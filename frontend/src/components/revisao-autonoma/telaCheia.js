'use client';
/** Tela cheia e orientação com fallback honesto. Nada aqui prende Escape/voltar. */

export function suportaTelaCheia(el) {
  return Boolean(el && (el.requestFullscreen || el.webkitRequestFullscreen));
}

export function elementoEmTelaCheia(doc = typeof document !== 'undefined' ? document : null) {
  return doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
}

/** Deve ser chamada SINCRONAMENTE dentro do gesto do usuário (antes de qualquer await). */
export function pedirTelaCheia(el) {
  try {
    const pedido = el?.requestFullscreen || el?.webkitRequestFullscreen;
    if (!pedido) return Promise.resolve(false);
    return Promise.resolve(pedido.call(el)).then(() => true, () => false);
  } catch {
    return Promise.resolve(false);
  }
}

export function sairDaTelaCheia(doc = typeof document !== 'undefined' ? document : null) {
  try {
    if (!elementoEmTelaCheia(doc)) return Promise.resolve(false);
    const sair = doc.exitFullscreen || doc.webkitExitFullscreen;
    return Promise.resolve(sair?.call(doc)).then(() => true, () => false);
  } catch {
    return Promise.resolve(false);
  }
}

/** API moderna: screen.orientation.lock('landscape'); só funciona após fullscreen e em alguns navegadores. */
export async function travarPaisagem(scr = typeof screen !== 'undefined' ? screen : null) {
  try {
    if (!scr?.orientation?.lock) return false;
    await scr.orientation.lock('landscape');
    return true;
  } catch {
    return false;
  }
}

export function destravarOrientacao(scr = typeof screen !== 'undefined' ? screen : null) {
  try { scr?.orientation?.unlock?.(); } catch { /* sem suporte */ }
}

export function estaEmRetrato() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(orientation: portrait)')?.matches);
}
