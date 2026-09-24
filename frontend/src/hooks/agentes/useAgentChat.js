'use client';

import { useState, useCallback, useEffect } from 'react';
import { getClientAIHeaders } from '@/utils/aiHeaders';

/**
 * Hook de chat conversacional para os Agentes Pedagógicos.
 * RN-15: histórico persistido em localStorage por agentId.
 *
 * @param {string} agentId - ID do agente ('ensino-medio' | 'fundamental-2')
 */
export function useAgentChat(agentId) {
  const storageKey = agentId ? `agente_history_${agentId}` : null;

  // Inicializa o histórico do localStorage (RN-15)
  const [messages, setMessages] = useState(() => {
    if (!storageKey || typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persiste o histórico no localStorage sempre que mudar (RN-15)
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignora erros de quota
    }
  }, [messages, storageKey]);

  // Recarrega histórico quando o agente muda
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(storageKey);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
    setError(null);
  }, [storageKey]);

  /**
   * Envia uma mensagem ao agente e atualiza o histórico.
   * @param {string} text - Mensagem do usuário
   */
  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim() || !agentId || isLoading) return;

      const userMessage = { role: 'user', content: text.trim() };
      const updatedHistory = [...messages, userMessage];

      setMessages(updatedHistory);
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
            messages: updatedHistory,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || data?.error || 'Erro ao chamar o agente pedagógico.');
        }

        const assistantContent =
          data?.choices?.[0]?.message?.content || 'Sem resposta do agente.';

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: assistantContent },
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [agentId, messages, isLoading]
  );

  /**
   * Limpa o histórico de conversa do agente atual (RN-15).
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    if (storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setError(null);
  }, [storageKey]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  };
}
