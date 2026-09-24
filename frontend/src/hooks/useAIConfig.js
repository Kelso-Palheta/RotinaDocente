"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AIConfigService } from '@/aplicacao/ai/AIConfigService';

const service = new AIConfigService();
const EVENT_NAME = 'rotina_docente_ai_config_changed';

/**
 * Hook React unificado para gerenciamento e consumo da chave de IA (BYOK).
 */
export function useAIConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState(() => {
    return service.repository.carregarLocal();
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;

    async function sincronizar() {
      if (user?.uid) {
        setLoading(true);
        try {
          const cfg = await service.obterConfiguracao(user.uid);
          if (!cancel && cfg) {
            setConfig(cfg);
          }
        } finally {
          if (!cancel) setLoading(false);
        }
      }
    }

    sincronizar();

    const handleStorageOrEvent = () => {
      const atual = service.repository.carregarLocal();
      setConfig(atual);
    };

    window.addEventListener('storage', handleStorageOrEvent);
    window.addEventListener(EVENT_NAME, handleStorageOrEvent);

    return () => {
      cancel = true;
      window.removeEventListener('storage', handleStorageOrEvent);
      window.removeEventListener(EVENT_NAME, handleStorageOrEvent);
    };
  }, [user]);

  const salvar = async ({ provider, apiKey, model }) => {
    const nova = await service.salvarConfiguracao(user?.uid, { provider, apiKey, model });
    setConfig(nova);
    window.dispatchEvent(new Event(EVENT_NAME));
    return nova;
  };

  const remover = async () => {
    await service.removerConfiguracao(user?.uid);
    setConfig(null);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  const testar = async ({ provider, apiKey, model }) => {
    return await service.testarConexao({ provider, apiKey, model });
  };

  /**
   * Retorna os headers canônicos a serem anexados nas requisições fetch para rotas de IA.
   */
  const getAIHeaders = useCallback(() => {
    if (!config || !config.isValid()) {
      return {};
    }
    return {
      'x-user-ai-provider': config.provider,
      'x-user-ai-key': config.apiKey,
      'x-user-ai-model': config.model,
    };
  }, [config]);

  const carregar = useCallback(async () => {
    const local = service.repository.carregarLocal();
    if (local) {
      setConfig(local);
    } else if (user?.uid) {
      const remoto = await service.obterConfiguracao(user.uid);
      if (remoto) setConfig(remoto);
    }
  }, [user]);

  return {
    config,
    temChave: Boolean(config && config.isValid()),
    provider: config?.provider || null,
    maskedKey: config ? config.getMaskedKey() : '',
    model: config?.model || null,
    loading,
    salvar,
    remover,
    testar,
    getAIHeaders,
    recarregar: carregar,
  };
}
