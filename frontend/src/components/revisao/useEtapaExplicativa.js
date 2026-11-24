'use client';
import { useMemo, useSyncExternalStore } from 'react';

function criarRelogio({ etapa, totalEtapas, automatica, agoraServidorMs, iniciadaEmMs, etapaBase, intervaloMs }) {
  let inicio = null;
  let valor = etapa;
  const calcular = () => automatica && inicio !== null
    ? Math.min(totalEtapas - 1, Math.max(etapa, etapaBase + Math.floor(Math.max(0, agoraServidorMs - iniciadaEmMs + performance.now() - inicio) / intervaloMs)))
    : etapa;
  return {
    getSnapshot: () => valor,
    getServerSnapshot: () => etapa,
    subscribe(notificar) {
      if (inicio === null) inicio = performance.now();
      const atualizar = () => { const proximo = calcular(); if (proximo !== valor) { valor = proximo; notificar(); } };
      atualizar();
      if (!automatica) return () => {};
      const id = setInterval(atualizar, 200);
      return () => clearInterval(id);
    },
  };
}

// Relógio monotônico entre projeções: mudanças no relógio do aparelho não avançam a aula.
export function useEtapaExplicativa(apresentacao) {
  const { etapa = 0, totalEtapas = 1, automatica = false, agoraServidorMs = 0, iniciadaEmMs = 0, etapaBase = 0, intervaloMs = 8000 } = apresentacao || {};
  const relogio = useMemo(() => criarRelogio({ etapa, totalEtapas, automatica, agoraServidorMs, iniciadaEmMs, etapaBase, intervaloMs }),
    [etapa, totalEtapas, automatica, agoraServidorMs, iniciadaEmMs, etapaBase, intervaloMs]);
  return useSyncExternalStore(relogio.subscribe, relogio.getSnapshot, relogio.getServerSnapshot);
}
