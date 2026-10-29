import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ docs: [] }));
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const real = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return { jsPDF: function (...args) {
    const doc = new real.jsPDF(...args);
    const textos = [], faixas = [];
    let cor;
    const color = doc.setFillColor.bind(doc), rect = doc.rect.bind(doc), text = doc.text.bind(doc);
    doc.setFillColor = (...rgb) => { cor = rgb; return color(...rgb); };
    doc.rect = (x, y, w, h, ...resto) => { faixas.push({x,y,w,h,cor}); return rect(x,y,w,h,...resto); };
    doc.text = (valor,x,y,opcoes) => { textos.push({texto:String(valor),x,y,opcoes,largura:doc.getTextWidth(String(valor))}); return text(valor,x,y,opcoes); };
    doc.save = vi.fn();
    doc.__textos = textos; doc.__faixas = faixas;
    m.docs.push(doc); return doc;
  } };
});
import { generateBoletimPDF } from '@/lib/aluno/boletim-pdf';
import { generateFichaAluno360PDF } from '@/lib/diario/fichaAlunoExport';
beforeEach(() => { m.docs.length = 0; });
it('REV-H81-01: emissão do boletim deve ficar acima da faixa rosa, sem colisão com a linha de base', () => {
  generateBoletimPDF({ nomeAluno: 'Aluno Exemplo', turmaNome: 'Turma de teste', bimTotais: [5,5,5,5] });
  const doc = m.docs.at(-1);
  const emissao = doc.__textos.find(t => t.texto.startsWith('EMISSÃO:'));
  const faixa = doc.__faixas.find(f => f.cor?.join(',') === '246,12,73');
  expect(emissao.y + 1).toBeLessThan(faixa.y);
});
it('REV-H81-02: identificação longa cabe na margem com a fonte efetivamente usada na escrita', async () => {
  const aluno = { id: 'a', nome: 'Maria Eduarda ' + 'de Albuquerque '.repeat(7) + 'Silva', matricula: '123' };
  const turma = { id: 't', nome: 'Turma ' + 'Interdisciplinar '.repeat(9), disciplina: 'Linguagens', alunos: [aluno], bimestres: {} };
  await generateFichaAluno360PDF({ aluno, turma, professorNome: 'Professor de Teste' });
  const doc = m.docs.at(-1);
  // Neste cenário o corpo só tem a identificação e as seções padrão; não há feedback longo.
  const identificacao = doc.__textos.filter(t => t.texto.includes('ALBUQUERQUE') || t.texto.includes('Interdisciplinar'));
  expect(identificacao.length).toBeGreaterThan(0);
  for (const linha of identificacao) expect(linha.x + linha.largura).toBeLessThanOrEqual(196.6);
});
