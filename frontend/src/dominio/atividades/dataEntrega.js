/**
 * Data serializada de uma entrega (RN-75).
 * Aceita Timestamp do Firestore, `{seconds}`/`{_seconds}`, epoch em ms, texto ISO e Date.
 * Ausência ou valor inválido devolve `null` — nunca a data atual do dispositivo.
 */
const dataValida = (valor) => (valor instanceof Date && !Number.isNaN(valor.getTime()) ? valor : null);

export function interpretarDataEntrega(valor) {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return dataValida(valor);
  if (typeof valor === 'number') return Number.isFinite(valor) ? dataValida(new Date(valor)) : null;

  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (!texto) return null;
    return dataValida(new Date(texto));
  }

  if (typeof valor === 'object') {
    if (typeof valor.toDate === 'function') {
      try {
        return dataValida(valor.toDate());
      } catch {
        return null;
      }
    }
    const segundos = valor.seconds ?? valor._seconds;
    if (segundos !== undefined && segundos !== null && segundos !== '') {
      const numero = Number(segundos);
      if (Number.isFinite(numero)) return dataValida(new Date(numero * 1000));
    }
  }

  return null;
}
