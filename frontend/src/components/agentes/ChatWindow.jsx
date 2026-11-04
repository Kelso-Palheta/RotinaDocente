'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Trash2, GraduationCap, BookOpen, X } from 'lucide-react';
import { useAgentChat } from '@/hooks/agentes/useAgentChat';
import AcoesConversa from './AcoesConversa';
import CopiarRespostaBotao from './CopiarRespostaBotao';
import PromptChips from './PromptChips';

const ICONS = {
  'ensino-medio': GraduationCap,
  'fundamental-2': BookOpen,
};

function TypingDots({ cor }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0.625rem 0.875rem' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: cor,
            display: 'inline-block',
            animation: `agtPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, agente, indice }) {
  const isUser = msg.role === 'user';
  return (
    <div
      role="group"
      aria-label={isUser ? 'Sua mensagem' : `Resposta de ${agente.name}`}
      data-testid={`agentes-mensagem-${indice}`}
      data-role={msg.role}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '0.75rem',
        minWidth: 0,
        animation: 'agtSlideIn 0.3s cubic-bezier(0.19,1,0.22,1) both',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: agente.cor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginRight: '0.5rem',
            alignSelf: 'flex-end',
          }}
        >
          {(() => { const Icon = ICONS[agente.id] || GraduationCap; return <Icon size={16} color="#fff" />; })()}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          minWidth: 0,
          maxWidth: 'min(82%, 34rem)',
        }}
      >
        <div
          className="agentes-chat-bolha"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: isUser ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
            background: isUser
              ? 'var(--navy)'
              : 'rgba(255,255,255,0.95)',
            color: isUser ? '#ffffff' : 'var(--navy)',
            fontSize: '0.875rem',
            lineHeight: 1.65,
            boxShadow: isUser
              ? '0 4px 12px rgba(18,60,58,0.18)'
              : '0 2px 8px rgba(18,60,58,0.08)',
            border: isUser ? 'none' : '1px solid var(--border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            fontFamily: 'var(--font-body)',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {msg.content}
        </div>
        {!isUser && <CopiarRespostaBotao key={msg.content} conteudo={msg.content} />}
      </div>
    </div>
  );
}

/**
 * Janela de chat conversacional com o Agente Pedagógico.
 */
export default function ChatWindow({ agente, onBack }) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    clearHistory,
    storageNotice,
    dismissStorageNotice,
  } = useAgentChat(agente?.id);
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Foca o input quando o agente muda
  useEffect(() => {
    inputRef.current?.focus();
  }, [agente?.id]);

  // Acompanha o crescimento do texto digitado, até o limite de 120px
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) {
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agente) return null;

  return (
    <section
      role="region"
      aria-label={`Conversa com ${agente.name}`}
      className="agentes-chat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '1.5rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        overflow: 'hidden',
      }}
    >
      {/* Cabeçalho */}
      <div
        className="agentes-chat-cabecalho"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.7)',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para os agentes"
          title="Voltar para os agentes"
          className="agentes-chat-voltar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '0.75rem',
            border: '1.5px solid var(--border)',
            background: 'white',
            color: 'var(--navy)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = agente.cor; e.currentTarget.style.color = agente.cor; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--navy)'; }}
        >
          <ArrowLeft size={17} />
        </button>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '0.75rem',
            background: agente.cor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {(() => { const Icon = ICONS[agente.id] || GraduationCap; return <Icon size={20} color="#fff" />; })()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy)', letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
            {agente.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 500, overflowWrap: 'anywhere' }}>
            {agente.segmento}
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            aria-label="Limpar histórico"
            title="Limpar histórico"
            className="agentes-chat-limpar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              flexShrink: 0,
              padding: '0.375rem 0.75rem',
              borderRadius: '100px',
              border: '1.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--gray)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0F766E'; e.currentTarget.style.color = '#0F766E'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--gray)'; }}
          >
            <Trash2 size={13} />
            <span className="agentes-chat-limpar-texto">Limpar</span>
          </button>
        )}

        <AcoesConversa agente={agente} messages={messages} />
      </div>

      {/* Área de mensagens */}
      <div
        className="agentes-chat-mensagens"
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Aviso neutro de recuperação ou de armazenamento local */}
        {storageNotice && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.75rem',
              background: '#F3F8F5',
              border: '1px solid #D5E3DC',
              color: '#4F6B63',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              overflowWrap: 'anywhere',
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>{storageNotice.message}</span>
            <button
              type="button"
              onClick={dismissStorageNotice}
              aria-label="Fechar aviso de armazenamento"
              title="Fechar aviso"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                flexShrink: 0,
                border: 'none',
                borderRadius: '0.375rem',
                background: 'transparent',
                color: '#566F65',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Estado vazio — exibe prompt chips */}
        {messages.length === 0 && !isLoading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minWidth: 0 }}>
            <div style={{ textAlign: 'center', padding: '2rem 1rem 1.5rem' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '1rem',
                background: `${agente.cor}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.875rem',
              }}>
                {(() => { const Icon = ICONS[agente.id] || GraduationCap; return <Icon size={28} color={agente.cor} />; })()}
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.375rem', overflowWrap: 'anywhere' }}>
                Olá! Sou o {agente.name}.
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {agente.descricao}
              </div>
            </div>
            <PromptChips agente={agente} onSelect={(chip) => { setInputText(chip); inputRef.current?.focus(); }} />
          </div>
        )}

        {/* Mensagens */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} agente={agente} indice={i} />
        ))}

        {/* Indicador "digitando..." */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: agente.cor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginRight: '0.5rem', alignSelf: 'flex-end',
            }}>
              {(() => { const Icon = ICONS[agente.id] || GraduationCap; return <Icon size={16} color="#fff" />; })()}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid var(--border)',
              borderRadius: '1.25rem 1.25rem 1.25rem 0.25rem',
              boxShadow: '0 2px 8px rgba(18,60,58,0.08)',
            }}>
              <TypingDots cor={agente.cor} />
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              margin: '0.5rem 0',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.75rem',
              background: '#F3F8F5',
              border: '1px solid #B7D3C8',
              color: '#0B5F59',
              fontSize: '0.78rem',
              overflowWrap: 'anywhere',
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>⚠️ {error}</span>
            {typeof retryLastMessage === 'function' && !isLoading && (
              <button
                type="button"
                onClick={retryLastMessage}
                style={{
                  flexShrink: 0,
                  padding: '0.25rem 0.625rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #B7D3C8',
                  background: '#ffffff',
                  color: '#0B5F59',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="agentes-chat-entrada"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.7)',
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'flex-end',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={`Mensagem para ${agente.name}`}
          placeholder={`Pergunte ao ${agente.name}…`}
          rows={1}
          style={{
            flex: 1,
            minWidth: 0,
            resize: 'none',
            border: '1.5px solid var(--border)',
            borderRadius: '0.875rem',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            color: 'var(--navy)',
            background: 'white',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: 'auto',
          }}
          onFocus={(e) => { e.target.style.borderColor = agente.cor; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !inputText.trim()}
          aria-label="Enviar mensagem"
          style={{
            width: 42,
            height: 42,
            borderRadius: '0.875rem',
            background: inputText.trim() && !isLoading ? agente.cor : 'var(--border)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            boxShadow: inputText.trim() && !isLoading ? `0 4px 12px ${agente.cor}40` : 'none',
          }}
        >
          <Send size={17} color="white" />
        </button>
      </div>

      {/* Keyframes e ajustes responsivos */}
      <style>{`
        .agentes-chat-cabecalho { padding: 1rem 1.25rem; }
        .agentes-chat-entrada { padding: 0.875rem 1rem; }
        .agentes-chat-bolha { max-width: 100%; }
        .agentes-chat-acao { padding: 0.375rem 0.625rem; box-sizing: border-box; }
        @keyframes agtPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes agtSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .agentes-chat-acao-texto { display: none; }
          .agentes-chat-acao { padding: 0.4rem 0.5rem; }
        }
        @media (max-width: 480px) {
          .agentes-chat { border-radius: 1rem; }
          .agentes-chat-cabecalho { padding: 0.75rem 0.75rem; gap: 0.5rem; }
          .agentes-chat-mensagens { padding: 0.75rem; }
          .agentes-chat-entrada { padding: 0.75rem; gap: 0.5rem; }
          .agentes-chat-limpar-texto { display: none; }
          .agentes-chat-limpar { padding: 0.4rem 0.5rem; }
        }
      `}</style>
    </section>
  );
}
