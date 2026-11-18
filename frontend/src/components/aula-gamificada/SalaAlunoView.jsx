'use client';

import React from 'react';
import { RenderTextoSeguro } from './RenderTextoSeguro';
import { useCronometroServidor } from './useSalaGamificada';
import {
  FASES_ROTULO,
  classeDificuldade,
  formatarCronometro,
  normalizarEstadoSala,
  normalizarRankingComEmpates,
  obterModalidadeInfo,
  rotuloDificuldade,
  validarUrlImagemSegura,
} from './constantes';
import { JogoQuiz } from './jogos/JogoQuiz';
import { JogoMemoria } from './jogos/JogoMemoria';
import { JogoAssociacao } from './jogos/JogoAssociacao';
import { JogoOrdenacao } from './jogos/JogoOrdenacao';

function StatusConexao({ conexao }) {
  const mapa = {
    conectado: { texto: 'Conectado', classe: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    conectando: { texto: 'Conectando...', classe: 'bg-amber-100 text-amber-900 border-amber-300' },
    reconectando: { texto: 'Reconectando...', classe: 'bg-amber-100 text-amber-900 border-amber-300' },
    desconectado: { texto: 'Desconectado', classe: 'bg-red-100 text-red-900 border-red-300' },
  };
  const info = mapa[conexao] || mapa.desconectado;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${info.classe}`}>
      {info.texto}
    </span>
  );
}

export function SalaAlunoView({
  estado: estadoBruto,
  conexao = 'conectado',
  ocupado = false,
  erro = null,
  onResponder,
  onReconectar,
}) {
  const estado = normalizarEstadoSala(estadoBruto) || {};
  const segundos = useCronometroServidor(estado);
  const modalidadeInfo = obterModalidadeInfo(estado?.modalidade);
  const fase = estado?.fase || 'espera';
  const questao = estado?.questao || null;
  const recibo = estado?.recibo || null;
  const feedback = estado?.feedback || null;
  const rankingIndividual = normalizarRankingComEmpates(estado?.ranking || []);
  const rankingEquipes = normalizarRankingComEmpates(estado?.rankingEquipes || []);
  const prazoEncerrado = Boolean(estado?.rodadaEncerrada) || (estado?.prazo != null && segundos <= 0);
  const bloqueado = ocupado || conexao !== 'conectado' || prazoEncerrado;

  const chaveRodada = `${estado?.codigo || ''}:${estado?.rodada || 0}:${questao?.id || ''}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      {/* Cabeçalho da sala */}
      <header className="arte-banner-festival rounded-3xl p-5 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="arte-selo">{modalidadeInfo.nome}</span>
            <StatusConexao conexao={conexao} />
          </div>
          <span className="font-mono text-sm font-black bg-white/15 border border-white/25 rounded-xl px-3 py-1">
            Sala {estado?.codigo}
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-head text-2xl sm:text-3xl font-black text-white">
              {estado?.titulo || 'Aula Gamificada'}
            </h1>
            <p className="text-xs text-[#E7DBFD] mt-1">
              {FASES_ROTULO[fase] || fase}
              {estado?.rodada > 0 && (
                <> · Rodada {estado.rodada}{estado?.totalRodadas ? ` de ${estado.totalRodadas}` : ''}</>
              )}
            </p>
          </div>

          {fase === 'pergunta' && (
            <div
              aria-live="off"
              className="rounded-2xl bg-[#25104A] border-2 border-[#00DDEB] px-4 py-2 text-center"
            >
              <span className="block text-[10px] font-black uppercase tracking-widest text-[#00DDEB]">
                Tempo restante
              </span>
              <span className="font-mono text-2xl font-black text-[#FFE500]">
                {formatarCronometro(segundos)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Regra de pontuação documentada para o aluno */}
      <div className="rounded-2xl border border-[#E2D9F7] bg-[#F3EDFF] px-4 py-3 text-xs text-[#25104A] flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="font-extrabold">Pontuação: </strong>
          {modalidadeInfo.regraPontuacao}
        </span>
        <span className="font-bold text-[#5B4B86]">Esta atividade não altera suas notas.</span>
      </div>

      {erro && (
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-red-900">
          <span>{erro}</span>
          {onReconectar && (
            <button
              type="button"
              onClick={onReconectar}
              className="min-h-10 rounded-xl bg-red-800 px-3.5 py-1.5 text-xs font-extrabold text-white"
            >
              Reconectar
            </button>
          )}
        </div>
      )}

      {/* FASE: ESPERA */}
      {fase === 'espera' && (
        <section className="rounded-3xl border-2 border-[#E2D9F7] bg-white p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EDFF] text-3xl">
            ⏳
          </span>
          <h2 className="font-head text-xl font-black text-[#25104A]">
            Você entrou na sala!
          </h2>
          <p className="text-sm text-[#5B4B86] max-w-md mx-auto">
            Aguardando o professor iniciar a primeira rodada. Mantenha esta tela aberta — se precisar recarregar, sua participação será retomada automaticamente.
          </p>
          {estado?.equipeAluno && (
            <p className="inline-block rounded-xl bg-[#FFE500] px-4 py-2 text-xs font-black text-[#25104A]">
              Sua equipe: {estado.equipeAluno.nome}
            </p>
          )}
        </section>
      )}

      {/* FASE: PERGUNTA (5 modalidades) */}
      {fase === 'pergunta' && questao && (
        <section className="rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {questao.disciplina && (
              <span className="rounded-lg bg-[#F3EDFF] border border-[#E2D9F7] px-2.5 py-0.5 text-xs font-extrabold text-[#25104A]">
                {questao.disciplina}
              </span>
            )}
            {questao.dificuldade && (
              <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${classeDificuldade(questao.dificuldade)}`}>
                {rotuloDificuldade(questao.dificuldade)}
              </span>
            )}
            {prazoEncerrado && (
              <span className="rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-extrabold text-amber-900">
                Prazo encerrado
              </span>
            )}
          </div>

          <h2 className="font-head text-lg sm:text-xl font-black text-[#25104A] leading-snug">
            <RenderTextoSeguro texto={questao.enunciado} />
          </h2>

          {questao.imagem?.url && validarUrlImagemSegura(questao.imagem.url) && (
            <figure className="rounded-2xl border border-[#E2D9F7] bg-[#FFFDF7] p-3 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={questao.imagem.url}
                alt={questao.imagem.alt || 'Imagem da questão'}
                className="max-h-64 w-auto rounded-xl object-contain"
              />
              {questao.imagem.alt && (
                <figcaption className="mt-2 text-xs text-[#5B4B86] text-center">
                  {questao.imagem.alt}
                </figcaption>
              )}
            </figure>
          )}

          {(estado.modalidade === 'quiz' || estado.modalidade === 'equipes') && (
            <JogoQuiz
              key={chaveRodada}
              questao={questao}
              recibo={recibo}
              ocupado={ocupado}
              bloqueado={bloqueado}
              equipeAluno={estado.modalidade === 'equipes' ? estado.equipeAluno : null}
              onEnviar={onResponder}
            />
          )}

          {estado.modalidade === 'memoria' && (
            <JogoMemoria
              key={chaveRodada}
              estado={estado}
              questao={questao}
              recibo={recibo}
              ocupado={ocupado}
              bloqueado={bloqueado}
              onEnviar={onResponder}
            />
          )}

          {estado.modalidade === 'associacao' && (
            <JogoAssociacao
              key={chaveRodada}
              questao={questao}
              recibo={recibo}
              ocupado={ocupado}
              bloqueado={bloqueado}
              onEnviar={onResponder}
            />
          )}

          {estado.modalidade === 'ordenacao' && (
            <JogoOrdenacao
              key={chaveRodada}
              questao={questao}
              recibo={recibo}
              ocupado={ocupado}
              bloqueado={bloqueado}
              onEnviar={onResponder}
            />
          )}
        </section>
      )}

      {/* FASE: FEEDBACK */}
      {fase === 'feedback' && (
        <section className="rounded-3xl border-2 border-[#6315D9] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-lg bg-[#FFE500] px-3 py-1 text-xs font-black uppercase text-[#25104A]">
              Feedback da rodada {estado?.rodada}
            </span>
            {recibo?.pontuacao != null && (
              <span className="rounded-xl bg-[#6315D9] px-3.5 py-1.5 font-mono text-sm font-black text-white">
                +{recibo.pontuacao} pts
              </span>
            )}
          </div>

          {recibo && (
            <div
              role="status"
              className={`rounded-2xl border p-4 text-sm font-extrabold ${
                recibo.correta || (recibo.pontuacao ?? 0) > 0
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-amber-300 bg-amber-50 text-amber-950'
              }`}
            >
              {recibo.correta
                ? 'Excelente! Você acertou esta rodada.'
                : recibo.pontuacao > 0
                ? `Pontuação parcial confirmada pelo servidor: ${recibo.pontuacao} pontos.`
                : 'Resposta registrada. Confira a explicação pedagógica abaixo.'}
            </div>
          )}

          {feedback?.explicacao && (
            <div className="rounded-2xl border border-[#E2D9F7] bg-[#F3EDFF] p-4 space-y-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#4A3B7C]">
                Explicação pedagógica
              </h2>
              <p className="text-sm sm:text-base text-[#25104A] leading-relaxed">
                <RenderTextoSeguro texto={feedback.explicacao} />
              </p>
            </div>
          )}

          {feedback?.justificativaDificuldade && (
            <p className="text-xs text-[#5B4B86]">
              <strong>Sobre o nível da questão: </strong>
              <RenderTextoSeguro texto={feedback.justificativaDificuldade} />
            </p>
          )}
        </section>
      )}

      {/* FASE: RANKING OU ENCERRADA */}
      {(fase === 'ranking' || fase === 'encerrada') && (
        <section className="rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-head text-xl font-black text-[#25104A]">
              {fase === 'encerrada' ? 'Placar final da partida' : `Placar após a rodada ${estado?.rodada}`}
            </h2>
            <span className="rounded-full bg-[#E7DBFD] px-3 py-1 text-xs font-extrabold text-[#25104A]">
              Empates preservados
            </span>
          </div>

          {estado?.modalidade === 'equipes' && rankingEquipes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A3B7C]">
                Classificação das Equipes (soma individual)
              </h3>
              <ol className="space-y-2">
                {rankingEquipes.map((eq) => (
                  <li
                    key={eq.equipeId || eq.id || eq.nome}
                    className="rounded-2xl border-2 border-[#6315D9]/30 bg-[#F3EDFF] px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE500] text-sm font-black text-[#25104A]">
                        {eq.posicao}º
                      </span>
                      <span className="font-extrabold text-[#25104A]">{eq.nome}</span>
                    </div>
                    <span className="font-mono text-base font-black text-[#6315D9]">{eq.pontos} pts</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {rankingIndividual.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A3B7C]">
                Classificação Individual
              </h3>
              <ol className="space-y-2">
                {rankingIndividual.map((item) => (
                  <li
                    key={item.participanteId || item.id || item.nome}
                    className="rounded-2xl border border-[#E2D9F7] bg-[#FFFDF7] px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7DBFD] text-xs font-black text-[#25104A]">
                        {item.posicao}º
                      </span>
                      <div className="min-w-0">
                        <span className="block font-bold text-sm text-[#25104A] truncate">{item.nome}</span>
                        {item.equipeNome && (
                          <span className="block text-[11px] font-semibold text-[#5B4B86]">{item.equipeNome}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-sm font-black text-[#25104A]">{item.pontos} pts</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : rankingEquipes.length === 0 ? (
            <p className="text-sm text-[#5B4B86]">Aguardando consolidação do placar pelo servidor.</p>
          ) : null}
        </section>
      )}
    </div>
  );
}
