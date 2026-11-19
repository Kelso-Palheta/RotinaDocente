'use client';

import React, { useState } from 'react';
import { RenderTextoSeguro } from '../RenderTextoSeguro';
import { gerarRequestId } from '../api';
import { useAudiovisualSala } from '../audiovisual/ProvedorAudiovisualSala';

/**
 * Jogo de Ordenação — controles acessíveis Subir/Descer (sem exigir arraste).
 * Envia `{ ordem: [ids] }`.
 */
export function JogoOrdenacao({
  questao,
  recibo,
  ocupado,
  bloqueado,
  onEnviar,
}) {
  const itensServidor = Array.isArray(questao?.itens) ? questao.itens : [];
  const ordemConfirmada = Array.isArray(recibo?.resposta?.ordem) ? recibo.resposta.ordem : null;
  const jaConfirmado = Boolean(recibo && (recibo.status === 'confirmado' || ordemConfirmada));

  const [ordem, setOrdem] = useState(() =>
    ordemConfirmada ? ordemConfirmada : itensServidor.map((it) => it.id)
  );
  const [anuncio, setAnuncio] = useState('');
  const [requestIdPendente, setRequestIdPendente] = useState(null);
  const [erroEnvio, setErroEnvio] = useState(null);
  const audiovisual = useAudiovisualSala();

  const listaAtual = (jaConfirmado && ordemConfirmada ? ordemConfirmada : ordem)
    .map((id) => itensServidor.find((it) => it.id === id))
    .filter(Boolean);

  const mover = (indice, direcao) => {
    audiovisual?.desbloquearPorGesto?.();
    if (jaConfirmado || bloqueado || ocupado) return;
    const destino = indice + direcao;
    if (destino < 0 || destino >= listaAtual.length) return;

    const nova = listaAtual.map((it) => it.id);
    const movido = listaAtual[indice];
    [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
    setOrdem(nova);
    setRequestIdPendente(null);
    setErroEnvio(null);
    setAnuncio(`"${movido.texto}" movido para a ${destino + 1}ª posição.`);
  };

  const enviar = async () => {
    if (listaAtual.length === 0 || jaConfirmado || bloqueado || ocupado) return;
    const reqId = requestIdPendente || gerarRequestId('ord');
    setRequestIdPendente(reqId);
    setErroEnvio(null);
    try {
      await onEnviar?.({ ordem: listaAtual.map((it) => it.id) }, reqId);
    } catch (err) {
      setErroEnvio(err?.message || 'Não foi possível enviar sua ordenação. A ordem escolhida foi mantida.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#F3EDFF] border border-[#E2D9F7] px-4 py-2.5 text-xs font-bold text-[#25104A]">
        Use os botões <strong>Subir</strong> e <strong>Descer</strong> para organizar os itens da 1ª até a última posição.
      </div>

      <div aria-live="polite" className="sr-only">{anuncio}</div>

      <ol className="space-y-2.5">
        {listaAtual.map((item, idx) => (
          <li
            key={item.id}
            className="rounded-2xl border-2 border-[#E2D9F7] bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE500] text-sm font-black text-[#25104A]">
                {idx + 1}º
              </span>
              <span className="text-sm sm:text-base font-bold text-[#25104A] min-w-0 break-words">
                <RenderTextoSeguro texto={item.texto} />
              </span>
            </div>

            {!jaConfirmado && (
              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0 || bloqueado || ocupado}
                  onClick={() => mover(idx, -1)}
                  aria-label={`Subir ${item.texto}`}
                  className="min-h-11 min-w-11 rounded-xl border-2 border-[#E2D9F7] bg-[#F3EDFF] px-3 text-xs font-black text-[#25104A] hover:border-[#6315D9] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#6315D9]"
                >
                  ↑ Subir
                </button>
                <button
                  type="button"
                  disabled={idx === listaAtual.length - 1 || bloqueado || ocupado}
                  onClick={() => mover(idx, 1)}
                  aria-label={`Descer ${item.texto}`}
                  className="min-h-11 min-w-11 rounded-xl border-2 border-[#E2D9F7] bg-[#F3EDFF] px-3 text-xs font-black text-[#25104A] hover:border-[#6315D9] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#6315D9]"
                >
                  ↓ Descer
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>

      {erroEnvio && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-red-900">
          <span>{erroEnvio}</span>
          <button
            type="button"
            disabled={ocupado || bloqueado}
            onClick={enviar}
            className="min-h-9 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-extrabold text-white"
          >
            Tentar enviar novamente
          </button>
        </div>
      )}

      {jaConfirmado ? (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950">
          Ordenação confirmada pelo servidor! Aguarde a revelação da sequência correta.
        </p>
      ) : (
        <button
          type="button"
          disabled={listaAtual.length === 0 || ocupado || bloqueado}
          onClick={enviar}
          className="w-full min-h-12 rounded-2xl bg-[#6315D9] px-5 py-3 text-base font-black text-white shadow-md transition hover:bg-[#5411B8] disabled:opacity-45"
        >
          {ocupado ? 'Enviando ordenação...' : 'Enviar ordenação'}
        </button>
      )}
    </div>
  );
}
