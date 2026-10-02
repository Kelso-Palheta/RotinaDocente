/**
 * Regras de Domínio — Serialização e Validação de Backup de Turmas
 * Referência: specs/RULES.md e specs/TESTS_SPEC.md (IT-02)
 */

/**
 * Serializa a lista de turmas para JSON formatado para exportação em arquivo.
 * @param {Array<object>} turmas
 * @returns {string}
 */
export function serializarBackupTurmas(turmas) {
  if (!Array.isArray(turmas)) {
    throw new Error('A entrada para serialização deve ser uma lista de turmas.');
  }
  return JSON.stringify(turmas, null, 2);
}

/**
 * Deserializa e valida a integridade do backup de turmas importado de arquivo JSON.
 * @param {string|Array<object>} jsonOrArray
 * @returns {Array<object>}
 */
export function deserializarBackupTurmas(jsonOrArray) {
  let parsed;
  if (typeof jsonOrArray === 'string') {
    try {
      parsed = JSON.parse(jsonOrArray);
    } catch (err) {
      throw new Error(`JSON de backup inválido: ${err.message}`);
    }
  } else {
    parsed = jsonOrArray;
  }

  if (!Array.isArray(parsed)) {
    throw new Error('O arquivo de backup deve ser uma lista de turmas.');
  }

  const isValid = parsed.every(
    (t) => t && t.id && t.nome && Array.isArray(t.alunos) && typeof t.bimestres === 'object'
  );

  if (!isValid) {
    throw new Error('Estrutura de turmas inválida no arquivo de backup.');
  }

  return parsed;
}
