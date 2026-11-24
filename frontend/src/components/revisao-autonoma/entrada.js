'use client';
import { useEffect } from 'react';

/** Mapa único de teclas → ações; minúsculas e maiúsculas (Caps Lock/Shift) valem igualmente. */
export const MAPA_TECLAS = { arrowleft: 'esquerda', a: 'esquerda', arrowright: 'direita', d: 'direita', arrowup: 'pular', ' ': 'pular', spacebar: 'pular', w: 'pular' };

export function acaoDaTecla(key) {
  return MAPA_TECLAS[String(key || '').toLowerCase()] || null;
}

/** Teclas do jogo nunca são capturadas em campos, botões, links ou menus. */
export function alvoIgnoraJogo(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (['input', 'textarea', 'select', 'button', 'a', 'summary'].includes(tag)) return true;
  if (el.isContentEditable) return true;
  const papel = el.getAttribute?.('role');
  return ['button', 'radio', 'checkbox', 'menuitem', 'option', 'textbox', 'slider'].includes(papel);
}

export function limparEntrada(entrada) {
  entrada.esquerda = false; entrada.direita = false; entrada.pular = false;
}

/** Teclado global do palco: ativo só quando o jogo roda; limpa tudo ao pausar, perder foco ou desmontar. */
export function useEntradaTeclado(entradaRef, ativo) {
  useEffect(() => {
    const entrada = entradaRef.current;
    const limpar = () => limparEntrada(entrada);
    if (!ativo) { limpar(); return undefined; }
    const tecla = (ligar) => (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const acao = acaoDaTecla(e.key);
      if (!acao) return;
      if (alvoIgnoraJogo(e.target)) { if (!ligar) entrada[acao] = false; return; }
      e.preventDefault();
      entrada[acao] = ligar;
    };
    const aoBaixo = tecla(true); const aoCima = tecla(false);
    const aoOcultar = () => { if (document.hidden) limpar(); };
    window.addEventListener('keydown', aoBaixo);
    window.addEventListener('keyup', aoCima);
    window.addEventListener('blur', limpar);
    document.addEventListener('visibilitychange', aoOcultar);
    return () => {
      window.removeEventListener('keydown', aoBaixo);
      window.removeEventListener('keyup', aoCima);
      window.removeEventListener('blur', limpar);
      document.removeEventListener('visibilitychange', aoOcultar);
      limpar();
    };
  }, [entradaRef, ativo]);
}
