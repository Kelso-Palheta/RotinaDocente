"use client";

import React from "react";

/**
 * BlocoAulaTematica — Renderiza um bloco didático da aula introdutória v2.
 * Suporta blocos de texto conceitual e leitura guiada de imagens com acessibilidade.
 *
 * Contrato: BlocoAulaTematica({ bloco, imagens, aula, tema })
 */
export function BlocoAulaTematica({
  bloco,
  imagens = [],
  aula = {},
  tema = "",
}) {
  if (!bloco) return null;

  const tituloConteudo = aula.tituloConteudo || tema || "";
  const indice = aula.indiceBloco !== undefined ? aula.indiceBloco + 1 : null;
  const total = aula.totalBlocos || null;

  // Resolução da imagem se for bloco de imagem
  let dadosImagem = null;
  if (bloco.tipo === "imagem") {
    const listaImagens = [...(imagens || []), ...(bloco.imagens || [])];
    dadosImagem = listaImagens.find((img) => img.id === bloco.imagemId) || null;
  }

  return (
    <article
      data-testid="bloco-aula-tematica"
      className="bg-[#6334E3]/25 border-2 border-[#6334E3]/70 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl backdrop-blur-md space-y-5 text-[#FFFDF7]"
    >
      {/* Topo do Bloco: Identificação da Aula e Progresso */}
      <header className="border-b border-[#6334E3]/40 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          {tituloConteudo && (
            <span className="text-xs uppercase tracking-widest font-black text-[#00DDEB] block">
              {tituloConteudo}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#FFFDF7] tracking-tight">
            {bloco.titulo}
          </h2>
        </div>

        {indice !== null && total !== null && (
          <span
            data-testid="indicador-bloco-progresso"
            className="text-xs font-black uppercase tracking-wider bg-[#FFE14D]/20 text-[#FFE14D] border border-[#FFE14D]/40 px-3 py-1 rounded-full shrink-0 shadow-sm"
          >
            Bloco {indice} de {total}
          </span>
        )}
      </header>

      {/* Conteúdo Principal do Bloco */}
      <div className="space-y-5">
        {/* Renderização de Imagem Contextual */}
        {bloco.tipo === "imagem" && (
          <figure className="space-y-2.5 max-w-2xl mx-auto my-3 text-center">
            {dadosImagem?.url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={dadosImagem.url}
                alt={
                  dadosImagem.alt || bloco.titulo || "Imagem didática da aula"
                }
                className="rounded-2xl border-2 border-[#6334E3]/60 max-h-[460px] w-auto mx-auto object-contain shadow-2xl bg-[#25104A]"
                loading="lazy"
              />
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-[#6334E3]/60 bg-[#25104A]/60 text-sm text-[#FFFDF7]/70 italic">
                Imagem contextual associada ao bloco
              </div>
            )}

            {(dadosImagem?.legenda || dadosImagem?.alt) && (
              <figcaption className="text-xs text-[#FFFDF7]/80 leading-relaxed max-w-xl mx-auto">
                <span className="font-bold text-[#00DDEB]">Figura: </span>
                <span>{dadosImagem.legenda || dadosImagem.alt}</span>
                {dadosImagem.licenca && (
                  <span className="block text-[11px] text-[#FFFDF7]/60 mt-0.5">
                    Fonte / Licença: {dadosImagem.licenca}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        )}

        {/* Texto do Bloco (seja puro texto ou explicação que acompanha a imagem) */}
        {bloco.texto && (
          <div className="text-sm sm:text-base md:text-lg leading-relaxed text-[#FFFDF7]/95 font-medium space-y-3 whitespace-pre-line">
            <p>{bloco.texto}</p>
          </div>
        )}
      </div>
    </article>
  );
}

export default BlocoAulaTematica;
