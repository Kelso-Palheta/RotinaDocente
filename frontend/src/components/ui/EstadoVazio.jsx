'use client';

import React from 'react';

export function EstadoVazio({
  titulo = 'Nenhum registro encontrado',
  descricao = null,
  textoAcao = null,
  onAcao = null,
  icone = '🎨',
  badge = null,
  className = '',
}) {
  return (
    <div
      className={`rounded-3xl border-2 border-dashed border-[#E2D9F7] bg-[#FFFDF7] p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 ${className}`}
    >
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F3EDFF] border border-[#E2D9F7] flex items-center justify-center text-3xl shadow-xs">
        {icone}
      </div>

      <div className="space-y-1.5">
        {badge && (
          <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-[#FFE500] text-[#25104A] px-2.5 py-0.5 rounded-full border border-[#FFE500]">
            {badge}
          </span>
        )}
        <h3 className="text-lg sm:text-xl font-black text-[#25104A] tracking-tight">
          {titulo}
        </h3>
        {descricao && (
          <p className="text-xs sm:text-sm text-[#5B4B86] max-w-md mx-auto leading-relaxed">
            {descricao}
          </p>
        )}
      </div>

      {textoAcao && onAcao && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAcao}
            className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-[#6315D9] hover:bg-[#5411B8] active:scale-95 text-[#FFFFFF] shadow-md transition"
          >
            {textoAcao}
          </button>
        </div>
      )}
    </div>
  );
}
