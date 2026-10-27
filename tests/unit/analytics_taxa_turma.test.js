import { test, expect } from 'vitest';
import { montarAnalise } from '@/dominio/analytics/analise';
test('comparativo recebe taxa por turma ou indisponibilidade, nunca undefined', () => {
  const turma = {
    id: 't',
    alunos: [{ id: 'a' }],
    bimestres: { 1: { config: { mediaAprovacao: 7 }, atividades: [], notas: { a: { simulado: 5 } } } },
  };
  expect(montarAnalise([turma], '1').turmasMetricas[0].taxaAprovacao).toBe(0);
  turma.bimestres[1].notas = {};
  expect(montarAnalise([turma], '1').turmasMetricas[0].taxaAprovacao).toBeNull();
});
