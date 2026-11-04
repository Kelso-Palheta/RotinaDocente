import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ docs: [] }));

vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async () => {
  const real = await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
  return {
    jsPDF: function (...args) {
      const doc = new real.jsPDF(...args);
      const textos = [];
      const faixas = [];
      const linhas = [];
      const divididos = [];
      let corFill = null;
      let corTexto = null;

      const paginaAtual = () =>
        doc.getCurrentPageInfo?.()?.pageNumber ||
        doc.internal?.getCurrentPageInfo?.()?.pageNumber ||
        doc.getNumberOfPages();

      const origSetFillColor = doc.setFillColor.bind(doc);
      const origSetTextColor = doc.setTextColor.bind(doc);
      const origRect = doc.rect.bind(doc);
      const origLine = doc.line.bind(doc);
      const origText = doc.text.bind(doc);
      const origSplit = doc.splitTextToSize.bind(doc);

      doc.setFillColor = (...rgb) => {
        corFill = rgb;
        return origSetFillColor(...rgb);
      };
      doc.setTextColor = (...rgb) => {
        corTexto = rgb;
        return origSetTextColor(...rgb);
      };
      doc.rect = (x, y, w, h, style, ...resto) => {
        faixas.push({
          pagina: paginaAtual(),
          x,
          y,
          w,
          h,
          style,
          cor: corFill ? [...corFill] : null,
        });
        return origRect(x, y, w, h, style, ...resto);
      };
      doc.line = (x1, y1, x2, y2, ...resto) => {
        linhas.push({
          pagina: paginaAtual(),
          x1,
          y1,
          x2,
          y2,
        });
        return origLine(x1, y1, x2, y2, ...resto);
      };
      doc.splitTextToSize = (valor, largura, ...resto) => {
        const fonte = doc.getFont();
        const resultado = origSplit(valor, largura, ...resto);
        divididos.push({
          pagina: paginaAtual(),
          texto: String(valor),
          largura,
          familia: fonte?.fontName,
          estilo: fonte?.fontStyle,
          tamanho: Number(doc.getFontSize()),
          linhas: Array.isArray(resultado) ? [...resultado] : [String(resultado)],
        });
        return resultado;
      };
      doc.text = (valor, x, y, opcoes, ...resto) => {
        const fonte = doc.getFont();
        const tamanho = Number(doc.getFontSize());
        const itens = Array.isArray(valor) ? valor.map(String) : [String(valor)];
        const fatorLinha = typeof doc.getLineHeightFactor === 'function' ? doc.getLineHeightFactor() : 1.15;
        const passoLinha = (tamanho * 0.3527777778) * fatorLinha;
        itens.forEach((item, idx) => {
          textos.push({
            pagina: paginaAtual(),
            texto: item,
            x,
            y: y + idx * passoLinha,
            opcoes: opcoes ? { ...opcoes } : undefined,
            largura: doc.getTextWidth(item),
            familia: fonte?.fontName,
            estilo: fonte?.fontStyle,
            tamanho,
            corTexto: corTexto ? [...corTexto] : null,
          });
        });
        return origText(valor, x, y, opcoes, ...resto);
      };
      doc.save = vi.fn();

      doc.__textos = textos;
      doc.__faixas = faixas;
      doc.__linhas = linhas;
      doc.__divididos = divididos;
      m.docs.push(doc);
      return doc;
    },
  };
});

import {
  exportBimestreCSV,
  exportCadernetaCSV,
  generateCadernetaPDF,
  generateRelatorioBimestrePDF,
} from '@/lib/diario/caderneta-export';

const limitesHorizontais = (chamada) => {
  if (chamada.opcoes?.align === 'right') return [chamada.x - chamada.largura, chamada.x];
  if (chamada.opcoes?.align === 'center') return [chamada.x - chamada.largura / 2, chamada.x + chamada.largura / 2];
  return [chamada.x, chamada.x + chamada.largura];
};

const fundoCabecalho = (doc) =>
  doc.__faixas.find((f) => f.pagina === 1 && f.cor?.join(',') === '18,60,58' && f.x === 0 && f.y === 0);

