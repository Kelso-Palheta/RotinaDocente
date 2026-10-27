import { test, expect } from 'vitest';
import { montarAnalise } from '@/dominio/analytics/analise';
test('comparativo de etapa incompleta usa cor neutra e não indica reprovação', () => {
  const t = {
    id: 't',
    alunos: [{ id: 'a', nome: 'Ana' }],
    bimestres: { 1: { config: {}, atividades: [], notas: { a: { simulado: 5 } } } },
  };
  const a = montarAnalise([t], 's1');
  expect(a.linhas[0].situacao).toBe('Em andamento');
  expect(a.turmasMetricas[0].cor).toBe('#94a3b8');
});
