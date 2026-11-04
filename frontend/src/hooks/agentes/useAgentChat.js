'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getClientAIHeaders } from '@/utils/aiHeaders';
import {
  LIMITE_MENSAGENS_API,
  normalizarHistoricoLocal,
} from '@/dominio/agentes/ConversaAgente';

const PREFIXO_HISTORICO = 'agente_history_';
const PREFIXO_BACKUP = 'agente_history_backup_';

const AVISO_RECUPERACAO = {
  type: 'recovery',
  message:
    'O histórico salvo estava inválido. Uma cópia foi preservada em backup e a conversa foi reiniciada.',
};

const AVISO_RECUPERACAO_SEM_BACKUP = {
  type: 'recovery',
  message:
    'O histórico salvo estava inválido e não pôde ser copiado. O conteúdo original foi preservado no navegador; a conversa reiniciou apenas nesta sessão.',
};

const AVISO_ARMAZENAMENTO = {
  type: 'storage',
  message:
    'Não foi possível salvar o histórico no navegador. A conversa continua disponível nesta sessão; verifique o espaço de armazenamento.',
};

const AVISO_INDISPONIVEL = {
  type: 'storage',
  message:
    'O armazenamento local não está disponível neste navegador. A conversa funciona apenas nesta sessão.',
};

function chaveDoHistorico(agentId) {
  return agentId ? `${PREFIXO_HISTORICO}${agentId}` : null;
}

function recuperarHistorico(agentId, storageKey, bruto) {
  try {
    localStorage.setItem(`${PREFIXO_BACKUP}${agentId}`, bruto);
    localStorage.removeItem(storageKey);
    return {
      key: storageKey,
      messages: [],
      persistAllowed: true,
      notice: AVISO_RECUPERACAO,
    };
  } catch {
    return {
      key: storageKey,
      messages: [],
      persistAllowed: false,
      notice: AVISO_RECUPERACAO_SEM_BACKUP,
    };
  }
}

/**
 * Carrega a conversa de uma chave específica.
 * O conteúdo bruto inválido vai para backup antes de a chave principal ser limpa.
 */
function carregarConversa(agentId, storageKey) {
  const vazia = {
    key: storageKey,
    messages: [],
    persistAllowed: true,
    notice: null,
  };

  if (!storageKey || typeof window === 'undefined') {
    return { ...vazia, persistAllowed: false };
  }

  let bruto;
  try {
    bruto = localStorage.getItem(storageKey);
  } catch {
    return { ...vazia, persistAllowed: false, notice: AVISO_INDISPONIVEL };
  }

  if (!bruto) return vazia;

  let valor;
  try {
    valor = JSON.parse(bruto);
  } catch {
    return recuperarHistorico(agentId, storageKey, bruto);
  }

  const { valido, mensagens } = normalizarHistoricoLocal(valor);
  if (!valido) return recuperarHistorico(agentId, storageKey, bruto);

  return {
    key: storageKey,
    messages: mensagens,
    persistAllowed: true,
    notice: null,
  };
}

/**
 * Hook de chat conversacional para os Agentes Pedagógicos.
 * RN-15: histórico persistido em localStorage por agentId.
 *
 * @param {string} agentId - ID do agente ('ensino-medio' | 'fundamental-2')
 */
