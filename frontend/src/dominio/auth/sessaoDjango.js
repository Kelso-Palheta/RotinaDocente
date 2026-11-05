/** Compara contexto de respostas assíncronas; não autentica nem concede acesso. */
function identidadeJwt(token) {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const dados = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    const id = dados.user_id ?? dados.sub;
    return (typeof id === 'string' && id.trim()) || typeof id === 'number'
      ? JSON.stringify([dados.iss ?? null, String(id)]) : null;
  } catch { return null; }
}

export function mesmaSessaoDjango(anterior, atual) {
  if (!anterior?.access || !atual?.access) return false;
  if (anterior.access === atual.access) return true;
  const antes = identidadeJwt(anterior.access);
  const depois = identidadeJwt(atual.access);
  if (antes && depois) return antes === depois;
  return Boolean(anterior.refresh && anterior.refresh === atual.refresh);
}
