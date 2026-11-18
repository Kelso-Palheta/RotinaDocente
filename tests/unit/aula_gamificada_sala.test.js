import { describe, expect, it } from 'vitest';
import {
  aplicarComando,
  aceitaRespostas,
  montarConteudo,
  projetarEstado,
} from '@/dominio/aula-gamificada/sala';
import { normalizarQuestao } from '@/dominio/aula-gamificada/questoes';

const questao = (extra = {}) =>
  normalizarQuestao(
    {
      disciplina: 'Arte',
      anoEscolar: '1º ano do Ensino Médio',
      conteudo: 'Ciclo da água',
      dificuldade: 'facil',
      tipo: 'multipla_escolha',
      enunciado: 'Qual etapa transforma vapor em gotas?',
      alternativas: [
        { id: 'A', texto: 'Evaporação' },
        { id: 'B', texto: 'Condensação' },
      ],
      respostaCorreta: 'B',
      explicacao: 'A condensação forma gotas.',
      justificativaDificuldade: 'Vocabulário direto.',
      ...extra,
    },
    { gerarId: (() => { let n = 0; return () => `q-${++n}`; })() },
  );

const salaBase = (extra = {}) => ({
  codigo: 'SALA01',
  professorId: 'prof-1',
  revision: 3,
  titulo: 'Revisão de Arte',
  modalidade: 'quiz',
  turmaIds: ['t1'],
  questaoIds: ['q-1'],
  tempoSegundos: 60,
  rodada: 1,
  totalRodadas: 2,
  fase: 'espera',
  encerraEmMs: null,
  revelado: false,
  criadoEmMs: 1000,
  atualizadoEmMs: 1000,
  ...extra,
});

const comando = (acao, extra = {}) => ({
  acao,
  expectedRevision: 3,
  rodada: 1,
  requestId: `req-${acao}`,
  ...extra,
});

const capturar = (fn) => {
  try {
    fn();
  } catch (erro) {
    return erro;
  }
  return null;
};

describe('máquina de estados da sala', () => {
  it('percorre espera → pergunta → feedback → ranking → próxima pergunta', () => {
    const espera = salaBase();
    const pergunta = aplicarComando(espera, comando('iniciar'), 2000);

    expect(pergunta.fase).toBe('pergunta');
    expect(pergunta.rodada).toBe(1);
    expect(pergunta.encerraEmMs).toBe(62000);
    expect(pergunta.revision).toBe(4);
    expect(aceitaRespostas(pergunta, 61000)).toBe(true);
    expect(aceitaRespostas(pergunta, 62000)).toBe(false);

    const feedback = aplicarComando(pergunta, comando('encerrar_rodada', { expectedRevision: 4 }), 61000);
    expect(feedback.fase).toBe('feedback');
    expect(feedback.revelado).toBe(false);
    expect(aceitaRespostas(feedback, 61000)).toBe(false);

    const revelado = aplicarComando(feedback, comando('revelar', { expectedRevision: 5 }), 61000);
    expect(revelado.fase).toBe('feedback');
    expect(revelado.revelado).toBe(true);

    const ranking = aplicarComando(revelado, comando('ranking', { expectedRevision: 6 }), 61000);
    expect(ranking.fase).toBe('ranking');

    const proxima = aplicarComando(ranking, comando('proxima', { expectedRevision: 7 }), 62000);
    expect(proxima.fase).toBe('pergunta');
    expect(proxima.rodada).toBe(2);
    expect(proxima.encerraEmMs).toBe(122000);
  });

  it('encerra a sala quando não há próxima rodada', () => {
    const ranking = salaBase({ fase: 'ranking', rodada: 2, totalRodadas: 2, revelado: true });
    const encerrada = aplicarComando(ranking, comando('proxima', { rodada: 2 }), 5000);

    expect(encerrada.fase).toBe('encerrada');
    expect(encerrada.encerradaEmMs).toBe(5000);
  });

  it('rejeita ação fora da fase e revisão divergente', () => {
    const espera = salaBase();

    expect(capturar(() => aplicarComando(espera, comando('revelar'), 1000))?.status).toBe(409);
    expect(
      capturar(() => aplicarComando(espera, comando('iniciar', { expectedRevision: 2 }), 1000))?.status,
    ).toBe(409);
    expect(capturar(() => aplicarComando(espera, comando('iniciar', { rodada: 2 }), 1000))?.status).toBe(409);
  });
});