export function useAgentChat(agentId) {
  const storageKey = chaveDoHistorico(agentId);
  const [conversation, setConversation] = useState(() =>
    carregarConversa(agentId, storageKey)
  );
  const [storageNotice, setStorageNotice] = useState(() => conversation.notice);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Invalida respostas pendentes quando a conversa muda ou o hook desmonta.
  const versionRef = useRef(0);
  const loadedKeyRef = useRef(storageKey);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const abortarEnvioPendente = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Reativa no setup para conviver com StrictMode e invalida envios na desmontagem.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      versionRef.current += 1;
      abortarEnvioPendente();
    };
  }, [abortarEnvioPendente]);

  // Só expõe mensagens que pertencem à chave atual; evita vazar o agente anterior.
  const messages = conversation.key === storageKey ? conversation.messages : [];

  // Carrega o histórico do destino ao trocar de agente, sem gravar o histórico antigo.
  useEffect(() => {
    if (loadedKeyRef.current === storageKey) return;

    loadedKeyRef.current = storageKey;
    versionRef.current += 1;
    abortarEnvioPendente();
    setIsLoading(false);
    setError(null);

    const carregada = carregarConversa(agentId, storageKey);
    setConversation(carregada);
    setStorageNotice(carregada.notice);
  }, [abortarEnvioPendente, agentId, storageKey]);

  /**
   * Persiste a conversa após uma alteração explícita do usuário ou da resposta.
   * A chave só é gravada quando a sessão está montada e a versão/chave continuam ativas.
   */
  const persistirHistorico = useCallback((chave, mensagens, expectedVersion) => {
    if (!chave || typeof window === 'undefined') return;
    if (!mountedRef.current) return;
    if (expectedVersion !== undefined && versionRef.current !== expectedVersion) return;
    if (loadedKeyRef.current !== chave) return;

    try {
      localStorage.setItem(chave, JSON.stringify(mensagens));
      setStorageNotice((anterior) => (anterior?.type === 'storage' ? null : anterior));
    } catch {
      setStorageNotice((anterior) =>
        anterior?.type === 'storage' ? anterior : AVISO_ARMAZENAMENTO
      );
    }
  }, []);

  const executarEnvio = useCallback(
    async (updatedHistory) => {
      if (!agentId || !storageKey || isLoading) return;
      if (!mountedRef.current || conversation.key !== storageKey) return;

      abortarEnvioPendente();
      const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
      abortControllerRef.current = controller;

      const requestVersion = versionRef.current + 1;
      versionRef.current = requestVersion;

      const requestKey = storageKey;
      const podePersistir = conversation.persistAllowed;

      setConversation((anterior) =>
        anterior.key === requestKey
          ? { ...anterior, messages: updatedHistory }
          : anterior
      );
      if (podePersistir) {
        persistirHistorico(requestKey, updatedHistory, requestVersion);
      }
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/agentes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getClientAIHeaders(),
          },
          body: JSON.stringify({
            agentId,
            messages: updatedHistory.slice(-LIMITE_MENSAGENS_API),
          }),
          signal: controller?.signal,
        });

        if (
          !mountedRef.current ||
          versionRef.current !== requestVersion ||
          loadedKeyRef.current !== requestKey
        ) {
          return;
        }

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (
          !mountedRef.current ||
          versionRef.current !== requestVersion ||
          loadedKeyRef.current !== requestKey
        ) {
          return;
        }

        if (!res.ok) {
          throw new Error(
            data?.message || data?.error || 'Erro ao chamar o agente pedagógico.'
          );
        }

        const resposta = data?.choices?.[0]?.message?.content;
        const assistantContent =
          typeof resposta === 'string' && resposta.trim()
            ? resposta
            : 'Sem resposta do agente.';
        const conversaComResposta = [
          ...updatedHistory,
          { role: 'assistant', content: assistantContent },
        ];

        setConversation((anterior) =>
          anterior.key === requestKey
            ? { ...anterior, messages: conversaComResposta }
            : anterior
        );
        if (podePersistir) {
          persistirHistorico(requestKey, conversaComResposta, requestVersion);
        }
      } catch (err) {
        if (
          !mountedRef.current ||
          versionRef.current !== requestVersion ||
          loadedKeyRef.current !== requestKey
        ) {
          return;
        }
        setError(err?.message || 'Erro ao chamar o agente pedagógico.');
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        if (
          mountedRef.current &&
          versionRef.current === requestVersion &&
          loadedKeyRef.current === requestKey
        ) {
          setIsLoading(false);
        }
      }
    },
    [abortarEnvioPendente, agentId, conversation, isLoading, persistirHistorico, storageKey]
  );

  /**
   * Envia uma mensagem ao agente e atualiza o histórico.
   * Se a última mensagem de usuário falhou e o mesmo texto é reenviado, evita duplicá-la.
   * @param {string} text - Mensagem do usuário
   */
  const sendMessage = useCallback(
    async (text) => {
      const conteudo = typeof text === 'string' ? text.trim() : '';
      if (!conteudo || !agentId || !storageKey || isLoading) return;
      if (conversation.key !== storageKey) return;

      const ultima = conversation.messages[conversation.messages.length - 1];
      const ehReenvioMesmaPergunta =
        Boolean(error) && ultima?.role === 'user' && ultima.content === conteudo;
      const updatedHistory = ehReenvioMesmaPergunta
        ? conversation.messages
        : [...conversation.messages, { role: 'user', content: conteudo }];

      await executarEnvio(updatedHistory);
    },
    [agentId, conversation, error, executarEnvio, isLoading, storageKey]
  );

  /**
   * Repete o envio da última pergunta pendente após falha sem duplicá-la na conversa.
   */
  const retryLastMessage = useCallback(async () => {
    if (!agentId || !storageKey || isLoading) return;
    if (conversation.key !== storageKey) return;

    const ultima = conversation.messages[conversation.messages.length - 1];
    if (!ultima || ultima.role !== 'user') return;

    await executarEnvio(conversation.messages);
  }, [agentId, conversation, executarEnvio, isLoading, storageKey]);

  /**
   * Limpa o histórico de conversa do agente atual (RN-15).
   */
  const clearHistory = useCallback(() => {
    versionRef.current += 1;
    abortarEnvioPendente();
    setIsLoading(false);
    setError(null);
    setStorageNotice((anterior) =>
      anterior?.type === 'recovery' ? null : anterior
    );
    setConversation((anterior) =>
      anterior.key === storageKey
        ? { ...anterior, messages: [], persistAllowed: true }
        : anterior
    );

    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        setStorageNotice(AVISO_ARMAZENAMENTO);
      }
    }
  }, [abortarEnvioPendente, storageKey]);

  const dismissStorageNotice = useCallback(() => {
    setStorageNotice(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    clearHistory,
    storageNotice,
    dismissStorageNotice,
  };
}
