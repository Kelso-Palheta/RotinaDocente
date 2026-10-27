/**
 * Tradução do resultado de persistência em estado de tela (RN-76).
 * Camada: src/apresentacao/horario/
 *
 * `nuvem` e `local` descrevem onde a grade está;
 * `pendente` e `falha` descrevem o que ainda falta fazer.
 */

const ESTADOS = new Set(['cloud', 'local', 'saving', 'pending', 'error']);

const DA_PERSISTENCIA = {
  nuvem: 'cloud',
  local: 'local',
  padrao: 'local',
  pendente: 'pending',
  falha: 'error',
};

const ROTULOS = {
  cloud: 'syncCloud',
  local: 'syncLocal',
  saving: 'syncSaving',
  pending: 'syncPending',
  error: 'syncError',
};

/** Converte `persistencia` do repositório em estado de interface. */
export function mapearEstadoSync(persistencia) {
  if (!persistencia || typeof persistencia !== 'object') return 'local';
  const chave = persistencia.estado ?? persistencia.origem;
  return DA_PERSISTENCIA[chave] || 'local';
}

/** Chave i18n do rótulo; estado desconhecido cai no rótulo local. */
export function chaveRotuloSync(estado) {
  return ESTADOS.has(estado) ? ROTULOS[estado] : ROTULOS.local;
}

/** Estados em que a gravação ainda não chegou à nuvem e podem ser repetidos. */
export const precisaNovaTentativa = (estado) => estado === 'pending' || estado === 'error';
