const chave = (conta, ano) => `diario_publicacao:${conta}:${ano}`;
export function guardarResultadoPublicacao(storage, conta, ano, resultado) {
  try { storage.setItem(chave(conta, ano), JSON.stringify(resultado)); return true; }
  catch { return false; }
}
export function lerResultadoPublicacao(storage, conta, ano) {
  try { const valor = JSON.parse(storage.getItem(chave(conta, ano)) || 'null'); return Array.isArray(valor?.resultados) ? valor : null; }
  catch { return null; }
}
