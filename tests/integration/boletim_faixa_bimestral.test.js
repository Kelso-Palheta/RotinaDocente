import { describe, expect, it, vi } from 'vitest';

const docs = vi.hoisted(() => []);

vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const actual = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return {
    jsPDF: function (...args) {
      const doc = new actual.jsPDF(...args);
      const chamadas = [];
      const divididos = [];
      const textOriginal = doc.text.bind(doc);
      const setTextColorOriginal = doc.setTextColor.bind(doc);
      const splitOriginal = doc.splitTextToSize.bind(doc);
      let corAtual = null;

      doc.save = vi.fn();
      doc.splitTextToSize = (texto, largura) => {
        const linhas = splitOriginal(texto, largura);
        divididos.push({ texto: String(texto), largura, linhas });
        return linhas;
      };
      doc.setTextColor = (...valores) => {
        corAtual = valores;
        return setTextColorOriginal(...valores);
      };
      doc.text = (texto, x, y, opcoes) => {
        chamadas.push({
          texto: String(texto),
          x,
          y,
          opcoes,
          cor: corAtual,
          tamanho: doc.getFontSize(),
          fonte: doc.getFont()?.fontStyle,
          largura: doc.getTextWidth(String(texto)),
        });
        return textOriginal(texto, x, y, opcoes);
      };
      Object.defineProperty(doc, '__chamadas', { value: chamadas });
      Object.defineProperty(doc, '__divididos', { value: divididos });
      docs.push(doc);
      return doc;
    },
  };
});

import { generateBoletimPDF } from '@/lib/aluno/boletim-pdf';

const VERMELHO = [220, 38, 38];
const AZUL = [37, 99, 235];
const VERDE = [22, 101, 52];
const CINZA = [150, 160, 180];

const config = (mediaAprovacao) => ({ mediaAprovacao });
const bimestresCom = (...minimos) => Object.fromEntries(
  minimos.map((mediaAprovacao, indice) => [String(indice + 1), { config: config(mediaAprovacao) }])
);

const gerar = (dados = {}) => {
  docs.length = 0;
  generateBoletimPDF({
    nomeAluno: 'Ana Exemplo',
    turmaNome: 'Turma Sintética',
    bimTotais: [5, 6, 8, 0],
    S1: { total: 32 },
    S2: { total: 25 },
    totalAnual: 57,
    ...dados,
  });
  return docs.at(-1).__chamadas;
};

const chamadasComTexto = (chamadas, texto) => chamadas.filter((chamada) => chamada.texto === texto);

describe('H81-01 — boletim usa a faixa e a configuração do bimestre', () => {
  it('classifica 5,00 como azul/Na média sem o corte fixo 6 e mantém 25/25/50', () => {
    const chamadas = gerar();
    const naMedia = chamadasComTexto(chamadas, 'Na média');

    expect(naMedia).toHaveLength(2);
    expect(naMedia.every((chamada) => chamada.cor?.join(',') === AZUL.join(','))).toBe(true);
    expect(chamadasComTexto(chamadas, 'Atenção')).toHaveLength(0);
    expect(chamadasComTexto(chamadas, 'Satisfatório')).toHaveLength(0);

    expect(chamadas.some((chamada) => chamada.texto === '32,00')).toBe(true);
    expect(chamadas.some((chamada) => chamada.texto === '25,00')).toBe(true);
    expect(chamadas.some((chamada) => chamada.texto === '57,00')).toBe(true);
    expect(chamadasComTexto(chamadas, 'Mínimo: 25,00 pontos')).toHaveLength(2);
    expect(chamadasComTexto(chamadas, 'Mínimo: 50,00 pontos')).toHaveLength(1);
  });

  it('respeita mínimo customizado, limites e a precedência do vermelho', () => {
    const chamadas = gerar({
      bimTotais: [6.5, 7, 8, 9],
      bimestres: bimestresCom(7, 7, 9, 9),
    });

    const abaixo = chamadasComTexto(chamadas, 'Abaixo da média');
    const naMedia = chamadasComTexto(chamadas, 'Na média');
    const excelente = chamadasComTexto(chamadas, 'Excelente');

    expect(abaixo).toHaveLength(2);
    expect(abaixo.every((chamada) => chamada.cor?.join(',') === VERMELHO.join(','))).toBe(true);
    expect(naMedia).toHaveLength(1);
    expect(naMedia[0].cor).toEqual(AZUL);
    expect(excelente).toHaveLength(1);
    expect(excelente[0].cor).toEqual(VERDE);
  });

  it('distingue ausência de zero real e usa Em aberto para ausência', () => {
    const chamadas = gerar({ bimTotais: [0, null, '', undefined] });

    const abaixo = chamadasComTexto(chamadas, 'Abaixo da média');
    const emAberto = chamadasComTexto(chamadas, 'Em aberto');

    expect(abaixo).toHaveLength(1);
    expect(abaixo[0].cor).toEqual(VERMELHO);
    expect(emAberto).toHaveLength(3);
    expect(emAberto.every((chamada) => chamada.cor?.join(',') === CINZA.join(','))).toBe(true);
    expect(chamadas.some((chamada) => chamada.texto === '0,00')).toBe(true);
    expect(chamadasComTexto(chamadas, 'Abaixo da média')).toHaveLength(1);
  });

  it('aplica verde a partir de 8 e mantém o mínimo customizado no azul', () => {
    const chamadas = gerar({
      bimTotais: [8, 7.99, 5, 4.99],
      bimestres: bimestresCom(5, 5, 5, 5),
    });

    expect(chamadasComTexto(chamadas, 'Excelente')[0].cor).toEqual(VERDE);
    expect(chamadasComTexto(chamadas, 'Na média')[0].cor).toEqual(AZUL);
    expect(chamadasComTexto(chamadas, 'Abaixo da média')).toHaveLength(1);
  });

  it('quebra aluno e turma longos no cabeçalho sem ultrapassar a folha', () => {
    const nomeAluno = 'Ana Clara de Albuquerque Nascimento e Silva dos Santos Oliveira';
    const turmaNome = '3º Ano do Ensino Médio Integral — Turma Interdisciplinar de Linguagens e Ciências Humanas';
    docs.length = 0;
    generateBoletimPDF({
      nomeAluno,
      turmaNome,
      bimTotais: [5, 5, 5, 5],
      S1: { total: 25 },
      S2: { total: 25 },
      totalAnual: 50,
    });
    const doc = docs.at(-1);
    const divididos = doc.__divididos.map((item) => item.texto);

    expect(divididos).toContain(`ALUNO(A): ${nomeAluno.toUpperCase()}`);
    expect(divididos).toContain(`TURMA: ${turmaNome.toUpperCase()}`);
    for (const chamada of doc.__chamadas) {
      expect(chamada.x + chamada.largura).toBeLessThanOrEqual(195.1);
    }
  });
});
