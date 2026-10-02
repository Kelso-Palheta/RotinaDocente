/**
 * Dominio: Inteligência Artificial (BYOK)
 * Telemetria Local e Estimativa de Consumo de Tokens
 * Referência: specs/RULES.md (RN-55) e specs/TESTS_SPEC.md (UT-29)
 */

export const CHAVE_STORAGE_TELEMETRIA = 'ia_consumo_telemetria_v1';

/**
 * Recupera o storage seguro (localStorage no navegador ou fallback).
 */
function obterStorage(storageInjetado) {
  if (storageInjetado) return storageInjetado;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Obtém o resumo acumulado de telemetria de consumo local de IA.
 * @param {Storage} [storageInjetado]
 * @returns {{
 *   totalGeralChamadas: number,
 *   totalGeralTokens: number,
 *   porProvedor: Record<string, { totalChamadas: number, tokensEstimados: number }>,
 *   porModulo: Record<string, { totalChamadas: number, tokensEstimados: number }>
 * }}
 */
export function obterResumoConsumoIA(storageInjetado) {
  const store = obterStorage(storageInjetado);
  const padrao = {
    totalGeralChamadas: 0,
    totalGeralTokens: 0,
    porProvedor: {},
    porModulo: {}
  };

  if (!store) return padrao;

  try {
    const raw = store.getItem(CHAVE_STORAGE_TELEMETRIA);
    if (!raw) return padrao;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return padrao;

    return {
      totalGeralChamadas: Number(parsed.totalGeralChamadas) || 0,
      totalGeralTokens: Number(parsed.totalGeralTokens) || 0,
      porProvedor: parsed.porProvedor && typeof parsed.porProvedor === 'object' ? parsed.porProvedor : {},
      porModulo: parsed.porModulo && typeof parsed.porModulo === 'object' ? parsed.porModulo : {}
    };
  } catch (_e) {
    return padrao;
  }
}

/**
 * Registra incrementalmente o consumo de uma chamada ao provedor de IA.
 * 
 * @param {{
 *   provedor: string,
 *   modulo: string,
 *   tokensEstimados?: number
 * }} params
 * @param {Storage} [storageInjetado]
 */
export function registrarConsumoIA({ provedor, modulo, tokensEstimados = 0 }, storageInjetado) {
  const store = obterStorage(storageInjetado);
  if (!store) return;

  const prov = (provedor || 'desconhecido').toLowerCase().trim();
  const mod = (modulo || 'geral').toLowerCase().trim();
  const tokens = Math.max(0, Number(tokensEstimados) || 0);

  const atual = obterResumoConsumoIA(store);

  // Incrementa totais gerais
  atual.totalGeralChamadas += 1;
  atual.totalGeralTokens += tokens;

  // Incrementa agrupamento por provedor
  if (!atual.porProvedor[prov]) {
    atual.porProvedor[prov] = { totalChamadas: 0, tokensEstimados: 0 };
  }
  atual.porProvedor[prov].totalChamadas += 1;
  atual.porProvedor[prov].tokensEstimados += tokens;

  // Incrementa agrupamento por módulo
  if (!atual.porModulo[mod]) {
    atual.porModulo[mod] = { totalChamadas: 0, tokensEstimados: 0 };
  }
  atual.porModulo[mod].totalChamadas += 1;
  atual.porModulo[mod].tokensEstimados += tokens;

  try {
    store.setItem(CHAVE_STORAGE_TELEMETRIA, JSON.stringify(atual));
  } catch (_e) {
    // Ignora silenciosamente se localStorage estiver lotado ou indisponível
  }
}

/**
 * Remove todos os dados locais de telemetria de IA.
 * @param {Storage} [storageInjetado]
 */
export function limparTelemetriaIA(storageInjetado) {
  const store = obterStorage(storageInjetado);
  if (!store) return;

  try {
    store.removeItem(CHAVE_STORAGE_TELEMETRIA);
  } catch (_e) {
    // Silencioso
  }
}
