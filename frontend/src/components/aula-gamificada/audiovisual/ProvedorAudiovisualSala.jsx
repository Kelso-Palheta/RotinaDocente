'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MotorAudioJogo, lerPreferenciasAudio } from './motorAudioJogo';
import { selecionarCenaSemRepeticao } from './catalogoCenas';
import { usePreferenciaMovimentoReduzido } from '../jogos/ControladorAudioJogo';

const AudiovisualContext = createContext(null);

export function derivarContextoAudiovisual(estado, segundos, papel = 'aluno') {
  const modalidade = estado?.modalidade || 'quiz';
  const fase = estado?.fase || 'espera';
  const rodada = estado?.rodada || 0;
  const codigo = estado?.codigo || 'sala';
  const recibo = estado?.recibo || null;
  const feedback = estado?.feedback || null;
  const revelado = Boolean(estado?.revelado || estado?.rodada?.revelado);

  let situacao = 'desafio';
  if (fase === 'espera') situacao = 'espera';
  else if (fase === 'encerrada') situacao = 'vitoria';
  else if (fase === 'ranking') situacao = 'ranking';
  else if (fase === 'feedback') {
    if (!revelado) {
      situacao = modalidade === 'acerte_perde' ? 'tempo_esgotado' : 'resposta_recebida';
    } else if (papel === 'aluno') {
      const pontuacaoRecibo = Number(recibo?.pontuacao);
      if (recibo?.estadoHeroi === 'vitoria_fase') {
        situacao = 'acerto';
      } else if (recibo?.estadoHeroi === 'golpe_encerrado') {
        situacao = 'erro';
      } else if (!recibo) {
        situacao = 'sem_resposta';
      } else if (recibo.correta === true) {
        situacao = 'acerto';
      } else if (Number.isFinite(pontuacaoRecibo) && pontuacaoRecibo > 0) {
        situacao = 'parcial';
      } else if (recibo.correta === false) {
        situacao = 'erro';
      } else if (typeof feedback?.correta === 'boolean') {
        situacao = feedback.correta ? 'acerto' : 'erro';
      } else {
        situacao = 'sem_resposta';
      }
    } else {
      situacao = 'revelacao_neutra';
    }
  } else if (modalidade === 'acerte_perde' && !estado?.semCronometro && estado?.prazo != null && segundos <= 0) {
    situacao = 'tempo_esgotado';
  } else if (recibo?.estadoHeroi === 'vitoria_fase') {
    situacao = 'acerto';
  } else if (recibo?.estadoHeroi === 'golpe_tente_novamente') {
    situacao = 'nova_tentativa';
  } else if (recibo?.estadoHeroi === 'golpe_encerrado') {
    situacao = 'erro';
  } else if (recibo?.status === 'confirmado') {
    situacao = 'resposta_recebida';
  } else if (segundos > 0 && segundos <= 5) {
    situacao = 'ultimos_segundos';
  }

  const somSituacao = situacao === 'desafio' && rodada > 0 ? 'abertura' : situacao;
  const deveTocarSom = somSituacao !== 'espera';
  const evento = deveTocarSom
    ? { id: `${codigo}:${rodada}:${somSituacao}:${recibo?.tentativas || 0}:${somSituacao === 'tempo_esgotado' ? 'fechamento' : fase}`, situacao: somSituacao }
    : null;

  return { modalidade, fase, situacao, eventoId: `${codigo}:${rodada}:${situacao}:${recibo?.tentativas || 0}`, evento };
}

export function useAudiovisualSala() {
  return useContext(AudiovisualContext);
}

