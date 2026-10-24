/** Situações acadêmicas por etapa. Ausência de lançamento não equivale a zero. */
export const ROTULOS_APROVACAO = Object.freeze({
  good: 'Aprovado',
  bad: 'Recuperação',
  warn: 'Em andamento',
  none: 'Sem notas',
});

export function classificarEtapa(total, completo, minimo) {
  if (total == null) return 'none';
  if (!completo) return 'warn';
  return total >= minimo ? 'good' : 'bad';
}

export function situacoesBoletim(bimTotais, S1, S2, totalAnual) {
  const lancado = (valor) => valor !== null && valor !== undefined && valor !== '';
  const completoS1 = [0, 1].every(i => lancado(bimTotais[i]));
  const completoS2 = [2, 3].every(i => lancado(bimTotais[i]));
  return {
    S1: { ...S1, completo: completoS1, status: classificarEtapa(S1?.total, completoS1, 25) },
    S2: { ...S2, completo: completoS2, status: classificarEtapa(S2?.total, completoS2, 25) },
    statusFinal: classificarEtapa(totalAnual, completoS1 && completoS2, 50),
  };
}
