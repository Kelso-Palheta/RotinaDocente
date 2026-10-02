/**
 * Dominio: Diário Pedagógico
 * Cálculo de Frequência Escolar e Classificação Legal de Risco (LDB Art. 24)
 * Referência: specs/RULES.md (RN-54) e specs/TESTS_SPEC.md (UT-28)
 */

/**
 * Calcula o percentual de frequência arredondado com 2 casas decimais.
 * @param {number} presencas - Quantidade de presenças registradas
 * @param {number} totalAulas - Total de aulas ministradas/previstas
 * @returns {number} Percentual entre 0 e 100
 */
export function calcularFrequencia(presencas, totalAulas) {
  const tot = Number(totalAulas) || 0;
  const pres = Number(presencas) || 0;

  if (tot <= 0) {
    return 100; // Padrão seguro para início de período sem aulas
  }

  const taxa = (pres / tot) * 100;
  const taxaLimitada = Math.max(0, Math.min(100, taxa));
  return Math.round(taxaLimitada * 100) / 100;
}

/**
 * Classifica o risco de reprovação por infrequência conforme o Art. 24 da LDB:
 * - Faltas < 20% (Presença > 80%) => 'regular'
 * - 20% <= Faltas < 25% (75% < Presença <= 80%) => 'alerta'
 * - Faltas >= 25% (Presença <= 75%) => 'critico'
 * 
 * @param {number} percentualPresenca - Taxa de presença (0..100)
 * @returns {'regular' | 'alerta' | 'critico'}
 */
export function classificarRiscoInfrequencia(percentualPresenca) {
  const taxa = Number(percentualPresenca);

  if (taxa <= 75) {
    return 'critico';
  }

  if (taxa <= 80) {
    return 'alerta';
  }

  return 'regular';
}

/**
 * Gera marcação em lote para todos os alunos de uma turma em 1 clique.
 * @param {Array<{ id?: string, uid?: string }>} alunos 
 * @param {'presente' | 'ausente' | 'justificado'} status 
 * @returns {Record<string, string>} Mapa de { [alunoId]: status }
 */
export function marcarPresencaTodos(alunos, status = 'presente') {
  if (!Array.isArray(alunos) || alunos.length === 0) {
    return {};
  }

  const mapa = {};
  for (const aluno of alunos) {
    if (!aluno) continue;
    const id = aluno.id || aluno.uid;
    if (id) {
      mapa[id] = status;
    }
  }

  return mapa;
}