export function ProvedorAudiovisualSala({
  modalidade = 'quiz',
  fase = 'espera',
  evento = null,
  children,
}) {
  const motorRef = useRef(null);
  const [estadoAudio, setEstadoAudio] = useState(() => ({
    ...(lerPreferenciasAudio() || {
      somAtivo: true,
      musicaAtiva: true,
      efeitosAtivos: true,
      volume: 0.45,
    }),
    bloqueadoAutoplay: false,
    oculto: false,
  }));
  const [reduzirAnimacao, setReduzirAnimacao] = usePreferenciaMovimentoReduzido();
  const eventosDisparadosRef = useRef(new Set());
  const historicoCenasRef = useRef(new Map());

  useEffect(() => {
    if (!motorRef.current) {
      motorRef.current = new MotorAudioJogo();
    }
    const motor = motorRef.current;
    setEstadoAudio(motor.obterEstado());
    const cancelar = motor.assinar(setEstadoAudio);

    const aoVisibilidade = () => {
      motor.definirOculto(Boolean(document?.hidden));
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', aoVisibilidade);
    }

    return () => {
      cancelar();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', aoVisibilidade);
      }
      motor.destroy();
      motorRef.current = null;
    };
  }, []);

  useEffect(() => {
    motorRef.current?.sincronizarTrilha({ modalidade, fase });
  }, [modalidade, fase]);

  const dispararEvento = useCallback((eventoId, situacao) => {
    if (!eventoId || !situacao) return;
    if (eventosDisparadosRef.current.has(eventoId)) return;
    eventosDisparadosRef.current.add(eventoId);
    if (eventosDisparadosRef.current.size > 300) {
      const primeiro = eventosDisparadosRef.current.values().next().value;
      eventosDisparadosRef.current.delete(primeiro);
    }
    // Efeitos de filhos rodam antes do efeito do provedor na montagem: cria o motor sob demanda (um só por aparelho).
    if (!motorRef.current) motorRef.current = new MotorAudioJogo();
    motorRef.current.tocarEfeito(situacao);
  }, []);

  useEffect(() => {
    if (evento?.id && evento?.situacao) {
      dispararEvento(evento.id, evento.situacao);
    }
  }, [evento?.id, evento?.situacao, dispararEvento]);

  /** Efeito sem deduplicação por id (salto, queda); quem chama controla a frequência. */
  const tocarEfeitoLivre = useCallback((situacao) => {
    if (!situacao) return;
    if (!motorRef.current) motorRef.current = new MotorAudioJogo();
    motorRef.current.tocarEfeito(situacao);
  }, []);

  const selecionarCena = useCallback(
    (jogo, situacao, eventoId) =>
      selecionarCenaSemRepeticao({
        jogo: jogo || modalidade,
        situacao,
        eventoId: String(eventoId || `${modalidade}:${fase}`),
        historicoPorChave: historicoCenasRef.current,
      }),
    [modalidade, fase],
  );

  const desbloquearPorGesto = useCallback(
    () => motorRef.current?.desbloquearPorGesto({ modalidade, fase }),
    [modalidade, fase],
  );

  const valor = useMemo(
    () => ({
      ativoNoGerenciador: true,
      modalidade,
      fase,
      estadoAudio,
      reduzirAnimacao,
      setReduzirAnimacao,
      definirSomAtivo: (v) => motorRef.current?.definirSomAtivo(v),
      definirMusicaAtiva: (v) => motorRef.current?.definirMusicaAtiva(v),
      definirEfeitosAtivos: (v) => motorRef.current?.definirEfeitosAtivos(v),
      definirVolume: (v) => motorRef.current?.definirVolume(v),
      desbloquearPorGesto,
      dispararEvento,
      tocarEfeitoLivre,
      selecionarCena,
    }),
    [
      modalidade,
      fase,
      estadoAudio,
      reduzirAnimacao,
      setReduzirAnimacao,
      desbloquearPorGesto,
      dispararEvento,
      tocarEfeitoLivre,
      selecionarCena,
    ],
  );

  return <AudiovisualContext.Provider value={valor}>{children}</AudiovisualContext.Provider>;
}

