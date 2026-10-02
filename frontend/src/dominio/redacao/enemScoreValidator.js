/**
 * Entidade de Domínio e Validador de Pontuação ENEM — Rotina Docente
 *
 * Referência: specs/RULES.md (RN-05)
 * Grade Oficial: 5 competências (C1 a C5), cada uma com pontuação em [0, 40, 80, 120, 160, 200].
 * Pontuação total: Somatório estrito de C1..C5 variando de 0 a 1000 pontos.
 */

export const PONTUACOES_VALIDAS_COMPETENCIA = [0, 40, 80, 120, 160, 200];

/**
 * Valida se uma pontuação de competência individual atende à grade oficial do ENEM.
 * @param {number} pontuacao
 * @returns {boolean}
 */
export function validarPontuacaoCompetencia(pontuacao) {
  if (typeof pontuacao !== 'number' || Number.isNaN(pontuacao)) {
    return false;
  }
  return PONTUACOES_VALIDAS_COMPETENCIA.includes(pontuacao);
}

/**
 * Calcula a nota total da redação como somatório estrito de C1 a C5.
 * Lança erro se qualquer competência não pertencer à grade oficial.
 *
 * @param {{ c1: number, c2: number, c3: number, c4: number, c5: number }} competencias
 * @returns {number} Nota total no intervalo [0, 1000]
 */
export function calcularNotaTotalEnem(competencias) {
  const { c1, c2, c3, c4, c5 } = competencias || {};

  const comps = [
    { nome: 'C1', valor: c1 },
    { nome: 'C2', valor: c2 },
    { nome: 'C3', valor: c3 },
    { nome: 'C4', valor: c4 },
    { nome: 'C5', valor: c5 },
  ];

  for (const { nome, valor } of comps) {
    if (!validarPontuacaoCompetencia(valor)) {
      throw new Error(
        `A pontuação da competência ${nome} (${valor}) é inválida. Valores permitidos: 0, 40, 80, 120, 160, 200.`
      );
    }
  }

  return c1 + c2 + c3 + c4 + c5;
}
