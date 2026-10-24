import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
const documentos = vi.hoisted(() => []);
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const real = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return { jsPDF: function (...args) {
    const doc = new real.jsPDF(...args);
    const escrever = doc.text.bind(doc); const cor = doc.setTextColor.bind(doc);
    let corAtual = [];
    doc.registros = [];
    doc.setTextColor = (...valores) => { corAtual = valores; return cor(...valores); };
    doc.text = (...valores) => { doc.registros.push({ valores, cor: corAtual }); return escrever(...valores); };
    doc.save = vi.fn(); documentos.push(doc); return doc;
  } };
});
import { generateRelatorioBimestrePDF, exportBimestreCSV } from '@/lib/diario/caderneta-export';
import { montarCSVNotasBimestre } from '@/lib/diario/bimestre-export';

const turma = () => ({ id: 't1', nome: 'Turma 203', alunos: [{ id: 'a1', nome: 'Ana' }, { id: 'a2', nome: 'Bruna' }, { id: 'a3', nome: 'Carla' }, { id: 'a4', nome: 'Dora sem notas' }], bimestres: {
  1: { atividades: [{ id: 'a-fora', nome: 'ATIVIDADE FORA DO RECORTE', max: 5 }], notas: { a1: { simulado: 5 } } },
  3: { atividades: [{ id: 'at1', nome: 'Atividade de arte', max: 5 }], notas: { a1: { simulado: 0 }, a2: { simulado: 5, at1: 1 }, a3: { simulado: 5, at1: 4 } } },
} });
const textos = doc => doc.registros.flatMap(registro => registro.valores[0]).join(' ').replace(/\s+/g, ' ');
afterEach(() => { documentos.length = 0; vi.unstubAllGlobals(); });

describe('RN-68: exportação do bimestre selecionado', () => {
  it('PDF exporta apenas turma e bimestre escolhidos e distingue zero de ausência, com cores compartilhadas', async () => {
    const doc = await generateRelatorioBimestrePDF(turma(), 3, 'Professor Kelso');
    expect(doc).toBe(documentos[0]);
    expect(textos(doc)).toContain('3º bimestre');
    expect(textos(doc)).toContain('Professor Kelso');
    expect(textos(doc)).toContain('Atividade de arte');
    expect(textos(doc)).not.toContain('ATIVIDADE FORA DO RECORTE');
    expect(textos(doc)).not.toContain('Total anual');
    expect(doc.registros).toEqual(expect.arrayContaining([
      expect.objectContaining({ valores: expect.arrayContaining(['0,00']), cor: [220, 38, 38] }),
      expect.objectContaining({ valores: expect.arrayContaining(['6,00']), cor: [37, 99, 235] }),
      expect.objectContaining({ valores: expect.arrayContaining(['9,00']), cor: [22, 163, 74] }),
    ]));
    expect(doc.save).toHaveBeenCalledWith(expect.stringMatching(/3bim.*\.pdf$/));
  });
  it('PDF pagina alunos, blocos de atividades e nomes completos sem cortar texto', async () => {
    const t = turma();
    t.alunos = Array.from({ length: 60 }, (_, i) => ({ id: `a${i}`, nome: i === 59 ? 'Nome muito longo de aluno '.repeat(90) + 'FIM_NOME_LONGO' : `Estudante ${i + 1}` }));
    t.bimestres[3].atividades = Array.from({ length: 12 }, (_, i) => ({ id: `at${i}`, nome: i === 11 ? 'Nome completo extenso da atividade '.repeat(70) + 'FIM_ATIVIDADE_LONGA' : `Atividade selecionada ${i + 1}`, max: 1 }));
    const doc = await generateRelatorioBimestrePDF(t, 3, 'Professor exemplo');
    expect(doc.getNumberOfPages()).toBeGreaterThan(5);
    const conteudo = textos(doc);
    expect(conteudo).toContain('FIM_NOME_LONGO');
    expect(conteudo).toContain('FIM_ATIVIDADE_LONGA');
    expect(conteudo).toContain('Estudante 1');
    expect(conteudo).toContain('Estudante 59');
    for (const { valores } of doc.registros) {
      expect(valores[1]).toBeGreaterThanOrEqual(12);
      expect(valores[1]).toBeLessThanOrEqual(285);
      expect(valores[2]).toBeGreaterThan(0);
      expect(valores[2]).toBeLessThanOrEqual(200);
    }
    if (process.env.RD_BIMESTRE_FIXTURE_PATH) {
      fs.mkdirSync(path.dirname(process.env.RD_BIMESTRE_FIXTURE_PATH), { recursive: true });
      fs.writeFileSync(process.env.RD_BIMESTRE_FIXTURE_PATH, Buffer.from(doc.output('arraybuffer')));
    }
  });
  it('CSV identifica período, só inclui atividades do recorte e escapa nomes completos', () => {
    const t = turma(); t.alunos[0].nome = 'Ana; "Nome"\nCompleto';
    const csv = montarCSVNotasBimestre(t, 3);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Turma;Bimestre;Ordem;Nome do aluno;Simulado');
    expect(csv).toContain('Turma 203;3º bimestre;1;"Ana; ""Nome""\nCompleto";0,00;');
    expect(csv).not.toContain('ATIVIDADE FORA DO RECORTE');
    expect(csv).not.toContain('anual');
    expect(csv).toContain('Dora sem notas;;;;');
  });
  it('CSV baixa arquivo do bimestre correto e libera URL temporária', () => {
    const link = { setAttribute: vi.fn(), click: vi.fn(), remove: vi.fn() };
    const createObjectURL = vi.fn(() => 'blob:csv'); const revokeObjectURL = vi.fn();
    vi.stubGlobal('document', { createElement: () => link, body: { appendChild: vi.fn() } });
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const csv = exportBimestreCSV(turma(), 3);
    expect(csv).toContain('3º bimestre');
    expect(link.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/3bim.*\.csv$/));
    expect(link.click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');
  });
  it('rejeita período inválido sem exportar outro bimestre', async () => {
    expect(() => montarCSVNotasBimestre(turma(), 5)).toThrow(/bimestre/i);
    await expect(generateRelatorioBimestrePDF(turma(), 'anual')).rejects.toThrow(/bimestre/i);
  });
});
