'use client';

import React from 'react';

export function AbasNavegacao({
  abas = [],
  abaAtiva,
  onSelect,
  variante = 'pill', // 'pill' | 'linha'
  className = '',
}) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex items-center gap-2 overflow-x-auto pb-1 max-w-full ${className}`}
    >
      {abas.map((aba) => {
        const ativa = aba.id === abaAtiva;
        if (variante === 'linha') {
          return (
            <button
              key={aba.id}
              role="tab"
              type="button"
              id={`tab-${aba.id}`}
              aria-controls={`tabpanel-${aba.id}`}
              aria-selected={ativa}
              tabIndex={ativa ? 0 : -1}
              onClick={() => onSelect && onSelect(aba.id)}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                ativa
                  ? 'border-[#6315D9] text-[#6315D9]'
                  : 'border-transparent text-[#5B4B86] hover:text-[#25104A] hover:border-[#E2D9F7]'
              }`}
            >
              {aba.icone && <span aria-hidden="true">{aba.icone}</span>}
              <span>{aba.rotulo}</span>
              {aba.contagem != null && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    ativa
                      ? 'bg-[#E7DBFD] text-[#6315D9]'
                      : 'bg-[#F3EDFF] text-[#5B4B86]'
                  }`}
                >
                  {aba.contagem}
                </span>
              )}
            </button>
          );
        }

        // Variante pill (estilo Arte em Jogo)
        return (
          <button
            key={aba.id}
            role="tab"
            type="button"
            id={`tab-${aba.id}`}
            aria-controls={`tabpanel-${aba.id}`}
            aria-selected={ativa}
            tabIndex={ativa ? 0 : -1}
            onClick={() => onSelect && onSelect(aba.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black tracking-wide transition whitespace-nowrap flex items-center gap-2 border-2 ${
              ativa
                ? 'bg-[#6315D9] text-[#FFFFFF] border-[#6315D9] shadow-md shadow-[#6315D9]/20'
                : 'bg-[#FFFDF7] text-[#25104A] border-[#E2D9F7] hover:bg-[#F3EDFF]'
            }`}
          >
            {aba.icone && <span aria-hidden="true">{aba.icone}</span>}
            <span>{aba.rotulo}</span>
            {aba.contagem != null && (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  ativa
                    ? 'bg-[#FFE500] text-[#25104A]'
                    : 'bg-[#E7DBFD] text-[#25104A]'
                }`}
              >
                {aba.contagem}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
