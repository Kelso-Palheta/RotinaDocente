'use client';

import { GraduationCap, BookOpen } from 'lucide-react';

const ICONS = {
  'ensino-medio': GraduationCap,
  'fundamental-2': BookOpen,
};

/**
 * Card de seleção de agente pedagógico.
 */
export default function AgentCard({ agente, selected, onClick }) {
  const Icon = ICONS[agente.id] || GraduationCap;
  const isSelected = selected === agente.id;

  return (
    <button
      type="button"
      onClick={() => onClick(agente.id)}
      style={{
        background: isSelected ? agente.cor : 'rgba(255,255,255,0.92)',
        border: `2px solid ${isSelected ? agente.cor : 'rgba(226, 217, 247,0.7)'}`,
        borderRadius: '1.25rem',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
        textAlign: 'left',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        display: 'block',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isSelected
          ? `0 12px 32px ${agente.cor}40`
          : '0 4px 16px rgba(37, 16, 74,0.07)',
        transform: isSelected ? 'translateY(-2px)' : 'none',
      }}
      aria-pressed={isSelected}
      aria-label={`Selecionar ${agente.name}`}
    >
      {/* Ícone */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '0.875rem',
          background: isSelected ? 'rgba(255,255,255,0.2)' : `${agente.cor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.875rem',
          flexShrink: 0,
        }}
      >
        <Icon size={24} color={isSelected ? '#ffffff' : agente.cor} />
      </div>

      {/* Nome */}
      <div
        style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 800,
          fontSize: '1.1rem',
          color: isSelected ? '#ffffff' : 'var(--navy)',
          letterSpacing: '-0.02em',
          marginBottom: '0.25rem',
          overflowWrap: 'anywhere',
        }}
      >
        {agente.name}
      </div>

      {/* Segmento */}
      <div
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--gray)',
          marginBottom: '0.625rem',
          overflowWrap: 'anywhere',
        }}
      >
        {agente.segmento}
      </div>

      {/* Descrição */}
      <div
        style={{
          fontSize: '0.75rem',
          color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--gray-light)',
          lineHeight: 1.5,
          overflowWrap: 'anywhere',
        }}
      >
        {agente.descricao}
      </div>
    </button>
  );
}
