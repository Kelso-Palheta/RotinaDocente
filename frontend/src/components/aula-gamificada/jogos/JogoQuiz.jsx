'use client';

import React, { useState } from 'react';
import { RenderTextoSeguro } from '../RenderTextoSeguro';
import { gerarRequestId } from '../api';
import { LETRAS } from '../constantes';

/**
 * Jogo de Múltipla Escolha — usado pelas modalidades `quiz` e `equipes`.
 */
export function JogoQuiz({
  questao,
  recibo,
  ocupado,
  bloqueado,
  equipeAluno = null,
  onEnviar,
}) {
  const alternativaConfirmada = recibo?.resposta?.alternativaId || recibo?.alternativaId || null;
  const jaConfirmado = Boolean(
    recibo && (recibo.status === 'confirmado' || recibo.status === 'recebido' || alternativaConfirmada)
  );

  const [selecionada, setSelecionada] = useState(alternativaConfirmada);
  const [requestIdPendente, setRequestIdPendente] = useState(null);
  const [erroEnvio, setErroEnvio] = useState(null);

  const alternativas = Array.isArray(questao?.alternativas) ? questao.alternativas : [];
  const ativa = jaConfirmado ? alternativaConfirmada : selecionada;

  const escolher = (altId) => {
    if (jaConfirmado || bloqueado || ocupado) return;
    setSelecionada(altId);
    setRequestIdPendente(null);
    setErroEnvio(null);
  };

  const enviar = async () => {
    if (!ativa || jaConfirmado || bloqueado || ocupado) return;
    const reqId = requestIdPendente || gerarRequestId('quiz');
    setRequestIdPendente(reqId);
    setErroEnvio(null);
    try {
      await onEnviar?.({ alternativaId: ativa }, reqId);
    } catch (err) {
      setErroEnvio(err?.message || 'Não foi possível enviar sua resposta. Sua escolha foi mantida.');
    }
  };

  return (
    <div className="space-y-4">
      {equipeAluno && (
        <div className="rounded-xl border border-[#6315D9]/30 bg-[#F3EDFF] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[#25104A]">
          <span>Sua equipe: <strong className="text-[#6315D9]">{equipeAluno.nome}</strong></span>
          <span className="text-[#5B4B86]">Sua resposta soma na pontuação coletiva da equipe</span>
        </div>
      )}

      <div role="group" aria-label="Alternativas da questão" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {alternativas.map((alt, idx) => {
          const marcada = ativa === alt.id;
          return (
            <button
              key={alt.id}
              type="button"
              aria-pressed={marcada}
              disabled={jaConfirmado || bloqueado || ocupado}
              onClick={() => escolher(alt.id)}
              className={`min-h-14 rounded-2xl border-2 p-4 text-left flex items-start gap-3 transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6315D9] ${
                marcada
                  ? 'border-[#6315D9] bg-[#6315D9] text-white shadow-md'
                  : 'border-[#E2D9F7] bg-white text-[#25104A] hover:border-[#6315D9]/60 hover:bg-[#F3EDFF]'
              } disabled:opacity-75`}
            >
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                  marcada ? 'bg-[#FFE500] text-[#25104A]' : 'bg-[#E7DBFD] text-[#25104A]'
                }`}
              >
                {LETRAS[idx] || idx + 1}
              </span>
              <span className="text-sm sm:text-base font-bold leading-snug pt-0.5">
                <RenderTextoSeguro texto={alt.texto} className={marcada ? 'text-white' : ''} />
              </span>
            </button>
          );
        })}
      </div>

      {erroEnvio && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-red-900">
          <span>{erroEnvio}</span>
          <button
            type="button"
            disabled={ocupado || bloqueado}
            onClick={enviar}
            className="min-h-9 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-red-900"
          >
            Tentar enviar novamente
          </button>
        </div>
      )}

      {jaConfirmado ? (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950">
          Resposta confirmada pelo servidor! Aguarde o encerramento da rodada.
        </p>
      ) : (
        <button
          type="button"
          disabled={!ativa || ocupado || bloqueado}
          onClick={enviar}
          className="w-full min-h-12 rounded-2xl bg-[#6315D9] px-5 py-3 text-base font-black text-white shadow-md transition hover:bg-[#5411B8] disabled:opacity-45"
        >
          {ocupado ? 'Enviando resposta...' : 'Enviar resposta'}
        </button>
      )}
    </div>
  );
}
