'use client';

import { useMemo, useSyncExternalStore } from 'react';

function criarRelogio({ agora: agoraServidorMs, prazo: encerraEmMs, ativo }) {
  const inicioLocal = performance.now();
  const prazoValido = Number.isFinite(agoraServidorMs) && Number.isFinite(encerraEmMs);
  const calcular = () => prazoValido
    ? Math.max(0, Math.ceil((encerraEmMs - agoraServidorMs - (ativo ? performance.now() - inicioLocal : 0)) / 1000))
    : 0;
  const inicial = calcular();
  let valor = inicial;
  return {
    getSnapshot: () => valor,
    getServerSnapshot: () => inicial,
    subscribe(notificar) {
      const atualizar = () => {
        const proximo = calcular();
        if (proximo !== valor) {
          valor = proximo;
          notificar();
        }
      };
      atualizar();
      if (!ativo) return () => {};
      // O callback apenas atualiza a tela; a passagem do tempo vem do relógio monotônico.
      const intervalo = setInterval(atualizar, 200);
      return () => clearInterval(intervalo);
    },
  };
}

export function useCronometroRevisao(estado) {
  const agora = estado?.agoraServidorMs;
  const prazo = estado?.rodada?.encerraEmMs;
  const ativo = estado?.fase === 'pergunta';
  const salaId = estado?.sala?.id;
  const rodadaId = estado?.rodada?.id;
  const relogio = useMemo(
    () => criarRelogio({ agora, prazo, ativo, salaId, rodadaId }),
    [agora, prazo, ativo, salaId, rodadaId],
  );
  return useSyncExternalStore(relogio.subscribe, relogio.getSnapshot, relogio.getServerSnapshot);
}
