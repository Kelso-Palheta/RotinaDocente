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
test('PDF pagina nomes longos completos e usa símbolos compatíveis com a fonte', async () => {
  const nome = 'Maria Eduarda de Souza Albuquerque Nascimento Rodrigues';
  const alunos = Array.from({ length: 60 }, (_, i) => ({ id: String(i), nome: `${nome} ${i}` }));
  await generateAnalyticsPDF({
    turmas: [{ id: 't', nome: '101', alunos, bimestres: { 1: { config: {}, atividades: [], notas: {} } } }],
    ano: 2026,
  });
  const d = docs.at(-1),
    texto = d.text.mock.calls.map((c) => c[0]).join('\n');
  expect(d.internal.getNumberOfPages()).toBeGreaterThan(2);
  expect(texto).toContain('Rodrigues 59');
  expect(texto).toContain('Sem nota');
  expect(texto).not.toContain('≥');
});
