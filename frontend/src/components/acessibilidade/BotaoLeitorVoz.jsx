"use client";

import React, { useState, useEffect } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import {
  prepararTextoParaLeitura,
  validarTaxaFala,
  ESTADOS_LEITURA,
} from '@/dominio/adaptacoes/leitorAcessivel';

export function BotaoLeitorVoz({ texto, rate = 1.0, label = 'Ouvir', className = '' }) {
  const [estado, setEstado] = useState(ESTADOS_LEITURA.IDLE);
  const [suportado, setSuportado] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSuportado(true);
    }
  }, []);

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
          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
          : 'bg-[#f7f8fc] text-[#101942] border border-[#dce0f0] hover:bg-[#eef0f8] hover:border-[#b0b8d8]'
      } ${className}`}
      title={isPlaying ? 'Parar leitura por voz' : 'Ouvir texto em voz alta com sintetizador acessível'}
      aria-label={isPlaying ? 'Parar leitura por voz' : 'Ouvir texto em voz alta'}
    >
      {isPlaying ? (
        <>
          <Square size={13} className="text-rose-600 fill-rose-600" />
          <span>Parar</span>
        </>
      ) : (
        <>
          <Volume2 size={13} className="text-[#f60c49]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
