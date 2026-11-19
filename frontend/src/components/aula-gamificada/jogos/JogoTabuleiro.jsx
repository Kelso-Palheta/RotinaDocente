'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RenderTextoSeguro } from '../RenderTextoSeguro';
import { gerarRequestId } from '../api';
import { LETRAS, resolverRequestIdOperacao } from '../constantes';
import ControladorAudioJogo, { usePreferenciaMovimentoReduzido } from './ControladorAudioJogo';
import { useAudiovisualSala } from '../audiovisual/ProvedorAudiovisualSala';

const GIF_CARTA = {
  avance_1: '/aula-gamificada/tabuleiro/carta-avance-1.gif',
  avance_2: '/aula-gamificada/tabuleiro/carta-avance-2.gif',
  passe_a_vez: '/aula-gamificada/tabuleiro/carta-passe-vez.gif',
  erro_nao_ande: '/aula-gamificada/tabuleiro/carta-erro.gif',
};

const COR_EQUIPE = [
  { badge: 'bg-blue-600 text-white', peao: '/aula-gamificada/tabuleiro/peao-azul.png' },
  { badge: 'bg-emerald-600 text-white', peao: '/aula-gamificada/tabuleiro/peao-verde.png' },
  { badge: 'bg-amber-500 text-[#25104A]', peao: '/aula-gamificada/tabuleiro/peao-azul.png' },
  { badge: 'bg-[#6315D9] text-white', peao: '/aula-gamificada/tabuleiro/peao-verde.png' },
];

