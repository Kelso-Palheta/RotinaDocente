'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Bot } from 'lucide-react';
import { AGENTES_CONFIG } from '@/data/agentes/agentesConfig';
import AgentCard from '@/components/agentes/AgentCard';
import ChatWindow from '@/components/agentes/ChatWindow';

export default function AgentesPage() {
  const { user, perfil, loading } = useAuth();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(null);

  const selectedAgente = AGENTES_CONFIG.find((a) => a.id === selectedId) || null;

  // Loading state
  if (loading || (!perfil && user)) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-soft)' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '1rem',
          background: 'var(--pink)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      </div>
    );
  }

  if (!user) { router.replace('/'); return null; }

  return (
    <div
      className="agentes-page"
      data-testid="agentes-page"
      style={{
        background: 'linear-gradient(145deg, #101942 0%, #1a2560 45%, #0d1535 100%)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ─── Navbar ─────────────────────────────────── */}
      <div
        className="agentes-navbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        >
          <ArrowLeft size={14} />
          Hub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <Bot size={18} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0 }} />
          <h1
            style={{
              color: 'white',
              fontFamily: 'var(--font-head)',
              fontWeight: 800,
              fontSize: 'clamp(0.95rem, 4.2vw, 1.15rem)',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              margin: 0,
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            Agentes Pedagógicos
          </h1>
        </div>
      </div>

      {/* ─── Conteúdo Principal ─────────────────────── */}
      <div className="agentes-conteudo">

        {/* Painel esquerdo — seleção de agentes */}
        <section
          aria-label="Seleção de agente pedagógico"
          data-testid="agentes-painel-selecao"
          className={`agentes-painel-selecao${selectedAgente ? ' agentes-painel-selecao--ativa' : ''}`}
        >
          {/* Header do painel */}
          {!selectedAgente && (
            <div className="agentes-painel-cabecalho" style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '1.25rem',
                background: 'rgba(246,12,73,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.875rem',
              }}>
                <Bot size={28} color="#f60c49" />
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.62)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                margin: 0,
                overflowWrap: 'anywhere',
              }}>
                Selecione o assistente de IA para o seu segmento escolar.
              </p>
            </div>
          )}

          {/* Cards dos agentes */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              minWidth: 0,
            }}
          >
            {AGENTES_CONFIG.map((agente, i) => (
              <div
                key={agente.id}
                style={{
                  animation: `agtCardIn 400ms cubic-bezier(0.19,1,0.22,1) ${i * 80}ms both`,
                  minWidth: 0,
                }}
              >
                <AgentCard
                  agente={agente}
                  selected={selectedId}
                  onClick={(id) => setSelectedId(id === selectedId ? null : id)}
                />
              </div>
            ))}
          </div>

          {/* Badge do modelo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            marginTop: '0.5rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            alignSelf: 'center',
            maxWidth: '100%',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, overflowWrap: 'anywhere' }}>
              Powered by sabiazinho-4 · Maritalk
            </span>
          </div>
        </section>

        {/* Painel direito — chat */}
        {selectedAgente && (
          <div
            data-testid="agentes-painel-chat"
            className="agentes-painel-chat"
            style={{ animation: 'agtSlideRight 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
          >
            <ChatWindow agente={selectedAgente} onBack={() => setSelectedId(null)} />
          </div>
        )}
      </div>

      {/* Keyframes e layout responsivo */}
      <style>{`
        .agentes-page {
          min-height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .agentes-navbar {
          flex-shrink: 0;
          padding: 1rem 1.5rem;
        }
        .agentes-conteudo {
          flex: 1;
          min-height: 0;
          min-width: 0;
          display: flex;
          overflow: hidden;
        }
        .agentes-painel-selecao {
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          overflow-x: hidden;
          min-width: 0;
          min-height: 0;
          box-sizing: border-box;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .agentes-painel-selecao--ativa {
          max-width: 100%;
          margin: 0;
        }
        .agentes-painel-cabecalho {
          padding: 2rem 0 1rem;
        }
        .agentes-painel-chat {
          flex: 1;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          box-sizing: border-box;
        }
        .agentes-page button:focus-visible,
        .agentes-page textarea:focus-visible {
          outline: 2px solid #f60c49;
          outline-offset: 2px;
        }
        @media (min-width: 900px) {
          .agentes-painel-selecao--ativa {
            flex: 0 0 300px;
            width: 300px;
            max-width: 300px;
            padding: 1.5rem;
          }
          .agentes-painel-chat {
            padding: 1.25rem 1.5rem 1.25rem 0;
          }
        }
        @media (max-width: 899px) {
          .agentes-painel-selecao--ativa {
            display: none;
          }
          .agentes-navbar {
            padding: 0.875rem 1rem;
          }
          .agentes-painel-cabecalho {
            padding: 1.25rem 0 0.75rem;
          }
        }
        @media (max-width: 480px) {
          .agentes-painel-selecao {
            padding: 1rem;
          }
          .agentes-painel-chat {
            padding: 0.5rem;
          }
        }
        @keyframes agtCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes agtSlideRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