const faixaDecorativa = (doc) =>
  doc.__faixas.find((f) => f.pagina === 1 && f.cor?.join(',') === '15,118,110' && f.x === 0);

const primeiroCabecalhoTabela = (doc, pagina = 1) =>
  doc.__faixas.find((f) => f.pagina === pagina && f.cor?.join(',') === '243,247,245' && f.style === 'F');

const textosCabecalho = (doc) => {
  const tabela = primeiroCabecalhoTabela(doc, 1);
  const limiteY = tabela ? tabela.y : 60;
  return doc.__textos.filter((t) => t.pagina === 1 && t.y < limiteY);
};

beforeEach(() => {
  m.docs.length = 0;
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 4, 14, 35, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Caderneta PDF — cabeçalho dinâmico e preservação (CAB-01..06)', () => {
  it('CAB-01/02/03 (curto): mantém título, metadados, margens de 12 mm e folgas de 4 mm e 6 mm sem colisão', async () => {
    const turma = {
      id: 't-curta',
      nome: '3º Ano A',
      alunos: [{ id: 'a1', nome: 'Ana Souza' }],
      bimestres: {
        1: { atividades: [], notas: { a1: { simulado: 6 } } },
        2: { atividades: [], notas: { a1: { simulado: 7 } } },
        3: { atividades: [], notas: { a1: { simulado: 6 } } },
        4: { atividades: [], notas: { a1: { simulado: 6 } } },
      },
    };

    await generateCadernetaPDF(turma, 'Prof. Carlos Lima');
    const doc = m.docs.at(-1);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    expect(pageWidth).toBeCloseTo(297, 0);
    expect(pageHeight).toBeCloseTo(210, 0);

    const fundo = fundoCabecalho(doc);
    const faixa = faixaDecorativa(doc);
    const tabela = primeiroCabecalhoTabela(doc, 1);
    const cabecalho = textosCabecalho(doc);
    const titulo = cabecalho.find((t) => t.texto.includes('Rotina Docente — Caderneta de Rendimento Escolar Anual'));
    const metadados = cabecalho.filter((t) => t !== titulo);

    expect(fundo).toBeDefined();
    expect(faixa).toBeDefined();
    expect(tabela).toBeDefined();
    expect(titulo).toBeDefined();
    expect(titulo.familia).toBe('helvetica');
    expect(titulo.estilo).toBe('bold');
    expect(titulo.tamanho).toBe(16);

    const textoUnido = metadados.map((t) => t.texto).join(' ');
    expect(textoUnido).toContain('TURMA: 3º ANO A');
    expect(textoUnido).toContain('TOTAL DE ALUNOS: 1');
    expect(textoUnido).toContain('PROFESSOR(A): Prof. Carlos Lima');
    expect(textoUnido).toContain('EMISSÃO:');

    for (const item of metadados) {
      expect(item.familia).toBe('helvetica');
      expect(item.estilo).toBe('normal');
      expect(item.tamanho).toBe(9);
      const [esq, dir] = limitesHorizontais(item);
      expect(esq).toBeGreaterThanOrEqual(11.8);
      expect(dir).toBeLessThanOrEqual(pageWidth - 12 + 0.2);
    }

    const ultimoBaseline = Math.max(...metadados.map((t) => t.texto ? t.y : 0));
    expect(faixa.y - ultimoBaseline).toBeGreaterThanOrEqual(3.99);
    expect(fundo.y + fundo.h).toBeGreaterThanOrEqual(faixa.y + faixa.h - 0.01);
    expect(tabela.y - (faixa.y + faixa.h)).toBeGreaterThanOrEqual(5.99);
  });

  it('CAB-01/03 (colisão da amostra de homologação): impede sobreposição entre turma, total de alunos, professor e emissão', async () => {
    const turma = {
      id: 't-colisao',
      nome: '3º Ano do Ensino Médio Integral — Turma Interdisciplinar de Linguagens e Ciências Humanas',
      alunos: [{ id: 'a1', nome: 'Ana Clara de Albuquerque Nascimento e Silva' }],
      bimestres: {
        1: { atividades: [{ id: 'atv', max: 5 }], notas: { a1: { simulado: 4, atv: 0 } } },
        2: { atividades: [{ id: 'atv', max: 5 }], notas: { a1: { simulado: 5, atv: 3 } } },
        3: { atividades: [{ id: 'atv', max: 5 }], notas: { a1: { simulado: 5, atv: 0 } } },
        4: { atividades: [{ id: 'atv', max: 5 }], notas: { a1: { simulado: 5, atv: 0 } } },
      },
    };

    await generateCadernetaPDF(turma, 'Professor Sintético');
    const doc = m.docs.at(-1);
    const cabecalho = textosCabecalho(doc);

    for (let i = 0; i < cabecalho.length; i += 1) {
      for (let j = i + 1; j < cabecalho.length; j += 1) {
        const a = cabecalho[i];
        const b = cabecalho[j];
        if (Math.abs(a.y - b.y) < 3.0) {
          const [esqA, dirA] = limitesHorizontais(a);
          const [esqB, dirB] = limitesHorizontais(b);
          const intersecaoX = Math.min(dirA, dirB) - Math.max(esqA, esqB);
          expect(intersecaoX).toBeLessThanOrEqual(0.2);
        }
      }
    }
  });

  it('CAB-01/02/03 (nomes longos e ~300 caracteres): quebra linhas em normal 9, sem truncar, sem colidir e dentro de 273 mm', async () => {
    const nomeTurmaLongo =
      '3º Ano do Ensino Médio Integral em Tempo Estendido — Turma Interdisciplinar de Linguagens, Códigos, Ciências Humanas, Sociais Aplicadas, Redação Científica e Projetos de Iniciação Acadêmica Avançada do Bloco Pedagógico Integrado Norte-Sul — Unidade Experimental de Educação Integral Contemporânea 2026';
    const nomeProfessorLongo =
      'Professora Doutora Maria Fernanda de Albuquerque Nascimento e Silva Montenegro de Vasconcelos Cavalcanti — Coordenadora Regente da Área de Linguagens, Literatura Brasileira, Produção Textual Interdisciplinar e Práticas de Letramento Acadêmico do Ensino Médio em Tempo Integral da Rede Pública Estadual';

    expect(nomeTurmaLongo.length).toBeGreaterThanOrEqual(280);
    expect(nomeProfessorLongo.length).toBeGreaterThanOrEqual(280);

    const turma = {
      id: 't-longa',
      nome: nomeTurmaLongo,
      alunos: [
        { id: 'a1', nome: 'Ana Clara de Albuquerque Nascimento e Silva dos Santos Oliveira' },
      ],
      bimestres: {
        1: { atividades: [], notas: { a1: { simulado: 4 } } },
        2: { atividades: [], notas: { a1: { simulado: 8 } } },
        3: { atividades: [], notas: { a1: { simulado: 5 } } },
        4: { atividades: [], notas: { a1: { simulado: 5 } } },
      },
      recuperacao: {
        a1: { rec1: 8 },
      },
    };

    await generateCadernetaPDF(turma, nomeProfessorLongo);
    const doc = m.docs.at(-1);
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - 24;

    const fundo = fundoCabecalho(doc);
    const faixa = faixaDecorativa(doc);
    const tabela = primeiroCabecalhoTabela(doc, 1);
    const cabecalho = textosCabecalho(doc);
    const titulo = cabecalho.find((t) => t.texto.includes('Rotina Docente — Caderneta de Rendimento Escolar Anual'));
    const metadados = cabecalho.filter((t) => t !== titulo);

    // Nenhuma linha pode ultrapassar a margem direita (285 mm) ou esquerda (12 mm)
    for (const item of metadados) {
      expect(item.texto).not.toContain('...');
      expect(item.familia).toBe('helvetica');
      expect(item.estilo).toBe('normal');
      expect(item.tamanho).toBe(9);
      const [esq, dir] = limitesHorizontais(item);
      expect(esq).toBeGreaterThanOrEqual(11.8);
      expect(dir).toBeLessThanOrEqual(pageWidth - 12 + 0.2);
      expect(item.y).toBeGreaterThan(titulo.y + 3);
    }

    // Nenhuma sobreposição geométrica entre quaisquer elementos de texto do cabeçalho
    for (let i = 0; i < cabecalho.length; i += 1) {
      for (let j = i + 1; j < cabecalho.length; j += 1) {
        const a = cabecalho[i];
        const b = cabecalho[j];
        if (Math.abs(a.y - b.y) < 3.0) {
          const [esqA, dirA] = limitesHorizontais(a);
          const [esqB, dirB] = limitesHorizontais(b);
          const intersecaoX = Math.min(dirA, dirB) - Math.max(esqA, esqB);
          expect(intersecaoX).toBeLessThanOrEqual(0.2);
        }
      }
    }

    // Verifica que splitTextToSize foi chamado com helvetica normal 9 e largura útil ~273 mm
    const divisaoTurma = doc.__divididos.find((d) => d.texto.startsWith('TURMA:'));
    const divisaoProf = doc.__divididos.find((d) => d.texto.startsWith('PROFESSOR(A):'));
    expect(divisaoTurma).toBeDefined();
    expect(divisaoProf).toBeDefined();
    expect(divisaoTurma.familia).toBe('helvetica');
    expect(divisaoTurma.estilo).toBe('normal');
    expect(divisaoTurma.tamanho).toBe(9);
    expect(divisaoTurma.largura).toBeCloseTo(maxLineWidth, 1);
    expect(divisaoProf.familia).toBe('helvetica');
    expect(divisaoProf.estilo).toBe('normal');
    expect(divisaoProf.tamanho).toBe(9);
    expect(divisaoProf.largura).toBeCloseTo(maxLineWidth, 1);

    // Conservação integral dos textos sem reticências no cabeçalho
    const textoCabecalhoNormalizado = metadados
      .map((t) => t.texto.trim())
      .join(' ')
      .replace(/\s+/g, ' ');
    expect(textoCabecalhoNormalizado).toContain(`TURMA: ${nomeTurmaLongo.toUpperCase()}`);
    expect(textoCabecalhoNormalizado).toContain('TOTAL DE ALUNOS: 1');
    expect(textoCabecalhoNormalizado).toContain(`PROFESSOR(A): ${nomeProfessorLongo}`);
    expect(textoCabecalhoNormalizado).toContain('EMISSÃO: 04/11/2026 às 14:35');

    // Folgas verticais obrigatórias CAB-03
    const ultimoBaseline = Math.max(...metadados.map((t) => t.y));
    expect(faixa.y - ultimoBaseline).toBeGreaterThanOrEqual(3.99);
    expect(fundo.y + fundo.h).toBeGreaterThanOrEqual(faixa.y + faixa.h - 0.01);
    expect(tabela.y - (faixa.y + faixa.h)).toBeGreaterThanOrEqual(5.99);
    expect(tabela.y).toBeGreaterThan(38);
  });

  it('CAB-04 (45 alunos com cabeçalho longo): desloca tabela, pagina com linhas inteiras, repete cabeçalho da tabela e separa assinaturas', async () => {
    const alunos = Array.from({ length: 45 }, (_, idx) => ({
      id: `al-${idx + 1}`,
      nome: `Estudante Sintético Número ${String(idx + 1).padStart(2, '0')} da Turma Experimental`,
    }));
    const notas = Object.fromEntries(
      alunos.map((al, idx) => [al.id, { simulado: (idx % 5) + 5 }])
    );
    const turma = {
      id: 't-45',
      nome: '2º Ano do Ensino Médio em Tempo Integral — Itinerário Formativo de Ciências da Natureza e Matemática Aplicada',
      alunos,
      bimestres: {
        1: { atividades: [], notas },
        2: { atividades: [], notas },
        3: { atividades: [], notas },
        4: { atividades: [], notas },
      },
    };

    await generateCadernetaPDF(
      turma,
      'Professor Doutor Henrique Eduardo de Oliveira Cavalcanti Albuquerque'
    );
    const doc = m.docs.at(-1);
    const totalPaginas = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const tabelaPag1 = primeiroCabecalhoTabela(doc, 1);

    expect(tabelaPag1.y).toBeGreaterThan(38);
    expect(totalPaginas).toBeGreaterThanOrEqual(3);

    // Todos os 45 alunos estão presentes na ordem correta
    const linhasAlunos = doc.__textos.filter((t) => /^\d{2}\.\s/.test(t.texto));
    expect(linhasAlunos).toHaveLength(45);
    linhasAlunos.forEach((item, idx) => {
      const prefixoEsperado = `${String(idx + 1).padStart(2, '0')}. `;
      expect(item.texto.startsWith(prefixoEsperado)).toBe(true);
      // Cada linha de aluno tem 11 mm de altura (baseline em cursorY + 4.5); a linha inteira deve caber na página
      const topoLinha = item.y - 4.5;
      const baseLinha = topoLinha + 11;
      expect(baseLinha).toBeLessThanOrEqual(pageHeight - 10);
    });

    // Cada página que contém alunos deve possuir o cabeçalho da tabela acima do primeiro aluno daquela página
    const paginasComAlunos = [...new Set(linhasAlunos.map((l) => l.pagina))];
    for (const pag of paginasComAlunos) {
      const cabTabela = doc.__textos.find(
        (t) => t.pagina === pag && t.texto === 'Nº / NOME DO ESTUDANTE'
      );
      const primeiroAlunoPag = linhasAlunos.find((l) => l.pagina === pag);
      expect(cabTabela).toBeDefined();
      expect(cabTabela.y).toBeLessThan(primeiroAlunoPag.y);
    }

    // Assinaturas na última página, separadas da última linha de aluno e dentro da página
    const assProf = doc.__textos.find((t) => t.texto === 'Assinatura do(a) Professor(a) Regente');
    const assCoord = doc.__textos.find((t) => t.texto === 'Assinatura da Coordenação / Direção');
    expect(assProf).toBeDefined();
    expect(assCoord).toBeDefined();
    expect(assProf.pagina).toBe(totalPaginas);
    expect(assCoord.pagina).toBe(totalPaginas);
    expect(assProf.y).toBeLessThanOrEqual(pageHeight - 8);

    const alunosUltimaPag = linhasAlunos.filter((l) => l.pagina === totalPaginas);
    if (alunosUltimaPag.length > 0) {
      const ultimoAlunoY = Math.max(...alunosUltimaPag.map((l) => l.y));
      // Baseline do aluno é cursorY + 4.5; base da linha é cursorY + 11 = ultimoAlunoY + 6.5
      expect(assProf.y - (ultimoAlunoY + 6.5)).toBeGreaterThanOrEqual(5);
    }
  });

  it('CAB-05: preserva cálculos 25/25/50, zero vs ausência, cores de situação, colunas e truncamento de 34 caracteres na tabela', async () => {
    const turma = {
      id: 't-notas',
      nome: '1º Ano B',
      alunos: [
        {
          id: 'al-aprov',
          nome: 'Estudante Com Nome Muito Longo Que Ultrapassa Trinta E Quatro Caracteres Na Tabela',
        },
        {
          id: 'al-zero-ausente',
          nome: 'Bruno Zero E Ausência',
        },
        {
          id: 'al-rec',
          nome: 'Carla Em Recuperação Anual',
        },
      ],
      bimestres: {
        1: {
          atividades: [{ id: 'atv1', max: 5 }],
          notas: {
            'al-aprov': { simulado: 4, atv1: 0 },
            'al-zero-ausente': { simulado: 0, atv1: 0 },
            'al-rec': { simulado: 4, atv1: 0 },
          },
        },
        2: {
          atividades: [{ id: 'atv2', max: 5 }],
          notas: {
            'al-aprov': { simulado: 5, atv2: 3 },
            'al-zero-ausente': { simulado: 5, atv2: 0 },
            'al-rec': { simulado: 4, atv2: 0 },
          },
        },
        3: {
          atividades: [{ id: 'atv3', max: 5 }],
          notas: {
            'al-aprov': { simulado: 5, atv3: 0 },
            'al-rec': { simulado: 4, atv3: 0 },
          },
        },
        4: {
          atividades: [{ id: 'atv4', max: 5 }],
          notas: {
            'al-aprov': { simulado: 5, atv4: 0 },
            'al-rec': { simulado: 4, atv4: 0 },
          },
        },
      },
    };

    await generateCadernetaPDF(turma, 'Prof. Teste');
    const doc = m.docs.at(-1);

    // Verifica truncamento de nome na tabela (> 34 chars -> 32 chars + "...")
    const linhaAluno1 = doc.__textos.find((t) => t.texto.startsWith('01. '));
    expect(linhaAluno1).toBeDefined();
    expect(linhaAluno1.texto).toBe('01. Estudante Com Nome Muito Longo Q...');

    // Aluno 1: B1=4,00, B2=8,00 -> S1 = 4*2 + 8*3 = 32,00; B3=5,00, B4=5,00 -> S2 = 25,00; Total Anual = 57,00 -> APROVADO
    const textosAl1 = doc.__textos.filter((t) => Math.abs(t.y - linhaAluno1.y) < 0.2);
    const valoresAl1 = textosAl1.map((t) => t.texto);
    expect(valoresAl1).toContain('4,00');
    expect(valoresAl1).toContain('8,00');
    expect(valoresAl1).toContain('32,00');
    expect(valoresAl1).toContain('5,00');
    expect(valoresAl1).toContain('25,00');
    expect(valoresAl1).toContain('57,00');
    expect(valoresAl1).toContain('APROVADO');
    const situacaoAl1 = textosAl1.find((t) => t.texto === 'APROVADO');
    expect(situacaoAl1.corTexto).toEqual([22, 101, 52]);

    // Aluno 2: B1 = 0 real ("0,00"), B2 = 5 ("5,00"), B3 e B4 ausentes ("—"), situação "EM ANDAMENTO"
    const linhaAluno2 = doc.__textos.find((t) => t.texto.startsWith('02. '));
    const textosAl2 = doc.__textos.filter((t) => Math.abs(t.y - linhaAluno2.y) < 0.2);
    const valoresAl2 = textosAl2.map((t) => t.texto);
    expect(valoresAl2).toContain('0,00');
    expect(valoresAl2).toContain('5,00');
    expect(valoresAl2.filter((v) => v === '—').length).toBeGreaterThanOrEqual(3);
    expect(valoresAl2).toContain('EM ANDAMENTO');
    const situacaoAl2 = textosAl2.find((t) => t.texto === 'EM ANDAMENTO');
    expect(situacaoAl2.corTexto).toEqual([79, 107, 99]);

    // Aluno 3: todos os 4 bimestres = 4 -> S1=20, S2=20, Total Anual=40 < 50 -> "RECUPERAÇÃO" em vermelho [153, 27, 27]
    const linhaAluno3 = doc.__textos.find((t) => t.texto.startsWith('03. '));
    const textosAl3 = doc.__textos.filter((t) => Math.abs(t.y - linhaAluno3.y) < 0.2);
    const situacaoAl3 = textosAl3.find((t) => t.texto === 'RECUPERAÇÃO');
    expect(situacaoAl3).toBeDefined();
    expect(situacaoAl3.corTexto).toEqual([153, 27, 27]);
  });

  it('CAB-06: exporta turma vazia e professor omitido sem mutar argumentos e preserva exportações irmãs', async () => {
    const turmaVazia = {
      id: 't-vazia',
      nome: 'Turma Sem Alunos Cadastrados',
      alunos: [],
      bimestres: {},
    };
    const copiaAntes = structuredClone(turmaVazia);

    await generateCadernetaPDF(turmaVazia);
    expect(turmaVazia).toEqual(copiaAntes);

    const doc = m.docs.at(-1);
    const cabecalho = textosCabecalho(doc);
    const textoUnido = cabecalho.map((t) => t.texto).join(' ');
    expect(textoUnido).toContain('TURMA: TURMA SEM ALUNOS CADASTRADOS');
    expect(textoUnido).toContain('TOTAL DE ALUNOS: 0');
    expect(textoUnido).toContain('PROFESSOR(A): Professor(a)');
    expect(doc.save).toHaveBeenCalledTimes(1);

    expect(typeof exportCadernetaCSV).toBe('function');
    expect(typeof generateRelatorioBimestrePDF).toBe('function');
    expect(typeof exportBimestreCSV).toBe('function');
  });
});
