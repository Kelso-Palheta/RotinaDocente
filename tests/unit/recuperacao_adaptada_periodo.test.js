import { describe, expect, it } from 'vitest';
import { converterAdaptadaParaAtividadeOnline } from '../../frontend/src/dominio/adaptacoes/publicadorAtividadeOnline';
import { montarHistoricoFeedback, rotuloPeriodo } from '../../frontend/src/dominio/atividades/correcaoManual';

const adaptacao = (notaMaxima = 5) => ({
  versaoVisual: 2,
  titulo: 'Recuperação adaptada',
  disciplina: 'Matemática',
  anoEscolar: '1º Ano EM',
  aluno: { nome: 'Ana', necessidades: ['tea'] },
  atividadeAdaptada: {
    instrucoesAluno: 'Resolva com calma.',
    questoes: [
      { numero: 1, enunciado: 'Quanto é 2 + 2?', alternativas: ['A) 3', 'B) 4'], gabarito: 'B', tipo: 'multipla_escolha', notaMaxima },
      { numero: 2, enunciado: 'Explique o cálculo.', alternativas: [], notaMaxima },
    ],
  },
});

const base = {
  turmaId: 't1',
  alunoId: 'ana',
  professorId: 'p1',
  prazoEntrega: '2026-09-01T23:59:00Z',
};

describe('REV-R81-15: recuperação adaptada no Portal', () => {
  it('converte a parcela com semestre, conjunto e pontos exatos', () => {
    const atividade = converterAdaptadaParaAtividadeOnline({
      ...base,
      adaptacao: adaptacao(),
      bimestre: 3,
      recuperacao: {
        conjuntoId: 'c1',
        conjuntoVersao: 4,
        semestre: '2',
        anoLetivo: '2026',
        pontosMaximos: 4,
      },
    });

    expect(atividade.bimestre).toBeUndefined();
    expect(atividade.finalidade).toBe('recuperacao_semestral');
    expect(atividade.conjuntoRecuperacaoId).toBe('c1');
    expect(atividade.conjuntoVersao).toBe(4);
    expect(atividade.semestre).toBe('2');
    expect(atividade.anoLetivo).toBe('2026');
    expect(atividade.destinatariosIds).toEqual(['ana']);
    expect(atividade.alunoExclusivoId).toBe('ana');
    expect(atividade.notaMaxima).toBe(4);
    expect(atividade.questoes.map(q => q.notaMaxima)).toEqual([2, 2]);
    expect(atividade.questoes.reduce((s, q) => s + Math.round(q.notaMaxima * 100), 0)).toBe(400);
  });

  it('distribui centésimos sem sobra em parcelas ímpares', () => {
    const atividade = converterAdaptadaParaAtividadeOnline({
      ...base,
      adaptacao: {
        ...adaptacao(),
        atividadeAdaptada: {
          ...adaptacao().atividadeAdaptada,
          questoes: [
            { numero: 1, enunciado: 'A', alternativas: [] },
            { numero: 2, enunciado: 'B', alternativas: [] },
            { numero: 3, enunciado: 'C', alternativas: [] },
          ],
        },
      },
      recuperacao: { conjuntoId: 'c1', semestre: '1', pontosMaximos: 1 },
    });
    expect(atividade.questoes.reduce((s, q) => s + Math.round(q.notaMaxima * 100), 0)).toBe(100);
    expect(atividade.questoes.map(q => q.notaMaxima)).toEqual([0.34, 0.33, 0.33]);
  });

  it('recusa contexto de recuperação incompleto ou fora da escala', () => {
    expect(() => converterAdaptadaParaAtividadeOnline({
      ...base,
      adaptacao: adaptacao(),
      recuperacao: { semestre: '1', pontosMaximos: 4 },
    })).toThrow(/conjunto/i);

    expect(() => converterAdaptadaParaAtividadeOnline({
      ...base,
      adaptacao: adaptacao(),
      recuperacao: { conjuntoId: 'c1', semestre: '3', pontosMaximos: 4 },
    })).toThrow(/semestre/i);

    expect(() => converterAdaptadaParaAtividadeOnline({
      ...base,
      adaptacao: adaptacao(),
      recuperacao: { conjuntoId: 'c1', semestre: '1', pontosMaximos: 0 },
    })).toThrow(/parcela/i);

    expect(() => converterAdaptadaParaAtividadeOnline({
      ...base,
      adaptacao: adaptacao(),
      recuperacao: { conjuntoId: 'c1', semestre: '1', pontosMaximos: 11 },
    })).toThrow(/parcela/i);
  });
});

describe('REV-R81-16: período em devolutivas', () => {
  it('rotula bimestre e semestre sem undefined', () => {
    expect(rotuloPeriodo({ bimestre: 2 })).toBe('2º bimestre');
    expect(rotuloPeriodo({ finalidade: 'recuperacao_semestral', semestre: '1' })).toBe('1º semestre');
    expect(rotuloPeriodo({ finalidade: 'recuperacao_semestral' })).toBe('Recuperação semestral');
    expect(rotuloPeriodo({})).toBe('Período não informado');
  });

  it('histórico carrega finalidade, semestre e período', () => {
    const atividades = [
      { id: 'a1', professorId: 'p1', turmaIds: ['t1'], bimestre: 2, titulo: 'Prova', notaMaxima: 10 },
      { id: 'r1', professorId: 'p1', turmaIds: ['t1'], finalidade: 'recuperacao_semestral', semestre: '2', titulo: 'Recuperação', notaMaxima: 10 },
    ];
    const entregas = [
      { activityId: 'a1', alunoId: 'ana', turmaId: 't1', status: 'revisado', notaRevisada: 7 },
      { activityId: 'r1', alunoId: 'ana', turmaId: 't1', status: 'revisado', notaRevisada: 9 },
    ];
    const historico = montarHistoricoFeedback({ atividades, entregas, alunoId: 'ana', turmaId: 't1', professorId: 'p1' });
    expect(historico.map(item => item.periodo)).toEqual(['2º bimestre', '2º semestre']);
    expect(historico[1]).toMatchObject({ finalidade: 'recuperacao_semestral', semestre: '2' });
    expect(historico[0]).toMatchObject({ finalidade: 'regular', semestre: null });
  });
});
