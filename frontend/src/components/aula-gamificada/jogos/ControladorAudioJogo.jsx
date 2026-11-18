'use client';

import React, { useEffect, useRef, useState } from 'react';

export function usePreferenciaMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aoMudar = (e) => setReduzido(Boolean(e.matches));
    mq.addEventListener?.('change', aoMudar);
    return () => mq.removeEventListener?.('change', aoMudar);
  }, []);

  return [reduzido, setReduzido];
}

export default function ControladorAudioJogo({
  src,
  rotulo = 'Trilha sonora do jogo',
  reduzirAnimacao,
  onAlternarAnimacao,
}) {
  const audioRef = useRef(null);
  const [somAtivo, setSomAtivo] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (somAtivo) {
        const p = el.play?.();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        el.pause?.();
      }
    } catch {
      // Ambiente sem suporte a mídia (SSR/jsdom)
    }
  }, [somAtivo]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <audio ref={audioRef} src={src} loop preload="none" aria-label={rotulo} />
      <button
        type="button"
        aria-pressed={somAtivo}
        onClick={() => setSomAtivo((v) => !v)}
        className={`min-h-10 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition ${
          somAtivo
            ? 'border-[#00DDEB] bg-[#00DDEB]/20 text-[#25104A]'
            : 'border-[#E2D9F7] bg-white text-[#4A3B7C] hover:bg-[#F3EDFF]'
        }`}
      >
        {somAtivo ? '🔊 Som: Ligado' : '🔇 Som: Desligado'}
      </button>
      {typeof onAlternarAnimacao === 'function' && (
        <button
          type="button"
          aria-pressed={Boolean(reduzirAnimacao)}
          onClick={() => onAlternarAnimacao((v) => !v)}
          className={`min-h-10 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition ${
            reduzirAnimacao
              ? 'border-[#6315D9] bg-[#E7DBFD] text-[#25104A]'
              : 'border-[#E2D9F7] bg-white text-[#4A3B7C] hover:bg-[#F3EDFF]'
          }`}
        >
          {reduzirAnimacao ? 'Animações: Reduzidas' : 'Animações: Padrão'}
        </button>
      )}
    </div>
  );
}
