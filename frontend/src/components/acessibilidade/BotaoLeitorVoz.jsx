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
          ? 'bg-[#F3F8F5] text-[#0B5F59] border border-[#D5E3DC] animate-pulse'
          : 'bg-[#f3f7f5] text-[#123c3a] border border-[#d5e3dc] hover:bg-[#f3f7f5] hover:border-[#a9c9bc]'
      } ${className}`}
      title={isPlaying ? 'Parar leitura por voz' : 'Ouvir texto em voz alta com sintetizador acessível'}
      aria-label={isPlaying ? 'Parar leitura por voz' : 'Ouvir texto em voz alta'}
    >
      {isPlaying ? (
        <>
          <Square size={13} className="text-[#0F766E] fill-[#0F766E]" />
          <span>Parar</span>
        </>
      ) : (
        <>
          <Volume2 size={13} className="text-[#0f766e]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
