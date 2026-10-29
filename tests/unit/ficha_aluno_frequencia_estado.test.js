import { describe, expect, it, vi } from 'vitest';

const docs = vi.hoisted(() => []);

vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const actual = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return {
    jsPDF: function (...args) {
      const doc = new actual.jsPDF(...args);
      const chamadas = [];
      const textOriginal = doc.text.bind(doc);
      doc.save = vi.fn();
      doc.text = (texto, x, y, opcoes) => {
        chamadas.push({ texto: String(texto), x, y, opcoes });
        return textOriginal(texto, x, y, opcoes);
      };
      Object.defineProperty(doc, '__chamadas', { value: chamadas });
      docs.push(doc);
      return doc;
    },
  };
});

import { consolidarFichaAluno360 } from '@/dominio/diario/fichaAluno';
import { generateFichaAluno360PDF } from '@/lib/diario/fichaAlunoExport';

const aluno = { id: 'a1', nome: 'Ana Clara Souza', matricula: '2026-001' };
const turma = { id: 't1', nome: '3º Ano A', disciplina: 'Língua Portuguesa', alunos: [aluno], bimestres: {} };

const gerarPDF = async (frequenciasTurma) => {
  docs.length = 0;
  await generateFichaAluno360PDF({ aluno, turma, frequenciasTurma });
  return docs.at(-1).__chamadas.map((chamada) => chamada.texto).join(' ');
};

const comPresenca = (status) => ({
  '2026-03-01': { quantidadeAulas: 2, presencas: { a1: status } },
});

describe('H81-03 — frequência da ficha sem base e com dados reais', () => {
  it('marca ausência de base sem afirmar 100% ou regularidade', () => {
    for (const frequenciasTurma of [null, {}]) {
      const ficha = consolidarFichaAluno360({ aluno, turma, frequenciasTurma });
      expect(ficha.frequencia.totalAulas).toBe(0);
      expect(ficha.frequencia.disponivel).toBe(false);
      expect(ficha.frequencia.semRegistros).toBe(true);
      expect(ficha.frequencia.alertaLegal).toMatch(/indispon|sem registros/i);
      expect(ficha.frequencia.alertaLegal).not.toMatch(/frequência regular/i);
    }
  });

  it('preserva 100% regular quando há presenças reais', () => {
    const ficha = consolidarFichaAluno360({ aluno, turma, frequenciasTurma: comPresenca('P') });
    expect(ficha.frequencia.totalAulas).toBe(2);
    expect(ficha.frequencia.percentual).toBe(100);
    expect(ficha.frequencia.statusLdb).toBe('regular');
    expect(ficha.frequencia.disponivel).toBe(true);
    expect(ficha.frequencia.semRegistros).toBe(false);
    expect(ficha.frequencia.alertaLegal).toMatch(/frequência regular/i);
  });

  it('preserva zero real de presença como crítico, distinto de ausência de base', () => {
    const ficha = consolidarFichaAluno360({ aluno, turma, frequenciasTurma: comPresenca('F') });
    expect(ficha.frequencia.totalAulas).toBe(2);
    expect(ficha.frequencia.presencas).toBe(0);
    expect(ficha.frequencia.percentual).toBe(0);
    expect(ficha.frequencia.statusLdb).toBe('critico');
    expect(ficha.frequencia.disponivel).toBe(true);
    expect(ficha.frequencia.semRegistros).toBe(false);
    expect(ficha.frequencia.alertaLegal).toContain('Art. 24');
  });

  it('exporta sem registros sem 100% nem afirmação de regularidade', async () => {
    const texto = await gerarPDF(null);
    expect(texto).toMatch(/sem registros|indispon/i);
    expect(texto).not.toContain('100%');
    expect(texto).not.toContain('Frequência regular');
  });

  it('exporta zero real com 0% e alerta legal, sem confundir com indisponível', async () => {
    const texto = await gerarPDF(comPresenca('F'));
    expect(texto).toContain('0% Presença');
    expect(texto).toContain('Art. 24');
    expect(texto).not.toMatch(/sem registros|indispon/i);
  });

  it('exporta 100% e regularidade quando há presenças reais', async () => {
    const texto = await gerarPDF(comPresenca('P'));
    expect(texto).toContain('100% Presença');
    expect(texto).toContain('Frequência regular');
  });
});
