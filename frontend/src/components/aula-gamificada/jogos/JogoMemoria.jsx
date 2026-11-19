'use client';

import React, { useRef, useState } from 'react';
import { RenderTextoSeguro } from '../RenderTextoSeguro';
import { gerarRequestId } from '../api';
import { resolverRequestIdOperacao, validarUrlImagemSegura } from '../constantes';
import { useAudiovisualSala } from '../audiovisual/ProvedorAudiovisualSala';

/**
 * Jogo da Memória — tabuleiro individual persistido no servidor.
 * Consome somente faces autorizadas pelo servidor; cartas ocultas exibem apenas o verso.
 * Cada carta virada envia `{ virarId }` com requestId idempotente reaproveitado em retry.
 */
export function JogoMemoria({
  estado,
  questao,
  recibo,
  ocupado,
  bloqueado,
  onEnviar,
}) {
  const [erroCarta, setErroCarta] = useState(null);
  const [virandoId, setVirandoId] = useState(null);
  const audiovisual = useAudiovisualSala();
  const operacaoVirarRef = useRef(null);

  const cartas =
    estado?.tabuleiro?.cartas ||
    recibo?.tabuleiro?.cartas ||
    questao?.cartas ||
    [];

  const totalPares =
    estado?.tabuleiro?.totalPares ??
    recibo?.totalPares ??
    Math.floor(cartas.length / 2);

  const paresEncontrados =
    estado?.tabuleiro?.paresEncontrados ??
    recibo?.paresEncontrados ??
    Math.floor(cartas.filter((c) => c.encontrada).length / 2);

  const concluido =
    Boolean(estado?.tabuleiro?.concluido || recibo?.concluido || recibo?.completo) ||
    (totalPares > 0 && paresEncontrados >= totalPares);

  const virarCarta = async (carta) => {
    audiovisual?.desbloquearPorGesto?.();
    if (bloqueado || ocupado || concluido || carta.encontrada || carta.virada) return;
    const assinatura = JSON.stringify({
      rodada: estado?.rodada ?? 1,
      revision: estado?.revision ?? 0,
      virarId: carta.id,
      encontradas: cartas.filter((c) => c.encontrada).map((c) => c.id),
      visiveis: cartas.filter((c) => c.virada && !c.encontrada).map((c) => c.id),
    });
    const requestId = resolverRequestIdOperacao(operacaoVirarRef, assinatura, () =>
      gerarRequestId(`mem_${carta.id}`)
    );

    setVirandoId(carta.id);
    setErroCarta(null);
    try {
      await onEnviar?.({ virarId: carta.id }, requestId);
      operacaoVirarRef.current = null;
    } catch (err) {
      setErroCarta(err?.message || 'Não foi possível virar a carta. Tente novamente.');
    } finally {
      setVirandoId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F3EDFF] border border-[#E2D9F7] px-4 py-2.5 text-xs font-extrabold text-[#25104A]">
        <span>Pares encontrados: <strong className="text-[#6315D9]">{paresEncontrados} / {totalPares}</strong></span>
        <span className="text-[#5B4B86]">Toque ou use Tab + Enter/Espaço para virar</span>
      </div>

      {erroCarta && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-900">
          {erroCarta}
        </p>
      )}

      <div
        role="group"
        aria-label="Tabuleiro do jogo da memória"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      >
        {cartas.map((carta, idx) => {
          const temFaceAutorizada = Boolean(carta.texto || carta.face || carta.imagem?.url);
          const encontrada = Boolean(carta.encontrada);
          const aberta = Boolean((carta.virada || encontrada) && temFaceAutorizada);
          const carregandoEsta = virandoId === carta.id;

          return (
            <button
              key={carta.id}
              type="button"
              aria-pressed={aberta}
              aria-label={
                encontrada
                  ? `Carta ${idx + 1}: par encontrado — ${carta.texto || carta.imagem?.alt || ''}`
                  : aberta
                  ? `Carta ${idx + 1}: revelada — ${carta.texto || carta.imagem?.alt || ''}`
                  : `Carta ${idx + 1}: virada para baixo, ativar para revelar`
              }
              disabled={bloqueado || ocupado || concluido || aberta}
              onClick={() => virarCarta(carta)}
              className={`min-h-28 rounded-2xl border-2 p-3 text-center flex flex-col items-center justify-center gap-1.5 transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6315D9] ${
                encontrada
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                  : aberta
                  ? 'border-[#6315D9] bg-white text-[#25104A] shadow-md'
                  : 'border-[#25104A] bg-[#25104A] text-[#FFFDF7] hover:bg-[#3A1A73]'
              } disabled:cursor-default`}
            >
              {aberta ? (
                <>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5B4B86]">
                    {encontrada ? 'Par encontrado ✓' : 'Revelada'}
                  </span>
                  {carta.imagem?.url && validarUrlImagemSegura(carta.imagem.url) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={carta.imagem.url}
                      alt={carta.imagem.alt || 'Ilustração da carta'}
                      className="max-h-16 w-auto rounded-lg object-contain"
                    />
                  )}
                  {(carta.texto || carta.face) && (
                    <span className="text-sm font-bold leading-snug">
                      <RenderTextoSeguro texto={carta.texto || carta.face} />
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-2xl font-black text-[#FFE500]" aria-hidden="true">?</span>
                  <span className="text-xs font-extrabold text-[#B9A6EF]">
                    {carregandoEsta ? 'Virando...' : `Carta ${idx + 1}`}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {concluido && (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950">
          Tabuleiro concluído! O servidor consolidou sua pontuação desta rodada.
        </p>
      )}
    </div>
  );
}
