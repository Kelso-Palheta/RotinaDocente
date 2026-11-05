"use client";

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import {
  prepararTextoParaLeitura,
  validarTaxaFala,
  ESTADOS_LEITURA,
} from '@/dominio/adaptacoes/leitorAcessivel';

const observarSuporteVoz = () => () => {};
const lerSuporteVoz = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
const suporteVozServidor = () => false;

export function BotaoLeitorVoz({ texto, rate = 1.0, label = 'Ouvir', className = '' }) {
  const [estado, setEstado] = useState(ESTADOS_LEITURA.IDLE);
  const suportado = useSyncExternalStore(observarSuporteVoz, lerSuporteVoz, suporteVozServidor);

  useEffect(() => {
    // Parar áudio caso o componente desmonte
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!suportado || !texto) return null;

  const handleToggle = () => {
    if (!window.speechSynthesis) return;

    if (estado === ESTADOS_LEITURA.PLAYING) {
      window.speechSynthesis.cancel();
      setEstado(ESTADOS_LEITURA.IDLE);
      return;
    }

    window.speechSynthesis.cancel(); // cancela qualquer fala anterior

    const textoHigienizado = prepararTextoParaLeitura(texto);
    if (!textoHigienizado) return;

    const utterance = new SpeechSynthesisUtterance(textoHigienizado);
    utterance.lang = 'pt-BR';
    utterance.rate = validarTaxaFala(rate);

    utterance.onstart = () => setEstado(ESTADOS_LEITURA.PLAYING);
    utterance.onend = () => setEstado(ESTADOS_LEITURA.IDLE);
    utterance.onerror = () => setEstado(ESTADOS_LEITURA.IDLE);

    window.speechSynthesis.speak(utterance);
  };

  const isPlaying = estado === ESTADOS_LEITURA.PLAYING;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
        isPlaying
          ? 'bg-[#F3EDFF] text-[#5411B8] border border-[#E2D9F7] animate-pulse'
          : 'bg-[#f3edff] text-[#25104a] border border-[#e2d9f7] hover:bg-[#f3edff] hover:border-[#a9c9bc]'
      } ${className}`}
      title={isPlaying ? 'Parar leitura por voz' : 'Ouvir texto em voz alta com sintetizador acessível'}
      aria-label={isPlaying ? 'Parar leitura por voz' : 'Ouvir texto em voz alta'}
    >
      {isPlaying ? (
        <>
          <Square size={13} className="text-[#6315D9] fill-[#6315D9]" />
          <span>Parar</span>
        </>
      ) : (
        <>
          <Volume2 size={13} className="text-[#6315d9]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