export default function JogoTabuleiro({
  modo = 'aluno',
  estado = null,
  questao = null,
  fase = 'pergunta',
  recibo = null,
  prazoEncerrado = false,
  ocupado = false,
  bloqueado: bloqueadoExterno = false,
  onResponder,
}) {
  const [selecionada, setSelecionada] = useState(null);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [reduzirLocal, setReduzirLocal] = usePreferenciaMovimentoReduzido();
  const audiovisual = useAudiovisualSala();
  const reduzirAnimacao = audiovisual ? audiovisual.reduzirAnimacao : reduzirLocal;
  const operacaoRef = useRef(null);

  const tab = estado?.tabuleiroEstado || estado?.sala?.tabuleiroEstado || {};
  const totalCasas = Number(tab.totalCasas) || 12;
  const posicoes = tab.posicoesPorEquipe || {};
  const equipes = estado?.sala?.equipes || estado?.equipes || [
    { id: 'eq_azul', nome: 'Equipe Azul', cor: 'azul' },
    { id: 'eq_verde', nome: 'Equipe Verde', cor: 'verde' },
  ];
  const equipeDaVezId = tab.equipeDaVezId || equipes[0]?.id;
  const equipeDaVez = equipes.find((e) => e.id === equipeDaVezId) || equipes[0];
  const equipeAluno = estado?.equipeAluno || null;
  const ehMinhaVez = modo === 'aluno' && equipeAluno && equipeAluno.id === equipeDaVezId;
  const ultimaCarta = tab.ultimaCarta || null;
  const vencedorChegadaId = tab.vencedorChegadaId || null;
  const gabarito = fase === 'feedback' ? estado?.feedback?.respostaCorreta : null;

  const situacaoTabuleiro =
    vencedorChegadaId || fase === 'encerrada'
      ? 'vitoria'
      : ultimaCarta?.tipo === 'avance_1' || ultimaCarta?.tipo === 'avance_2'
        ? 'acerto'
        : ultimaCarta?.tipo === 'erro_nao_ande' || ultimaCarta?.tipo === 'passe_a_vez'
          ? 'erro'
          : null;

  useEffect(() => {
    if (!audiovisual?.ativoNoGerenciador || !situacaoTabuleiro) return;
    const salaCodigo = estado?.sala?.codigo || 'tab';
    const rodadaAtual = estado?.sala?.rodada || 1;
    const evtId = `${salaCodigo}:${rodadaAtual}:${situacaoTabuleiro}:${ultimaCarta?.tipo || ''}:${vencedorChegadaId || ''}`;
    audiovisual.dispararEvento(evtId, situacaoTabuleiro);
  }, [
    audiovisual,
    situacaoTabuleiro,
    estado?.sala?.codigo,
    estado?.sala?.rodada,
    ultimaCarta?.tipo,
    vencedorChegadaId,
  ]);

  const bloqueado =
    bloqueadoExterno ||
    modo !== 'aluno' ||
    !ehMinhaVez ||
    fase !== 'pergunta' ||
    prazoEncerrado ||
    ocupado ||
    Boolean(recibo?.resposta);

  const alternativas = Array.isArray(questao?.alternativas) ? questao.alternativas : [];
  const casas = Array.from({ length: totalCasas + 1 }, (_, i) => i);

  const escolher = (altId) => {
    audiovisual?.desbloquearPorGesto?.();
    if (bloqueado) return;
    setSelecionada(altId);
    setErroEnvio(null);
    const assinatura = `${questao?.id || ''}:${estado?.rodada || 1}:${altId}`;
    const reqId = resolverRequestIdOperacao(operacaoRef, assinatura, () =>
      gerarRequestId('tabuleiro'),
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
      className="rounded-3xl border-2 border-[#25104A] bg-[#1F3A1D] text-white shadow-xl overflow-hidden"
      style={{
        backgroundImage: 'url(/aula-gamificada/tabuleiro/fundo-tabuleiro.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      data-reduced-motion={reduzirAnimacao ? 'true' : 'false'}
    >
      <div className="bg-[#112410]/85 p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 text-[#25104A]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#B9EF00] px-2.5 py-1 text-xs font-black uppercase">
              Tabuleiro · {totalCasas} casas
            </span>
            {equipeDaVez && (
              <span className="text-xs font-black text-[#25104A]">
                Vez de: <strong>{equipeDaVez.nome}</strong>
              </span>
            )}
          </div>
          {!audiovisual?.ativoNoGerenciador && (
            <ControladorAudioJogo
              src="/aula-gamificada/tabuleiro/trilha-tabuleiro.mp3"
              rotulo="Trilha sonora do jogo de Tabuleiro"
              reduzirAnimacao={reduzirLocal}
              onAlternarAnimacao={setReduzirLocal}
            />
          )}
        </div>

        {/* Trilha de blocos Início -> 1..12 -> Chegada */}
        <div className="rounded-2xl border border-white/20 bg-black/45 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {equipes.map((eq, idx) => {
                const estilo = COR_EQUIPE[idx % COR_EQUIPE.length];
                const casaAtual = Number(posicoes[eq.id]) || 0;
                return (
                  <div
                    key={eq.id}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-black ${estilo.badge} ${
                      eq.id === equipeDaVezId ? 'ring-2 ring-[#FFE500]' : 'opacity-90'
                    }`}
                  >
                    <img src={estilo.peao} alt="" className="h-5 w-5 object-contain" />
                    <span>{eq.nome}</span>
                    <span className="rounded bg-black/25 px-1.5 py-0.5">Casa {casaAtual}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-1.5"
            aria-label="Trilha do tabuleiro"
          >
            {casas.map((casa) => {
              const rotulo = casa === 0 ? 'Início' : casa === totalCasas ? 'Chegada' : String(casa);
              const equipesNaCasa = equipes.filter((eq) => (Number(posicoes[eq.id]) || 0) === casa);
              return (
                <div
                  key={casa}
                  className={`relative flex flex-col items-center justify-between rounded-xl border p-1.5 min-h-14 text-center ${
                    casa === totalCasas
                      ? 'border-[#FFE500] bg-[#FFE500]/25'
                      : casa === 0
                        ? 'border-[#00DDEB] bg-[#00DDEB]/20'
                        : 'border-white/25 bg-[#3A6B2C]/70'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-tight">{rotulo}</span>
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {equipesNaCasa.map((eq) => {
                      const idx = equipes.findIndex((x) => x.id === eq.id);
                      const estilo = COR_EQUIPE[idx % COR_EQUIPE.length];
                      return (
                        <img
                          key={eq.id}
                          src={estilo.peao}
                          alt={`Peão ${eq.nome}`}
                          className={`h-6 w-6 object-contain ${
                            reduzirAnimacao ? '' : 'transition-all duration-500'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carta de resultado revelada ou vitória */}
        {(ultimaCarta || vencedorChegadaId || fase === 'encerrada') && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border-2 border-[#FFE500] bg-black/60 p-4"
          >
            <img
              src={
                reduzirAnimacao
                  ? '/aula-gamificada/tabuleiro/capa-personagens.png'
                  : vencedorChegadaId || fase === 'encerrada'
                    ? '/aula-gamificada/tabuleiro/vitoria-parabens.gif'
                    : GIF_CARTA[ultimaCarta?.tipo] || '/aula-gamificada/tabuleiro/capa-personagens.png'
              }
              alt={ultimaCarta?.titulo || 'Parabéns!'}
              className="h-28 sm:h-36 w-40 sm:w-48 rounded-xl object-contain bg-black/40 border border-white/25"
            />
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-black uppercase text-[#FFE500]">
                {vencedorChegadaId
                  ? 'Chegada alcançada!'
                  : fase === 'encerrada'
                    ? 'Fim de jogo!'
                    : `Carta de ${ultimaCarta?.equipeNome || 'rodada'}`}
              </p>
              <p className="font-head text-lg sm:text-xl font-black">
                {vencedorChegadaId
                  ? 'Parabéns! Chegada concluída no tabuleiro!'
                  : fase === 'encerrada'
                    ? 'Parabéns! Trilha concluída!'
                    : ultimaCarta?.titulo}
              </p>
            </div>
          </div>
        )}

        {/* Aviso de turno no celular */}
        {modo === 'aluno' && !ehMinhaVez && fase === 'pergunta' && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border-2 border-[#00DDEB] bg-[#00DDEB]/15 px-4 py-3 text-sm font-black text-[#DDFBFF]"
          >
            Aguarde a vez da equipe {equipeDaVez?.nome || 'adversária'} responder nesta rodada.
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

        {/* Questão e alternativas */}
        {questao?.enunciado && (
          <div className="space-y-3 rounded-2xl border border-white/20 bg-black/50 p-4">
            <h3 className="font-head text-lg sm:text-xl font-black text-white">
              <RenderTextoSeguro texto={questao.enunciado} />
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {alternativas.map((alt, idx) => {
                const letra = LETRAS[idx] || String(idx + 1);
                const marcada = (recibo?.resposta?.alternativaId || selecionada) === alt.id;
                const correta = gabarito === alt.id;
                return (
                  <button
                    key={alt.id}
                    type="button"
                    disabled={bloqueado}
                    onClick={() => escolher(alt.id)}
                    className={`min-h-12 w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE500] ${
                      correta
                        ? 'border-[#B9EF00] bg-[#2D7A22] text-white'
                        : marcada
                          ? 'border-[#FFE500] bg-[#2D7A22] text-white'
                          : 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                    } ${bloqueado ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFE500] text-sm font-black text-[#25104A]">
                        {letra}
                      </span>
                      <span className="text-sm sm:text-base">
                        <RenderTextoSeguro texto={alt.texto} />
                      </span>
                    </span>
                    {correta && (
                      <span className="rounded-lg bg-[#B9EF00] px-2 py-0.5 text-xs font-black text-[#25104A]">
                        Correta
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {fase === 'feedback' && estado?.feedback?.explicacao && (
          <div className="rounded-2xl border-2 border-[#00DDEB] bg-black/70 p-4 space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#00DDEB]">
              Explicação pedagógica
            </h4>
            <p className="text-sm sm:text-base font-medium text-white">
              <RenderTextoSeguro texto={estado.feedback.explicacao} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
