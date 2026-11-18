'use client';

import React from 'react';
import { CartaoSuperficie } from '@/components/ui/CartaoSuperficie';
import { mesclarModalidades, rotuloTipoQuestao } from './constantes';

const ICONES_MODALIDADE = {
  quiz: '⚡',
  memoria: '🃏',
  associacao: '🔗',
  ordenacao: '📊',
  equipes: '🏆',
};

export function CatalogoModalidades({
  modalidadesServidor = null,
  onSelecionarParaSala,
  onSelecionarParaGerar,
  onCriarManual,
}) {
  const modalidades = mesclarModalidades(modalidadesServidor);

  return (
    <section aria-labelledby="titulo-catalogo-modalidades" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 id="titulo-catalogo-modalidades" className="font-head text-2xl font-black text-[#25104A]">
            Cinco modalidades para qualquer disciplina
          </h2>
          <p className="text-sm text-[#5B4B86] mt-1">
            Escolha a mecânica ideal para o conteúdo da aula. Cada modalidade aceita apenas tipos de questões compatíveis e revisadas.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#E7DBFD] px-3 py-1 text-xs font-extrabold text-[#25104A] w-fit">
          5 jogos prontos · Sem alterar notas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modalidades.map((mod) => {
          const tipoPrincipal = mod.tiposQuestoes[0] || 'multipla_escolha';
          return (
            <CartaoSuperficie
              key={mod.id}
              titulo={mod.nome}
              badge={mod.badge}
              badgeCor={mod.accent === 'rosa' ? 'lavanda' : mod.accent}
              accentBorda={mod.accent}
              className="flex flex-col justify-between"
            >
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4A3B7C]">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3EDFF] border border-[#E2D9F7] text-lg"
                    >
                      {ICONES_MODALIDADE[mod.id] || '🎯'}
                    </span>
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-[#6E5F94]">
                        Tipo compatível
                      </span>
                      <span className="text-[#25104A] font-extrabold">
                        {mod.tiposQuestoes.map(rotuloTipoQuestao).join(', ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[#5B4B86] leading-relaxed">{mod.resumo}</p>

                  <div className="rounded-xl bg-[#F3EDFF] border border-[#E2D9F7] p-3 text-xs text-[#25104A]">
                    <strong className="block font-extrabold text-[#4A3B7C] mb-0.5">Regra de pontuação</strong>
                    <span>{mod.regraPontuacao}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2D9F7] flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSelecionarParaSala?.(mod.id)}
                    className="flex-1 min-h-11 rounded-xl bg-[#6315D9] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#5411B8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6315D9]"
                  >
                    Preparar sala
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelecionarParaGerar?.(tipoPrincipal)}
                    className="min-h-11 rounded-xl border border-[#6315D9] bg-white px-3 py-2 text-xs font-extrabold text-[#6315D9] transition hover:bg-[#F3EDFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6315D9]"
                  >
                    Gerar IA
                  </button>
                  <button
                    type="button"
                    onClick={() => onCriarManual?.(tipoPrincipal)}
                    className="min-h-11 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-xs font-bold text-[#25104A] transition hover:bg-[#F3EDFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6315D9]"
                  >
                    Manual
                  </button>
                </div>
              </div>
            </CartaoSuperficie>
          );
        })}
      </div>
    </section>
  );
}
