import { test, expect } from 'vitest';
import { montarAnalise } from '@/dominio/analytics/analise';
test('escala semestral respeita os tetos dos bimestres e seus pesos', () => {
  const b = {
    config: { simuladoMaxLanca: 20, simuladoMaxFinal: 20, atividadesMaxFinal: 0 },
    atividades: [],
    notas: { a: { simulado: 10 } },
  };
  const a = montarAnalise([{ id: 't', alunos: [{ id: 'a', nome: 'Ana' }], bimestres: { 1: b, 2: b } }], 's1');
  expect(a.linhas[0].nota).toBe(50);
  expect(a.linhas[0].escala).toBe(100);
  expect(a.turmasMetricas[0].percentualEscala).toBe(50);
});
