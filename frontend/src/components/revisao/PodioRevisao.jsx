"use client";
import React from "react";
/** Posições compartilhadas preservam empates; acerto continua valendo mil pontos. */
export function PodioRevisao({ ranking = [] }) {
  return (
    <section
      aria-label="Pódio acumulado por acertos"
      className="my-6 space-y-3"
    >
      <h2 className="text-center text-2xl font-black text-[#FFE14D]">
        Pódio de acertos
      </h2>
      <div className="grid grid-cols-3 gap-3 items-end">
        {[2, 1, 3].map((posicao) => {
          const alunos = ranking.filter((a) => a.posicao === posicao);
          return (
            <div
              key={posicao}
              className={`rounded-2xl border-2 p-3 text-center ${posicao === 1 ? "border-[#FFE14D] bg-[#6334E3]/70 pb-10" : "border-[#00DDEB] bg-[#25104A]/80 pb-5"}`}
            >
              <h3 className="text-3xl font-black text-[#FFE14D]">
                {posicao === 1 ? "🥇" : posicao === 2 ? "🥈" : "🥉"} {posicao}º
              </h3>
              <ul className="max-h-48 overflow-auto space-y-2 mt-3">
                {alunos.map((a) => (
                  <li key={a.participanteId} className="min-w-0 break-words">
                    <strong className="block">{a.nomeExibicao}</strong>
                    <span className="text-sm text-[#00DDEB]">
                      {Math.floor(a.pontos / 1000)} acertos
                    </span>
                  </li>
                ))}
              </ul>
              {!alunos.length && (
                <p className="text-xs mt-3">Sem participante nesta posição</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm">
        Classificação acumulada. Empatados compartilham a mesma posição.
      </p>
    </section>
  );
}
