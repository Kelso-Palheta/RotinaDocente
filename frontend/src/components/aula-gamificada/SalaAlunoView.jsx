'use client';

import React, { useState } from 'react';
import { Plataforma2D } from '@/components/revisao-autonoma/Plataforma2D';
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
import { JogoNatacao } from './jogos/JogoNatacao';
import { JogoAcertePerde, PalcoAcertePerde } from './jogos/JogoAcertePerde';
import { ResgateRio } from '@/components/resgate/ResgateRio';
import { JogoQuiz } from './jogos/JogoQuiz';
import { JogoMemoria } from './jogos/JogoMemoria';
import { JogoAssociacao } from './jogos/JogoAssociacao';
import { JogoOrdenacao } from './jogos/JogoOrdenacao';
import JogoHerois from './jogos/JogoHerois';
import JogoTabuleiro from './jogos/JogoTabuleiro';
import {
  BarraControleAudiovisual,
  ProvedorAudiovisualSala,
  derivarContextoAudiovisual,
} from './audiovisual/ProvedorAudiovisualSala';
import { PalcoCenaConectado } from './audiovisual/PalcoCenaJogo';
import FeedbackEmocional from './audiovisual/FeedbackEmocional';

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
  const ehCompartilhada = estado?.modoRespostaGrupo === 'compartilhada';
  const ehRepresentante = Boolean(estado?.eu?.ehRepresentante);
  const bloqueadoPorRepresentante = ehCompartilhada && !ehRepresentante;
  const bloqueado = ocupado || conexao !== 'conectado' || prazoEncerrado || bloqueadoPorRepresentante;

  const chaveRodada = `${estado?.codigo || ''}:${estado?.rodada || 0}:${questao?.id || ''}`;
  const contextoAv = derivarContextoAudiovisual(estado, segundos, 'aluno');
  const [portalRodada, setPortalRodada] = useState(null);
  const emPlataforma = estado.experiencia === 'plataforma' && estado.modalidade === 'quiz';
  const portalLiberado = portalRodada === chaveRodada;
  const modoTemPalcoProprio = estado.experiencia === 'resgate' || estado.modalidade === 'herois' || estado.modalidade === 'tabuleiro' || estado.modalidade === 'natacao';

  return (
    <ProvedorAudiovisualSala
      modalidade={contextoAv.modalidade}
      fase={contextoAv.fase}
      evento={contextoAv.evento}
    >
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      <BarraControleAudiovisual />
      {/* Cabeçalho da sala */}
      <header className="arte-banner-festival rounded-3xl p-5 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="arte-selo">{modalidadeInfo.nome}</span>
            <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-extrabold text-white">
              {estado?.finalidade === 'avaliativa' ? 'Avaliativa' : 'Revisão'}
            </span>
            {estado?.formatoParticipacao && (
              <span className="rounded-full bg-[#FFE500] px-3 py-0.5 text-xs font-black text-[#25104A]">
                {estado.formatoParticipacao === 'duelo'
                  ? 'Duelo 1×1'
                  : estado.formatoParticipacao === 'grupos'
                    ? estado.modoRespostaGrupo === 'compartilhada'
                      ? 'Grupos · Resposta compartilhada'
                      : 'Grupos · Resposta individual'
                    : 'Individual'}
              </span>
            )}
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
                {estado.semCronometro ? 'Sem limite' : formatarCronometro(segundos)}
              </span>
            </div>
          )}
        </div>
      </header>

      {estado.modalidade === 'natacao' && <JogoNatacao estado={estado.natacaoEstado} euId={estado.eu?.equipeId || estado.eu?.id} />}
      {estado.modalidade === 'acerte_perde' && <PalcoAcertePerde {...estado} />}

      {/* Regra de pontuação documentada para o aluno */}
      <div className="rounded-2xl border border-[#E2D9F7] bg-[#F3EDFF] px-4 py-3 text-xs text-[#25104A] flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="font-extrabold">Pontuação: </strong>
          {modalidadeInfo.regraPontuacao}
        </span>
        <span className="font-bold text-[#5B4B86]">{estado.finalidade === 'avaliativa' ? 'Avaliativa: resultado depende da revisão e publicação do professor.' : 'Esta atividade não altera suas notas.'}</span>
      </div>

      {ehCompartilhada && (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-2.5 text-xs font-extrabold ${
            ehRepresentante
              ? 'border-[#B9EF00] bg-[#B9EF00]/20 text-[#25104A]'
              : 'border-[#E2D9F7] bg-[#F3EDFF] text-[#4A3B7C]'
          }`}
        >
          {ehRepresentante
            ? 'Você é o representante autorizado do grupo nesta sala. Seu envio registra a resposta da equipe.'
            : 'Modo compartilhado: você acompanha em tempo real o envio do representante do seu grupo.'}
        </div>
      )}

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
        <section className="rounded-3xl border-2 border-[#E2D9F7] bg-white p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <PalcoCenaConectado
            jogo={contextoAv.modalidade}
            situacao="espera"
            eventoId={contextoAv.eventoId}
            tamanho="compacto"
          />
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

      {/* FASE: PERGUNTA (modalidades compatíveis) */}
      {fase === 'pergunta' && questao && emPlataforma && !portalLiberado && <section aria-label="Plataforma em sala" className="space-y-3"><p className="rounded-xl bg-[#FFE500] p-3 font-bold text-[#25104A]">Atravesse o percurso até o portal para responder à questão desta rodada.</p><Plataforma2D key={chaveRodada} fase={estado.rodada} pausado={prazoEncerrado || ocupado} onDesafio={() => setPortalRodada(chaveRodada)} /></section>}
      {['pergunta','feedback'].includes(fase) && questao && estado.experiencia === 'resgate' && <ResgateRio key={chaveRodada} questao={questao} indice={Math.max(0,estado.rodada-1)} total={estado.totalRodadas} fase={fase} recibo={recibo} bloqueado={bloqueado} ocupado={ocupado} onEnviar={onResponder} />}
      {fase === 'pergunta' && questao && estado.experiencia !== 'resgate' && (!emPlataforma || portalLiberado) && (
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

          {!modoTemPalcoProprio && (
            <PalcoCenaConectado
              jogo={contextoAv.modalidade}
              situacao={contextoAv.situacao}
              eventoId={contextoAv.eventoId}
              tamanho="compacto"
            />
          )}

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

          {(estado.modalidade === 'quiz' || estado.modalidade === 'equipes' || estado.modalidade === 'natacao') && (
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

          {estado.modalidade === 'acerte_perde' && <JogoAcertePerde key={chaveRodada} questao={questao} recibo={recibo} ocupado={ocupado} bloqueado={bloqueado} onEnviar={onResponder} />}

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

          {estado.modalidade === 'herois' && (
            <JogoHerois
              key={chaveRodada}
              modo="aluno"
              questao={questao}
              fase={fase}
              rodada={estado.rodada}
              totalRodadas={estado.totalRodadas}
              recibo={recibo}
              estado={estado}
              prazoEncerrado={prazoEncerrado}
              ocupado={ocupado}
              bloqueado={bloqueado}
              onResponder={onResponder}
            />
          )}

          {estado.modalidade === 'tabuleiro' && (
            <JogoTabuleiro
              key={chaveRodada}
              modo="aluno"
              estado={estado}
              questao={questao}
              fase={fase}
              recibo={recibo}
              prazoEncerrado={prazoEncerrado}
              ocupado={ocupado}
              bloqueado={bloqueado}
              onResponder={onResponder}
            />
          )}
        </section>
      )}

      {/* FASE: FEEDBACK */}
      {fase === 'feedback' && (
        <section className="rounded-3xl border-2 border-[#6315D9] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          {estado.modalidade === 'herois' && (
            <JogoHerois
              key={chaveRodada}
              modo="aluno"
              questao={questao}
              fase="feedback"
              rodada={estado.rodada}
              totalRodadas={estado.totalRodadas}
              recibo={recibo}
              estado={estado}
              prazoEncerrado={true}
              ocupado={ocupado}
              bloqueado={true}
              onResponder={onResponder}
            />
          )}
          {estado.modalidade === 'tabuleiro' && (
            <JogoTabuleiro
              key={chaveRodada}
              modo="aluno"
              estado={estado}
              questao={questao}
              fase="feedback"
              recibo={recibo}
              prazoEncerrado={true}
              ocupado={ocupado}
              bloqueado={true}
              onResponder={onResponder}
            />
          )}
          {!modoTemPalcoProprio && (
            <PalcoCenaConectado
              jogo={contextoAv.modalidade}
              situacao={contextoAv.situacao}
              eventoId={contextoAv.eventoId}
              tamanho="compacto"
            />
          )}
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

          {(() => {
            const pendenteManual = recibo && questao?.tipo === 'resposta_aberta' && !recibo.correcaoManual;
            const tipoFb = pendenteManual ? 'correcao_pendente' : ['acerto', 'erro', 'parcial', 'sem_resposta'].includes(contextoAv.situacao) ? contextoAv.situacao : null;
            return tipoFb ? <FeedbackEmocional tipo={tipoFb} chave={contextoAv.eventoId} semSom mostrarCena={false} fundoClaro className="text-[#25104A]" /> : null;
          })()}
          {recibo && (
            <div
              role="status"
              className={`rounded-2xl border p-4 text-sm font-extrabold ${
                contextoAv.situacao === 'acerto' || (contextoAv.situacao === 'parcial' && (recibo.pontuacao ?? 0) > 0)
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-amber-300 bg-amber-50 text-amber-950'
              }`}
            >
              {contextoAv.situacao === 'acerto'
                ? 'Excelente! Você acertou esta rodada.'
                : contextoAv.situacao === 'parcial' && recibo.pontuacao > 0
                ? `Pontuação parcial confirmada pelo servidor: ${recibo.pontuacao} pontos.`
                : 'Resposta registrada. Confira a explicação pedagógica abaixo.'}
            </div>
          )}

          {questao?.tipo === 'resposta_aberta' && <div className="rounded-xl bg-[#F3EDFF] p-4 text-[#25104A]"><strong>Resposta-modelo</strong><p>{feedback?.respostaCorreta}</p><p className="mt-2 font-bold">{recibo?.correcaoManual ? recibo.correcaoManual.justificativa : recibo ? 'Aguardando correção do professor.' : 'Você não enviou resposta.'}</p></div>}
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
          {fase === 'encerrada' && estado.modalidade === 'herois' && (
            <JogoHerois
              modo="aluno"
              questao={null}
              fase="encerrada"
              rodada={estado.rodada}
              totalRodadas={estado.totalRodadas}
              estado={estado}
            />
          )}
          {fase === 'encerrada' && estado.modalidade === 'tabuleiro' && (
            <JogoTabuleiro modo="aluno" estado={estado} questao={null} fase="encerrada" />
          )}
          {!modoTemPalcoProprio && (
            <PalcoCenaConectado
              jogo={contextoAv.modalidade}
              situacao={fase === 'encerrada' ? 'vitoria' : 'ranking'}
              eventoId={contextoAv.eventoId}
              tamanho="compacto"
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-head text-xl font-black text-[#25104A]">
              {fase === 'encerrada' ? 'Placar final da partida' : `Placar após a rodada ${estado?.rodada}`}
            </h2>
            <span className="rounded-full bg-[#E7DBFD] px-3 py-1 text-xs font-extrabold text-[#25104A]">
              Empates preservados
            </span>
          </div>

          {rankingEquipes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A3B7C]">
                {estado.modalidade === 'tabuleiro'
                  ? 'Classificação das equipes (casas e pontos)'
                  : estado.modoRespostaGrupo === 'compartilhada' || estado.sala?.modoRespostaGrupo === 'compartilhada'
                    ? 'Classificação dos Grupos (resposta compartilhada)'
                    : 'Classificação das Equipes (soma individual)'}
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
                    <span className="font-mono text-base font-black text-[#6315D9]">
                      {estado.modalidade === 'tabuleiro' && (
                        <span className="block text-xs">Casa {eq.posicaoTabuleiro ?? 0}</span>
                      )}
                      {eq.pontos} pts
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {rankingIndividual.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A3B7C]">
                {estado?.formatoParticipacao === 'grupos' || estado?.sala?.formatoParticipacao === 'grupos'
                  ? estado?.modoRespostaGrupo === 'compartilhada' || estado?.sala?.modoRespostaGrupo === 'compartilhada'
                    ? 'Classificação por Grupos (resposta compartilhada)'
                    : 'Classificação por Grupos (soma individual)'
                  : 'Classificação Individual'}
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
    </ProvedorAudiovisualSala>
  );
}
