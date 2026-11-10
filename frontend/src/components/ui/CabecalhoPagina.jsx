'use client';

import React from 'react';
import Link from 'next/link';

export function CabecalhoPagina({
  titulo,
  subtitulo,
  badge = null,
  badgeCor = 'amarelo',
  acoes = null,
  variante = 'padrao', // 'padrao' | 'escuro' | 'compacto'
  voltarUrl = null,
  onVoltar = null,
}) {
  const badgeCores = {
    amarelo: 'bg-[#FFE500] text-[#25104A] border-[#FFE500]',
    ciano: 'bg-[#00DDEB] text-[#25104A] border-[#00DDEB]',
    rosa: 'bg-[#FF2D93] text-[#25104A] border-[#FF2D93]',
    lima: 'bg-[#B9EF00] text-[#25104A] border-[#B9EF00]',
    lavanda: 'bg-[#E7DBFD] text-[#25104A] border-[#B9A6EF]',
  };

  const badgeEstilo = badgeCores[badgeCor] || badgeCores.amarelo;

  if (variante === 'escuro') {
    return (
      <header className="arte-banner-festival arte-cartaz-compacto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              {voltarUrl && (
                <Link
                  href={voltarUrl}
                  className="px-3 py-1.5 rounded-xl bg-[#6315D9]/30 hover:bg-[#6315D9]/60 text-xs font-bold text-[#00DDEB] border border-[#00DDEB]/40 transition"
                >
                  ← Voltar
                </Link>
              )}
              {onVoltar && (
                <button
                  type="button"
                  onClick={onVoltar}
                  className="px-3 py-1.5 rounded-xl bg-[#6315D9]/30 hover:bg-[#6315D9]/60 text-xs font-bold text-[#00DDEB] border border-[#00DDEB]/40 transition"
                >
                  ← Voltar
                </button>
              )}
              {badge && (
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${badgeEstilo}`}
                >
                  {badge}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FFFDF7] tracking-tight">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="text-xs sm:text-sm text-[#FFFDF7]/80 max-w-2xl font-medium leading-relaxed">
                {subtitulo}
              </p>
            )}
          </div>
          {acoes && <div className="flex items-center gap-3 shrink-0 flex-wrap">{acoes}</div>}
        </div>
      </header>
    );
  }

  // Variante padrão: fundo claro quente com faixa/borda roxa compacta e identidade expressiva
  return (
    <header className={`arte-faixa arte-composicao bg-[#FFFDF7] border-b-2 border-[#E2D9F7] px-4 sm:px-6 shadow-sm ${variante === "compacto" ? "py-4" : "py-6 md:px-8"}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {voltarUrl && (
              <Link
                href={voltarUrl}
                className="px-3 py-1 rounded-xl bg-[#F3EDFF] hover:bg-[#E7DBFD] text-xs font-bold text-[#6315D9] border border-[#E2D9F7] transition"
              >
                ← Voltar
              </Link>
            )}
            {onVoltar && (
              <button
                type="button"
                onClick={onVoltar}
                className="px-3 py-1 rounded-xl bg-[#F3EDFF] hover:bg-[#E7DBFD] text-xs font-bold text-[#6315D9] border border-[#E2D9F7] transition"
              >
                ← Voltar
              </button>
            )}
            {badge && (
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${badgeEstilo}`}
              >
                {badge}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#25104A] tracking-tight">
            {titulo}
          </h1>
          {subtitulo && (
            <p className="text-xs sm:text-sm text-[#5B4B86] max-w-2xl font-medium leading-relaxed">
              {subtitulo}
            </p>
          )}
        </div>
        {acoes && <div className="flex items-center gap-3 shrink-0 flex-wrap">{acoes}</div>}
      </div>
    </header>
  );
}
