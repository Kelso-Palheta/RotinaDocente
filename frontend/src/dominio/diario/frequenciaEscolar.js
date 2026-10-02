/**
 * Dominio: Diário Pedagógico
 * Cálculo de Frequência Escolar e Classificação Legal de Risco (LDB Art. 24)
 * Referência: specs/RULES.md (RN-54 & RN-56) e specs/TESTS_SPEC.md (UT-28 & UT-30)
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
 * @param {'presente' | 'ausente' | 'justificado' | 'P' | 'F' | 'FJ'} status 
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

/**
 * Consolida o histórico de chamadas diárias por aluno, apurando total de aulas, presenças, faltas e status LDB.
 * 
 * @param {Array<{ id: string, nome: string }>} alunos - Lista de estudantes da turma
 * @param {Record<string, { quantidadeAulas?: number, presencas?: Record<string, string> }>} frequencias - Mapa de chamadas por data
 * @returns {Array<{
 *   alunoId: string,
 *   nome: string,
 *   totalAulas: number,
 *   presencas: number,
 *   faltas: number,
 *   faltasJustificadas: number,
 *   percentual: number,
 *   statusLdb: 'regular' | 'alerta' | 'critico'
 * }>}
 */
export function consolidarFrequenciaTurma(alunos = [], frequencias = {}) {
  if (!Array.isArray(alunos) || alunos.length === 0) {
    return [];
  }

  const freqEntries = Object.entries(frequencias || {});

  return alunos.map((aluno) => {
    const alunoId = aluno.id || aluno.uid;
    const nome = aluno.nome || 'Aluno';

    let totalAulas = 0;
    let presencas = 0;
    let faltas = 0;
    let faltasJustificadas = 0;

    for (const [_, reg] of freqEntries) {
      if (!reg || typeof reg !== 'object') continue;

      const qtd = Number(reg.quantidadeAulas) || 1;
      totalAulas += qtd;

      const st = (reg.presencas?.[alunoId] || 'P').toUpperCase();

      if (st === 'P' || st === 'PRESENTE') {
        presencas += qtd;
      } else if (st === 'F' || st === 'AUSENTE' || st === 'FALTA') {
        faltas += qtd;
      } else if (st === 'FJ' || st === 'JUSTIFICADA' || st === 'JUSTIFICADO') {
        faltasJustificadas += qtd;
        // Na apuração da LDB, falta justificada não deduz frequência legal contra o aluno
        presencas += qtd;
      } else {
        presencas += qtd;
      }
    }

    const percentual = totalAulas > 0 ? calcularFrequencia(presencas, totalAulas) : 100;
    
    let statusLdb = 'regular';
    if (totalAulas > 0) {
      const taxaFaltaInjustificada = (faltas / totalAulas) * 100;

      // Se o aluno possui faltas justificadas (atestados), o risco crítico é atenuado para alerta
      if (faltasJustificadas > 0 && faltas < totalAulas) {
        statusLdb = taxaFaltaInjustificada > 0 ? 'alerta' : 'regular';
      } else if (taxaFaltaInjustificada >= 25) {
        statusLdb = 'critico';
      } else if (taxaFaltaInjustificada >= 20) {
        statusLdb = 'alerta';
      } else {
        statusLdb = classificarRiscoInfrequencia(percentual);
      }
    }

    return {
      alunoId,
      nome,
      totalAulas,
      presencas: totalAulas > 0 ? (totalAulas - faltas - faltasJustificadas) : 0,
      faltas,
      faltasJustificadas,
      percentual,
      statusLdb
    };
  });
}
