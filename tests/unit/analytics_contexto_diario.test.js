import { test, expect } from 'vitest';
import { resolverContextoAnalytics } from '@/dominio/analytics/contextoDiario';
test('navegação por IDs restringe turma/aluno/período sem criar cadastro', () => {
  const turmas = [{ id: 't', anoLetivo: 2025, arquivada: true, alunos: [{ id: 'a' }] }];
  expect(resolverContextoAnalytics('?turmaId=t&alunoId=a&bimestre=3', turmas)).toEqual({
    turmaId: 't',
    alunoId: 'a',
    bimestre: 3,
    ano: '2025',
    arquivadas: true,
  });
  expect(resolverContextoAnalytics('?turmaId=desconhecida&alunoId=a', turmas)).toBeNull();
  expect(resolverContextoAnalytics('?turmaId=t&alunoId=alheio&bimestre=9', turmas)).toMatchObject({
    alunoId: null,
    bimestre: 1,
  });
});
