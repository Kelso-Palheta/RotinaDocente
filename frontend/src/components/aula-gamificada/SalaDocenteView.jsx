'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { RenderTextoSeguro } from './RenderTextoSeguro';
import { useCronometroServidor, useSalaGamificada } from './useSalaGamificada';
import {
  FASES_ROTULO,
  LETRAS,
  classeDificuldade,
  formatarCronometro,
  normalizarRankingComEmpates,
  obterModalidadeInfo,
  rotuloDificuldade,
  validarUrlImagemSegura,
} from './constantes';
import { JogoNatacao } from './jogos/JogoNatacao';
import { PalcoAcertePerde } from './jogos/JogoAcertePerde';
import { CorrecaoAbertaDocente } from './CorrecaoAbertaDocente';
import JogoHerois from './jogos/JogoHerois';
import JogoTabuleiro from './jogos/JogoTabuleiro';
import RelatorioAvaliacao from './RelatorioAvaliacao';
import ControlesGrupoDocente from './ControlesGrupoDocente';
import {
  BarraControleAudiovisual,
  ProvedorAudiovisualSala,
  derivarContextoAudiovisual,
  useAudiovisualSala,
} from './audiovisual/ProvedorAudiovisualSala';
import { PalcoCenaConectado } from './audiovisual/PalcoCenaJogo';

