// Codificação mantém links legados legíveis; não é autorização.
export const encodeToken = (alunoId, activityId) => btoa(unescape(encodeURIComponent(`${alunoId}:${activityId}`)));
export const chaveVinculoAtividade = (turmaId, alunoId) => btoa(unescape(encodeURIComponent(JSON.stringify([turmaId, alunoId])))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
export const criarTokenAtividade = (alunoId, activityId, turmaId) => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const segredo = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return btoa(unescape(encodeURIComponent(`${alunoId}:${activityId}:${turmaId}:${segredo}`)));
};
export const decodeToken = token => {
  try {
    if (typeof token !== 'string' || token.length > 4096) return null;
    const partes = decodeURIComponent(escape(atob(token))).split(':');
    const [alunoId, activityId, turmaId, segredo] = partes;
    if (!alunoId || !activityId || [alunoId, activityId, turmaId].filter(Boolean).some(id => id.includes('/'))) return null;
    if (partes.length === 2) return { alunoId, activityId };
    if (partes.length !== 4 || !turmaId || !/^[a-f0-9]{64}$/.test(segredo)) return null;
    return { alunoId, activityId, turmaId, segredo };
  } catch { return null; }
};
