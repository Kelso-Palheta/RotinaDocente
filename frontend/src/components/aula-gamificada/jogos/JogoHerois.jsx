'use client';

import React, { useRef, useState } from 'react';
import { RenderTextoSeguro } from '../RenderTextoSeguro';
import { gerarRequestId } from '../api';
import { LETRAS, resolverRequestIdOperacao } from '../constantes';
import ControladorAudioJogo, { usePreferenciaMovimentoReduzido } from './ControladorAudioJogo';

export default function JogoHerois({
  modo = 'aluno',
  questao,
  fase = 'pergunta',
  rodada = 1,
  totalRodadas = 1,
  recibo = null,
  estado = null,
  prazoEncerrado = false,
  ocupado = false,
  bloqueado: bloqueadoExterno = false,
  onResponder,
}) {
  const [selecionada, setSelecionada] = useState(null);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [reduzirAnimacao, setReduzirAnimacao] = usePreferenciaMovimentoReduzido();
  const operacaoRef = useRef(null);

  const estadoHeroi = recibo?.estadoHeroi || null;
  const tentativas = Number(recibo?.tentativas) || 0;
  const maxTentativas = Number(recibo?.maxTentativas) || 2;
  const podeTentarNovamente = recibo?.podeTentarNovamente === true;
  const concluiuRodada =
    estadoHeroi === 'vitoria_fase' ||
    estadoHeroi === 'golpe_encerrado' ||
    (recibo && !podeTentarNovamente && tentativas >= maxTentativas);

  const bloqueado =
    bloqueadoExterno ||
    modo !== 'aluno' ||
    fase !== 'pergunta' ||
    prazoEncerrado ||
    ocupado ||
    concluiuRodada;

  const alternativas = Array.isArray(questao?.alternativas) ? questao.alternativas : [];
  const participantes = Array.isArray(estado?.participantes) ? estado.participantes : [];
  const presentes = participantes.filter((p) => Boolean(p?.entrouEmMs));
  const respondentes = participantes.filter((p) => Boolean(p?.respondeu));
  const revelado = Boolean(estado?.rodada?.revelado || estado?.revelado);
  const gabarito = fase === 'feedback' ? estado?.feedback?.respostaCorreta : null;

  const gifAtual =
    fase === 'encerrada'
      ? '/aula-gamificada/herois/image19.gif'
      : estadoHeroi === 'vitoria_fase'
        ? '/aula-gamificada/herois/image2.gif'
        : estadoHeroi === 'golpe_tente_novamente' || estadoHeroi === 'golpe_encerrado'
          ? '/aula-gamificada/herois/image3.gif'
          : '/aula-gamificada/herois/image1.gif';

  const escolher = (altId) => {
    if (bloqueado) return;
    setSelecionada(altId);
    setErroEnvio(null);
    const assinatura = `${questao?.id || ''}:${rodada}:${tentativas}:${altId}`;
    const reqId = resolverRequestIdOperacao(operacaoRef, assinatura, () =>
      gerarRequestId('herois'),
    );
    try {
      const resultado = onResponder?.({ alternativaId: altId }, reqId);
      if (resultado && typeof resultado.then === 'function') {
        return resultado.catch((err) => {
          setErroEnvio(err?.message || 'Não foi possível enviar sua resposta. Tente novamente.');
        });
      }
    } catch (err) {
      setErroEnvio(err?.message || 'Não foi possível enviar sua resposta. Tente novamente.');
    }
    return undefined;
  };

  return (
    <div
      className="rounded-3xl border-2 border-[#25104A] bg-gradient-to-br from-[#1B103B] via-[#25104A] to-[#3B177A] p-4 sm:p-6 text-white shadow-xl space-y-5"
      data-reduced-motion={reduzirAnimacao ? 'true' : 'false'}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 text-[#25104A] rounded-2xl px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-[#FFE500] px-2.5 py-1 text-xs font-black uppercase">
            Heróis · Fase {rodada}/{totalRodadas || 1}
          </span>
          {modo === 'aluno' && tentativas > 0 && (
            <span className="text-xs font-extrabold text-[#4A3B7C]">
              Tentativa {tentativas} de {maxTentativas}
            </span>
          )}
        </div>
        <ControladorAudioJogo
          src="/aula-gamificada/herois/trilha-herois.mp3"
          rotulo="Trilha sonora do jogo Heróis"
          reduzirAnimacao={reduzirAnimacao}
          onAlternarAnimacao={setReduzirAnimacao}
        />
      </div>

      {/* Palco visual preservado com mídias originais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center rounded-2xl border border-white/15 bg-black/25 p-4">
        <div className="flex justify-center">
          <img
            src={reduzirAnimacao ? '/aula-gamificada/herois/image1.png' : gifAtual}
            alt={
              fase === 'encerrada'
                ? 'Comemore! Vocês conseguiram!'
                : estadoHeroi === 'vitoria_fase'
                  ? 'Parabéns! Você conseguiu!'
                  : estadoHeroi === 'golpe_tente_novamente'
                    ? 'Que golpe! Você errou! Tente novamente'
                    : 'Batalha dos Heróis em andamento'
            }
            className={`max-h-40 rounded-2xl object-contain border-2 border-[#FFE500]/60 bg-black/40 ${
              reduzirAnimacao ? '' : 'transition-transform duration-300'
            }`}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          {fase === 'encerrada' ? (
            <h3 className="font-head text-xl sm:text-3xl font-black leading-snug text-[#FFE500]">
              Comemore! Vocês conseguiram!
            </h3>
          ) : questao?.enunciado ? (
            <h3 className="font-head text-lg sm:text-2xl font-black leading-snug text-[#FFFDF7]">
              <RenderTextoSeguro texto={questao.enunciado} />
            </h3>
          ) : (
            <p className="text-sm font-bold text-[#E7DBFD]">
              Aguardando a próxima fase da missão.
            </p>
          )}

          {modo === 'docente' && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold text-[#E7DBFD]">
              <span>Presentes: {presentes.length}</span>
              <span>Responderam: {respondentes.length}</span>
              {revelado && estado?.distribuicao && (
                <span className="rounded-md bg-[#00DDEB]/20 px-2 py-0.5 text-[#00DDEB]">
                  Resultado coletivo revelado
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback individual imediato para o aluno */}
      {modo === 'aluno' && estadoHeroi && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border-2 px-4 py-3 text-sm font-black ${
            estadoHeroi === 'vitoria_fase'
              ? 'border-[#B9EF00] bg-[#B9EF00]/20 text-[#EFFFBA]'
              : estadoHeroi === 'golpe_tente_novamente'
                ? 'border-[#FFE500] bg-[#FFE500]/20 text-[#FFF7B2]'
                : 'border-[#FF2D93] bg-[#FF2D93]/20 text-[#FFD6EA]'
          }`}
        >
          {estadoHeroi === 'vitoria_fase' &&
            'Parabéns! Você conseguiu! Resposta registrada para a fase.'}
          {estadoHeroi === 'golpe_tente_novamente' &&
            'Que golpe! Você errou! Tente novamente antes que o tempo acabe.'}
          {estadoHeroi === 'golpe_encerrado' &&
            'Que golpe! Suas 2 tentativas nesta fase terminaram. Aguarde a revelação docente.'}
        </div>
      )}

      {erroEnvio && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-[#FF2D93] bg-[#FF2D93]/20 px-4 py-3 text-sm font-black text-[#FFD6EA]"
        >
          {erroEnvio}
        </p>
      )}

      {/* Alternativas acessíveis para celular e telão */}
      {alternativas.length > 0 && (
        <div className="grid grid-cols-1 gap-3" role="group" aria-label="Alternativas da fase">
          {alternativas.map((alt, idx) => {
            const letra = LETRAS[idx] || String(idx + 1);
            const marcada = (recibo?.resposta?.alternativaId || selecionada) === alt.id;
            const correta = gabarito === alt.id;
            const totalAlt =
              revelado && Array.isArray(estado?.distribuicao)
                ? estado.distribuicao.find((d) => d.alternativaId === alt.id)?.total ?? 0
                : null;
            return (
              <button
                key={alt.id}
                type="button"
                disabled={bloqueado}
                onClick={() => escolher(alt.id)}
                className={`min-h-12 w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE500] ${
                  correta
                    ? 'border-[#B9EF00] bg-[#B9EF00]/25 text-white'
                    : marcada
                      ? 'border-[#FFE500] bg-[#6315D9] text-white'
                      : 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                } ${bloqueado ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFE500] text-sm font-black text-[#25104A]">
                    {letra}
                  </span>
                  <span className="text-sm sm:text-base">
                    <RenderTextoSeguro texto={alt.texto} />
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {correta && (
                    <span className="rounded-lg bg-[#B9EF00] px-2 py-0.5 text-xs font-black text-[#25104A]">
                      Correta
                    </span>
                  )}
                  {totalAlt !== null && (
                    <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-black">
                      {totalAlt} votos
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {fase === 'feedback' && estado?.feedback?.explicacao && (
        <div className="rounded-2xl border-2 border-[#00DDEB] bg-[#160932]/90 p-4 space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#00DDEB]">
            Explicação pedagógica
          </h4>
          <p className="text-sm sm:text-base font-medium text-[#FFFDF7]">
            <RenderTextoSeguro texto={estado.feedback.explicacao} />
          </p>
        </div>
      )}
    </div>
  );
}
