'use client';

import React from 'react';

export function CartaoSuperficie({
  titulo = null,
  subtitulo = null,
  badge = null,
  badgeCor = 'amarelo',
  destaque = null,
  acoes = null,
  children,
  className = '',
  variante = 'claro', // 'claro' | 'suave' | 'escuro'
  accentBorda = null, // 'ciano' | 'amarelo' | 'rosa' | 'lima' | null
}) {
  const badgeCores = {
    amarelo: 'bg-[#FFE500] text-[#25104A] border-[#FFE500]',
    ciano: 'bg-[#00DDEB] text-[#25104A] border-[#00DDEB]',
    rosa: 'bg-[#FF2D93] text-[#25104A] border-[#FF2D93]',
    lima: 'bg-[#B9EF00] text-[#25104A] border-[#B9EF00]',
    lavanda: 'bg-[#E7DBFD] text-[#25104A] border-[#B9A6EF]',
  };

  const bordasAccent = {
    ciano: 'border-t-4 border-t-[#00DDEB]',
    amarelo: 'border-t-4 border-t-[#FFE500]',
    rosa: 'border-t-4 border-t-[#FF2D93]',
    lima: 'border-t-4 border-t-[#B9EF00]',
  };

  const variantesEstilo = {
    claro: 'bg-[#FFFDF7] text-[#25104A] border-[#E2D9F7]',
    suave: 'bg-[#F3EDFF] text-[#25104A] border-[#E2D9F7]',
    escuro: 'bg-[#25104A] text-[#FFFDF7] border-[#6315D9]/40',
  };

  const estiloBase = variantesEstilo[variante] || variantesEstilo.claro;
  const estiloAccent = accentBorda ? bordasAccent[accentBorda] : '';

  return (
    <div
      className={`rounded-2xl border-2 p-5 sm:p-6 shadow-sm transition ${estiloBase} ${estiloAccent} ${className}`}
    >
      {(titulo || badge || destaque || acoes) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2D9F7]/70 mb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {titulo && (
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  {titulo}
                </h3>
              )}
              {badge && (
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    badgeCores[badgeCor] || badgeCores.amarelo
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitulo && (
              <p className="text-xs text-[#5B4B86] font-medium leading-normal">
                {subtitulo}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {destaque && (
              <span className="font-mono text-xl sm:text-2xl font-black text-[#6315D9]">
                {destaque}
              </span>
            )}
            {acoes && <div className="flex items-center gap-2">{acoes}</div>}
          </div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
