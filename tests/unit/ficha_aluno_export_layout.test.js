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
      const splitOriginal = doc.splitTextToSize.bind(doc);

      doc.save = vi.fn();
      doc.splitTextToSize = (texto, largura) => {
        const linhas = splitOriginal(texto, largura);
        divididos.push({ texto: String(texto), largura, linhas });
        return linhas;
      };
      doc.text = (texto, x, y, opcoes) => {
        chamadas.push({
          texto: String(texto),
          x,
          y,
          opcoes,
          largura: doc.getTextWidth(String(texto)),
          pagina: doc.getNumberOfPages(),
          tamanho: doc.getFontSize(),
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

import { generateFichaAluno360PDF } from '@/lib/diario/fichaAlunoExport';

const NOME_ALUNO = 'Maria Eduarda de Albuquerque Nascimento e Silva dos Santos Oliveira';
const NOME_TURMA = '3º Ano do Ensino Médio Integral — Turma Interdisciplinar de Linguagens e Ciências Humanas';
const DISCIPLINA = 'Língua Portuguesa, Literatura Brasileira e Produção Textual Interdisciplinar';
const NOME_PROFESSOR = 'Professora Doutora Ana Beatriz de Carvalho Albuquerque Montenegro';

const limites = (chamada) => {
  if (chamada.opcoes?.align === 'right') return [chamada.x - chamada.largura, chamada.x];
  if (chamada.opcoes?.align === 'center') return [chamada.x - chamada.largura / 2, chamada.x + chamada.largura / 2];
  return [chamada.x, chamada.x + chamada.largura];
};

const gerar = async () => {
  docs.length = 0;
  const aluno = { id: 'a1', nome: NOME_ALUNO, matricula: '2026.1.000123456789' };
  const turma = {
    id: 't1',
    nome: NOME_TURMA,
    disciplina: DISCIPLINA,
    alunos: [aluno],
    bimestres: {},
    ocorrencias: Array.from({ length: 24 }, (_, indice) => ({
      id: `oc-${indice}`,
      data: `2026-03-${String((indice % 28) + 1).padStart(2, '0')}`,
      titulo: `Acompanhamento pedagógico ${indice + 1}`,
      descricao: 'Registro sintético longo para verificar a paginação e a ausência de sobreposição entre as linhas.',
      alunoIds: ['a1'],
      visivelFamilia: true,
    })),
  };

  await generateFichaAluno360PDF({
    aluno,
    turma,
    frequenciasTurma: null,
    professorNome: NOME_PROFESSOR,
    parecerManual: 'Parecer sintético longo. '.repeat(40),
  });
  return docs.at(-1);
};

describe('H81-02 — ficha 360º com identificação longa', () => {
  it('quebra aluno, turma, disciplina e professor sem truncar ou sair da margem', async () => {
    const doc = await gerar();
    const textosDivididos = doc.__divididos.map((item) => item.texto);

    expect(textosDivididos).toContain(`ESTUDANTE: ${NOME_ALUNO.toUpperCase()}`);
    expect(textosDivididos).toContain(`TURMA: ${NOME_TURMA}`);
    expect(textosDivididos).toContain(`DISCIPLINA: ${DISCIPLINA}`);
    expect(textosDivididos).toContain(`MATRÍCULA: 2026.1.000123456789`);
    expect(textosDivididos).toContain(`PROFESSOR(A): ${NOME_PROFESSOR.toUpperCase()}`);

    for (const chamada of doc.__chamadas) {
      const [esquerda, direita] = limites(chamada);
      expect(esquerda).toBeGreaterThanOrEqual(13.4);
      expect(direita).toBeLessThanOrEqual(196.6);
    }
  });

  it('posiciona a seção seguinte depois do bloco e pagina todas as páginas dentro da folha', async () => {
    const doc = await gerar();
    const chamadas = doc.__chamadas;
    const tituloRendimento = chamadas.find((chamada) => chamada.texto === '1. RENDIMENTO ACADÊMICO & AVALIAÇÕES');
    expect(tituloRendimento).toBeDefined();

    const linhasIdentificacao = doc.__divididos
      .filter((item) => /^(ESTUDANTE|TURMA|DISCIPLINA|MATRÍCULA):/.test(item.texto))
      .flatMap((item) => item.linhas);
    const posicoes = [...new Set(linhasIdentificacao.map((linha) => {
      const chamada = chamadas.find((item) => item.texto === linha && item.y > 20 && item.y < tituloRendimento.y);
      return chamada?.y;
    }).filter((y) => Number.isFinite(y)))].sort((a, b) => a - b);

    expect(posicoes.length).toBeGreaterThanOrEqual(4);
    for (let indice = 1; indice < posicoes.length; indice += 1) {
      expect(posicoes[indice] - posicoes[indice - 1]).toBeGreaterThanOrEqual(3.2);
    }
    expect(tituloRendimento.y).toBeGreaterThan(posicoes.at(-1) + 3);

    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    for (const chamada of chamadas) {
      expect(chamada.y).toBeGreaterThanOrEqual(0);
      expect(chamada.y).toBeLessThanOrEqual(289);
    }
  });
});
