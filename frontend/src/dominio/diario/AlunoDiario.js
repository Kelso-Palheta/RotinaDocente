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

const NIVEIS_SUPORTE_VALIDOS = [1, 2, 3];

/**
 * Normaliza o nível de suporte (RN-46): aceita apenas 1, 2 ou 3.
 * Qualquer outro valor (ausente, string, fração, fora da faixa) retorna
 * `undefined`, sinalizando que o campo deve ser omitido.
 *
 * @param {*} valor
 * @returns {number|undefined}
 */
export function normalizarNivelSuporte(valor) {
  const numero = Number(valor);
  return NIVEIS_SUPORTE_VALIDOS.includes(numero) ? numero : undefined;
}

/**
 * Normaliza um texto opcional (RN-46): trim e `undefined` quando vazio.
 *
 * @param {*} valor
 * @returns {string|undefined}
 */
function normalizarTextoOpcional(valor) {
  const texto = String(valor ?? '').trim();
  return texto.length > 0 ? texto : undefined;
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
 * @param {number} [params.nivelSuporte] - 1 | 2 | 3 (RN-46)
 * @param {string} [params.hiperfoco] - âncora de engajamento (RN-46)
 * @param {string} [params.observacoes] - observação pedagógica (RN-46)
 * @returns {Object}
 */
export function criarAlunoDiario({
  id,
  nome,
  dataNascimento,
  necessidades,
  nivelSuporte,
  hiperfoco,
  observacoes,
} = {}) {
  const necessidadesLimpas = sanitizarNecessidades(necessidades);
  const nivel = normalizarNivelSuporte(nivelSuporte);
  const ancora = normalizarTextoOpcional(hiperfoco);
  const obs = normalizarTextoOpcional(observacoes);
  return {
    id,
    nome,
    ...(dataNascimento ? { dataNascimento } : {}),
    ...(necessidadesLimpas.length > 0 ? { necessidades: necessidadesLimpas } : {}),
    ...(nivel !== undefined ? { nivelSuporte: nivel } : {}),
    ...(ancora !== undefined ? { hiperfoco: ancora } : {}),
    ...(obs !== undefined ? { observacoes: obs } : {}),
  };
}

/**
 * Atualiza um aluno do Diário via merge. Quando `necessidades` é informado,
 * é sanitizado contra o catálogo; array vazio ou totalmente inválido remove o campo.
 * Idem para `nivelSuporte` inválido e `hiperfoco`/`observacoes` vazios (RN-46).
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
  if (Object.prototype.hasOwnProperty.call(updates, 'nivelSuporte')) {
    const nivel = normalizarNivelSuporte(updates.nivelSuporte);
    if (nivel !== undefined) {
      proximo.nivelSuporte = nivel;
    } else {
      delete proximo.nivelSuporte;
    }
  }
  for (const campo of ['hiperfoco', 'observacoes']) {
    if (Object.prototype.hasOwnProperty.call(updates, campo)) {
      const texto = normalizarTextoOpcional(updates[campo]);
      if (texto !== undefined) {
        proximo[campo] = texto;
      } else {
        delete proximo[campo];
      }
    }
  }
  return proximo;
}

/**
 * Converte um aluno do Diário no perfil inclusivo usado pelo form de
 * Atividades Adaptadas (RN-46 — ponte "Carregar do Diário").
 * Função pura: aplica defaults de leitura (nível 1, textos vazios) e
 * sanitiza as necessidades contra o catálogo oficial.
 *
 * @param {Object|null} aluno
 * @returns {{nome: string, necessidades: string[], nivelSuporte: number, hiperfoco: string, observacoes: string}|null}
 */
export function paraPerfilInclusivo(aluno) {
  const nome = String(aluno?.nome ?? '').trim();
  if (!nome) return null;
  return {
    nome,
    necessidades: sanitizarNecessidades(aluno.necessidades),
    nivelSuporte: normalizarNivelSuporte(aluno.nivelSuporte) ?? 1,
    hiperfoco: String(aluno.hiperfoco ?? '').trim(),
    observacoes: String(aluno.observacoes ?? '').trim(),
  };
}

/**
 * Achata as turmas do professor em opções para o seletor "Carregar do Diário"
 * (RN-46): ignora entradas corrompidas (sem `nome` ou que não sejam objetos)
 * para nunca propagar erro bruto ao usuário.
 *
 * @param {Array|null} turmas
 * @returns {Array<{turmaId: string, turmaNome: string, aluno: Object}>}
 */
export function listarAlunosParaSeletor(turmas) {
  if (!Array.isArray(turmas)) return [];
  const opcoes = [];
  for (const turma of turmas) {
    if (!turma || !Array.isArray(turma.alunos)) continue;
    for (const aluno of turma.alunos) {
      if (!aluno || typeof aluno !== 'object') continue;
      if (!String(aluno.nome ?? '').trim()) continue;
      opcoes.push({
        turmaId: turma.id,
        turmaNome: String(turma.nome ?? ''),
        aluno,
      });
    }
  }
  return opcoes;
}

/**
 * Filtra uma lista de alunos do Diário por presença de necessidades específicas / CID (RN-61).
 *
 * @param {Array<Object>} alunos
 * @param {Object} [options]
 * @param {boolean} [options.apenasComNecessidades=true]
 * @returns {Array<Object>}
 */
export function filtrarAlunosComNecessidades(alunos, { apenasComNecessidades = true } = {}) {
  if (!Array.isArray(alunos)) return [];
  if (!apenasComNecessidades) return alunos;

  return alunos.filter((aluno) => {
    if (!aluno || typeof aluno !== 'object') return false;
    const temArrayNecessidades = Array.isArray(aluno.necessidades) && aluno.necessidades.length > 0;
    const temAnotacaoInclusiva = Boolean(aluno.hiperfoco || aluno.observacoes || aluno.nivelSuporte);
    return temArrayNecessidades || temAnotacaoInclusiva;
  });
}

