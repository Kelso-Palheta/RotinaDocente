import { beforeEach, expect, it, vi } from 'vitest';
import fs from 'node:fs';
const documentos = vi.hoisted(() => []);
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const real = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return { jsPDF: function (...args) {
    const doc = new real.jsPDF(...args);
    doc.save = vi.fn();
    const text = doc.text.bind(doc);
    doc.text = vi.fn((...values) => text(...values));
    documentos.push(doc);
    return doc;
  } };
});
import { generateCalendarioPDF } from '@/lib/calendario/pdf-generator';
beforeEach(() => { documentos.length = 0; });
const texto = doc => doc.text.mock.calls.map(call => call[0]).flat().join(' ').replace(/\s+/g, ' ');
it('exporta objeto usado pela página, com conteúdo completo, observações e páginas numeradas', async () => {
  const resultado = await generateCalendarioPDF({
    turma: { nome: 'Turma 203' }, professorNome: 'Professora Ana', anoLetivo: 2026,
    grade: { dataInicio: '2026-07-01', dataFim: '2026-09-30' },
    planejamento: { topicos: [{ id: 't1', titulo: 'Título integral da sequência de estudos sobre história cultural', descricao: 'Descrição detalhada '.repeat(1000) + 'FIM DO CONTEUDO' }] },
    feriados: [{ data: '2026-09-07', nome: 'Independência do Brasil' }],
    aulas: [{ dataAgendada: '2026-08-03', horarioInicio: '07:00', horarioFim: '07:50', status: 'PARCIAL', topicosAssociados: [{ topicoId: 't1' }], observacoes: 'Observação pedagógica', justificativa: 'Faltou energia', restante: 'Concluir debate' }],
  });
  const doc = documentos[0];
  expect(resultado).toBe(doc);
  expect(doc.getNumberOfPages()).toBeGreaterThan(2);
  for (const esperado of ['FIM DO CONTEUDO', 'Título integral da sequência', 'Observação pedagógica', 'Faltou energia', 'Concluir debate', 'Independência do Brasil', '203', '2026', '01/07/2026', '30/09/2026', 'Parcial']) expect(texto(doc)).toContain(esperado);
  expect(doc.text.mock.calls.filter(call => typeof call[0] === 'string' && /^Página /.test(call[0]))).toHaveLength(doc.getNumberOfPages());
  expect(doc.save).toHaveBeenCalledOnce();
  if (process.env.RD_CALENDARIO_PDF) fs.writeFileSync(process.env.RD_CALENDARIO_PDF, Buffer.from(doc.output('arraybuffer')));
});
it('preserva assinatura posicional e títulos/descrições legados e atuais', async () => {
  await generateCalendarioPDF([
    { dataAgendada: '2026-10-23', status: 'CONCLUIDA', topicoTitulo: 'Conteúdo legado integral', descricao: 'Descrição legada' },
    { dataAgendada: '2026-10-23', horarioInicio: '10:00', status: 'NAO_REALIZADA', topicosAssociados: [{ id: 'x', titulo: 'Conteúdo atual integral', descricao: 'Descrição atual' }] },
  ], '301', 'Professor Pedro');
  const conteudo = texto(documentos[0]);
  for (const esperado of ['Conteúdo legado integral', 'Descrição legada', 'Conteúdo atual integral', 'Descrição atual', 'Concluída', 'Não realizada', 'Professor Pedro']) expect(conteudo).toContain(esperado);
});
it('exporta turma vazia sem lançar erro ou inventar agendamentos', async () => {
  await generateCalendarioPDF({ turma: { nome: '101' }, aulas: [] });
  expect(texto(documentos[0])).toContain('Nenhuma aula agendada');
});
it('inclui execução aninhada e conteúdos históricos de aula bloqueada sem vínculo ativo', async () => {
  await generateCalendarioPDF({
    turma: { nome: '203' },
    aulas: [{ dataAgendada: '2026-11-02', status: 'NAO_REALIZADA', conteudoEncaminhado: true, topicosAssociados: [], historicoConteudos: [{ topicoId: 't1', topicoTitulo: 'Estudos históricos preservados', descricao: 'Descrição original preservada' }], execucao: { justificativa: 'Justificativa registrada no detalhe', restante: 'Debate que faltou concluir', observacao: 'Observação salva na execução' } }],
  });
  const conteudo = texto(documentos[0]);
  for (const esperado of ['Estudos históricos preservados', 'Descrição original preservada', 'Justificativa registrada no detalhe', 'Debate que faltou concluir', 'Observação salva na execução', 'Histórico']) expect(conteudo).toContain(esperado);
});
