import { describe, expect, it } from 'vitest';
import { acao, cenario, salaPronta } from '../helpers/revisaoCenario';
import { transicaoTematica } from '@/dominio/revisao/tematico';

async function comando(c, codigo, acao, extras = {}) {
  const { estado } = await c.service.estado(c.docente, codigo);
  return c.service.comandar(c.docente, codigo, {
    acao, revisao: estado.sala.revisao, rodadaId: estado.rodada.id, ...extras,
  });
}

describe('controles do aulão', () => {
  it('pula conteúdo e abre cada pergunta depois do feedback e ranking', async () => {
    const c = await cenario();
    const codigo = await salaPronta(c);
    const inicial = await comando(c, codigo, 'iniciar_so_questoes');
    expect(inicial.estado).toMatchObject({ fase: 'pergunta', rodada: { numero: 1, encerraEmMs: 110000 } });
    for (const etapa of ['encerrar_pergunta', 'mostrar_feedback', 'mostrar_ranking']) {
      await acao(c, codigo, etapa);
    }
    const proxima = await acao(c, codigo, 'proxima_rodada');
    expect(proxima.estado).toMatchObject({ fase: 'pergunta', rodada: { numero: 2 } });
  });

  it('atualiza o cronômetro pelo servidor e mantém as respostas já aceitas', async () => {
    const c = await cenario();
    const codigo = await salaPronta(c);
    await c.service.entrar(c.aluno(0), codigo);
    await comando(c, codigo, 'alterar_tempo', { duracaoSegundos: 30 });
    await acao(c, codigo, 'mostrar_conteudo');
    const { estado } = await acao(c, codigo, 'abrir_pergunta');
    expect(estado.rodada.encerraEmMs).toBe(130000);
    await c.service.responder(c.aluno(0), codigo, { rodadaId: estado.rodada.id, alternativa: 'B' });
    c.tempo(131000);
    await expect(comando(c, codigo, 'alterar_tempo', { duracaoSegundos: 0 })).rejects.toMatchObject({ status: 422 });
    const atual = await comando(c, codigo, 'alterar_tempo', { duracaoSegundos: 120 });
    expect(atual.estado).toMatchObject({ fase: 'pergunta', rodada: { encerraEmMs: 251000 }, participacao: { respondidos: 1 } });
  });

  it('no modo só questões, o assunto seguinte abre direto na pergunta', () => {
    const sala = {
      schemaVersion: 2, modoFluxo: 'sequencia_assunto', soQuestoes: true,
      fase: 'ranking', indice: 0, revisao: 4,
      rodadas: [{ id: 'r1', conteudoId: 'a' }, { id: 'r2', conteudoId: 'b' }],
    };
    const comando = { revisao: 4, rodadaId: 'r1' };
    expect(transicaoTematica(sala, { ...comando, acao: 'proxima_rodada' }, 100000)).toBe('pergunta');
    expect(() => transicaoTematica(sala, { ...comando, acao: 'apresentar_proximo_assunto' }, 100000)).toThrow();
  });

  it('reinicia com o mesmo código e rejeita recibo antigo sem perder o aluno conectado', async () => {
    const c = await cenario();
    const codigo = await salaPronta(c);
    await c.service.entrar(c.aluno(0), codigo);
    await acao(c, codigo, 'mostrar_conteudo');
    const { estado } = await acao(c, codigo, 'abrir_pergunta');
    const resposta = { rodadaId: estado.rodada.id, alternativa: 'B' };
    await c.service.responder(c.aluno(0), codigo, resposta);
    await expect(comando(c, codigo, 'reiniciar')).rejects.toMatchObject({ status: 422 });
    const novo = await comando(c, codigo, 'reiniciar', { confirmarReinicio: true });
    expect(novo.estado).toMatchObject({ sala: { codigo }, fase: 'espera', participacao: { total: 1, respondidos: 0 } });
    expect(novo.estado.rodada.id).not.toBe(resposta.rodadaId);
    await expect(c.service.responder(c.aluno(0), codigo, resposta)).rejects.toMatchObject({ status: 409 });
    await acao(c, codigo, 'finalizar');
    const final = await c.service.estado(c.docente, codigo);
    expect(final.estado.ranking[0].pontos).toBe(0);
    expect(final.estado.feedback).toBeNull();
  });
});
