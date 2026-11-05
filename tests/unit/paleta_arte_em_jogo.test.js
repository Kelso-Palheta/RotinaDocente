/**
 * AJ-01..03 — Paleta "Arte em jogo" (roxo festival) aplicada a todo o site.
 *
 * Fonte normativa: specs/PALETA_ARTE_EM_JOGO_SPEC.md (05/11/2026), que substitui
 * a identidade petróleo/sálvia para a interface própria, com preservações:
 * cores de nota (RN-18), faixas críticas de Analytics, paleta de disciplinas do
 * Horário Escolar, imagens e o módulo Revisão ao Vivo (tokens próprios intactos).
 *
 * O teste verifica ESTRUTURA: tokens centrais, ausência dos hexes antigos de
 * marca em produção (exceções declaradas), preservação literal das cores de nota
 * e contraste WCAG 2.1 calculado de forma independente nos pares da especificação.
 * Ele NÃO prova que cada superfície da interface ficou legível em todas as
 * larguras; essa conferência visual é do relatório/evidências da entrega.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(RAIZ, 'frontend/src');
const CSS = path.join(SRC, 'app/globals.css');

// AJ-01 — tokens centrais aprovados (nomes herdados do legado por compatibilidade).
const TOKENS_APROVADOS = {
  '--pink': '#6315d9',
  '--pink-dark': '#5411b8',
  '--navy': '#25104a',
  '--ink': '#25104a',
  '--foreground': '#25104a',
  '--background': '#fffdf7',
  '--bg-soft': '#f3edff',
  '--pink-light': '#e7dbfd',
  '--pink-soft': '#f3edff',
  '--gray': '#5b4b86',
  '--gray-light': '#6e5f94',
  '--border': '#e2d9f7',
  '--primary': '#6315d9',
  '--primary-foreground': '#ffffff',
  '--white': '#ffffff',
};

// Destaques vibrantes registrados na especificação (não usados como texto em fundo claro).
const DESTAQUES = {
  '--accent-ciano': '#00ddeb',
  '--accent-amarelo': '#ffe500',
  '--accent-rosa': '#ff2d93',
  '--accent-lima': '#b9ef00',
  '--surface': '#fffdf7',
  '--surface-soft': '#f3edff',
  '--roxo': '#6315d9',
  '--roxo-profundo': '#25104a',
  '--lavanda': '#b9a6ef',
};

// AJ-02 — hexes de marca petróleo/sálvia que não podem sobreviver na interface própria.
const HEXES_ANTIGOS = [
  '0f766e', '0b5f59', '123c3a', '0a2a27', '0b2b2a', '0b2f2c', '1b4d48',
  '35594d', '194d46', '4f6b63', '566f65', 'daebe5', 'd5e3dc', 'f3f7f5',
  'f3f8f5', 'b7d3c8',
];

// Hexes que também integram a paleta de disciplinas do Horário Escolar (dados do
// usuário). São aceitos somente nos contextos declarados abaixo.
const HEXES_COMPARTILHADOS = new Set(['0f766e', '123c3a', '4f6b63']);

const ARQUIVOS_DISCIPLINAS = new Set([
  'apresentacao/horario/HorarioApp.jsx',
  'aplicacao/horario/gradeService.js',
  'aplicacao/horario/autoScheduleGenerator.js',
  'aplicacao/horario/pdfScheduleParser.js',
  'dominio/horario/entidades.js',
]);

// Exceção autorizada: módulo Revisão ao Vivo (REVISAO_VISUAL_VIBRANTE_SPEC.md).
const EXCECOES_CAMINHO = [/^components\/revisao\//];

function lerTokens() {
  const css = fs.readFileSync(CSS, 'utf8');
  const bloco = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const tokens = {};
  for (const linha of bloco.split('\n')) {
    const encontrado = linha.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
    if (encontrado) tokens[encontrado[1]] = encontrado[2].trim().toLowerCase();
  }
  return tokens;
}

function luminancia(hex) {
  const valor = hex.replace('#', '');
  const canais = [0, 2, 4].map((i) => parseInt(valor.slice(i, i + 2), 16) / 255);
  const linear = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contraste(texto, fundo) {
  const [a, b] = [luminancia(texto), luminancia(fundo)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

function arquivosFonte(diretorio) {
  const arquivos = [];
  for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) arquivos.push(...arquivosFonte(caminho));
    else if (/\.(js|jsx|css|mjs|ts|tsx)$/.test(entrada.name)) arquivos.push(caminho);
  }
  return arquivos;
}

const relativoDe = (arquivo) => path.relative(SRC, arquivo).replaceAll(path.sep, '/');
const ehExcecao = (relativo) => EXCECOES_CAMINHO.some((re) => re.test(relativo));

// Linha formada apenas por itens de array de cores (paleta declarada), ex.:
//   "#0f766e",   |   '#0f766e', '#123c3a', '#2563eb', '#059669',
function ehItemDeArrayDeCores(linha) {
  const resto = linha.replace(/['"]#[0-9a-f]{6}['"]/g, '');
  return /^[\s,[\]]*$/.test(resto);
}

// Linha de dado/valor da paleta de disciplinas. O fallback explícito de dado
// (`aula.color || "#0f766e"`) é sempre disciplina, mesmo dentro de style={{}}.
// Estilos de UI compartilhada (backgroundColor, cor fixa em style) não são tolerados.
function ehLinhaDeDisciplina(linha) {
  if (/\.color\s*\|\|\s*['"]#[0-9a-f]{6}['"]/.test(linha)) return true;
  if (/backgroundcolor/.test(linha)) return false;
  return /formcolor|setformcolor|color:\s*['"]#/.test(linha);
}

describe('AJ-01/PV-02 — contrato de tokens da paleta Arte em jogo', () => {
  it('declara os papéis aprovados nos tokens centrais', () => {
    const tokens = lerTokens();
    for (const [nome, valor] of Object.entries(TOKENS_APROVADOS)) {
      expect(tokens[nome], `token ${nome}`).toBe(valor);
    }
  });

  it('expõe os destaques da imagem de referência como tokens', () => {
    const tokens = lerTokens();
    for (const [nome, valor] of Object.entries(DESTAQUES)) {
      expect(tokens[nome], `token ${nome}`).toBe(valor);
    }
  });
});

describe('AJ-02/PV-03 — migração sem cor antiga de marca e sem tocar notas/disciplinas', () => {
  function varrerHexesAntigos() {
    const violacoes = [];
    for (const arquivo of arquivosFonte(SRC)) {
      const relativo = relativoDe(arquivo);
      if (ehExcecao(relativo)) continue;
      const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
      linhas.forEach((bruta, indice) => {
        const linha = (relativo === 'components/analytics/EvolucaoChart.jsx'
          ? bruta
            .replace('w-3 h-3 rounded-full bg-[#0f766e]', 'w-3 h-3 rounded-full bg-nota-preservada')
            .replace("activeDot={{ r: 7, fill: '#0f766e'", "activeDot={{ r: 7, fill: 'nota_preservada'")
          : bruta).toLowerCase();
        const tocado = ARQUIVOS_DISCIPLINAS.has(relativo);
        const coercaoDisciplina =
          tocado &&
          (ehItemDeArrayDeCores(linha) || ehLinhaDeDisciplina(linha));
        for (const hex of HEXES_ANTIGOS) {
          if (linha.includes(hex) && !(coercaoDisciplina && HEXES_COMPARTILHADOS.has(hex))) {
            violacoes.push(`${relativo}:${indice + 1} #${hex}`);
          }
        }
      });
    }
    return violacoes;
  }

  it('não mantém hexes da marca petróleo/sálvia na interface própria', () => {
    expect(varrerHexesAntigos()).toEqual([]);
  });

  it('não mantém sombras rgba nem triplas RGB de PDF da marca antiga', () => {
    const violacoes = [];
    const padroes = [
      /rgba\(\s*15\s*,\s*118\s*,\s*110/g,
      /rgba\(\s*18\s*,\s*60\s*,\s*58/g,
      /rgba\(\s*213\s*,\s*227\s*,\s*220/g,
      /\[\s*15\s*,\s*118\s*,\s*110\s*\]/g,
      /\[\s*18\s*,\s*60\s*,\s*58\s*\]/g,
    ];
    for (const arquivo of arquivosFonte(SRC)) {
      const relativo = relativoDe(arquivo);
      if (ehExcecao(relativo)) continue;
      let conteudo = fs.readFileSync(arquivo, 'utf8');
      if (relativo === 'lib/redacao/pdf-generator.js') {
        conteudo = conteudo.replace(
          /(`NOTA FINAL: [^`]+`,\{size:15,bold:true,color:)\[15, 118, 110\]/,
          '$1nota_preservada',
        );
      }
      for (const padrao of padroes) {
        padrao.lastIndex = 0;
        if (padrao.test(conteudo)) violacoes.push(relativo);
      }
    }
    expect(violacoes).toEqual([]);
  });

  it('preserva as classes e os valores das notas (RN-18)', () => {
    const evolucao = fs.readFileSync(path.join(SRC, 'components/analytics/EvolucaoChart.jsx'), 'utf8');
    expect(evolucao).toContain('w-3 h-3 rounded-full bg-[#0f766e]');
    expect(evolucao).toContain("activeDot={{ r: 7, fill: '#0f766e'");
    const pdfRedacao = fs.readFileSync(path.join(SRC, 'lib/redacao/pdf-generator.js'), 'utf8');
    expect(pdfRedacao).toMatch(/`NOTA FINAL: [^`]+`,\{size:15,bold:true,color:\[15, 118, 110\]/);

    const estilos = fs.readFileSync(path.join(SRC, 'utils/diario/coresNota.js'), 'utf8');
    expect(estilos).toContain("sem_nota: 'text-slate-400'");
    expect(estilos).toContain('abaixo: \'text-red-600 bg-red-50 border border-red-200\'');
    expect(estilos).toContain('aprovado: \'text-blue-600 bg-blue-50 border border-blue-200\'');
    expect(estilos).toContain('excelente: \'text-green-600 bg-green-50 border border-green-200\'');

    const analise = fs.readFileSync(path.join(SRC, 'dominio/analytics/analise.js'), 'utf8');
    expect(analise).toContain("excelente: '#16a34a'");
    expect(analise).toContain("aprovado: '#2563eb'");
    expect(analise).toContain("abaixo: '#dc2626'");
    expect(analise).toContain("sem_nota: '#94a3b8'");
  });

  it('preserva as faixas críticas de desempenho em rosa (PV-13/PV-14)', () => {
    const distrib = fs.readFileSync(
      path.join(SRC, 'components/analytics/DistribuicaoChart.jsx'), 'utf8'
    );
    expect(distrib.toLowerCase()).toContain('#f60c49');
    const comparativo = fs.readFileSync(
      path.join(SRC, 'components/analytics/ComparativoTurmasChart.jsx'), 'utf8'
    );
    expect(comparativo.toLowerCase()).toContain('#f60c49');
  });

  it('preserva a paleta de disciplinas do Horário Escolar', () => {
    const app = fs
      .readFileSync(path.join(SRC, 'apresentacao/horario/HorarioApp.jsx'), 'utf8')
      .toLowerCase();
    // Cores exclusivas da paleta de disciplinas (não são cores de marca).
    for (const hex of ['#0d9488', '#7c3aed', '#d97706', '#ea580c', '#059669', '#16a34a', '#0284c7', '#db2777', '#475569']) {
      expect(app, `HorarioApp deve manter ${hex}`).toContain(hex);
    }
    const parser = fs
      .readFileSync(path.join(SRC, 'aplicacao/horario/pdfScheduleParser.js'), 'utf8')
      .toLowerCase();
    for (const hex of ['#2563eb', '#0891b2']) {
      expect(parser, `pdfScheduleParser deve manter ${hex}`).toContain(hex);
    }
    const servico = fs
      .readFileSync(path.join(SRC, 'aplicacao/horario/gradeService.js'), 'utf8')
      .toLowerCase();
    // Fallback de aula sem cor definida segue na paleta de disciplinas.
    expect(servico).toContain("#0f766e");
  });
});

describe('AJ-03/PV-04 — contraste WCAG AA da nova paleta', () => {
  it.each([
    ['#ffffff', '#6315d9'],
    ['#fffdf7', '#6315d9'],
    ['#ffffff', '#5411b8'],
    ['#ffffff', '#25104a'],
    ['#fffdf7', '#25104a'],
    ['#25104a', '#f3edff'],
    ['#25104a', '#fffdf7'],
    ['#25104a', '#e7dbfd'],
    ['#5b4b86', '#fffdf7'],
    ['#5b4b86', '#f3edff'],
    ['#6e5f94', '#fffdf7'],
    ['#6e5f94', '#f3edff'],
    ['#4a3b7c', '#fffdf7'],
    ['#4a3b7c', '#f3edff'],
    ['#b9a6ef', '#25104a'],
    ['#25104a', '#00ddeb'],
    ['#25104a', '#ffe500'],
    ['#25104a', '#b9ef00'],
  ])('contraste de %s sobre %s atinge 4,5:1', (texto, fundo) => {
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(4.5);
  });
});
