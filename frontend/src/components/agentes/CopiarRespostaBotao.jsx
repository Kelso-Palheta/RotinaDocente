'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';

const MENSAGEM_ERRO = 'Não foi possível copiar. Selecione o texto manualmente.';

/**
 * Copia somente o conteúdo da resposta em que o botão está inserido.
 * O estado é local para que confirmação e erro não vazem para outras mensagens.
 */
export default function CopiarRespostaBotao({ conteudo }) {
  const [status, setStatus] = useState(null);

  const copiar = async () => {
    setStatus(null);

    if (typeof conteudo !== 'string' || conteudo.length === 0) {
      setStatus('erro');
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== 'function'
    ) {
      setStatus('erro');
      return;
    }

    try {
      await navigator.clipboard.writeText(conteudo);
      setStatus('sucesso');
    } catch {
      setStatus('erro');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.25rem 0.5rem',
        marginTop: '0.25rem',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <button
        type="button"
        onClick={copiar}
        aria-label="Copiar resposta"
        title="Copiar resposta"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          flexShrink: 0,
          padding: '0.125rem 0.375rem',
          border: 'none',
          borderRadius: '0.375rem',
          background: 'transparent',
          color: 'var(--gray)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'color 0.2s ease, background 0.2s ease',
        }}
        onMouseEnter={(evento) => {
          evento.currentTarget.style.color = 'var(--navy)';
          evento.currentTarget.style.background = 'rgba(18, 60, 58, 0.06)';
        }}
        onMouseLeave={(evento) => {
          evento.currentTarget.style.color = 'var(--gray)';
          evento.currentTarget.style.background = 'transparent';
        }}
      >
        <Copy size={12} aria-hidden="true" />
        Copiar
      </button>

      {status === 'sucesso' && (
        <span
          role="status"
          aria-live="polite"
          style={{
            minWidth: 0,
            color: '#0B5F59',
            fontSize: '0.7rem',
            fontWeight: 600,
            overflowWrap: 'anywhere',
          }}
        >
          Resposta copiada
        </span>
      )}

      {status === 'erro' && (
        <span
          role="alert"
          style={{
            minWidth: 0,
            color: '#0B5F59',
            fontSize: '0.7rem',
            fontWeight: 600,
            lineHeight: 1.4,
            overflowWrap: 'anywhere',
          }}
        >
          {MENSAGEM_ERRO}
        </span>
      )}
    </div>
  );
}
