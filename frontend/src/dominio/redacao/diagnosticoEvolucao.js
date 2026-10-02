/**
 * Dominio: Redação ENEM
 * Diagnóstico Longitudinal e Evolução de Competências (C1..C5)
 * Referência: specs/RULES.md (RN-52) e specs/TESTS_SPEC.md (UT-26)
 */

/**
 * Normaliza os valores de competências de uma redação.
 * @param {any} redacao 
 * @returns {{ c1: number, c2: number, c3: number, c4: number, c5: number, total: number }}
 */
function extrairCompetencias(redacao) {
  if (!redacao || typeof redacao !== 'object') {
    return { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, total: 0 };
  }

  const fonte = redacao.competencias || redacao.scores || redacao;

  const c1 = Number(fonte.c1 ?? fonte.C1 ?? 0) || 0;
  const c2 = Number(fonte.c2 ?? fonte.C2 ?? 0) || 0;
  const c3 = Number(fonte.c3 ?? fonte.C3 ?? 0) || 0;
  const c4 = Number(fonte.c4 ?? fonte.C4 ?? 0) || 0;
  const c5 = Number(fonte.c5 ?? fonte.C5 ?? 0) || 0;

  const total = Number(redacao.total ?? fonte.total ?? (c1 + c2 + c3 + c4 + c5)) || 0;

  return { c1, c2, c3, c4, c5, total };
}

/**
 * Calcula médias das competências C1 a C5, identifica a competência prioritária e a tendência.
 * 
 * @param {Array<any>} historicoRedacoes - Lista de redações em ordem cronológica
 * @returns {{
 *   totalRedacoes: number,
 *   medias: { c1: number, c2: number, c3: number, c4: number, c5: number },
 *   mediaGeralTotal: number,
 *   competenciaAlvo: string | null,
 *   tendencia: 'ascendente' | 'descendente' | 'estável' | 'insuficiente'
 * }}
 */
export function calcularEvolucaoCompetencias(historicoRedacoes) {
  if (!Array.isArray(historicoRedacoes) || historicoRedacoes.length === 0) {
    return {
      totalRedacoes: 0,
      medias: { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 },
      mediaGeralTotal: 0,
      competenciaAlvo: null,
      tendencia: 'insuficiente'
    };
  }

  const itens = historicoRedacoes.map(extrairCompetencias);
  const n = itens.length;

  const somas = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, total: 0 };
  for (const item of itens) {
    somas.c1 += item.c1;
    somas.c2 += item.c2;
    somas.c3 += item.c3;
    somas.c4 += item.c4;
    somas.c5 += item.c5;
    somas.total += item.total;
  }

  const medias = {
    c1: Math.round((somas.c1 / n) * 10) / 10,
    c2: Math.round((somas.c2 / n) * 10) / 10,
    c3: Math.round((somas.c3 / n) * 10) / 10,
    c4: Math.round((somas.c4 / n) * 10) / 10,
    c5: Math.round((somas.c5 / n) * 10) / 10
  };

  const mediaGeralTotal = Math.round((somas.total / n) * 10) / 10;

  // Identifica a competência alvo (menor média entre C1..C5)
  const comps = ['c1', 'c2', 'c3', 'c4', 'c5'];
  let menorComp = comps[0];
  let menorValor = medias[comps[0]];

  for (let i = 1; i < comps.length; i++) {
    const comp = comps[i];
    if (medias[comp] < menorValor) {
      menorValor = medias[comp];
      menorComp = comp;
    }
  }

  // Detecta tendência com base na evolução cronológica
  let tendencia = 'insuficiente';
  if (n >= 2) {
    const primeiro = itens[0].total;
    const ultimo = itens[n - 1].total;
    const diferenca = ultimo - primeiro;

    if (diferenca >= 40) {
      tendencia = 'ascendente';
    } else if (diferenca <= -40) {
      tendencia = 'descendente';
    } else {
      tendencia = 'estável';
    }
  }

  return {
    totalRedacoes: n,
    medias,
    mediaGeralTotal,
    competenciaAlvo: menorComp,
    tendencia
  };
}