export function BarraControleAudiovisual({ compacto = false }) {
  const ctx = useAudiovisualSala();
  if (!ctx) return null;

  const {
    estadoAudio,
    reduzirAnimacao,
    setReduzirAnimacao,
    definirSomAtivo,
    definirMusicaAtiva,
    definirEfeitosAtivos,
    definirVolume,
    desbloquearPorGesto,
  } = ctx;

  return (
    <div
      data-testid="barra-controle-audiovisual"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2D9F7] bg-white/95 px-3 py-2 text-xs text-[#25104A] shadow-sm"
    >
      {estadoAudio.bloqueadoAutoplay && estadoAudio.somAtivo && (
        <button
          type="button"
          onClick={() => desbloquearPorGesto()}
          className="min-h-10 rounded-xl border-2 border-[#FFDF00] bg-[#FFDF00] px-3 py-1.5 font-black text-[#25104A] shadow-sm hover:brightness-95"
        >
          🔊 Toque para ativar o som
        </button>
      )}

      <button
        type="button"
        aria-label="Som geral"
        aria-pressed={estadoAudio.somAtivo}
        onClick={() => definirSomAtivo(!estadoAudio.somAtivo)}
        className={`min-h-10 rounded-xl border px-3 py-1.5 font-extrabold transition ${
          estadoAudio.somAtivo
            ? 'border-[#00DDEB] bg-[#00DDEB]/20 text-[#25104A]'
            : 'border-[#E2D9F7] bg-white text-[#4A3B7C]'
        }`}
      >
        {estadoAudio.somAtivo ? '🔊 Som: Ligado' : '🔇 Som: Desligado'}
      </button>

      {!compacto && (
        <>
          <button
            type="button"
            aria-label="Música"
            aria-pressed={estadoAudio.musicaAtiva}
            onClick={() => definirMusicaAtiva(!estadoAudio.musicaAtiva)}
            className={`min-h-10 rounded-xl border px-2.5 py-1.5 font-bold transition ${
              estadoAudio.musicaAtiva
                ? 'border-[#6315D9]/30 bg-[#F3EDFF] text-[#25104A]'
                : 'border-[#E2D9F7] bg-white text-[#7C6EA3]'
            }`}
          >
            🎵 Música
          </button>

          <button
            type="button"
            aria-label="Efeitos sonoros"
            aria-pressed={estadoAudio.efeitosAtivos}
            onClick={() => definirEfeitosAtivos(!estadoAudio.efeitosAtivos)}
            className={`min-h-10 rounded-xl border px-2.5 py-1.5 font-bold transition ${
              estadoAudio.efeitosAtivos
                ? 'border-[#6315D9]/30 bg-[#F3EDFF] text-[#25104A]'
                : 'border-[#E2D9F7] bg-white text-[#7C6EA3]'
            }`}
          >
            ✨ Efeitos
          </button>

          <label className="flex items-center gap-1.5 font-bold text-[#4A3B7C]">
            <span>Vol</span>
            <input
              type="range"
              aria-label="Volume do áudio"
              min={0}
              max={1}
              step={0.05}
              value={estadoAudio.volume}
              onChange={(e) => definirVolume(Number(e.target.value))}
              className="w-20 accent-[#6315D9]"
            />
          </label>
        </>
      )}

      <button
        type="button"
        aria-label="Alternar animações"
        aria-pressed={Boolean(reduzirAnimacao)}
        onClick={() => setReduzirAnimacao((v) => !v)}
        className={`min-h-10 rounded-xl border px-2.5 py-1.5 font-bold transition ${
          reduzirAnimacao
            ? 'border-[#6315D9] bg-[#E7DBFD] text-[#25104A]'
            : 'border-[#E2D9F7] bg-white text-[#4A3B7C]'
        }`}
      >
        {reduzirAnimacao ? 'Animações: Reduzidas' : 'Animações: Padrão'}
      </button>
    </div>
  );
}
