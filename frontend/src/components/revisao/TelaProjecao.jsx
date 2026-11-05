'use client';

import React from 'react';
import { useCronometroRevisao } from './useCronometroRevisao';
import { BadgeConexao, BlocoConteudo, formatarTempo, LETRAS_ALTERNATIVAS } from './revisaoUtils';

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
    <div className="w-full min-h-screen bg-[#081a19] text-slate-100 p-6 md:p-10 lg:p-12 flex flex-col justify-between font-sans select-none">
      {/* Topo da Projeção */}
      <header className="flex items-center justify-between border-b border-teal-800/40 pb-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-3 h-10 bg-teal-400 rounded-full" aria-hidden="true" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {sala.titulo || 'Grande Aulão ENEM'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {rodada?.numero && rodada?.total && (
                <span className="text-teal-300 font-semibold text-sm uppercase tracking-wider">
                  Rodada {rodada.numero} de {rodada.total}
                </span>
              )}
              {questao?.tema && (
                <span className="text-slate-400 text-sm">
                  • {questao.tema}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <BadgeConexao conexao={conexao} />
          {fase !== 'espera' && (
            <div className="bg-[#123c3a] border border-teal-600/50 rounded-xl px-5 py-2 text-right shadow-inner">
              <span className="text-xs text-teal-300/80 uppercase font-semibold tracking-widest block">
                Código de Acesso
              </span>
              <span className="text-2xl md:text-3xl font-mono font-black text-teal-300 tracking-wider">
                {sala.codigo || '------'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Área Central Projetada */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full my-auto">
        {/* FASE: ESPERA */}
        {fase === 'espera' && (
          <section className="text-center py-12 space-y-8 animate-fade-in">
            <div className="inline-block bg-[#123c3a]/80 border-2 border-teal-500/60 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-md max-w-2xl mx-auto">
              <span className="text-sm md:text-base text-teal-300 font-bold uppercase tracking-widest block mb-2">
                Entre no Portal e digite o código
              </span>
              <div className="text-6xl md:text-8xl font-mono font-black text-white tracking-widest py-4 drop-shadow-md">
                {sala.codigo || 'ARTE42'}
              </div>
              <p className="text-slate-300 text-lg md:text-xl font-medium mt-2">
                Aguardando início do aulão pelo professor...
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 text-teal-200 text-lg font-semibold">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span>{participacao.total} participantes conectados</span>
            </div>
          </section>
        )}

        {/* FASE: CONTEUDO */}
        {fase === 'conteudo' && (
          <section className="bg-[#123c3a]/90 border border-teal-700/40 rounded-2xl p-8 md:p-12 shadow-2xl space-y-6 max-w-5xl mx-auto w-full">
            <div className="border-b border-teal-700/50 pb-4">
              <span className="text-teal-400 text-sm uppercase tracking-widest font-bold">
                Conteúdo de Revisão
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mt-1">
                {questao.tema || 'Tópico da Rodada'}
              </h2>
            </div>

            <div className="space-y-6 text-slate-100 text-lg md:text-xl leading-relaxed">
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
            <div className="lg:col-span-2 bg-[#123c3a]/90 border border-teal-700/40 rounded-2xl p-8 shadow-2xl space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-teal-900/80 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-700/50 uppercase tracking-wider">
                    Questão {rodada.numero}
                  </span>
                  {fase === 'encerrada' && (
                    <span className="bg-amber-950/90 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-700/60 uppercase tracking-wider animate-pulse">
                      Pergunta Encerrada
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
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
                {(questao.alternativas || []).map((alt) => (
                  <div
                    key={alt.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-[#0b2624] border border-teal-800/40 text-base md:text-lg text-slate-200"
                  >
                    <span className="w-8 h-8 rounded-lg bg-teal-800/80 font-black text-teal-200 text-base flex items-center justify-center shrink-0">
                      {alt.id}
                    </span>
                    <span className="pt-0.5 font-medium leading-snug">{alt.texto}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lado Direito: Cronômetro, Distribuição A–E e Respondentes */}
            <div className="lg:col-span-1 space-y-6">
              {/* Timer Visual */}
              {fase === 'pergunta' && (
                <div className="bg-[#123c3a]/90 border border-teal-700/40 rounded-2xl p-6 text-center shadow-2xl">
                  <span className="text-xs text-teal-300/80 uppercase font-bold tracking-widest block mb-1">
                    Tempo Restante
                  </span>
                  <div
                    data-testid="projecao-timer"
                    aria-hidden="true"
                    className={`text-5xl md:text-6xl font-mono font-black tracking-tight ${
                      segundosRestantes <= 10 ? 'text-rose-400 animate-pulse' : 'text-teal-300'
                    }`}
                  >
                    {formatarTempo(segundosRestantes)}
                  </div>
                </div>
              )}

              {/* Estatísticas e Distribuição A–E com valores numéricos */}
              <div className="bg-[#123c3a]/90 border border-teal-700/40 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-teal-700/40 pb-3">
                  <span className="text-sm text-teal-300/80 uppercase font-bold">
                    Participação
                  </span>
                  <span className="text-lg font-bold text-white">
                    {participacao.respondidos} / {participacao.total} responderam
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-teal-300/70 font-semibold uppercase block">
                    Distribuição das Respostas:
                  </span>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {LETRAS_ALTERNATIVAS.map((letra) => {
                      const qtd = participacao?.distribuicao?.[letra] ?? 0;
                      return (
                        <div
                          key={letra}
                          className="bg-[#0b2624] border border-teal-800/50 rounded-lg p-2.5"
                        >
                          <span className="text-xs text-slate-400 block font-bold">
                            {letra}
                          </span>
                          <span className="text-lg font-mono font-extrabold text-teal-300 block">
                            {letra}: {qtd}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RV-04: Lista de Respondentes (nomes mostrados SEM alternativa) */}
              <div className="bg-[#123c3a]/90 border border-teal-700/40 rounded-2xl p-6 shadow-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-teal-700/40 pb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Já Responderam
                  </h3>
                  <span className="text-xs font-mono font-semibold text-teal-300">
                    {participacao.respondentes?.length || 0} alunos
                  </span>
                </div>

                <div
                  data-testid="projecao-respondentes"
                  className="max-h-56 overflow-y-auto pr-1 flex flex-wrap gap-2 text-xs text-slate-200"
                >
                  {(participacao.respondentes || []).map((resp, idx) => (
                    <span
                      key={resp.id || resp.alunoId || idx}
                      className="px-3 py-1 bg-[#0b2624] border border-teal-800/40 rounded-full font-medium truncate max-w-full"
                    >
                      {resp.nomeExibicao || resp.nome}
                    </span>
                  ))}
                  {(!participacao.respondentes || participacao.respondentes.length === 0) && (
                    <span className="text-slate-400 italic py-2">
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
          <section className="bg-[#123c3a]/90 border border-teal-700/40 rounded-2xl p-8 md:p-12 shadow-2xl space-y-8 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-700/50 pb-4">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
                  Correção Pedagógica • Questão {rodada.numero}
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                  Gabarito Oficial: Alternativa {feedback?.gabarito || '—'}
                </h2>
              </div>
            </div>

            <p className="text-slate-200 text-lg leading-relaxed font-medium">
              {questao.enunciado}
            </p>

            {/* Explicações para as 5 alternativas A–E */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-teal-300/80 uppercase tracking-wider">
                Comentário de Cada Alternativa:
              </h3>
              <div className="space-y-3">
                {(questao.alternativas || []).map((alt) => {
                  const ehGabarito = feedback?.gabarito === alt.id;
                  const explicacao = feedback?.explicacoes?.[alt.id];

                  return (
                    <div
                      key={alt.id}
                      className={`p-4 md:p-5 rounded-xl border text-base transition ${
                        ehGabarito
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-lg'
                          : 'bg-[#0b2624] border-teal-800/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-7 h-7 rounded-md font-bold text-sm flex items-center justify-center shrink-0 ${
                            ehGabarito
                              ? 'bg-emerald-500 text-emerald-950 font-black'
                              : 'bg-teal-800/60 text-teal-200'
                          }`}
                        >
                          {alt.id}
                        </span>
                        <div className="space-y-1.5 flex-1">
                          <p className="font-semibold">{alt.texto}</p>
                          {explicacao && (
                            <p
                              className={`text-sm md:text-base leading-relaxed ${
                                ehGabarito ? 'text-emerald-200 font-medium' : 'text-slate-300'
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
          <section className="bg-[#123c3a]/90 border border-teal-700/40 rounded-2xl p-8 md:p-12 shadow-2xl space-y-6 max-w-4xl mx-auto w-full">
            <div className="text-center border-b border-teal-700/40 pb-4">
              <span className="text-xs md:text-sm font-bold text-teal-400 uppercase tracking-widest block">
                {fase === 'finalizada' ? 'Aulão Finalizado' : `Resultado Parcial • Rodada ${rodada.numero}`}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-1">
                Classificação Geral
              </h2>
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
              {ranking.map((item, idx) => {
                const ehPodio = item.posicao <= 3;
                return (
                  <div
                    key={item.participanteId || idx}
                    className={`flex items-center justify-between p-4 md:p-5 rounded-xl border text-lg ${
                      ehPodio
                        ? 'bg-teal-900/60 border-teal-500/70 text-white font-semibold'
                        : 'bg-[#0b2624] border-teal-800/40 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-9 h-9 rounded-full font-black text-sm md:text-base flex items-center justify-center ${
                          item.posicao === 1
                            ? 'bg-amber-400 text-amber-950 shadow-md'
                            : item.posicao === 2
                            ? 'bg-slate-300 text-slate-900 shadow-md'
                            : item.posicao === 3
                            ? 'bg-amber-700 text-white shadow-md'
                            : 'bg-teal-800/60 text-teal-200'
                        }`}
                      >
                        {item.posicao}º
                      </span>
                      <span className="font-bold text-base md:text-xl truncate max-w-sm md:max-w-lg">
                        {item.nomeExibicao}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-teal-300 text-lg md:text-2xl">
                      {item.pontos} pts
                    </span>
                  </div>
                );
              })}

              {ranking.length === 0 && (
                <p className="text-slate-400 italic text-center py-8">
                  Nenhum dado de ranking registrado.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Rodapé da Projeção */}
      <footer className="mt-6 pt-4 border-t border-teal-800/40 flex justify-between items-center text-xs text-slate-400">
        <span>Rotina Docente • Revisão ao Vivo</span>
        <span>ENEM Arte & Cultura</span>
      </footer>
    </div>
  );
}

export default TelaProjecao;
