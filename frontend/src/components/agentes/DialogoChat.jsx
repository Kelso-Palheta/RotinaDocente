'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo acessível usado pela exportação e pela ajuda.
 * Mantém o foco dentro do cartão, fecha com Escape e devolve o foco ao gatilho
 * por meio do efeito de restauração em `AcoesConversa`.
 */
export default function DialogoChat({ titulo, onClose, children }) {
  const tituloId = useId();
  const caixaRef = useRef(null);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  useEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;

    const focaveis = () => Array.from(caixa.querySelectorAll(FOCAVEIS));
    const primeiro = focaveis()[0];
    (primeiro || caixa).focus();

    const aoTratarTecla = (evento) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onClose();
        return;
      }

      if (evento.key !== 'Tab') return;

      const itens = focaveis();
      if (itens.length === 0) {
        evento.preventDefault();
        caixa.focus();
        return;
      }

      const primeiroItem = itens[0];
      const ultimoItem = itens[itens.length - 1];

      if (evento.shiftKey && document.activeElement === primeiroItem) {
        evento.preventDefault();
        ultimoItem.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimoItem) {
        evento.preventDefault();
        primeiroItem.focus();
      }
    };

    document.addEventListener('keydown', aoTratarTecla);
    return () => document.removeEventListener('keydown', aoTratarTecla);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(18, 60, 58, 0.45)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <div
        ref={caixaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '26rem',
          maxHeight: 'calc(100dvh - 2rem)',
          overflowY: 'auto',
          borderRadius: '1.25rem',
          border: '1px solid var(--border)',
          background: '#ffffff',
          boxShadow: '0 24px 60px rgba(18, 60, 58, 0.28)',
          padding: '1.25rem',
          color: 'var(--navy)',
          fontFamily: 'var(--font-body)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      >
        <h2
          id={tituloId}
          style={{
            margin: 0,
            fontFamily: 'var(--font-head)',
            fontSize: '1.05rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            overflowWrap: 'anywhere',
          }}
        >
          {titulo}
        </h2>
        {children}
      </div>
    </div>,
    document.body
  );
}
