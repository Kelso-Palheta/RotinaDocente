'use client';

import React, { useState } from 'react';
import { RenderTextoSeguro } from '../RenderTextoSeguro';
import { gerarRequestId } from '../api';
import { useAudiovisualSala } from '../audiovisual/ProvedorAudiovisualSala';

/**
 * Jogo de Associação de Colunas — 100% operável por clique, toque e teclado (sem exigir arraste).
 * Envia `{ pares: [{ esquerdaId, direitaId }] }`.
 */
export function JogoAssociacao({
  questao,
  recibo,
  ocupado,
  bloqueado,
  onEnviar,
}) {
  const esquerda = Array.isArray(questao?.esquerda)
    ? questao.esquerda
    : Array.isArray(questao?.itensEsquerda)
    ? questao.itensEsquerda
    : [];
  const direita = Array.isArray(questao?.direita)
    ? questao.direita
    : Array.isArray(questao?.itensDireita)
    ? questao.itensDireita
    : [];

  const paresConfirmados = Array.isArray(recibo?.resposta?.pares) ? recibo.resposta.pares : null;
  const jaConfirmado = Boolean(recibo && (recibo.status === 'confirmado' || paresConfirmados));

  const [esquerdaAtiva, setEsquerdaAtiva] = useState(null);
  const [associacoes, setAssociacoes] = useState(() => {
    const mapa = {};
    for (const par of paresConfirmados || []) {
      mapa[par.esquerdaId] = par.direitaId;
    }
    return mapa;
  });
  const [anuncio, setAnuncio] = useState('');
  const [requestIdPendente, setRequestIdPendente] = useState(null);
  const [erroEnvio, setErroEnvio] = useState(null);
  const audiovisual = useAudiovisualSala();

  const direitaUsadaPor = (dirId) =>
    Object.entries(associacoes).find(([, dId]) => dId === dirId)?.[0] || null;

  const conectarComDireita = (dirItem) => {
    audiovisual?.desbloquearPorGesto?.();
    if (jaConfirmado || bloqueado || ocupado || !esquerdaAtiva) return;
    const itemEsq = esquerda.find((e) => e.id === esquerdaAtiva);

    setAssociacoes((prev) => {
      const proximo = { ...prev };
      // Se o item da direita já estava associado a outra esquerda, libera a anterior.
      for (const [eId, dId] of Object.entries(proximo)) {
        if (dId === dirItem.id) delete proximo[eId];
      }
      proximo[esquerdaAtiva] = dirItem.id;
      return proximo;
    });
    setAnuncio(`Associado "${itemEsq?.texto || esquerdaAtiva}" com "${dirItem.texto}".`);
    setEsquerdaAtiva(null);
    setRequestIdPendente(null);
    setErroEnvio(null);
  };

  const removerPar = (esqId) => {
    if (jaConfirmado || bloqueado || ocupado) return;
    setAssociacoes((prev) => {
      const proximo = { ...prev };
      delete proximo[esqId];
      return proximo;
    });
    setRequestIdPendente(null);
  };

  const paresProntos = Object.entries(associacoes).map(([esquerdaId, direitaId]) => ({
    esquerdaId,
    direitaId,
  }));
  const todosParesPreenchidos = esquerda.length > 0 && paresProntos.length === esquerda.length;

  const enviar = async () => {
    if (!todosParesPreenchidos || jaConfirmado || bloqueado || ocupado) return;
    const reqId = requestIdPendente || gerarRequestId('assoc');
    setRequestIdPendente(reqId);
    setErroEnvio(null);
    try {
      await onEnviar?.({ pares: paresProntos }, reqId);
    } catch (err) {
      setErroEnvio(err?.message || 'Não foi possível enviar sua associação. Seus pares foram preservados.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#F3EDFF] border border-[#E2D9F7] px-4 py-2.5 text-xs font-bold text-[#25104A]">
        Passo 1: selecione um item da Coluna A. Passo 2: selecione o correspondente na Coluna B.
        <span className="ml-2 font-black text-[#6315D9]">({paresProntos.length}/{esquerda.length} pares)</span>
      </div>

      <div aria-live="polite" className="sr-only">{anuncio}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna A */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#4A3B7C]">Coluna A</h3>
          {esquerda.map((item, idx) => {
            const ativo = esquerdaAtiva === item.id;
            const dirId = associacoes[item.id];
            const dirObj = dirId ? direita.find((d) => d.id === dirId) : null;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  aria-pressed={ativo}
                  disabled={jaConfirmado || bloqueado || ocupado}
                  onClick={() => setEsquerdaAtiva(ativo ? null : item.id)}
                  className={`w-full min-h-12 rounded-xl border-2 px-4 py-3 text-left flex items-center justify-between gap-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6315D9] ${
                    ativo
                      ? 'border-[#6315D9] bg-[#6315D9] text-white shadow-md'
                      : dirObj
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                      : 'border-[#E2D9F7] bg-white text-[#25104A] hover:bg-[#F3EDFF]'
                  }`}
                >
                  <span className="font-bold text-sm">
                    <span className="mr-2 font-black">{idx + 1}.</span>
                    <RenderTextoSeguro texto={item.texto} className={ativo ? 'text-white' : ''} />
                  </span>
                  {dirObj && (
                    <span className="shrink-0 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-black text-emerald-900 border border-emerald-300">
                      → {dirObj.texto}
                    </span>
                  )}
                </button>
                {dirObj && !jaConfirmado && !bloqueado && (
                  <button
                    type="button"
                    onClick={() => removerPar(item.id)}
                    className="text-[11px] font-bold text-[#5B4B86] hover:text-red-700 underline ml-2"
                  >
                    Desfazer par de {item.texto}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Coluna B */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#4A3B7C]">Coluna B</h3>
          {direita.map((item) => {
            const vinculadoEsqId = direitaUsadaPor(item.id);
            const indiceEsq = vinculadoEsqId ? esquerda.findIndex((e) => e.id === vinculadoEsqId) + 1 : null;

            return (
              <button
                key={item.id}
                type="button"
                disabled={jaConfirmado || bloqueado || ocupado || !esquerdaAtiva}
                onClick={() => conectarComDireita(item)}
                className={`w-full min-h-12 rounded-xl border-2 px-4 py-3 text-left flex items-center justify-between gap-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6315D9] ${
                  esquerdaAtiva
                    ? 'border-[#6315D9]/70 bg-[#FFFDF7] text-[#25104A] hover:bg-[#F3EDFF]'
                    : vinculadoEsqId
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                    : 'border-[#E2D9F7] bg-white text-[#25104A]'
                } disabled:opacity-65`}
              >
                <span className="font-bold text-sm">
                  <RenderTextoSeguro texto={item.texto} />
                </span>
                {indiceEsq && (
                  <span className="shrink-0 rounded-md bg-[#E7DBFD] px-2 py-0.5 text-[11px] font-black text-[#25104A]">
                    Par #{indiceEsq}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

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
          Associação confirmada pelo servidor! Aguarde a revelação do gabarito.
        </p>
      ) : (
        <button
          type="button"
          disabled={!todosParesPreenchidos || ocupado || bloqueado}
          onClick={enviar}
          className="w-full min-h-12 rounded-2xl bg-[#6315D9] px-5 py-3 text-base font-black text-white shadow-md transition hover:bg-[#5411B8] disabled:opacity-45"
        >
          {ocupado ? 'Enviando associação...' : 'Enviar associação'}
        </button>
      )}
    </div>
  );
}
