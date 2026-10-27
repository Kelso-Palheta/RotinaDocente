'use client';
import { useState, useEffect, useCallback } from 'react';
import { consultarDiarioAnalytics } from '@/aplicacao/analytics/consultarDiarioAnalytics';
import { DiarioRepository } from '@/infraestrutura/diario/DiarioRepository';
const vazio = { turmas: [], carregando: true, erro: '', origem: '', atualizadoEm: null };

/** Leitor sem efeitos de escrita: cache próprio é apenas fallback consultivo. */
export function useDadosAnalytics(uid) {
  const [snapshot, setSnapshot] = useState(vazio);
  const [tentativa, setTentativa] = useState(0);
  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);
  useEffect(() => {
    if (!uid) return;
    let ativo = true;
    queueMicrotask(() => {
      if (ativo) setSnapshot({ ...vazio, uid });
    });
    async function carregar() {
      let storage = null;
      try {
        storage = window.localStorage;
      } catch {
        /* Navegador pode negar armazenamento. */
      }
      const resultado = await consultarDiarioAnalytics({
        uid,
        repository: new DiarioRepository(uid),
        storage,
      });
      if (ativo) setSnapshot({ ...resultado, uid });
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [uid, tentativa]);
  return {
    ...(snapshot.uid === uid ? snapshot : { ...vazio, turmas: [], carregando: Boolean(uid) }),
    recarregar,
  };
}
