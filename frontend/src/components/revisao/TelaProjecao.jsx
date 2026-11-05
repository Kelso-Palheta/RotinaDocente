'use client';

import React from 'react';
import { useCronometroRevisao } from './useCronometroRevisao';
import { BadgeConexao, BlocoConteudo, formatarTempo, LETRAS_ALTERNATIVAS } from './revisaoUtils';
import { CORES_ALTERNATIVAS, temaStyles } from './RevisaoTema';
import { PodioRevisao } from './PodioRevisao';
import { BlocoAulaTematica } from './BlocoAulaTematica';

export function TelaProjecao({ estado }) {
  const sala = estado?.sala || {};
  const rodada = estado?.rodada || {};
  const questao = rodada?.questao || {};
  const participacao = estado?.participacao || {
    total: 0,
    respondidos: 0,
    respondentes: [],
    distribuicao: { A: 0, B: 0, C: 0, D: 0, E: 0 },
  };
  const feedback = estado?.feedback;
  const ranking = estado?.ranking || [];
  const fase = estado?.fase || 'espera';
  const conexao = estado?.conexao || 'conectando';

  const segundosRestantes = useCronometroRevisao(estado);

  return (
    <div
      data-tema="vibrante"
      className={`w-full min-h-screen text-[#FFFDF7] p-4 md:p-10 lg:p-12 flex flex-col justify-between font-sans select-none ${temaStyles.palco}`}
      style={{ backgroundColor: '#25104A' }}
    >
      {/* Topo da Projeção */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#6334E3]/50 pb-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-3.5 h-12 bg-[#00DDEB] rounded-full shadow-[0_0_15px_#00DDEB]" aria-hidden="true" />
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-[#FFFDF7] tracking-tight">
              {sala.titulo || 'Grande Aulão ENEM'}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              {rodada?.numero && rodada?.total && (
                <span className="text-[#FFE14D] font-black text-sm uppercase tracking-wider bg-[#FFE14D]/20 px-3 py-0.5 rounded-full border border-[#FFE14D]/40">
                  Rodada {rodada.numero} de {rodada.total}
                </span>
              )}
              {questao?.tema && (
                <span className="text-[#FFFDF7]/80 text-sm font-medium">
                  • {questao.tema}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <BadgeConexao conexao={conexao} />
          {fase !== 'espera' && (
            <div className="bg-[#6334E3]/40 border-2 border-[#00DDEB] rounded-2xl px-6 py-2.5 text-right shadow-xl backdrop-blur-md">
              <span className="text-[11px] text-[#00DDEB] uppercase font-black tracking-widest block">
                Código de Acesso
              </span>
              <span className="text-2xl md:text-3xl font-mono font-black text-[#FFE14D] tracking-wider">
                {sala.codigo || '------'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Área Central Projetada */}
      <main key={`${sala.id || ""}:${rodada.id || ""}:${fase}`} className={`${temaStyles.animacaoEntrada} flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full my-auto`}>
        {/* FASE: ESPERA */}
        {fase === 'espera' && (
          <section className="text-center py-12 space-y-8 ">
            <div className="inline-block bg-[#6334E3]/30 border-2 border-[#6334E3] rounded-3xl p-4 sm:p-8 md:p-14 shadow-2xl backdrop-blur-lg max-w-3xl mx-auto">
              <span className="text-base md:text-lg text-[#00DDEB] font-extrabold uppercase tracking-widest block mb-2">
                Entre no Portal e digite o código
              </span>
              <div className="text-5xl sm:text-7xl md:text-9xl font-mono font-black text-[#FFE14D] tracking-widest py-6 drop-shadow-[0_0_35px_rgba(255,225,77,0.4)]">
                {sala.codigo || '------'}
              </div>
              <p className="text-[#FFFDF7]/90 text-xl md:text-2xl font-bold mt-2">
                Aguardando início do aulão pelo professor...
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 max-w-full text-[#B7F247] text-xl font-extrabold bg-[#B7F247]/10 px-6 py-2.5 rounded-full border border-[#B7F247]/40 w-fit mx-auto shadow-md">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#B7F247] animate-ping" />
              <span>{participacao.total} participantes conectados</span>
            </div>
          </section>
        )}

        {/* FASE: CONTEUDO */}
        {fase === 'conteudo' && estado?.aula && (
          <section className="max-w-5xl mx-auto w-full">
            <BlocoAulaTematica
              bloco={estado.aula.bloco}
              aula={estado.aula}
              imagens={estado.aula.bloco?.imagens || []}
            />
          </section>
        )}

        {fase === 'conteudo' && !estado?.aula && (
          <section className="bg-[#6334E3]/30 border-2 border-[#6334E3]/70 rounded-3xl p-8 md:p-12 shadow-2xl space-y-6 max-w-5xl mx-auto w-full backdrop-blur-md">
            <div className="border-b-2 border-[#6334E3]/50 pb-4">
              <span className="text-[#00DDEB] text-sm uppercase tracking-widest font-black">
                Conteúdo de Revisão
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-[#FFFDF7] mt-1">
                {questao.tema || 'Tópico da Rodada'}
              </h2>
            </div>

            <div className="space-y-6 text-[#FFFDF7] text-lg md:text-xl leading-relaxed font-medium">
              {(rodada.conteudo || []).map((bloco, idx) => (
                <BlocoConteudo key={idx} bloco={bloco} imagens={questao.imagens || []} />
              ))}
            </div>
          </section>
        )}

        {/* FASES: PERGUNTA & ENCERRADA */}
        {(fase === 'pergunta' || fase === 'encerrada') && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Lado Esquerdo: Questão e Alternativas */}
            <div className="min-w-0 lg:col-span-2 bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-[#00DDEB]/20 text-[#00DDEB] text-xs font-black px-3.5 py-1 rounded-full border border-[#00DDEB]/50 uppercase tracking-wider">
                    Questão {rodada.numero}
                  </span>
                  {fase === 'encerrada' && (
                    <span className="bg-[#FF4F9B] text-[#25104A] text-xs font-black px-3.5 py-1 rounded-full border border-[#FF4F9B]/60 uppercase tracking-wider animate-pulse">
                      Pergunta Encerrada
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-3xl font-extrabold text-[#FFFDF7] leading-relaxed">
                  {questao.enunciado}
                </h2>
              </div>

              {questao.imagens && questao.imagens.length > 0 && (
                <div className="my-4 flex flex-wrap gap-4 justify-center">
                  {questao.imagens.map((img, idx) => (
                    <BlocoConteudo key={idx} bloco={img} />
                  ))}
                </div>
              )}

              {/* Lista de Alternativas (sem gabarito nesta fase) */}
              <div className="space-y-3 pt-2">
                {(questao.alternativas || []).map((alt) => {
                  const corBadge = CORES_ALTERNATIVAS[alt.id] || {
                    bg: '#FFE14D',
                    text: '#25104A',
                  };
                  return (
                    <div
                      key={alt.id}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-[#25104A]/90 border-2 border-[#6334E3]/40 text-base md:text-xl text-[#FFFDF7] shadow-md"
                    >
                      <span
                        style={{
                          backgroundColor: corBadge.bg,
                          color: corBadge.text,
                        }}
                        className="w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shrink-0 shadow"
                      >
                        {alt.id}
                      </span>
                      <span className="pt-1 font-medium leading-snug">{alt.texto}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lado Direito: Cronômetro, Distribuição A–E e Respondentes */}
            <div className="min-w-0 lg:col-span-1 space-y-6">
              {/* Timer Visual */}
              {fase === 'pergunta' && (
                <div className="bg-[#6334E3]/30 border-2 border-[#6334E3] rounded-3xl p-6 text-center shadow-2xl backdrop-blur-md">
                  <span className="text-xs text-[#00DDEB] uppercase font-black tracking-widest block mb-1">
                    Tempo Restante
                  </span>
                  <div
                    data-testid="projecao-timer"
                    aria-hidden="true"
                    className={`text-6xl md:text-7xl font-mono font-black tracking-tight ${
                      segundosRestantes <= 10
                        ? 'text-[#FF4F9B] animate-pulse drop-shadow-[0_0_20px_#FF4F9B]'
                        : 'text-[#FFE14D] drop-shadow-[0_0_20px_#FFE14D]'
                    }`}
                  >
                    {formatarTempo(segundosRestantes)}
                  </div>
                </div>
              )}

              {/* Estatísticas e Distribuição A–E com valores numéricos */}
              <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
                <div className="flex flex-wrap gap-2 justify-between items-center border-b border-[#6334E3]/40 pb-3">
                  <span className="text-sm text-[#00DDEB] uppercase font-black">
                    Participação
                  </span>
                  <span className="text-lg font-black text-[#FFFDF7]">
                    {participacao.respondidos} / {participacao.total} responderam
                  </span>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs text-[#FFFDF7]/80 font-bold uppercase block">
                    Distribuição das Respostas:
                  </span>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {LETRAS_ALTERNATIVAS.map((letra) => {
                      const qtd = participacao?.distribuicao?.[letra] ?? 0;
                      const cor = CORES_ALTERNATIVAS[letra] || {
                        bg: '#FFE14D',
                        text: '#25104A',
                      };
                      return (
                        <div
                          key={letra}
                          data-testid={`distribuicao-projecao-${letra}`}
                          style={{ backgroundColor: cor.bg }}
                          className="rounded-xl p-2.5 shadow-md flex flex-col justify-center items-center"
                        >
                          <span
                            style={{ color: cor.text }}
                            className="text-xs block font-black"
                          >
                            {letra}
                          </span>
                          <span
                            style={{ color: cor.text }}
                            className="text-sm md:text-base font-mono font-black block"
                          >
                            {letra}: {qtd}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RV-04: Lista de Respondentes (nomes mostrados SEM alternativa) */}
              <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-2xl space-y-3 backdrop-blur-md">
                <div className="flex flex-wrap gap-2 justify-between items-center border-b border-[#6334E3]/40 pb-2">
                  <h3 className="text-sm font-black text-[#FFFDF7] uppercase tracking-wider">
                    Já Responderam
                  </h3>
                  <span className="text-xs font-mono font-black text-[#B7F247]">
                    {participacao.respondentes?.length || 0} alunos
                  </span>
                </div>

                <div
                  data-testid="projecao-respondentes"
                  className="max-h-56 overflow-y-auto pr-1 flex flex-wrap gap-2 text-xs text-[#FFFDF7]"
                >
                  {(participacao.respondentes || []).map((resp, idx) => (
                    <span
                      key={resp.id || resp.alunoId || idx}
                      className="px-3.5 py-1 bg-[#25104A]/90 border border-[#6334E3] rounded-full font-bold truncate max-w-full shadow-sm"
                    >
                      {resp.nomeExibicao || resp.nome}
                    </span>
                  ))}
                  {(!participacao.respondentes || participacao.respondentes.length === 0) && (
                    <span className="text-[#FFFDF7]/60 italic py-2">
                      Aguardando primeiras respostas...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FASE: FEEDBACK (Gabarito Oficial e Explicações Detalhadas) */}
        {fase === 'feedback' && (
          <section className="bg-[#6334E3]/25 border-2 border-[#6334E3]/70 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8 max-w-6xl mx-auto w-full backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#6334E3]/50 pb-4">
              <div>
                <span className="text-xs font-black text-[#00DDEB] uppercase tracking-widest">
                  Correção Pedagógica • Questão {rodada.numero}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-[#FFFDF7] mt-1">
                  Gabarito Oficial: Alternativa {feedback?.gabarito || '—'}
                </h2>
              </div>
            </div>

            <p className="text-[#FFFDF7] text-lg md:text-xl leading-relaxed font-semibold">
              {questao.enunciado}
            </p>

            {/* Explicações para as 5 alternativas A–E */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[#FFE14D] uppercase tracking-wider">
                Comentário de Cada Alternativa:
              </h3>
              <div className="space-y-3.5">
                {(questao.alternativas || []).map((alt) => {
                  const ehGabarito = feedback?.gabarito === alt.id;
                  const explicacao = feedback?.explicacoes?.[alt.id];
                  const corBadge = CORES_ALTERNATIVAS[alt.id] || {
                    bg: '#FFE14D',
                    text: '#25104A',
                  };

                  return (
                    <div
                      key={alt.id}
                      className={`p-4 md:p-5 rounded-2xl border-2 text-base transition ${
                        ehGabarito
                          ? 'bg-[#B7F247]/20 border-[#B7F247] text-[#FFFDF7] shadow-xl'
                          : 'bg-[#25104A]/90 border-[#6334E3]/40 text-[#FFFDF7]/90'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          style={{
                            backgroundColor: ehGabarito ? '#B7F247' : corBadge.bg,
                            color: '#25104A',
                          }}
                          className="w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 shadow-md"
                        >
                          {alt.id}
                        </span>
                        <div className="space-y-1.5 flex-1">
                          <p className="font-bold text-lg">{alt.texto}</p>
                          {explicacao && (
                            <p
                              className={`text-base leading-relaxed ${
                                ehGabarito ? 'text-[#B7F247] font-semibold' : 'text-[#FFFDF7]/80'
                              }`}
                            >
                              {explicacao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FASE: RANKING & FINALIZADA */}
        {(fase === 'ranking' || fase === 'finalizada') && (
          <section className="bg-[#6334E3]/30 border-2 border-[#6334E3] rounded-3xl p-8 md:p-12 shadow-2xl space-y-6 max-w-4xl mx-auto w-full backdrop-blur-md">
            <div className="text-center border-b-2 border-[#6334E3]/50 pb-5">
              <span className="text-xs md:text-sm font-black text-[#00DDEB] uppercase tracking-widest block">
                {fase === 'finalizada' ? 'Aulão Finalizado' : `Resultado Parcial • Rodada ${rodada.numero}`}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-[#FFE14D] mt-1.5 drop-shadow-[0_0_25px_rgba(255,225,77,0.4)]">
                Classificação Geral
              </h2>
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-3.5 pr-2">
              {estado?.schemaVersion === 2 && <PodioRevisao ranking={ranking}/>}
              {ranking.map((item, idx) => {
                const ehPodio = item.posicao <= 3;
                return (
                  <div
                    key={item.participanteId || idx}
                    className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 text-lg shadow-md ${
                      ehPodio
                        ? 'bg-[#6334E3]/50 border-[#00DDEB] text-[#FFFDF7] font-bold'
                        : 'bg-[#25104A] border-[#6334E3]/40 text-[#FFFDF7]/90'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                      <span
                        className={`w-10 h-10 shrink-0 rounded-2xl font-black text-sm md:text-base flex items-center justify-center shadow-md ${
                          item.posicao === 1
                            ? 'bg-[#FFE14D] text-[#25104A]'
                            : item.posicao === 2
                            ? 'bg-[#00DDEB] text-[#25104A]'
                            : item.posicao === 3
                            ? 'bg-[#FF4F9B] text-[#25104A]'
                            : 'bg-[#6334E3] text-[#FFFDF7]'
                        }`}
                      >
                        {item.posicao}º
                      </span>
                      <span className="font-extrabold text-lg md:text-2xl truncate min-w-0">
                        {item.nomeExibicao}
                      </span>
                    </div>

                    <span className="shrink-0 ml-2 font-mono font-black text-base md:text-2xl text-[#FFE14D]">
                      {item.pontos} pts
                    </span>
                  </div>
                );
              })}

              {(!ranking || ranking.length === 0) && (
                <p className="text-center text-[#FFFDF7]/70 italic py-8 text-lg">
                  Aguardando consolidação do ranking...
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default TelaProjecao;
