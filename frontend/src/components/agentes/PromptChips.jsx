'use client';

/**
 * Sugestões de perguntas rápidas contextuais por agente.
 * Desaparecem após o envio da primeira mensagem.
 */
export default function PromptChips({ agente, onSelect }) {
  if (!agente?.promptChips?.length) return null;

  return (
    <div
      data-testid="agentes-chips"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0 1rem 1rem',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--gray-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.25rem',
        }}
      >
        Sugestões de perguntas
      </div>
      {agente.promptChips.map((chip, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(chip)}
          style={{
            padding: '0.45rem 0.875rem',
            borderRadius: '1rem',
            border: `1.5px solid ${agente.cor}40`,
            background: `${agente.cor}0d`,
            color: agente.cor,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.4,
            textAlign: 'left',
            maxWidth: '100%',
            minWidth: 0,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${agente.cor}20`;
            e.currentTarget.style.borderColor = agente.cor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${agente.cor}0d`;
            e.currentTarget.style.borderColor = `${agente.cor}40`;
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
