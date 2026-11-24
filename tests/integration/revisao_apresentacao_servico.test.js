import { describe, expect, it } from 'vitest';
import { cenario, acao, questaoSintetica, confirmar } from '../helpers/revisaoCenario';
import { RevisaoService } from '@/aplicacao/revisao/RevisaoService';

async function preparar() {
  const c = await cenario();
  const conteudo = { id: 'aula', titulo: 'Aula sintética', status: 'rascunho', objetivos: [{ id: 'o', descricao: 'Conceito' }], fontes: [{ titulo: 'Fonte', url: 'https://www.metmuseum.org/' }], imagens: [], blocos: [
    { id: 'b1', tipo: 'texto', titulo: 'Contexto', texto: 'Primeira explicação. Segunda explicação. Terceira explicação. Quarta explicação.' },
    { id: 'b2', tipo: 'texto', titulo: 'Síntese', texto: 'Parte um. Parte dois.' },
  ] };
  c.opcoes.acervoTematico = { listarCatalogoTematico: async () => ({ trilhas: [], conteudos: [{ id: 'aula', titulo: conteudo.titulo, hashFonte: 'b'.repeat(64) }], questoes: [1, 2].map(n => ({ questaoId: questaoSintetica(n).id, conteudoIds: ['aula'] })) }), lerConteudoTematico: async () => ({ conteudo: structuredClone(conteudo), hashFonte: 'b'.repeat(64) }) };
  c.service = new RevisaoService(c.opcoes);
  for (let n = 1; n <= 2; n++) await c.service.aprovar(c.docente, questaoSintetica(n).id, { hashFonte: 'a'.repeat(64), confirmacoes: confirmar, ajustes: {} });
  await c.service.aprovarConteudo(c.docente, 'aula', { hashFonte: 'b'.repeat(64), confirmacoes: { conteudo: true, imagens: true, cobertura: true } });
  const { sala } = await c.service.criar(c.docente, { titulo: 'Etapas', turmaIds: ['t1'], conteudoIds: ['aula'], quantidadeQuestoes: 2, questaoIds: [1, 2].map(n => questaoSintetica(n).id), duracaoSegundos: 30, duracaoPorQuestao: {} });
  c.codigo = sala.codigo;
  await c.service.entrar(c.aluno(0), c.codigo);
  await acao(c, c.codigo, 'mostrar_conteudo');
  return c;
}

describe('comandos docentes de explicação sincronizada', () => {
  it('projeta primeira etapa manual para publicação antiga sem apresentação, sem gravar', async () => {
    const c = await preparar();
    const path = `revisaoSalas/${c.codigo}/publicacao/estado`;
    const legado = await c.store.get(path);
    delete legado.aula.apresentacao;
    await c.store.set(path, legado);
    const antes = structuredClone([...c.store.docs]);
    const aluno = (await c.service.estado(c.aluno(0), c.codigo)).estado;
    const professor = (await c.service.estado(c.docente, c.codigo)).estado;
    expect(aluno.aula.apresentacao).toMatchObject({ etapa: 0, totalEtapas: 4, automatica: false, etapaBase: 0, intervaloMs: 8000, agoraServidorMs: 100000 });
    expect(professor.aula.apresentacao).toEqual(aluno.aula.apresentacao);
    expect([...c.store.docs]).toEqual(antes);
  });

  it('sincroniza professor/aluno e rejeita aluno e outra conta antes de escrever', async () => {
    const c = await preparar();
    const inicial = (await c.service.estado(c.docente, c.codigo)).estado;
    const body = { acao: 'avancar_explicacao', revisao: inicial.sala.revisao, rodadaId: inicial.rodada.id };
    await expect(c.service.comandar(c.aluno(0), c.codigo, body)).rejects.toMatchObject({ status: 403 });
    await expect(c.service.comandar({ tipo: 'professor', uid: 'outro' }, c.codigo, body)).rejects.toMatchObject({ status: 403 });
    const p = await c.service.comandar(c.docente, c.codigo, body);
    expect(p.estado.aula.apresentacao).toMatchObject({ etapa: 1, totalEtapas: 4, automatica: false });
    expect((await c.service.estado(c.aluno(0), c.codigo)).estado.aula.apresentacao).toEqual(p.estado.aula.apresentacao);
    await expect(c.service.comandar(c.docente, c.codigo, body)).rejects.toMatchObject({ status: 409 });
    expect((await c.store.list(`revisaoSalas/${c.codigo}/respostas`))).toHaveLength(0);
    expect((await c.store.list(`revisaoSalas/${c.codigo}/participantes`))[0].pontos).toBe(0);
  });
  it('projeta passagem do tempo sem gravar por tick, pausa e reseta ao trocar bloco/reiniciar', async () => {
    const c = await preparar();
    await acao(c, c.codigo, 'reproduzir_explicacao');
    const congelado = structuredClone([...c.store.docs]);
    c.tempo(116000);
    const p = (await c.service.estado(c.aluno(0), c.codigo)).estado;
    expect(p.aula.apresentacao).toMatchObject({ etapa: 2, automatica: true, agoraServidorMs: 116000 });
    expect([...c.store.docs]).toEqual(congelado);
    await acao(c, c.codigo, 'pausar_explicacao');
    c.tempo(140000);
    expect((await c.service.estado(c.docente, c.codigo)).estado.aula.apresentacao.etapa).toBe(2);
    await acao(c, c.codigo, 'avancar_conteudo');
    expect((await c.service.estado(c.docente, c.codigo)).estado.aula.apresentacao).toMatchObject({ etapa: 0, totalEtapas: 2, automatica: false });
    await acao(c, c.codigo, 'voltar_conteudo');
    expect((await c.service.estado(c.docente, c.codigo)).estado.aula.apresentacao.etapa).toBe(0);
    await acao(c, c.codigo, 'avancar_explicacao');
    const { estado } = await c.service.estado(c.docente, c.codigo);
    await c.service.comandar(c.docente, c.codigo, { acao: 'reiniciar', confirmarReinicio: true, revisao: estado.sala.revisao, rodadaId: estado.rodada.id });
    await acao(c, c.codigo, 'mostrar_conteudo');
    expect((await c.service.estado(c.docente, c.codigo)).estado.aula.apresentacao.etapa).toBe(0);
  });
  it('não permite controles explicativos em pergunta nem com rodada antiga', async () => {
    const c = await preparar();
    const { estado } = await c.service.estado(c.docente, c.codigo);
    await expect(c.service.comandar(c.docente, c.codigo, { acao: 'avancar_explicacao', revisao: estado.sala.revisao, rodadaId: 'antiga' })).rejects.toMatchObject({ status: 409 });
    await acao(c, c.codigo, 'avancar_conteudo');
    await acao(c, c.codigo, 'abrir_pergunta');
    await expect(acao(c, c.codigo, 'avancar_explicacao')).rejects.toMatchObject({ status: 409 });
  });
});
