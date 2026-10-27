import { test, expect } from 'vitest';
import { montarAnalise, rotuloPeriodo } from '@/dominio/analytics/analise';
import {
  calcularMetricasTurma,
  calcularMetricasGlobais,
  obterAlunosEmRisco,
} from '@/utils/analytics/metricas';
const turma = (nota = 6, config = {}) => ({
  id: 't',
  nome: '101',
  alunos: [{ id: 'a', nome: 'Ana' }],
  bimestres: {
    1: {
      config: { simuladoMaxLanca: 10, simuladoMaxFinal: 10, atividadesMaxFinal: 0, ...config },
      atividades: [],
      notas: { a: { simulado: nota } },
    },
  },
});
test('mínimos configurados reconciliam taxa, radar e classificação', () => {
  const t = turma(6, { mediaAprovacao: 7, mediaRecuperacao: 5 });
  expect(calcularMetricasTurma(t).notasValidas[0].classificacao).toBe('recuperacao');
  expect(calcularMetricasGlobais([t]).taxaAprovacao).toBe(0);
  expect(obterAlunosEmRisco([t])).toHaveLength(1);
  const a = montarAnalise([t], '1');
  expect(a.taxaAtencao).toBe(100);
  expect(a.linhas[0].minimo).toBe(7);
});
test('dataset preserva zero, ausência e cobertura parcial', () => {
  const t = turma(0);
  t.alunos.push({ id: 'b', nome: 'Bia' });
  t.bimestres[1].atividades = [{ id: 'atv', max: 1 }];
  const a = montarAnalise([t], '1');
  expect(a.linhas.map((x) => x.nota)).toEqual([0, null]);
  expect(a.totalParciais).toBe(1);
  expect(a.totalSemNota).toBe(1);
  expect(a.totalAvaliados).toBe(1);
  expect(a.mediaGeral).toBe(0);
  const vazio = montarAnalise([turma(null)], '1');
  expect(vazio.taxaAprovacao).toBeNull();
  expect(vazio.taxaAtencao).toBeNull();
});
test('semestres e ano usam 25/50, conclusão e recuperação do domínio', () => {
  const t = turma(5);
  t.bimestres[2] = structuredClone(t.bimestres[1]);
  let a = montarAnalise([t], 's1');
  expect(a.linhas[0].nota).toBe(25);
  expect(a.linhas[0].situacao).toBe('Aprovado');
  expect(montarAnalise([t], 's2').linhas[0].nota).toBeNull();
  expect(montarAnalise([t], 'ano').linhas[0].situacao).toBe('Em andamento');
  t.bimestres[3] = structuredClone(t.bimestres[1]);
  t.bimestres[4] = structuredClone(t.bimestres[1]);
  expect(montarAnalise([t], 'ano').linhas[0].nota).toBe(50);
  expect(montarAnalise([t], 'ano').taxaAprovacao).toBe(100);
  t.bimestres[1].notas.a.simulado = 1;
  t.recuperacao = { a: { rec1: 5 } };
  expect(montarAnalise([t], 's1').linhas[0].nota).toBe(25);
  delete t.bimestres[2];
  expect(montarAnalise([t], 's1').linhas[0].situacao).toBe('Em andamento');
});
test('escalas diferentes não geram média bruta consolidada enganosa', () => {
  const t = turma(6),
    u = turma(10, { simuladoMaxLanca: 20, simuladoMaxFinal: 20 });
  u.id = 'u';
  const a = montarAnalise([t, u], '1');
  expect(a.escalasDiferentes).toBe(true);
  expect(a.mediaGeral).toBeNull();
  expect(a.turmasMetricas.map((x) => x.percentualEscala)).toEqual([60, 50]);
  expect(rotuloPeriodo('s2')).toBe('2º semestre');
});
