/** Classificação visual compartilhada entre Diário e Portal do Aluno (RN-18). */
export function faixaNotaBimestral(nota, config) {
  if (nota === null || nota === undefined || nota === '' || !Number.isFinite(Number(nota))) return 'sem_nota';
  if (Number(nota) < Number(config?.mediaAprovacao ?? 5)) return 'abaixo';
  return Number(nota) >= 8 ? 'excelente' : 'aprovado';
}

const ESTILOS = {
  sem_nota: 'text-slate-400',
  abaixo: 'text-red-600 bg-red-50 border border-red-200',
  aprovado: 'text-blue-600 bg-blue-50 border border-blue-200',
  excelente: 'text-green-600 bg-green-50 border border-green-200',
};

export function estiloNotaBimestral(nota, config) {
  return ESTILOS[faixaNotaBimestral(nota, config)];
}
