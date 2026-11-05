import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(RAIZ, 'frontend/src');
const CSS = path.join(SRC, 'app/globals.css');

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

// Núcleo da identidade antiga. Cores de nota (vermelho/azul/verde), status
// semânticos, marcas de terceiros e a paleta de disciplinas não entram aqui.
const HEXES_ANTIGOS = [
  '#101942',
  '#f60c49',
  '#d40840',
  '#df0940',
  '#b00634',
  '#fde4ec',
  '#fff2f6',
  '#fff5f8',
  '#fff9fa',
  '#ffe6ee',
  '#ffe5ed',
  '#ffe5ec',
  '#ff3366',
  '#dce0f0',
  '#6070a0',
  '#9098c0',
  '#a0a8c4',
  '#eef0f8',
  '#f7f8fc',
  '#f8f9fd',
  '#090f28',
  '#1c2a6b',
  '#1a2560',
  '#0d1535',
  '#1c275e',
  '#1a255a',
  '#182352',
  '#141e4a',
  '#0a0f24',
  '#253368',
  '#1c2960',
  '#1c2754',
  '#1b2a5e',
  '#304060',
  '#b4bee0',
  '#b0b8d8',
  '#e0e7ff',
  '#eef2ff',
  '#4338ca',
  '#3730a3',
  '#f1f3fa',
];

const CLASSES_ANTIGAS = new RegExp(
  String.raw`\b(?:bg|text|border|from|to|via|ring|shadow|fill|stroke|divide|outline|decoration|accent)-(?:violet|indigo|purple|fuchsia|pink)-[0-9]{2,3}\b`,
  'g'
);

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

describe('PV-01/PV-02 — contrato de tokens da identidade Arte em jogo', () => {
  it('declara os papéis aprovados nos tokens centrais', () => {
    const tokens = lerTokens();
    for (const [nome, valor] of Object.entries(TOKENS_APROVADOS)) {
      expect(tokens[nome], `token ${nome}`).toBe(valor);
    }
  });

  it.each([
    ['#ffffff', '#6315d9'],
    ['#ffffff', '#5411b8'],
    ['#25104a', '#f3edff'],
    ['#5b4b86', '#f3edff'],
    ['#6e5f94', '#f3edff'],
  ])('contraste de %s sobre %s atinge 4,5:1', (texto, fundo) => {
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('PV-03/PV-05 — migração sem cor antiga de marca e sem tocar nas notas', () => {
  it('não mantém hexes da identidade antiga na interface', () => {
    const ocorrencias = [];
    for (const arquivo of arquivosFonte(SRC)) {
      let conteudo = fs.readFileSync(arquivo, 'utf8').toLowerCase();
      // Exceção expressa do usuário: cores que representam notas permanecem.
      const relativo = path.relative(SRC, arquivo).replaceAll(path.sep, '/');
      if (relativo === 'components/analytics/DistribuicaoChart.jsx') {
        conteudo = conteudo.replace(/critico:\s*'#f60c49'/g, 'critico: nota_preservada');
      }
      if (relativo === 'components/analytics/ComparativoTurmasChart.jsx') {
        conteudo = conteudo.replace(/bg-\[#f60c49\](?=.*Abaixo do mínimo)/gi, 'bg-nota-preservada');
      }
      for (const hex of HEXES_ANTIGOS) {
        if (conteudo.includes(hex)) {
          ocorrencias.push(`${path.relative(RAIZ, arquivo)}: ${hex}`);
        }
      }
    }
    expect(ocorrencias).toEqual([]);
  });

  it('não mantém classes Tailwind da identidade antiga', () => {
    const ocorrencias = [];
    for (const arquivo of arquivosFonte(SRC)) {
      const conteudo = fs.readFileSync(arquivo, 'utf8');
      const encontrados = conteudo.match(CLASSES_ANTIGAS);
      if (encontrados) {
        ocorrencias.push(`${path.relative(RAIZ, arquivo)}: ${[...new Set(encontrados)].join(', ')}`);
      }
    }
    expect(ocorrencias).toEqual([]);
  });

  it('preserva as classes e os valores das notas', () => {
    const estilos = fs.readFileSync(
      path.join(SRC, 'utils/diario/coresNota.js'),
      'utf8'
    );
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
});
