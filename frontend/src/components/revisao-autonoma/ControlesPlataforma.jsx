'use client';
import React, { useEffect, useRef } from 'react';
import { limparEntrada } from './entrada';

/**
 * Controles separados: direcional no canto inferior ESQUERDO, pulo no DIREITO.
 * Cada botão rastreia o seu próprio ponteiro, permitindo andar e pular ao mesmo tempo (multitoque).
 */
const idDe = (e) => e.pointerId ?? 0;

function BotaoControle({ campo, rotulo, simbolo, entradaRef, desabilitado, className }) {
  const ponteiro = useRef(null);
  const soltar = () => { ponteiro.current = null; entradaRef.current[campo] = false; };
  useEffect(() => { if (desabilitado) { ponteiro.current = null; entradaRef.current[campo] = false; } }, [desabilitado, entradaRef, campo]);
  useEffect(() => () => { entradaRef.current[campo] = false; }, [entradaRef, campo]);
  return (
    <button
      type="button"
      aria-label={rotulo}
      data-controle={campo}
      disabled={desabilitado}
      onPointerDown={(e) => {
        e.preventDefault();
        if (ponteiro.current !== null) return;
        ponteiro.current = idDe(e);
        entradaRef.current[campo] = true;
        try { e.currentTarget.setPointerCapture?.(idDe(e)); } catch { /* ponteiro sintético */ }
      }}
      onPointerUp={(e) => { if (ponteiro.current === idDe(e)) soltar(); }}
      onPointerCancel={(e) => { if (ponteiro.current === idDe(e)) soltar(); }}
      onLostPointerCapture={(e) => { if (ponteiro.current === idDe(e)) soltar(); }}
      onPointerLeave={(e) => { if (ponteiro.current === idDe(e) && !e.currentTarget.hasPointerCapture?.(idDe(e))) soltar(); }}
      onBlur={soltar}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); entradaRef.current[campo] = true; } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') soltar(); }}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
      className={`flex select-none items-center justify-center rounded-full border-2 border-white/60 bg-[#6315D9]/80 font-black text-white shadow-lg backdrop-blur active:scale-95 active:bg-[#00DDEB]/90 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#FFE500] disabled:opacity-30 ${className}`}
    >
      <span aria-hidden="true">{simbolo}</span>
    </button>
  );
}

// 64–80 px conforme a altura do viewport (landscape baixo usa 64; telas maiores 80)
const TAMANHO = 'h-16 w-16 text-3xl [@media(min-height:520px)]:h-20 [@media(min-height:520px)]:w-20 [@media(min-height:520px)]:text-4xl';

export function ControlesPlataforma({ entradaRef, desabilitado = false }) {
  useEffect(() => { if (desabilitado) limparEntrada(entradaRef.current); }, [desabilitado, entradaRef]);
  const comum = { entradaRef, desabilitado, className: TAMANHO };
  return (
    <>
      <div
        data-testid="controles-esquerda"
        role="group"
        aria-label="Direção"
        className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-20 flex gap-4"
      >
        <div className="pointer-events-auto flex gap-4">
          <BotaoControle campo="esquerda" rotulo="Mover para a esquerda" simbolo="←" {...comum} />
          <BotaoControle campo="direita" rotulo="Mover para a direita" simbolo="→" {...comum} />
        </div>
      </div>
      <div
        data-testid="controles-direita"
        role="group"
        aria-label="Pulo"
        className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-20"
      >
        <div className="pointer-events-auto">
          <BotaoControle campo="pular" rotulo="Pular" simbolo="⤒" {...comum} className={`${TAMANHO} bg-[#FF2C9C]/80`} />
        </div>
      </div>
    </>
  );
}
