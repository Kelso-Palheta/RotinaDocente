/**
 * RT-VIS-01 — exemplos visuais comentados nas 34 aulas temáticas.
 *
 * Fonte normativa: specs/REVISAO_TEMATICA_SPEC.md, seção 10, e
 * docs/plans/2026-11-05-prompt-deepseek-exemplos-visuais.md.
 *
 * Este teste verifica ESTRUTURA e INTEGRIDADE:
 * - cada aula tem ao menos uma imagem local e um bloco de imagem;
 * - o bloco traz leitura guiada desenvolvida e pergunta de observação;
 * - arquivo seguro, existente, com MIME coerente, dimensão mínima e limite de bytes;
 * - alt, legenda, crédito, fonte específica e condições de uso declaradas;
 * - nenhuma imagem de questão é reutilizada e nenhum arquivo fica órfão;
 * - aulas continuam em rascunho e sem campos de gabarito.
 *
 * O teste NÃO acessa a rede e NÃO prova adequação pedagógica, precisão histórica
 * ou aprovação docente. Essas camadas são auditadas no relatório da entrega.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../content/revisao-enem'
);
const QUESTOES_DIR = path.join(RAIZ, 'questoes');
const IMAGENS_QUESTOES_DIR = path.join(RAIZ, 'imagens');
const AULAS_DIR = path.join(RAIZ, 'aulas');
const CATALOGO_PATH = path.join(AULAS_DIR, 'catalogo.json');
const CONTEUDOS_DIR = path.join(AULAS_DIR, 'conteudos');
const IMAGENS_AULAS_DIR = path.join(AULAS_DIR, 'imagens');

const EXTENSOES = new Set(['.png', '.jpg', '.webp']);
const CAMINHO_IMAGEM = /^aulas\/imagens\/[a-z0-9][a-z0-9-]*\.(png|jpg|webp)$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHAVES_PROIBIDAS = new Set([
  'gabarito',
  'alternativacorreta',
  'respostacorreta',
  'letracorreta',
  'resolucao',
  'comentariogabarito',
]);
const VERBOS_OBSERVACAO = [
  'observe',
  'repare',
  'note',
  'compare',
  'pergunte',
  'descreva',
  'procure',
  'identifique',
];

function lerJson(caminho) {
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

function texto(valor, minimo = 1) {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

function urlHttps(valor) {
  if (typeof valor !== 'string') return false;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function listar(diretorio) {
  if (!fs.existsSync(diretorio)) return [];
  return fs.readdirSync(diretorio).sort();
}

function hash(caminho) {
  return crypto.createHash('sha256').update(fs.readFileSync(caminho)).digest('hex');
}

function hashesDeImagens(diretorio) {
  const mapa = new Map();
  if (!fs.existsSync(diretorio)) return mapa;
  const visitar = (atual) => {
    for (const entrada of fs.readdirSync(atual, { withFileTypes: true })) {
      const caminho = path.join(atual, entrada.name);
      if (entrada.isDirectory()) visitar(caminho);
      else if (EXTENSOES.has(path.extname(entrada.name).toLowerCase())) {
        mapa.set(hash(caminho), caminho);
      }
    }
  };
  visitar(diretorio);
  return mapa;
}

function mimePorBytes(buffer) {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function dimensoes(buffer, mime) {
  try {
    if (mime === 'image/png') {
      return { largura: buffer.readUInt32BE(16), altura: buffer.readUInt32BE(20) };
    }
    if (mime === 'image/webp') {
      const tipo = buffer.toString('ascii', 12, 16);
      if (tipo === 'VP8X') {
        return {
          largura: 1 + buffer.readUIntLE(24, 3),
          altura: 1 + buffer.readUIntLE(27, 3),
        };
      }
      if (tipo === 'VP8 ') {
        return {
          largura: buffer.readUInt16LE(26) & 0x3fff,
          altura: buffer.readUInt16LE(28) & 0x3fff,
        };
      }
      if (tipo === 'VP8L') {
        const b = buffer.readUInt32LE(21);
        return { largura: (b & 0x3fff) + 1, altura: ((b >> 14) & 0x3fff) + 1 };
      }
      return null;
    }
    if (mime === 'image/jpeg') {
      let i = 2;
      while (i + 9 < buffer.length) {
        if (buffer[i] !== 0xff) return null;
        const marcador = buffer[i + 1];
        const tamanho = buffer.readUInt16BE(i + 2);
        if (marcador >= 0xc0 && marcador <= 0xc3) {
          return { altura: buffer.readUInt16BE(i + 5), largura: buffer.readUInt16BE(i + 7) };
        }
        i += 2 + tamanho;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function procurarChavesProibidas(valor, caminho = '') {
  const achados = [];
  if (Array.isArray(valor)) {
    valor.forEach((item, indice) => {
      achados.push(...procurarChavesProibidas(item, `${caminho}[${indice}]`));
    });
  } else if (valor && typeof valor === 'object') {
    for (const [chave, conteudo] of Object.entries(valor)) {
      if (CHAVES_PROIBIDAS.has(chave.toLowerCase())) achados.push(`${caminho}.${chave}`);
      achados.push(...procurarChavesProibidas(conteudo, `${caminho}.${chave}`));
    }
  }
  return achados;
}

function carregarAulas() {
  const catalogo = lerJson(CATALOGO_PATH);
  return catalogo.conteudos.map((meta) => ({
    meta,
    aula: lerJson(path.join(CONTEUDOS_DIR, `${meta.id}.json`)),
  }));
}

describe('RT-VIS-01 — exemplos visuais comentados', () => {
  it('cobre as 34 aulas com imagem local e bloco comentado', () => {
    const aulas = carregarAulas();
    expect(aulas.length).toBe(34);

    const problemas = [];
    for (const { meta, aula } of aulas) {
      if (!Array.isArray(aula.imagens) || aula.imagens.length === 0) {
        problemas.push(`${meta.id}: sem imagens`);
        continue;
      }
      const blocosImagem = aula.blocos.filter((bloco) => bloco.tipo === 'imagem');
      if (blocosImagem.length === 0) problemas.push(`${meta.id}: sem bloco de imagem`);

      for (const imagem of aula.imagens) {
        const prefixo = `${meta.id}/${imagem.id}`;
        if (!SLUG.test(imagem.id || '')) problemas.push(`${prefixo}: id inválido`);
        if (!CAMINHO_IMAGEM.test(imagem.arquivo || '')) {
          problemas.push(`${prefixo}: caminho inválido`);
          continue;
        }
        const absoluto = path.resolve(RAIZ, imagem.arquivo);
        const relativo = path.relative(IMAGENS_AULAS_DIR, absoluto);
        if (relativo.startsWith('..') || path.isAbsolute(relativo)) {
          problemas.push(`${prefixo}: fora de aulas/imagens`);
          continue;
        }
        if (!fs.existsSync(absoluto)) {
          problemas.push(`${prefixo}: arquivo ausente`);
          continue;
        }
        const buffer = fs.readFileSync(absoluto);
        const mime = mimePorBytes(buffer);
        const extensao = path.extname(imagem.arquivo).toLowerCase();
        const esperado =
          extensao === '.png' ? 'image/png' : extensao === '.jpg' ? 'image/jpeg' : 'image/webp';
        if (mime !== esperado) problemas.push(`${prefixo}: MIME não confere com a extensão`);
        if (buffer.length < 5000) problemas.push(`${prefixo}: arquivo pequeno demais`);
        if (buffer.length > 7_000_000) problemas.push(`${prefixo}: acima de 7 MB`);
        const dim = dimensoes(buffer, mime);
        if (!dim) problemas.push(`${prefixo}: dimensões ilegíveis`);
        else if (dim.largura < 800 || dim.altura < 500) {
          problemas.push(`${prefixo}: resolução ${dim.largura}x${dim.altura} abaixo do mínimo`);
        }

        if (!texto(imagem.alt, 40)) problemas.push(`${prefixo}: alt insuficiente`);
        if (!texto(imagem.legenda, 25)) problemas.push(`${prefixo}: legenda insuficiente`);
        if (!texto(imagem.credito, 3)) problemas.push(`${prefixo}: crédito ausente`);
        if (!texto(imagem.licenca, 20)) problemas.push(`${prefixo}: condições de uso insuficientes`);
        if (!urlHttps(imagem.fonteUrl)) problemas.push(`${prefixo}: fonteUrl não é HTTPS`);
        else {
          const url = new URL(imagem.fonteUrl);
          if (url.pathname === '/' || url.pathname.length < 6) {
            problemas.push(`${prefixo}: fonteUrl genérica demais`);
          }
        }

        const usos = blocosImagem.filter((bloco) => bloco.imagemId === imagem.id);
        if (usos.length === 0) problemas.push(`${prefixo}: imagem sem bloco de leitura`);
        for (const bloco of usos) {
          if (!texto(bloco.texto, 320)) {
            problemas.push(`${prefixo}: leitura guiada curta demais`);
          }
          if (!bloco.texto.includes('?')) {
            problemas.push(`${prefixo}: leitura sem pergunta de observação`);
          }
          const minusculo = bloco.texto.toLowerCase();
          if (!VERBOS_OBSERVACAO.some((verbo) => minusculo.includes(verbo))) {
            problemas.push(`${prefixo}: leitura sem verbo de observação`);
          }
          if (!Array.isArray(bloco.objetivoIds) || bloco.objetivoIds.length === 0) {
            problemas.push(`${prefixo}: bloco de imagem sem objetivo`);
          }
        }
      }

      for (const bloco of blocosImagem) {
        if (!aula.imagens.some((imagem) => imagem.id === bloco.imagemId)) {
          problemas.push(`${meta.id}/${bloco.id}: imagemId não declarado`);
        }
      }
      if (aula.status !== 'rascunho') problemas.push(`${meta.id}: fora de rascunho`);
      if (procurarChavesProibidas(aula).length > 0) {
        problemas.push(`${meta.id}: campo de gabarito/resolução`);
      }
    }

    expect(problemas, problemas.join('\n')).toEqual([]);
  });

  it('não reutiliza imagens de questão e não deixa recurso órfão', () => {
    const aulas = carregarAulas();
    const hashesQuestoes = hashesDeImagens(IMAGENS_QUESTOES_DIR);
    const hashesAulas = hashesDeImagens(IMAGENS_AULAS_DIR);

    for (const [h, caminho] of hashesAulas) {
      expect(hashesQuestoes.has(h), `imagem de aula reutiliza questão: ${caminho}`).toBe(false);
    }

    const referenciadas = new Set();
    for (const { aula } of aulas) {
      for (const imagem of aula.imagens) {
        referenciadas.add(path.resolve(RAIZ, imagem.arquivo));
      }
    }
    for (const caminho of hashesAulas.values()) {
      expect(referenciadas.has(path.resolve(caminho)), `imagem órfã: ${caminho}`).toBe(true);
    }

    const arquivos = listar(IMAGENS_AULAS_DIR).filter((nome) =>
      EXTENSOES.has(path.extname(nome).toLowerCase())
    );
    expect(arquivos.length).toBeGreaterThanOrEqual(34);
  });
});
