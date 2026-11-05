'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, HelpCircle } from 'lucide-react';
import DialogoChat from './DialogoChat';
import { baixarConversaTxt, nomeArquivoConversa } from './conversaTxt';

const paragrafo = {
  margin: 0,
  color: '#5B4B86',
  fontSize: '0.82rem',
  lineHeight: 1.6,
  overflowWrap: 'anywhere',
};

const rodape = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: '0.5rem',
  marginTop: '1rem',
};

const botaoBase = {
  padding: '0.5rem 0.875rem',
  borderRadius: '0.75rem',
  fontSize: '0.78rem',
  fontWeight: 700,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
  overflowWrap: 'anywhere',
};

const botaoSecundario = {
  ...botaoBase,
  border: '1.5px solid var(--border)',
  background: '#ffffff',
  color: 'var(--navy)',
};

const botaoPrimario = {
  ...botaoBase,
  border: '1.5px solid var(--navy)',
  background: 'var(--navy)',
  color: '#ffffff',
};

/**
 * Ações de reutilização da conversa: exportação confirmada e ajuda do histórico.
 * Não recebe nem acessa o hook; usa apenas `messages` do agente já selecionado.
 */
export default function AcoesConversa({ agente, messages }) {
  const [dialogo, setDialogo] = useState(null);
  const [erroExportacao, setErroExportacao] = useState('');
  const gatilhoRef = useRef(null);
  const exportarRef = useRef(null);
  const ajudaRef = useRef(null);
  const jaAbriuRef = useRef(false);

  const temMensagens = Array.isArray(messages) && messages.length > 0;
  const nomeAgente = agente?.name || 'Agente Pedagógico';

  const fechar = useCallback(() => setDialogo(null), []);

  useEffect(() => {
    if (dialogo) {
      jaAbriuRef.current = true;
      return;
    }

    if (jaAbriuRef.current) {
      jaAbriuRef.current = false;
      gatilhoRef.current?.focus();
    }
  }, [dialogo]);

  const abrir = (tipo, referencia) => {
    gatilhoRef.current = referencia.current;
    setErroExportacao('');
    setDialogo(tipo);
  };

  const exportar = () => {
    try {
      baixarConversaTxt(agente, messages);
      setDialogo(null);
    } catch {
      setErroExportacao('Não foi possível gerar o arquivo. Tente novamente.');
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          flexShrink: 0,
        }}
      >
        <button
          ref={exportarRef}
          type="button"
          onClick={() => abrir('exportar', exportarRef)}
          disabled={!temMensagens}
          aria-label="Exportar conversa em TXT"
          title={
            temMensagens
              ? 'Exportar conversa em TXT'
              : 'Ainda não há mensagens para exportar'
          }
          className="agentes-chat-acao"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            flexShrink: 0,
            borderRadius: '100px',
            border: '1.5px solid var(--border)',
            background: 'transparent',
            color: 'var(--gray)',
            fontSize: '0.72rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            cursor: temMensagens ? 'pointer' : 'not-allowed',
            opacity: temMensagens ? 1 : 0.45,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(evento) => {
            if (!temMensagens) return;
            evento.currentTarget.style.borderColor = 'var(--navy)';
            evento.currentTarget.style.color = 'var(--navy)';
          }}
          onMouseLeave={(evento) => {
            evento.currentTarget.style.borderColor = 'var(--border)';
            evento.currentTarget.style.color = 'var(--gray)';
          }}
        >
          <Download size={13} aria-hidden="true" />
          <span className="agentes-chat-acao-texto">Exportar</span>
        </button>

        <button
          ref={ajudaRef}
          type="button"
          onClick={() => abrir('ajuda', ajudaRef)}
          aria-label="Ajuda sobre o histórico local"
          title="Ajuda sobre o histórico local"
          className="agentes-chat-acao"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            flexShrink: 0,
            borderRadius: '100px',
            border: '1.5px solid var(--border)',
            background: 'transparent',
            color: 'var(--gray)',
            fontSize: '0.72rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(evento) => {
            evento.currentTarget.style.borderColor = 'var(--navy)';
            evento.currentTarget.style.color = 'var(--navy)';
          }}
          onMouseLeave={(evento) => {
            evento.currentTarget.style.borderColor = 'var(--border)';
            evento.currentTarget.style.color = 'var(--gray)';
          }}
        >
          <HelpCircle size={13} aria-hidden="true" />
          <span className="agentes-chat-acao-texto">Ajuda</span>
        </button>
      </div>

      {dialogo === 'exportar' && (
        <DialogoChat titulo="Exportar conversa" onClose={fechar}>
          <p style={{ ...paragrafo, marginTop: '0.75rem' }}>
            O arquivo TXT conterá toda a conversa com{' '}
            <strong style={{ color: 'var(--navy)' }}>{nomeAgente}</strong> neste
            navegador, incluindo suas perguntas e as respostas do agente. Nenhum
            outro dado da conta é incluído.
          </p>
          <p
            style={{
              ...paragrafo,
              marginTop: '0.5rem',
              color: 'var(--gray)',
              fontSize: '0.75rem',
            }}
          >
            Arquivo: {nomeArquivoConversa(agente)}
          </p>
          {erroExportacao && (
            <p
              role="alert"
              style={{
                ...paragrafo,
                marginTop: '0.75rem',
                padding: '0.5rem 0.625rem',
                borderRadius: '0.5rem',
                background: '#F3EDFF',
                border: '1px solid #B9A6EF',
                color: '#5411B8',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {erroExportacao}
            </p>
          )}
          <div style={rodape}>
            <button type="button" onClick={fechar} style={botaoSecundario}>
              Cancelar
            </button>
            <button type="button" onClick={exportar} style={botaoPrimario}>
              Baixar arquivo TXT
            </button>
          </div>
        </DialogoChat>
      )}

      {dialogo === 'ajuda' && (
        <DialogoChat titulo="Histórico local" onClose={fechar}>
          <div
            style={{
              display: 'grid',
              gap: '0.625rem',
              marginTop: '0.75rem',
            }}
          >
            <p style={paragrafo}>
              Esta conversa fica salva apenas neste navegador e neste
              dispositivo, separada por agente.
            </p>
            <p style={paragrafo}>
              Ela não é sincronizada entre dispositivos ou contas.
            </p>
            <p style={paragrafo}>
              O histórico pode ser apagado ao sair da conta, ao limpar os dados
              do navegador ou ao usar <strong>Limpar histórico</strong>. Para
              guardar uma cópia fora do navegador, use{' '}
              <strong>Exportar conversa em TXT</strong>.
            </p>
          </div>
          <div style={rodape}>
            <button type="button" onClick={fechar} style={botaoPrimario}>
              Entendi
            </button>
          </div>
        </DialogoChat>
      )}
    </>
  );
}
