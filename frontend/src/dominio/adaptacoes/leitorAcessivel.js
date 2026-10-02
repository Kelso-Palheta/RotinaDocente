/**
 * Dominio: Acessibilidade & Adaptações
 * Leitor Imersivo Acessível e Higienização Fonética para TTS
 * Referência: specs/RULES.md (RN-53) e specs/TESTS_SPEC.md (UT-27)
 */

export const ESTADOS_LEITURA = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused'
};

const TAXA_MINIMA = 0.75;
const TAXA_MAXIMA = 1.25;
const TAXA_PADRAO = 1.0;

/**
 * Valida e enquadra a velocidade de fala (rate) nos limites pedagógicos de conforto cognitivo.
 * @param {number|any} taxa 
 * @returns {number}
 */
export function validarTaxaFala(taxa) {
  const num = Number(taxa);
  if (isNaN(num) || taxa === null || taxa === undefined) {
    return TAXA_PADRAO;
  }
  if (num < TAXA_MINIMA) return TAXA_MINIMA;
  if (num > TAXA_MAXIMA) return TAXA_MAXIMA;
  return num;
}

/**
 * Higieniza marcações HTML, Markdown e links para leitura fonética suave em sintetizadores de voz.
 * @param {string} texto 
 * @returns {string}
 */
export function prepararTextoParaLeitura(texto) {
  if (!texto || typeof texto !== 'string') {
    return '';
  }

  let limpo = texto;

  // Remove tags HTML
  limpo = limpo.replace(/<[^>]*>/g, ' ');

  // Converte links markdown [texto](url) mantendo apenas o texto
  limpo = limpo.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove URLs puras
  limpo = limpo.replace(/https?:\/\/\S+/gi, '');

  // Remove formatações markdown (títulos, negrito, itálico, tachado, crases)
  limpo = limpo.replace(/^#{1,6}\s+/gm, ''); // títulos no início da linha
  limpo = limpo.replace(/#{1,6}\s+/g, '');    // títulos remanescentes
  limpo = limpo.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1'); // negrito / itálico
  limpo = limpo.replace(/_{1,3}([^_]+)_{1,3}/g, '$1');
  limpo = limpo.replace(/~{2}([^~]+)~{2}/g, '$1');
  limpo = limpo.replace(/`{1,3}([^`]+)`{1,3}/g, '$1'); // blocos de código

  // Remove linhas de tabelas markdown (| --- |) e barras verticais isoladas
  limpo = limpo.replace(/\|\s*[-:]+[-|\s:]*\|/g, '');
  limpo = limpo.replace(/\|/g, ', ');

  // Normaliza quebras de linha e múltiplos espaços
  limpo = limpo.replace(/\n+/g, '. ');
  limpo = limpo.replace(/\s{2,}/g, ' ');

  return limpo.trim();
}
