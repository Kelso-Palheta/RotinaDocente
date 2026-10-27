import { test, expect, vi } from 'vitest';
const docs = vi.hoisted(() => []);
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const real = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return {
    jsPDF: function (...args) {
      const d = new real.jsPDF(...args);
      const text = d.text.bind(d);
      d.text = vi.fn((...a) => text(...a));
      d.save = vi.fn();
      docs.push(d);
      return d;
    },
  };
});
import { generateAnalyticsPDF } from '@/lib/analytics/pdf-generator';
test('PDF usa nota canônica e inclui todos os alunos sem converter ausência em zero', async () => {
  const alunos = Array.from({ length: 16 }, (_, i) => ({ id: String(i), nome: `Aluno fictício ${i}` }));
  const t = {
    id: 't',
    nome: '101',
    alunos,
    bimestres: { 1: { config: {}, atividades: [], notas: { 0: { simulado: 5 }, 1: { simulado: 0 } } } },
  };
  await generateAnalyticsPDF({ turmas: [t], bimestre: '1', ano: '2026' });
  const texto = docs
    .at(-1)
    .text.mock.calls.map((x) => (Array.isArray(x[0]) ? x[0].join(' ') : x[0]))
    .join('\n');
  expect(texto).toContain('5,00');
  expect(texto).toContain('Sem nota');
  expect(texto).toContain('Aluno fictício 15');
  expect(texto).not.toContain('Homologação Oficial');
});
