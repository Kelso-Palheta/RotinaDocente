/**
 * Contrato de acervo — Revisão ao Vivo (RV-01/RV-02)
 *
 * Fonte normativa: specs/REVISAO_AO_VIVO_SPEC.md, seção 3.
 * Este teste valida formato, proveniência, alternativas A–E, gabarito,
 * caminhos de imagem, status de revisão e cobertura explícita do inventário.
 *
 * Importante: o teste NÃO acessa a rede. A verificação de URL é estrutural
 * (documento oficial do INEP); a conferência de conteúdo é feita na análise
 * entregue junto com o acervo.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../content/revisao-enem'
);
const QUESTOES_DIR = path.join(RAIZ, 'questoes');
const IMAGENS_DIR = path.join(RAIZ, 'imagens');
const FONTES_PATH = path.join(RAIZ, 'fontes.json');
const README_PATH = path.join(RAIZ, 'README.md');

const APLICACOES = new Set(['regular', 'ppl', 'reaplicacao']);
const STATUS_QUESTAO = new Set(['rascunho', 'em_revisao', 'revisada', 'descartada']);
const STATUS_FONTE = new Set([
  'pendente',
  'localizada',
  'catalogada',
  'conferida',
  'nao_localizada',
  'nao_aplicavel',
]);
const ANOS = Array.from({ length: 2025 - 2009 + 1 }, (_, i) => 2009 + i);
const VERIFICACOES = ['transcricao', 'gabarito', 'imagens', 'explicacoes'];
const IDS = ['A', 'B', 'C', 'D', 'E'];

function lerJson(caminho) {
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

function eDocumentoOficial(url) {
  if (typeof url !== 'string' || url.length === 0) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname === 'download.inep.gov.br') return true;
    if (parsed.hostname === 'www.gov.br' && parsed.pathname.startsWith('/inep/')) return true;
    return false;
  } catch {
    return false;
  }
}

function eDataISO(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function textoNaoVazio(valor, minimo = 1) {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

function exigirCaminhoSeguroDeImagem(arquivo) {
  expect(typeof arquivo).toBe('string');
  expect(arquivo).not.toContain('\\');
  expect(arquivo).not.toContain('..');
  expect(arquivo.startsWith('imagens/')).toBe(true);

  const absoluto = path.resolve(RAIZ, arquivo);
  const relativo = path.relative(IMAGENS_DIR, absoluto);
  expect(relativo.startsWith('..')).toBe(false);
  expect(path.isAbsolute(relativo)).toBe(false);
  expect(fs.existsSync(absoluto)).toBe(true);
  expect(fs.statSync(absoluto).isFile()).toBe(true);
}

function listarQuestoes() {
  expect(fs.existsSync(QUESTOES_DIR)).toBe(true);
  const arquivos = fs
    .readdirSync(QUESTOES_DIR)
    .filter((nome) => nome.endsWith('.json'))
    .sort();
  expect(arquivos.length).toBeGreaterThanOrEqual(12);

  return arquivos.map((nome) => {
    const caminho = path.join(QUESTOES_DIR, nome);
    return { arquivo: nome, caminho, questao: lerJson(caminho) };
  });
}

describe('RV-01/RV-02 — acervo de Arte do ENEM', () => {
  it('mantém README e fontes.json na raiz do acervo', () => {
    expect(fs.existsSync(README_PATH)).toBe(true);
    expect(textoNaoVazio(fs.readFileSync(README_PATH, 'utf8'), 200)).toBe(true);
    expect(fs.existsSync(FONTES_PATH)).toBe(true);
  });

  it('valida cada questão contra o registro da seção 3 do contrato', () => {
    const questoes = listarQuestoes();
    const ids = new Set();

    for (const { arquivo, questao } of questoes) {
      const contexto = `questao ${arquivo}`;

      expect(questao.schemaVersion, contexto).toBe(1);
      expect(textoNaoVazio(questao.id, 8), contexto).toBe(true);
      expect(questao.id, contexto).toMatch(/^enem-\d{4}-[a-z0-9-]+$/);
      expect(ids.has(questao.id), `${contexto}: id duplicado`).toBe(false);
      ids.add(questao.id);

      expect(ANOS, contexto).toContain(questao.ano);
      expect(Array.isArray(questao.aplicacoes), contexto).toBe(true);
      expect(questao.aplicacoes.length, contexto).toBeGreaterThan(0);
      expect(new Set(questao.aplicacoes).size, contexto).toBe(questao.aplicacoes.length);
      for (const aplicacao of questao.aplicacoes) {
        expect(APLICACOES.has(aplicacao), `${contexto}: aplicação inválida ${aplicacao}`).toBe(true);
      }

      expect(textoNaoVazio(questao.tema, 3), contexto).toBe(true);
      expect(Array.isArray(questao.habilidades), contexto).toBe(true);
      for (const habilidade of questao.habilidades) {
        expect(textoNaoVazio(habilidade, 2), `${contexto}: habilidade vazia`).toBe(true);
      }

      expect(textoNaoVazio(questao.enunciado, 20), contexto).toBe(true);

      expect(Array.isArray(questao.imagens), contexto).toBe(true);
      const idsImagens = new Set();
      for (const imagem of questao.imagens) {
        expect(textoNaoVazio(imagem.id, 8), `${contexto}: imagem sem id`).toBe(true);
        expect(idsImagens.has(imagem.id), `${contexto}: imagem duplicada ${imagem.id}`).toBe(false);
        idsImagens.add(imagem.id);
        exigirCaminhoSeguroDeImagem(imagem.arquivo);
        expect(textoNaoVazio(imagem.alt, 10), `${contexto}: alt ausente em ${imagem.id}`).toBe(true);
        expect(eDocumentoOficial(imagem.fonteUrl), `${contexto}: fonte de imagem não oficial`).toBe(true);
        expect(Number.isInteger(imagem.pagina) && imagem.pagina > 0, `${contexto}: página inválida`).toBe(true);
        expect(typeof imagem.revisada, `${contexto}: revisada não booleano`).toBe('boolean');
      }

      expect(Array.isArray(questao.alternativas), contexto).toBe(true);
      expect(questao.alternativas.length, contexto).toBe(5);
      expect(questao.alternativas.map((a) => a.id), contexto).toEqual(IDS);
      const textos = questao.alternativas.map((a) => a.texto);
      for (const alternativa of questao.alternativas) {
        expect(textoNaoVazio(alternativa.texto, 1), `${contexto}: alternativa ${alternativa.id} vazia`).toBe(true);
      }
      expect(new Set(textos).size, `${contexto}: alternativas repetidas`).toBe(5);

      expect(IDS, contexto).toContain(questao.gabarito);
      expect(questao.alternativas.some((a) => a.id === questao.gabarito), contexto).toBe(true);

      expect(questao.explicacoes, contexto).toBeTruthy();
      for (const id of IDS) {
        const explicacao = questao.explicacoes[id];
        expect(textoNaoVazio(explicacao, 40), `${contexto}: explicação ${id} insuficiente`).toBe(true);
        expect(
          String(explicacao).toLowerCase().includes('não corresponde ao enunciado'),
          `${contexto}: explicação ${id} genérica`
        ).toBe(false);
      }

      expect(Array.isArray(questao.conteudoRevisao), contexto).toBe(true);
      expect(questao.conteudoRevisao.length, `${contexto}: sem conteúdo de revisão`).toBeGreaterThan(0);
      for (const bloco of questao.conteudoRevisao) {
        expect(['texto', 'imagem'], `${contexto}: bloco inválido`).toContain(bloco.tipo);
        if (bloco.tipo === 'texto') {
          expect(textoNaoVazio(bloco.texto, 20), `${contexto}: bloco de texto vazio`).toBe(true);
        } else {
          expect(idsImagens.has(bloco.imagemId), `${contexto}: imagem de conteúdo ausente`).toBe(true);
          expect(textoNaoVazio(bloco.legenda, 3), `${contexto}: legenda de conteúdo ausente`).toBe(true);
        }
      }

      expect(Array.isArray(questao.fontes), contexto).toBe(true);
      expect(questao.fontes.length, `${contexto}: sem fontes`).toBeGreaterThan(0);
      for (const fonte of questao.fontes) {
        expect(APLICACOES.has(fonte.aplicacao), `${contexto}: fonte com aplicação inválida`).toBe(true);
        expect(textoNaoVazio(fonte.caderno, 2), `${contexto}: caderno ausente`).toBe(true);
        expect(Number.isInteger(fonte.numeroQuestao) && fonte.numeroQuestao >= 1 && fonte.numeroQuestao <= 180, `${contexto}: número da questão inválido`).toBe(true);
        expect(Number.isInteger(fonte.pagina) && fonte.pagina >= 1 && fonte.pagina <= 200, `${contexto}: página da fonte inválida`).toBe(true);
        expect(eDocumentoOficial(fonte.provaUrl), `${contexto}: prova não oficial`).toBe(true);
        expect(eDocumentoOficial(fonte.gabaritoUrl), `${contexto}: gabarito não oficial`).toBe(true);
        expect(eDataISO(fonte.consultadoEm), `${contexto}: data de consulta inválida`).toBe(true);
      }
      const aplicacoesDasFontes = [...new Set(questao.fontes.map((f) => f.aplicacao))].sort();
      expect(aplicacoesDasFontes, `${contexto}: fontes não cobrem as aplicações`).toEqual(
        [...questao.aplicacoes].sort()
      );

      expect(STATUS_QUESTAO.has(questao.status), `${contexto}: status inválido`).toBe(true);
      expect(questao.revisao, contexto).toBeTruthy();
      expect(Object.keys(questao.revisao).sort(), `${contexto}: verificações incompletas`).toEqual(
        [...VERIFICACOES].sort()
      );
      for (const verificacao of VERIFICACOES) {
        expect(typeof questao.revisao[verificacao], `${contexto}: ${verificacao} não booleana`).toBe('boolean');
      }

      if (questao.status === 'revisada') {
        for (const verificacao of VERIFICACOES) {
          expect(questao.revisao[verificacao], `${contexto}: revisada com ${verificacao} falsa`).toBe(true);
        }
        for (const imagem of questao.imagens) {
          expect(imagem.revisada, `${contexto}: revisada com imagem pendente`).toBe(true);
        }
      } else {
        expect(
          Object.values(questao.revisao).every(Boolean),
          `${contexto}: status não revisado com todas as verificações verdadeiras`
        ).toBe(false);
      }
    }
  });

  it('mantém o inventário completo de 2009–2025 por modalidade', () => {
    const fontes = lerJson(FONTES_PATH);
    expect(fontes.schemaVersion).toBe(1);
    expect(eDataISO(fontes.consultadoEm)).toBe(true);
    expect(Array.isArray(fontes.aplicacoes)).toBe(true);

    const esperados = new Set(ANOS.flatMap((ano) => [...APLICACOES].map((app) => `${ano}:${app}`)));
    const vistos = new Set();
    const idsReferenciados = new Map();

    for (const entrada of fontes.aplicacoes) {
      const chave = `${entrada.ano}:${entrada.aplicacao}`;
      expect(esperados.has(chave), `entrada inesperada ${chave}`).toBe(true);
      expect(vistos.has(chave), `entrada duplicada ${chave}`).toBe(false);
      vistos.add(chave);

      expect(STATUS_FONTE.has(entrada.status), `${chave}: status inválido`).toBe(true);
      expect(Array.isArray(entrada.questaoIds), `${chave}: questaoIds inválido`).toBe(true);
      expect(new Set(entrada.questaoIds).size, `${chave}: questaoIds duplicado`).toBe(entrada.questaoIds.length);
      expect(textoNaoVazio(entrada.observacoes, 1), `${chave}: observações ausentes`).toBe(true);
      expect(eDataISO(entrada.consultadoEm), `${chave}: data de consulta inválida`).toBe(true);

      if (['localizada', 'catalogada', 'conferida'].includes(entrada.status)) {
        expect(eDocumentoOficial(entrada.provaUrl), `${chave}: prova não oficial`).toBe(true);
        expect(eDocumentoOficial(entrada.gabaritoUrl), `${chave}: gabarito não oficial`).toBe(true);
      }

      if (['catalogada', 'conferida'].includes(entrada.status)) {
        expect(entrada.questaoIds.length, `${chave}: catalogada sem questões`).toBeGreaterThan(0);
      }

      if (entrada.status === 'nao_aplicavel') {
        expect(entrada.provaUrl, `${chave}: nao_aplicavel com prova`).toBeNull();
        expect(entrada.gabaritoUrl, `${chave}: nao_aplicavel com gabarito`).toBeNull();
        expect(textoNaoVazio(entrada.observacoes, 20), `${chave}: justificativa insuficiente`).toBe(true);
      }

      if (entrada.status === 'nao_localizada') {
        expect(entrada.provaUrl, `${chave}: nao_localizada com prova`).toBeNull();
        expect(entrada.gabaritoUrl, `${chave}: nao_localizada com gabarito`).toBeNull();
      }

      if (entrada.status === 'pendente') {
        expect(
          Boolean(entrada.provaUrl) || Boolean(entrada.gabaritoUrl),
          `${chave}: pendente sem nenhuma URL`
        ).toBe(true);
      }

      for (const id of entrada.questaoIds) {
        if (!idsReferenciados.has(id)) idsReferenciados.set(id, []);
        idsReferenciados.get(id).push(chave);
      }
    }

    expect([...vistos].sort()).toEqual([...esperados].sort());
  });

  it('faz o inventário e as questões concordarem entre si', () => {
    const fontes = lerJson(FONTES_PATH);
    const questoes = listarQuestoes();
    const porId = new Map(questoes.map(({ questao }) => [questao.id, questao]));

    for (const [id, chaves] of (() => {
      const mapa = new Map();
      for (const entrada of fontes.aplicacoes) {
        for (const questaoId of entrada.questaoIds) {
          if (!mapa.has(questaoId)) mapa.set(questaoId, []);
          mapa.get(questaoId).push(`${entrada.ano}:${entrada.aplicacao}`);
        }
      }
      return mapa;
    })()) {
      expect(porId.has(id), `fontes.json referencia questão inexistente: ${id}`).toBe(true);
      const questao = porId.get(id);
      const esperado = questao.aplicacoes.map((app) => `${questao.ano}:${app}`).sort();
      expect([...new Set(chaves)].sort(), `${id}: inventário diverge das aplicações`).toEqual(esperado);
    }

    for (const { questao } of questoes) {
      expect(
        fontes.aplicacoes.some((entrada) => entrada.questaoIds.includes(questao.id)),
        `${questao.id}: não aparece no inventário`
      ).toBe(true);
    }
  });
});
