import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ docs: [] }));

vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const real = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return {
    jsPDF: function (...args) {
      const doc = new real.jsPDF(...args);
      const textos = [];
      const faixas = [];
      const divididos = [];
      let cor = null;

      const colorir = doc.setFillColor.bind(doc);
      const retangulo = doc.rect.bind(doc);
      const escrever = doc.text.bind(doc);
      const dividir = doc.splitTextToSize.bind(doc);

      doc.setFillColor = (...rgb) => {
        cor = rgb;
        return colorir(...rgb);
      };
      doc.rect = (x, y, w, h, ...resto) => {
        faixas.push({ x, y, w, h, cor });
        return retangulo(x, y, w, h, ...resto);
      };
      doc.splitTextToSize = (valor, largura) => {
        const fonte = doc.getFont();
        const linhas = dividir(valor, largura);
        divididos.push({
          texto: String(valor),
          largura,
          familia: fonte?.fontName,
          estilo: fonte?.fontStyle,
          tamanho: Number(doc.getFontSize()),
          linhas,
        });
        return linhas;
      };
      doc.text = (valor, x, y, opcoes) => {
        textos.push({
          texto: String(valor),
          x,
          y,
          opcoes,
          largura: doc.getTextWidth(String(valor)),
          familia: doc.getFont()?.fontName,
          estilo: doc.getFont()?.fontStyle,
          tamanho: Number(doc.getFontSize()),
        });
        return escrever(valor, x, y, opcoes);
      };
      doc.save = vi.fn();

      doc.__textos = textos;
      doc.__faixas = faixas;
      doc.__divididos = divididos;
      m.docs.push(doc);
      return doc;
    },
  };
});

import { generateBoletimPDF } from '@/lib/aluno/boletim-pdf';
import { generateFichaAluno360PDF } from '@/lib/diario/fichaAlunoExport';

beforeEach(() => {
  m.docs.length = 0;
});

const faixaRosa = (doc) => doc.__faixas.find((faixa) => faixa.cor?.join(',') === '246,12,73');

const limites = (chamada) => {
  if (chamada.opcoes?.align === 'right') return [chamada.x - chamada.largura, chamada.x];
  if (chamada.opcoes?.align === 'center') return [chamada.x - chamada.largura / 2, chamada.x + chamada.largura / 2];
  return [chamada.x, chamada.x + chamada.largura];
};

const divisaoDe = (doc, prefixo) => doc.__divididos.find((item) => item.texto.startsWith(prefixo));

describe('REV-H81-01 — emissão do boletim separada da faixa rosa', () => {
  it('cabeçalho curto: reserva folga e desloca a tabela para baixo da faixa', () => {
    generateBoletimPDF({
      nomeAluno: 'Aluno Exemplo',
      turmaNome: 'Turma de teste',
      bimTotais: [5, 5, 5, 5],
    });
    const doc = m.docs.at(-1);
    const emissao = doc.__textos.find((texto) => texto.texto.startsWith('EMISSÃO:'));
    const faixa = faixaRosa(doc);
    const tabela = doc.__textos.find((texto) => texto.texto === 'PERÍODO / ETAPA');

    expect(faixa).toBeDefined();
    expect(emissao).toBeDefined();
    expect(faixa.y - emissao.y).toBeGreaterThanOrEqual(3);
    expect(tabela.y).toBeGreaterThan(faixa.y);
  });

  it('cabeçalho longo: mede aluno/turma em normal 10 e mantém tudo na folha', () => {
    const nomeAluno = 'Ana Clara de Albuquerque Nascimento e Silva dos Santos Oliveira';
    const turmaNome = '3º Ano do Ensino Médio Integral — Turma Interdisciplinar de Linguagens e Ciências Humanas';
    generateBoletimPDF({
      nomeAluno,
      turmaNome,
      bimTotais: [5, 5, 5, 5],
    });
    const doc = m.docs.at(-1);
    const emissao = doc.__textos.find((texto) => texto.texto.startsWith('EMISSÃO:'));
    const faixa = faixaRosa(doc);
    const tabela = doc.__textos.find((texto) => texto.texto === 'PERÍODO / ETAPA');

    const aluno = divisaoDe(doc, 'ALUNO(A):');
    const turma = divisaoDe(doc, 'TURMA:');
    expect(aluno.estilo).toBe('normal');
    expect(aluno.tamanho).toBe(10);
    expect(turma.estilo).toBe('normal');
    expect(turma.tamanho).toBe(10);

    expect(faixa.y - emissao.y).toBeGreaterThanOrEqual(3);
    expect(tabela.y).toBeGreaterThan(faixa.y);
    for (const chamada of doc.__textos) {
      const [, direita] = limites(chamada);
      expect(direita).toBeLessThanOrEqual(195.1);
    }
  });
});

