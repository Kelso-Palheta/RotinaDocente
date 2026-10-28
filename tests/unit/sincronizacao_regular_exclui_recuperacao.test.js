import { describe, expect, it } from 'vitest';
import { aplicarSincronizacaoAtividades, atividadesSincronizaveis } from '../../frontend/src/dominio/diario/sincronizacaoAtividades';

const turma = () => ({ id: 't1', alunos: [{ id: 'ana', nome: 'Ana' }], bimestres: { '1': { atividades: [], notas: { ana: { simulado: 4 } }, config: {} } } });

const atividades = () => ([
  { id: 'reg1', titulo: 'Prova bimestral', turmaIds: ['t1'], bimestre: 1, notaMaxima: 2 },
  { id: 'rec1', titulo: 'Recuperação 1º semestre', turmaIds: ['t1'], notaMaxima: 4, finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c1', semestre: 1 },
  { id: 'rec2', titulo: 'Recuperação 1º semestre II', turmaIds: ['t1'], notaMaxima: 6, finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c1', semestre: 1 },
]);

const entregas = () => ([
  { id: 'e1', activityId: 'reg1', turmaId: 't1', alunoId: 'ana', bimestre: 1, status: 'corrigido', notaFinal: 2 },
  { id: 'e2', activityId: 'rec1', turmaId: 't1', alunoId: 'ana', status: 'corrigido', notaFinal: 3 },
  { id: 'e3', activityId: 'rec2', turmaId: 't1', alunoId: 'ana', status: 'corrigido', notaFinal: 5 },
]);

describe('R81-04 (RN-81): sincronização regular nunca grava recuperação', () => {
  it('filtra atividades de recuperação da lista sincronizável', () => {
    expect(atividadesSincronizaveis(atividades()).map(a => a.id)).toEqual(['reg1']);
  });

  it('sincronização global ignora recuperação e mantém a regular', () => {
    const result = aplicarSincronizacaoAtividades({ turmas: [turma()], atividades: atividades(), entregas: entregas(), escopo: {} });
    expect(result.sincronizadas).toBe(1);
    expect(result.alteracoes.map(a => a.atividadeId || a.atvId)).toEqual(['reg1']);
    expect(result.turmas[0].bimestres['1'].notas.ana).toEqual({ simulado: 4, reg1: 2 });
  });

  it('sincronização recortada por turma também ignora recuperação', () => {
    const result = aplicarSincronizacaoAtividades({ turmas: [turma()], atividades: atividades(), entregas: entregas(), escopo: { turmaId: 't1' } });
    expect(result.sincronizadas).toBe(1);
  });

  it('não cria bimestre falso quando a recuperação não tem bimestre', () => {    const data = { turmas: [turma()], atividades: [atividades()[1]], entregas: [entregas()[1]], escopo: {} };
    const result = aplicarSincronizacaoAtividades(data);
    expect(result.sincronizadas).toBe(0);
    expect(result.turmas).toBe(data.turmas);
    expect(Object.keys(result.turmas[0].bimestres)).toEqual(['1']);
  });
});
