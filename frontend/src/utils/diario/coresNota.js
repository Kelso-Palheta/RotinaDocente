/** Cores de apresentação do total bimestral (RN-18), sem alterar status de aprovação. */
export function estiloNotaBimestral(nota, config) {
  if (nota === null || nota === undefined || nota === '' || !Number.isFinite(Number(nota))) {
    return 'text-slate-400';
  }
  const aprovacao = Number(config?.mediaAprovacao ?? 5);
  if (Number(nota) < aprovacao) return 'text-red-600 bg-red-50 border border-red-200';
  if (Number(nota) >= 8) return 'text-green-600 bg-green-50 border border-green-200';
  return 'text-blue-600 bg-blue-50 border border-blue-200';
}