describe('REV-H81-02 — identificação medida com a fonte da impressão', () => {
  it('cabeçalho curto: professor medido em normal 8,5 e emissão acima da faixa', async () => {
    const aluno = { id: 'a', nome: 'Ana Souza', matricula: '123' };
    const turma = { id: 't', nome: '3º Ano A', disciplina: 'Língua Portuguesa', alunos: [aluno], bimestres: {} };
    await generateFichaAluno360PDF({ aluno, turma, professorNome: 'Professor de Teste' });
    const doc = m.docs.at(-1);
    const emissao = doc.__textos.find((texto) => texto.texto.startsWith('EMISSÃO:'));
    const faixa = faixaRosa(doc);
    const professor = divisaoDe(doc, 'PROFESSOR(A):');

    expect(professor.estilo).toBe('normal');
    expect(professor.tamanho).toBe(8.5);
    expect(faixa.y - emissao.y).toBeGreaterThanOrEqual(3);
  });

  it('cabeçalho longo: estudante é medido/escrito em bold 9,5 e não cruza a margem', async () => {
    const aluno = {
      id: 'a1',
      nome: 'Maria Eduarda de Albuquerque Nascimento e Silva dos Santos Oliveira',
      matricula: '2026.1.000123456789',
    };
    const turma = {
      id: 't1',
      nome: '3º Ano do Ensino Médio Integral — Turma Interdisciplinar de Linguagens e Ciências Humanas',
      disciplina: 'Língua Portuguesa, Literatura Brasileira e Produção Textual Interdisciplinar',
      alunos: [aluno],
      bimestres: {},
    };
    await generateFichaAluno360PDF({
      aluno,
      turma,
      professorNome: 'Professora Doutora Ana Beatriz de Carvalho Albuquerque Montenegro',
    });
    const doc = m.docs.at(-1);
    const emissao = doc.__textos.find((texto) => texto.texto.startsWith('EMISSÃO:'));
    const faixa = faixaRosa(doc);
    const estudante = divisaoDe(doc, 'ESTUDANTE:');

    expect(estudante.estilo).toBe('bold');
    expect(estudante.tamanho).toBe(9.5);
    expect(faixa.y - emissao.y).toBeGreaterThanOrEqual(3);

    const desenhadas = estudante.linhas.map((linha) => doc.__textos.find((texto) => texto.texto === linha && texto.y > 20));
    expect(desenhadas.length).toBeGreaterThan(0);
    for (const linha of desenhadas) {
      expect(linha).toBeDefined();
      if (!linha) continue;
      expect(linha.estilo).toBe('bold');
      expect(linha.tamanho).toBe(9.5);
      const [esquerda, direita] = limites(linha);
      expect(esquerda).toBeGreaterThanOrEqual(13.4);
      expect(direita).toBeLessThanOrEqual(196.6);
    }
    for (const chamada of doc.__textos) {
      const [esquerda, direita] = limites(chamada);
      expect(esquerda).toBeGreaterThanOrEqual(13.4);
      expect(direita).toBeLessThanOrEqual(196.6);
    }
  });
});