describe('conteúdo congelado e projeção', () => {
  const congelar = () => montarConteudo(questao(), 'quiz', { codigo: 'SALA01', indice: 0 });

  it('congela uma cópia pública sem gabarito nem explicação', () => {
    const conteudo = congelar();

    expect(conteudo.questaoPublica.alternativas).toHaveLength(2);
    expect(conteudo.questaoPublica).not.toHaveProperty('respostaCorreta');
    expect(conteudo.questaoPublica).not.toHaveProperty('explicacao');
    expect(conteudo.segredo.respostaCorreta).toBe('B');
    expect(conteudo.segredo.explicacao).toMatch(/condensação/);
  });

  it('esconde o feedback até a revelação e o publica depois', () => {
    const conteudo = congelar();
    const sala = salaBase({ fase: 'feedback', revelado: false, encerraEmMs: 5000 });

    const oculto = projetarEstado({
      sala,
      conteudo,
      ator: { tipo: 'aluno' },
      participante: { id: 'p1', nomeExibicao: 'Ana', pontos: 0 },
      agora: 6000,
    });
    expect(oculto.rodada).not.toHaveProperty('gabarito');
    expect(oculto.rodada).not.toHaveProperty('explicacao');
    expect(oculto.rodada.revelado).toBe(false);

    const revelado = projetarEstado({
      sala: { ...sala, revelado: true },
      conteudo,
      ator: { tipo: 'aluno' },
      participante: { id: 'p1', nomeExibicao: 'Ana', pontos: 1000 },
      agora: 6000,
    });
    expect(revelado.rodada.gabarito).toBe('B');
    expect(revelado.rodada.explicacao).toMatch(/condensação/);
    expect(revelado.rodada.revelado).toBe(true);
  });

  it('entrega ao aluno apenas o próprio recibo e não expõe respostas alheias', () => {
    const conteudo = congelar();
    const estado = projetarEstado({
      sala: salaBase({ fase: 'feedback', revelado: true, encerraEmMs: 5000 }),
      conteudo,
      ator: { tipo: 'aluno' },
      participante: { id: 'p1', nomeExibicao: 'Ana', pontos: 1000 },
      recibo: {
        status: 'confirmado',
        resposta: { alternativaId: 'B' },
        recebidoEmMs: 3000,
        pontos: 1000,
      },
      participantes: [
        { id: 'p1', nomeExibicao: 'Ana', pontos: 1000 },
        { id: 'p2', nomeExibicao: 'Bia', pontos: 0 },
      ],
      agora: 6000,
    });

    expect(estado.eu.recibo.resposta).toEqual({ alternativaId: 'B' });
    expect(estado.participantes).toBeUndefined();
    expect(estado.distribuicao).toBeUndefined();
    expect(JSON.stringify(estado)).not.toContain('Bia');
  });

  it('entrega ao docente respondentes e distribuição sem nome ligado à alternativa', () => {
    const conteudo = congelar();
    const estado = projetarEstado({
      sala: salaBase({ fase: 'feedback', revelado: true, encerraEmMs: 5000 }),
      conteudo,
      ator: { tipo: 'professor' },
      participantes: [
        { id: 'p1', nomeExibicao: 'Ana', pontos: 1000 },
        { id: 'p2', nomeExibicao: 'Bia', pontos: 0 },
      ],
      respostas: [
        { participanteId: 'p1', resposta: { alternativaId: 'B' } },
        { participanteId: 'p2', resposta: { alternativaId: 'A' } },
      ],
      agora: 6000,
    });

    expect(estado.participantes).toHaveLength(2);
    expect(estado.distribuicao).toEqual([
      { alternativaId: 'A', total: 1 },
      { alternativaId: 'B', total: 1 },
    ]);
    expect(JSON.stringify(estado.distribuicao)).not.toContain('Ana');
    expect(JSON.stringify(estado.distribuicao)).not.toContain('Bia');
  });
});