function ControlesTransicao({ estado, ocupado, bloqueado, onComando, segundos }) {
  const audiovisual = useAudiovisualSala();
  const acionar = (acao) => {
    audiovisual?.desbloquearPorGesto?.();
    onComando(acao);
  };
  const fase = estado?.fase || 'espera';
  const totalRodadas = estado?.totalRodadas || estado?.questaoIds?.length || 1;
  const rodadaAtual = estado?.rodada || 0;
  const ultimaRodada = rodadaAtual >= totalRodadas;
  const rodadaEncerrada = Boolean(estado?.rodadaEncerrada) || (estado?.prazo != null && segundos <= 0);

  return (
    <section
      aria-label="Controles da sala"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#B9A6EF]/40 bg-[#3A1A73]/80 p-3"
    >
      {fase === 'espera' && (
        <button
          type="button"
          disabled={bloqueado || ocupado}
          onClick={() => acionar('iniciar')}
          className="min-h-11 rounded-xl bg-[#00DDEB] px-4 py-2 text-sm font-black text-[#25104A] hover:bg-[#FFE500] disabled:opacity-45"
        >
          Iniciar partida
        </button>
      )}

      {fase === 'pergunta' && (
        <>
          <button
            type="button"
            disabled={bloqueado || ocupado}
            onClick={() => onComando('encerrar_rodada')}
            className={`min-h-11 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-45 ${
              rodadaEncerrada
                ? 'border border-[#B9A6EF] bg-white/10 text-white'
                : 'bg-[#FFE500] text-[#25104A] hover:bg-[#00DDEB]'
            }`}
          >
            Encerrar rodada
          </button>
          <button
            type="button"
            disabled={bloqueado || ocupado}
            onClick={() => onComando('revelar')}
            className={`min-h-11 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-45 ${
              rodadaEncerrada
                ? 'bg-[#00DDEB] text-[#25104A] hover:bg-[#FFE500]'
                : 'border border-[#B9A6EF] bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Revelar feedback
          </button>
        </>
      )}

      {fase === 'feedback' && !estado?.revelado && (
        <button
          type="button"
          disabled={bloqueado || ocupado}
          onClick={() => onComando('revelar')}
          className="min-h-11 rounded-xl bg-[#FFE500] px-4 py-2 text-sm font-black text-[#25104A] hover:bg-[#00DDEB] disabled:opacity-45"
        >
          Revelar feedback
        </button>
      )}

      {fase === 'feedback' && estado?.revelado && (
        <button
          type="button"
          disabled={bloqueado || ocupado || estado?.pendentesCorrecao > 0}
          onClick={() => onComando('ranking')}
          className="min-h-11 rounded-xl bg-[#00DDEB] px-4 py-2 text-sm font-black text-[#25104A] hover:bg-[#FFE500] disabled:opacity-45"
        >
          Mostrar ranking
        </button>
      )}

      {fase === 'ranking' && !ultimaRodada && (
        <button
          type="button"
          disabled={bloqueado || ocupado}
          onClick={() => onComando('proxima')}
          className="min-h-11 rounded-xl bg-[#00DDEB] px-4 py-2 text-sm font-black text-[#25104A] hover:bg-[#FFE500] disabled:opacity-45"
        >
          Próxima rodada
        </button>
      )}

      {fase !== 'encerrada' && (
        <button
          type="button"
          disabled={bloqueado || ocupado}
          onClick={() => onComando('encerrar_sala')}
          className="min-h-11 rounded-xl border border-[#B9A6EF]/70 bg-white/10 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-white/20 disabled:opacity-45 ml-auto"
        >
          Encerrar sala
        </button>
      )}
    </section>
  );
}

function SalaDocenteConectada({ codigo, uid, obterToken, projecao }) {
  const { estado, conexao, erro, ocupado, reconectar, enviarComando } = useSalaGamificada({
    codigo,
    papel: projecao ? 'projecao' : 'docente',
    contextoUid: uid,
    obterToken,
    ativo: true,
  });

  const segundos = useCronometroServidor(estado);
  const modalidadeInfo = obterModalidadeInfo(estado?.modalidade);
  const fase = estado?.fase || 'espera';
  const questao = estado?.questao || null;
  const participacao = estado?.participacao || estado?.estatisticas || {};
  const respondentes = Array.isArray(participacao.respondentes) ? participacao.respondentes : [];
  const presentes = Array.isArray(participacao.presentes) ? participacao.presentes : [];
  const distribuicao = participacao.distribuicao || {};
  const totalParticipantes = participacao.totalParticipantes ?? participacao.total ?? 0;
  const totalPresentes = participacao.totalPresentes ?? presentes.length;
  const totalRespondentes = participacao.totalRespondentes ?? participacao.respondidos ?? respondentes.length;
  const rankingIndividual = normalizarRankingComEmpates(estado?.ranking || []);
  const rankingEquipes = normalizarRankingComEmpates(estado?.rankingEquipes || []);
  const feedback = estado?.feedback || null;
  const contextoAv = derivarContextoAudiovisual(estado, segundos, projecao ? 'projecao' : 'docente');
  const modoTemPalcoProprio = estado?.modalidade === 'herois' || estado?.modalidade === 'tabuleiro' || estado?.modalidade === 'natacao';

  const executarComando = async (acao, extras) => {
    try {
      await enviarComando(acao, extras);
    } catch {
      // Erro já exibido no estado do hook.
    }
  };

  return (
    <ProvedorAudiovisualSala
      modalidade={contextoAv.modalidade}
      fase={contextoAv.fase}
      evento={contextoAv.evento}
    >
    <main className="min-h-screen bg-[#25104A] text-[#FFFDF7]">
      {/* Barra superior docente / telão */}
      <nav aria-label="Navegação da sala docente" className="border-b border-[#B9A6EF]/30 bg-[#160932] px-4 py-3 text-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/aula-gamificada/salas"
              className="min-h-10 inline-flex items-center rounded-xl border border-[#B9A6EF]/50 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
            >
              ← Aula Gamificada
            </Link>
            {!projecao && (
              <>
                <Link
                  href={`/aula-gamificada/projecao/${encodeURIComponent(codigo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-10 inline-flex items-center rounded-xl bg-[#6315D9] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#5411B8]"
                >
                  Abrir telão ↗
                </Link>
                <Link
                  href={`/aluno/aula-gamificada/${encodeURIComponent(codigo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-10 inline-flex items-center rounded-xl border border-[#B9A6EF]/50 px-3 py-1.5 text-xs font-bold text-[#E7DBFD] hover:bg-white/10"
                >
                  Link do aluno ↗
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-[#B9A6EF]">
              {projecao ? 'Modo Telão / Projeção' : 'Painel Docente'}
            </span>
            <span className="rounded-xl bg-[#FFE500] px-3 py-1 font-mono text-sm font-black text-[#25104A]">
              {codigo}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                conexao === 'conectado'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}
            >
              {conexao === 'conectado' ? 'Ao vivo' : conexao === 'reconectando' ? 'Reconectando...' : 'Conectando...'}
            </span>
            {erro && (
              <button
                type="button"
                onClick={reconectar}
                className="min-h-9 rounded-xl border border-amber-400 px-3 py-1 text-xs font-extrabold text-amber-200 hover:bg-amber-400/15"
              >
                Reconectar
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 ${projecao ? 'lg:py-8' : ''}`}>
        <BarraControleAudiovisual />
        {erro && (
          <p role="alert" className="rounded-2xl border border-amber-400 bg-amber-950/70 px-4 py-3 text-sm font-semibold text-amber-100">
            {erro}
          </p>
        )}

        {!estado ? (
          <div className="rounded-3xl border border-[#B9A6EF]/30 bg-[#3A1A73]/40 p-10 text-center space-y-2">
            <p role="status" className="text-lg font-bold">
              Conectando à sala {codigo} e recuperando estado durável…
            </p>
            <p className="text-xs text-[#B9A6EF]">
              Nenhuma chamada de IA é realizada durante as partidas ao vivo.
            </p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da partida */}
            <header className="arte-banner-festival rounded-3xl border-2 border-[#6315D9] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="arte-selo">{modalidadeInfo.nome}</span>
                  <span className="rounded-full bg-[#E7DBFD] px-3 py-0.5 text-xs font-black text-[#25104A]">
                    {estado.finalidade === 'avaliativa' ? 'Avaliativa' : 'Revisão'}
                  </span>
                  {estado.formatoParticipacao && (
                    <span className="rounded-full bg-[#FFE500] px-3 py-0.5 text-xs font-black text-[#25104A]">
                      {estado.formatoParticipacao === 'duelo'
                        ? 'Duelo 1×1'
                        : estado.formatoParticipacao === 'grupos'
                          ? estado.modoRespostaGrupo === 'compartilhada'
                            ? 'Grupos · Compartilhada'
                            : 'Grupos · Individual'
                          : 'Individual'}
                    </span>
                  )}
                  <span className="rounded-full bg-[#00DDEB] px-3 py-0.5 text-xs font-black text-[#25104A]">
                    {FASES_ROTULO[fase] || fase}
                  </span>
                  {estado.rodada > 0 && (
                    <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-extrabold text-white">
                      Rodada {estado.rodada}{estado.totalRodadas ? ` de ${estado.totalRodadas}` : ''}
                    </span>
                  )}
                </div>
                <h1 className={`font-head font-black text-white ${projecao ? 'text-3xl lg:text-5xl' : 'text-2xl lg:text-3xl'}`}>
                  {estado.titulo || 'Aula Gamificada'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {fase === 'pergunta' && (
                  <div className="rounded-2xl border-2 border-[#00DDEB] bg-[#160932] px-5 py-2.5 text-center">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[#00DDEB]">
                      Cronômetro
                    </span>
                    <span className={`font-mono font-black text-[#FFE500] ${projecao ? 'text-4xl' : 'text-2xl'}`}>
                      {estado?.semCronometro ? 'Sem limite' : formatarCronometro(segundos)}
                    </span>
                  </div>
                )}
                <div className="rounded-2xl border border-[#B9A6EF]/40 bg-[#160932]/80 px-4 py-2.5 text-center">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-[#B9A6EF]">
                    Participação
                  </span>
                  <span className="font-mono text-xl font-black text-[#B9EF00]">
                    {totalRespondentes} / {totalParticipantes}
                  </span>
                </div>
              </div>
            </header>

            {estado?.modalidade === 'natacao' && <JogoNatacao estado={estado.natacaoEstado} />}
            {estado?.modalidade === 'acerte_perde' && <PalcoAcertePerde {...estado} />}
            {estado?.pendentesCorrecao > 0 && <p role="status" className="rounded-xl bg-amber-100 text-amber-950 p-3 font-bold">{estado.pendentesCorrecao} resposta(s) aguardando correção docente. O ranking será liberado após a correção.</p>}
            {!projecao && estado?.modalidade === 'acerte_perde' && fase === 'feedback' && questao?.tipo === 'resposta_aberta' && <CorrecaoAbertaDocente codigo={codigo} revision={estado.revision} obterToken={obterToken} ocupado={ocupado} onComando={enviarComando} />}

            {fase === 'feedback' && estado?.revelado && questao?.tipo === 'resposta_aberta' && <section className="rounded-2xl border-2 border-[#00DDEB] bg-[#FFFDF7] text-[#25104A] p-5"><h2 className="font-black text-xl mb-2">Resposta-modelo</h2><RenderTextoSeguro texto={feedback?.respostaCorreta} /></section>}

            {/* Controles disponíveis tanto no painel quanto no telão */}
            <ControlesTransicao
              estado={estado}
              ocupado={ocupado}
              bloqueado={conexao !== 'conectado'}
              segundos={segundos}
              onComando={executarComando}
            />

            {!projecao && (
              <ControlesGrupoDocente
                estado={estado}
                ocupado={ocupado}
                bloqueado={conexao !== 'conectado'}
                onComando={(acao, extras) => enviarComando(acao, extras)}
              />
            )}

            {/* FASE: ESPERA */}
            {fase === 'espera' && (
              <section className="rounded-3xl border-2 border-[#6315D9] bg-[#3A1A73]/40 p-8 sm:p-12 text-center space-y-6">
                <div className="max-w-md mx-auto">
                  <PalcoCenaConectado
                    jogo={contextoAv.modalidade}
                    situacao="espera"
                    eventoId={contextoAv.eventoId}
                    tamanho="compacto"
                  />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-[#00DDEB]">
                  Acesse o Portal do Aluno → Aula Gamificada e digite o código
                </span>
                <div className={`font-mono font-black tracking-widest text-[#FFE500] ${projecao ? 'text-7xl sm:text-9xl' : 'text-5xl sm:text-7xl'}`}>
                  {estado.codigo}
                </div>
                <p className="text-base sm:text-lg font-bold text-[#E7DBFD]">
                  {totalParticipantes} estudantes conectados · {modalidadeInfo.regraPontuacao}
                </p>
              </section>
            )}

            {/* FASE: PERGUNTA / FEEDBACK */}
            {(fase === 'pergunta' || fase === 'feedback') && estado.modalidade === 'herois' && (
              <JogoHerois
                modo="docente"
                questao={questao}
                fase={fase}
                rodada={estado.rodada}
                totalRodadas={estado.totalRodadas}
                estado={estado}
              />
            )}

            {(fase === 'pergunta' || fase === 'feedback') && estado.modalidade === 'tabuleiro' && (
              <JogoTabuleiro
                modo="docente"
                estado={estado}
                questao={questao}
                fase={fase}
              />
            )}

            {(fase === 'pergunta' || fase === 'feedback') &&
              !['herois', 'tabuleiro'].includes(estado.modalidade) &&
              questao && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <section className="lg:col-span-2 rounded-3xl border-2 border-[#6315D9]/70 bg-[#FFFDF7] text-[#25104A] p-6 space-y-5 shadow-lg">
                  <PalcoCenaConectado
                    jogo={contextoAv.modalidade}
                    situacao={contextoAv.situacao}
                    eventoId={contextoAv.eventoId}
                    tamanho="compacto"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {questao.disciplina && (
                      <span className="rounded-lg bg-[#F3EDFF] border border-[#E2D9F7] px-2.5 py-0.5 text-xs font-extrabold">
                        {questao.disciplina}
                      </span>
                    )}
                    {questao.dificuldade && (
                      <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${classeDificuldade(questao.dificuldade)}`}>
                        {rotuloDificuldade(questao.dificuldade)}
                      </span>
                    )}
                  </div>

                  <h2 className={`font-head font-black text-[#25104A] leading-snug ${projecao ? 'text-2xl lg:text-4xl' : 'text-xl lg:text-2xl'}`}>
                    <RenderTextoSeguro texto={questao.enunciado} />
                  </h2>

                  {questao.imagem?.url && validarUrlImagemSegura(questao.imagem.url) && (
                    <figure className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={questao.imagem.url}
                        alt={questao.imagem.alt || 'Imagem da questão'}
                        className="max-h-72 rounded-2xl border border-[#E2D9F7] object-contain"
                      />
                    </figure>
                  )}

                  {/* Alternativas + distribuição ANÔNIMA (sem nomes associados às opções) */}
                  {Array.isArray(questao.alternativas) && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {questao.alternativas.map((alt, idx) => {
                        const votos = Number(distribuicao[alt.id] ?? 0);
                        const percentual = totalRespondentes > 0 ? Math.round((votos / totalRespondentes) * 100) : 0;
                        const correta = fase === 'feedback' && feedback?.respostaCorreta === alt.id;

                        return (
                          <li
                            key={alt.id}
                            className={`rounded-2xl border-2 p-4 space-y-2 ${
                              correta
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-[#E2D9F7] bg-[#F3EDFF]/60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-sm sm:text-base">
                                <strong className="mr-2 text-[#6315D9]">{LETRAS[idx] || idx + 1})</strong>
                                <RenderTextoSeguro texto={alt.texto} />
                              </span>
                              {correta && (
                                <span className="shrink-0 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white">
                                  Correta
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-[#5B4B86]">
                                <span>{votos} respostas</span>
                                <span>{percentual}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-[#E2D9F7] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#6315D9]"
                                  style={{ width: `${percentual}%` }}
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Visualização pública para Associação / Ordenação / Memória */}
                  {estado.modalidade === 'associacao' && Array.isArray(questao.esquerda) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1.5">
                        <strong className="text-xs uppercase text-[#4A3B7C]">Coluna A</strong>
                        {questao.esquerda.map((it) => (
                          <div key={it.id} className="rounded-xl border border-[#E2D9F7] bg-[#F3EDFF] px-3 py-2 font-bold">
                            <RenderTextoSeguro texto={it.texto} />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <strong className="text-xs uppercase text-[#4A3B7C]">Coluna B</strong>
                        {(questao.direita || []).map((it) => (
                          <div key={it.id} className="rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 font-bold">
                            <RenderTextoSeguro texto={it.texto} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {estado.modalidade === 'ordenacao' && Array.isArray(questao.itens) && (
                    <ul className="space-y-2 text-sm">
                      {questao.itens.map((it) => (
                        <li key={it.id} className="rounded-xl border border-[#E2D9F7] bg-[#F3EDFF] px-4 py-2.5 font-bold">
                          <RenderTextoSeguro texto={it.texto} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {estado.modalidade === 'memoria' && (
                    <div className="rounded-2xl border border-[#E2D9F7] bg-[#F3EDFF] p-4 space-y-1 text-sm">
                      <p className="font-extrabold text-[#25104A]">
                        Tabuleiro individual em andamento no dispositivo de cada estudante
                      </p>
                      <p className="text-xs text-[#5B4B86]">
                        Tabuleiros privados não são exibidos no telão. Acompanhe o progresso agregado ao lado.
                      </p>
                    </div>
                  )}

                  {fase === 'feedback' && feedback?.explicacao && (
                    <div className="rounded-2xl border-2 border-[#6315D9] bg-[#F3EDFF] p-4 space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#6315D9]">
                        Explicação pedagógica
                      </h3>
                      <p className="text-sm sm:text-base font-medium text-[#25104A]">
                        <RenderTextoSeguro texto={feedback.explicacao} />
                      </p>
                    </div>
                  )}
                </section>

                {/* Coluna lateral: respondentes (sem vincular nome à alternativa) e progresso agregado */}
                <aside className="rounded-3xl border border-[#B9A6EF]/40 bg-[#3A1A73]/50 p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#00DDEB]">
                      Respondentes desta rodada
                    </h3>
                    <p className="text-xs text-[#E7DBFD] mt-1">
                      A distribuição de opções é sempre anônima para preservar a segurança psicológica da turma.
                    </p>
                  </div>

                  {participacao.progressoMemoria && (
                    <div className="rounded-2xl border border-[#00DDEB]/40 bg-[#160932]/70 p-3.5 text-xs space-y-1">
                      <strong className="block text-[#00DDEB]">Progresso agregado — Memória</strong>
                      <p>Concluíram o tabuleiro: <strong>{participacao.progressoMemoria.concluidos ?? 0}</strong></p>
                      <p>Média de pares encontrados: <strong>{participacao.progressoMemoria.mediaPares ?? 0}</strong></p>
                    </div>
                  )}

                  {respondentes.length === 0 ? (
                    <p className="text-xs text-[#B9A6EF]">
                      {totalRespondentes > 0
                        ? `${totalRespondentes} resposta(s) recebida(s) nesta rodada (lista nominal aguardando exposição pelo servidor).`
                        : 'Nenhuma resposta recebida nesta rodada ainda.'}
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {respondentes.map((resp, idx) => {
                        const nome = typeof resp === 'string' ? resp : resp?.nome || `Estudante ${idx + 1}`;
                        return (
                          <li
                            key={`${nome}-${idx}`}
                            className="rounded-full bg-white/10 border border-[#B9A6EF]/40 px-3 py-1 text-xs font-bold text-white"
                          >
                            {nome}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {totalPresentes > 0 && (
                    <div className="pt-3 border-t border-[#B9A6EF]/25 space-y-1.5">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-[#B9A6EF]">
                        Presentes na sala ({totalPresentes} de {totalParticipantes})
                      </h4>
                      <ul className="flex flex-wrap gap-1.5">
                        {presentes.map((nome, idx) => (
                          <li
                            key={`pres-${nome}-${idx}`}
                            className="rounded-full bg-[#160932]/70 border border-[#B9A6EF]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#E7DBFD]"
                          >
                            {nome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </aside>
              </div>
            )}

            {fase === 'encerrada' && !projecao && (
              <RelatorioAvaliacao codigo={codigo} obterToken={obterToken} />
            )}

            {/* FASE: RANKING OU ENCERRADA */}
            {(fase === 'ranking' || fase === 'encerrada') && (
              <section className="rounded-3xl border-2 border-[#6315D9] bg-[#3A1A73]/50 p-6 sm:p-8 space-y-6">
                {fase === 'encerrada' && estado.modalidade === 'herois' && (
                  <JogoHerois
                    modo="docente"
                    questao={null}
                    fase="encerrada"
                    rodada={estado.rodada}
                    totalRodadas={estado.totalRodadas}
                    estado={estado}
                  />
                )}
                {fase === 'encerrada' && estado.modalidade === 'tabuleiro' && (
                  <JogoTabuleiro modo="docente" estado={estado} questao={null} fase="encerrada" />
                )}
                {!modoTemPalcoProprio && (
                  <div className="max-w-lg mx-auto">
                    <PalcoCenaConectado
                      jogo={contextoAv.modalidade}
                      situacao={fase === 'encerrada' ? 'vitoria' : 'ranking'}
                      eventoId={contextoAv.eventoId}
                      tamanho="compacto"
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className={`font-head font-black text-white ${projecao ? 'text-3xl' : 'text-2xl'}`}>
                    {fase === 'encerrada' ? 'Placar Final' : `Placar — Rodada ${estado.rodada}`}
                  </h2>
                  <span className="rounded-full bg-[#FFE500] px-3 py-1 text-xs font-black text-[#25104A]">
                    Empates preservados
                  </span>
                </div>

                {rankingEquipes.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#00DDEB]">
                      {estado.modalidade === 'tabuleiro'
                        ? 'Ranking por equipes (casas e pontos)'
                        : estado.modoRespostaGrupo === 'compartilhada' || estado.sala?.modoRespostaGrupo === 'compartilhada'
                          ? 'Ranking por Grupos (resposta compartilhada)'
                          : 'Ranking por Equipes (soma individual)'}
                    </h3>
                    <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {rankingEquipes.map((eq) => (
                        <li
                          key={eq.equipeId || eq.id || eq.nome}
                          className="rounded-2xl border-2 border-[#00DDEB]/60 bg-[#160932] px-5 py-4 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE500] text-base font-black text-[#25104A]">
                              {eq.posicao}º
                            </span>
                            <span className="text-lg font-black text-white">{eq.nome}</span>
                          </div>
                          <span className="font-mono text-xl font-black text-[#B9EF00]">
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
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#B9A6EF]">
                      Classificação Individual
                    </h3>
                    <ol className="space-y-2">
                      {rankingIndividual.map((item) => (
                        <li
                          key={item.participanteId || item.id || item.nome}
                          className="rounded-2xl border border-[#B9A6EF]/40 bg-[#160932]/80 px-5 py-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE500] text-sm font-black text-[#25104A]">
                              {item.posicao}º
                            </span>
                            <div>
                              <span className="block font-extrabold text-base text-white">{item.nome}</span>
                              {item.equipeNome && (
                                <span className="block text-xs text-[#B9A6EF]">{item.equipeNome}</span>
                              )}
                            </div>
                          </div>
                          <span className="font-mono text-lg font-black text-[#00DDEB]">{item.pontos} pts</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : rankingEquipes.length === 0 ? (
                  <p className="text-sm text-[#E7DBFD]">Nenhum participante pontuou ainda.</p>
                ) : null}
              </section>
            )}
          </>
        )}
      </div>
    </main>
    </ProvedorAudiovisualSala>
  );
}

export function SalaDocenteView({ codigo, projecao = false }) {
  const { user, loading } = useAuth();
  const uid = user?.uid;

  const obterToken = useCallback(async () => {
    const atual = auth?.currentUser;
    if (!uid || !atual || atual.uid !== uid) {
      throw new Error('Sua conta mudou. Faça login novamente com sua conta Firebase.');
    }
    return atual.getIdToken();
  }, [uid]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#25104A] p-8 text-white">
        <p role="status">Verificando acesso docente…</p>
      </main>
    );
  }

  if (!user || user.isDjango || !auth?.currentUser || auth.currentUser.uid !== uid) {
    return (
      <main className="arte-pagina min-h-screen p-8 text-[#25104A] flex items-center justify-center">
        <section className="max-w-lg w-full rounded-3xl border-2 border-[#E2D9F7] bg-white p-6 space-y-4">
          <h1 className="font-head text-2xl font-black">Aula Gamificada</h1>
          <p className="text-sm text-[#5B4B86]">
            Faça login de professor com sua conta Firebase para abrir esta sala ou projeção.
          </p>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-[#6315D9] px-4 py-2 text-sm font-extrabold text-white">
            Voltar para entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <SalaDocenteConectada
      key={`${uid}:${codigo}:${projecao}`}
      codigo={codigo}
      uid={uid}
      obterToken={obterToken}
      projecao={projecao}
    />
  );
}
