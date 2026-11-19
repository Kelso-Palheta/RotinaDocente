'use client';

import React, { useState } from 'react';
import { useAudiovisualSala } from './ProvedorAudiovisualSala';
import { selecionarCenaSemRepeticao } from './catalogoCenas';

const MOLDURAS_TEMA = {
  herois: 'border-[#FFDF00] bg-gradient-to-br from-[#25104A] via-[#3A1772] to-[#1A0B36] text-white',
  tabuleiro: 'border-[#2E7D32] bg-gradient-to-br from-[#16261E] via-[#1E3A2B] to-[#0F1C15] text-white',
  quiz: 'border-[#6315D9] bg-gradient-to-br from-[#1E1145] via-[#2C1666] to-[#140A30] text-white',
  memoria: 'border-[#0EA5E9] bg-gradient-to-br from-[#0F2942] via-[#163B5E] to-[#0B1C2E] text-white',
  associacao: 'border-[#0D9488] bg-gradient-to-br from-[#132A2E] via-[#1B3D42] to-[#0C1D20] text-white',
  ordenacao: 'border-[#EA580C] bg-gradient-to-br from-[#2A1810] via-[#402315] to-[#1A0F0A] text-white',
  equipes: 'border-[#DB2777] bg-gradient-to-br from-[#271033] via-[#3B174D] to-[#1A0A22] text-white',
};

export default function PalcoCenaJogo({
  cena,
  titulo,
  subtitulo,
  reduzirAnimacao = false,
  tamanho = 'padrao', // 'padrao' | 'destaque' | 'compacto'
  testId,
  className = '',
}) {
  const [erroSrc, setErroSrc] = useState(null);

  if (!cena) return null;

  const src = reduzirAnimacao ? cena.alternativaEstatica : cena.midiaAnimada;
  const erroMidia = erroSrc === src;
  const tema = MOLDURAS_TEMA[cena.jogo] || MOLDURAS_TEMA.quiz;

  const alturaImg =
    tamanho === 'destaque'
      ? 'h-48 sm:h-64 md:h-[320px] lg:h-[400px]'
      : tamanho === 'compacto'
        ? 'h-36 sm:h-44 md:h-52'
        : 'h-44 sm:h-56 md:h-[290px] lg:h-[340px]';

  return (
    <div
      data-testid={testId || `palco-cena-${cena.jogo}`}
      className={`rounded-2xl border-2 p-3 sm:p-4 shadow-md transition-all duration-300 ${tema} ${className}`}
    >
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-black/25 p-2">
        {!erroMidia && src ? (
          <img
            src={src}
            alt={cena.descricao || titulo || 'Cena do jogo'}
            onError={() => setErroSrc(src)}
            className={`w-full ${alturaImg} object-contain mx-auto select-none`}
          />
        ) : (
          <div className={`flex w-full ${alturaImg} items-center justify-center text-center text-sm font-bold text-white/90 px-4`}>
            {cena.descricao || titulo || 'Cena temática em andamento'}
          </div>
        )}
      </div>

      {(titulo || subtitulo) && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          {titulo && <p className="text-sm sm:text-base font-black leading-snug">{titulo}</p>}
          {subtitulo && <p className="text-xs font-semibold text-white/85">{subtitulo}</p>}
        </div>
      )}
    </div>
  );
}

export function PalcoCenaConectado({
  jogo = 'quiz',
  situacao = 'desafio',
  eventoId = 'padrao',
  titulo,
  subtitulo,
  tamanho = 'compacto',
  className = '',
}) {
  const audiovisual = useAudiovisualSala();
  const cena = audiovisual
    ? audiovisual.selecionarCena(jogo, situacao, eventoId)
    : selecionarCenaSemRepeticao({ jogo, situacao, eventoId });

  return (
    <PalcoCenaJogo
      cena={cena}
      titulo={titulo}
      subtitulo={subtitulo}
      reduzirAnimacao={Boolean(audiovisual?.reduzirAnimacao)}
      tamanho={tamanho}
      className={className}
    />
  );
}
