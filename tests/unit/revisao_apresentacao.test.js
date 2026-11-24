import { describe, expect, it } from 'vitest';
import { ACOES_EXPLICACAO, criarEtapasExplicacao, projetarApresentacao, comandarApresentacao, atualizarProjecaoApresentacao } from '@/dominio/revisao/apresentacao';

const bloco = { id: 'b1', texto: 'Primeira frase. Segunda frase! Terceira frase? Quarta frase. Quinta frase.' };
const sala = () => ({ schemaVersion: 2, fase: 'conteudo', revisao: 1, indice: 0, indiceBloco: 0, rodadas: [{ id: 'r1' }], sequenciaAula: [{ conteudoId: 'aula', blocoId: 'b1' }] });
const cmd = (acao) => ({ acao, revisao: 1, rodadaId: 'r1' });

describe('etapas explicativas puras', () => {
  it('segmenta em até quatro strings sem perder texto ou espaços', () => {
    for (const texto of ['', 'Uma frase sem pontuação', bloco.texto, ' Um parágrafo.\n\nOutro parágrafo!  Mais detalhes. ']) {
      const etapas = criarEtapasExplicacao(texto);
      expect(etapas.length).toBeLessThanOrEqual(4);
      expect(etapas.join('')).toBe(texto);
      expect(etapas.every((e) => e.trim().length > 0)).toBe(true);
    }
    expect(criarEtapasExplicacao(bloco.texto)).toHaveLength(4);
  });
  it('começa manual e usa chave do bloco, ignorando apresentação velha', () => {
    expect(projetarApresentacao(sala(), bloco, 1000)).toMatchObject({ etapa: 0, totalEtapas: 4, automatica: false, intervaloMs: 8000, agoraServidorMs: 1000 });
    expect(projetarApresentacao({ ...sala(), apresentacao: { chave: 'outra:b2', etapaBase: 3, automatica: true, iniciadaEmMs: 0 } }, bloco, 100000).etapa).toBe(0);
  });
  it('avança, volta e repete; limites rejeitados, comandos manuais pausam', () => {
    let s = sala();
    expect(() => comandarApresentacao(s, cmd('voltar_explicacao'), bloco, 1000)).toThrow();
    s.apresentacao = comandarApresentacao(s, cmd('avancar_explicacao'), bloco, 1000);
    expect(s.apresentacao).toMatchObject({ chave: 'aula:b1', etapaBase: 1, automatica: false });
    s.apresentacao = comandarApresentacao(s, cmd('voltar_explicacao'), bloco, 1000);
    expect(s.apresentacao.etapaBase).toBe(0);
    s.apresentacao = comandarApresentacao(s, cmd('repetir_explicacao'), bloco, 1000);
    expect(s.apresentacao).toMatchObject({ etapaBase: 0, automatica: false });
  });
  it('automático avança pelo relógio, limita na última e não avança bloco', () => {
    const s = sala();
    s.apresentacao = comandarApresentacao(s, cmd('reproduzir_explicacao'), bloco, 1000);
    expect(projetarApresentacao(s, bloco, 8999).etapa).toBe(0);
    const p = projetarApresentacao(s, bloco, 9000);
    expect(p).toMatchObject({ etapa: 1, automatica: true });
    expect(atualizarProjecaoApresentacao(p, 17000).etapa).toBe(2);
    expect(projetarApresentacao(s, bloco, 100000)).toMatchObject({ etapa: 3, automatica: false });
    expect(s.indiceBloco).toBe(0);
    expect(comandarApresentacao(s, cmd('pausar_explicacao'), bloco, 17000)).toMatchObject({ etapaBase: 2, automatica: false, iniciadaEmMs: 17000 });
  });
  it('valida ações, revisão, rodada e fase', () => {
    expect(ACOES_EXPLICACAO).toHaveLength(5);
    for (const patch of [{ revisao: 0 }, { rodadaId: 'antiga' }, { acao: 'abrir_pergunta' }])
      expect(() => comandarApresentacao(sala(), { ...cmd('avancar_explicacao'), ...patch }, bloco, 1000)).toThrow();
    for (const patch of [{ schemaVersion: 1 }, { fase: 'pergunta' }])
      expect(() => comandarApresentacao({ ...sala(), ...patch }, cmd('avancar_explicacao'), bloco, 1000)).toThrow();
  });
});
