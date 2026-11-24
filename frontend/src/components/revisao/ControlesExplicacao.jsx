'use client';
import React from 'react';
import { useEtapaExplicativa } from './useEtapaExplicativa';

export function ControlesExplicacao({ apresentacao, bloqueado = false, onAcao }) {
  const etapa = useEtapaExplicativa(apresentacao);
  const total = apresentacao?.totalEtapas || 1;
  const botao = 'rounded-full border border-[#B9A6EF] bg-[#FFFDF7] px-3 py-2 text-xs font-bold text-[#25104A] disabled:opacity-40';
  return <div role="group" aria-label="Etapas da explicação" className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#F3EDFF] p-2 text-[#25104A]">
    <span className="px-2 text-xs font-black">Explicação {etapa + 1}/{total}</span>
    <button type="button" className={botao} disabled={bloqueado || etapa === 0} onClick={() => onAcao('voltar_explicacao')} aria-label="Etapa anterior">← Etapa</button>
    <button type="button" className={botao} disabled={bloqueado || etapa >= total - 1} onClick={() => onAcao('avancar_explicacao')} aria-label="Próxima etapa">Etapa →</button>
    <button type="button" className={botao} disabled={bloqueado} onClick={() => onAcao('repetir_explicacao')}>Repetir explicação</button>
    <button type="button" className={botao} disabled={bloqueado || (!apresentacao?.automatica && etapa >= total - 1)} onClick={() => onAcao(apresentacao?.automatica ? 'pausar_explicacao' : 'reproduzir_explicacao')}>
      {apresentacao?.automatica ? 'Pausar explicação' : 'Reprodução automática'}
    </button>
  </div>;
}
