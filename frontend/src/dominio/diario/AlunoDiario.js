import { CATEGORIAS_MAP } from '../adaptacoes/CategoriasDeficiencia';

/**
 * Entidade de domínio: Aluno do Diário Pedagógico.
 * Regra: RN-43 (Configuração de Necessidades Específicas no Diário Pedagógico).
 * O aluno do diário vive embutido na turma (`professores/{userId}/turmas/data`)
 * e pode carregar opcionalmente o array `necessidades` (IDs do catálogo DUA),
 * de forma independente do Banco PEI.
 */

/**
 * Sanitiza uma lista de necessidades contra o catálogo oficial (CATEGORIAS_MAP).
 * Descarta IDs desconhecidos, remove duplicatas (case-insensitive) e preserva
 * a ordem de entrada. Entradas que não sejam array retornam [].
 *
 * @param {*} necessidades
 * @returns {string[]}
 */
export function sanitizarNecessidades(necessidades) {
  if (!Array.isArray(necessidades)) return [];
  const validas = necessidades
    .map((n) => String(n ?? '').toLowerCase().trim())
    .filter((id) => Boolean(CATEGORIAS_MAP[id]));
  return Array.from(new Set(validas));
}

/**
 * Cria o objeto de aluno do Diário. Campos opcionais vazios/inválidos são omitidos
 * para manter compatibilidade com dados legados.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.nome
 * @param {string} [params.dataNascimento] - ddMM
 * @param {string[]} [params.necessidades]
 * @returns {Object}
 */
export function criarAlunoDiario({ id, nome, dataNascimento, necessidades } = {}) {
  const necessidadesLimpas = sanitizarNecessidades(necessidades);
  return {
    id,
    nome,
    ...(dataNascimento ? { dataNascimento } : {}),
    ...(necessidadesLimpas.length > 0 ? { necessidades: necessidadesLimpas } : {}),
  };
}

/**
 * Atualiza um aluno do Diário via merge. Quando `necessidades` é informado,
 * é sanitizado contra o catálogo; array vazio ou totalmente inválido remove o campo.
 *
 * @param {Object} aluno
 * @param {Object} updates
 * @returns {Object}
 */
export function atualizarAlunoDiario(aluno, updates = {}) {
  const proximo = { ...aluno, ...updates };
  if (Object.prototype.hasOwnProperty.call(updates, 'necessidades')) {
    const limpas = sanitizarNecessidades(updates.necessidades);
    if (limpas.length > 0) {
      proximo.necessidades = limpas;
    } else {
      delete proximo.necessidades;
    }
  }
  return proximo;
}
