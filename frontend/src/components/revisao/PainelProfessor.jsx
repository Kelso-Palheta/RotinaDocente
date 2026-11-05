'use client';

import React from 'react';
import { BadgeConexao, BlocoConteudo, LETRAS_ALTERNATIVAS } from './revisaoUtils';

export function PainelProfessor({ estado, ocupado, erro, onAcao }) {
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

  const acaoBloqueada = Boolean(ocupado || conexao !== 'conectado');

  const ehUltimaRodada = (rodada?.numero || 1) >= (rodada?.total || 1);

  return (
    <div className="w-full min-h-screen bg-[#0c2423] text-slate-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho do Painel Docente */}
        <header className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-4 md:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-teal-900/80 text-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded border border-teal-700/50 uppercase tracking-wider">
                Painel do Professor
              </span>
              <BadgeConexao conexao={conexao} />
              {rodada?.numero && rodada?.total && (
                <span className="text-xs text-teal-300/80 font-medium">
                  Rodada {rodada.numero} de {rodada.total}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {sala.titulo || 'Revisão ao Vivo'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0b2b29] border border-teal-700/60 rounded-lg px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-semibold text-teal-300/70 tracking-widest block">
                Código da Sala
              </span>
              <span className="text-2xl font-mono font-extrabold text-teal-300 tracking-wider">
                {sala.codigo || '------'}
              </span>
            </div>
          </div>
        </header>

        {/* Alerta de Erro */}
        {erro && (
          <div
            role="alert"
            className="p-4 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-200 text-sm flex items-start gap-3 shadow-md"
          >
            <span className="font-bold text-rose-400">Erro:</span>
            <p className="flex-1">{erro}</p>
          </div>
        )}

        {/* Corpo Principal por Fase */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de Controle e Ações */}
          <section className="lg:col-span-1 bg-[#123c3a] border border-teal-800/40 rounded-xl p-5 space-y-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-teal-800/40 pb-3">
                <span className="text-xs text-teal-300/70 uppercase tracking-wider font-semibold">
                  Fase Atual
                </span>
                <h2 className="text-lg font-bold text-teal-200 capitalize mt-0.5">
                  {fase === 'espera' && 'Aguardando Início'}
                  {fase === 'conteudo' && 'Apresentação de Conteúdo'}
                  {fase === 'pergunta' && 'Pergunta em Andamento'}
                  {fase === 'encerrada' && 'Pergunta Encerrada'}
                  {fase === 'feedback' && 'Feedback e Gabarito'}
                  {fase === 'ranking' && 'Classificação da Rodada'}
                  {fase === 'finalizada' && 'Aulão Finalizado'}
                </h2>
              </div>

              {/* Botões de Ação por Fase */}
              <div className="space-y-3 pt-2">
                {fase === 'espera' && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('mostrar_conteudo')}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:outline-none"
                  >
                    Mostrar Conteúdo
                  </button>
                )}

                {fase === 'conteudo' && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('abrir_pergunta')}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
                  >
                    Abrir Pergunta
                  </button>
                )}

                {fase === 'pergunta' && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('encerrar_pergunta')}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
                  >
                    Encerrar Pergunta
                  </button>
                )}

                {fase === 'encerrada' && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('mostrar_feedback')}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:outline-none"
                  >
                    Mostrar Feedback
                  </button>
                )}

                {fase === 'feedback' && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('mostrar_ranking')}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:outline-none"
                  >
                    Mostrar Ranking
                  </button>
                )}

                {fase === 'ranking' && !ehUltimaRodada && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('proxima_rodada')}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:outline-none"
                  >
                    Próxima Rodada
                  </button>
                )}

                {fase === 'ranking' && ehUltimaRodada && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('finalizar')}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:outline-none"
                  >
                    Finalizar Aulão
                  </button>
                )}

                {fase === 'finalizada' && (
                  <div className="p-3 text-center rounded-lg bg-teal-950/60 border border-teal-800/40 text-teal-300 text-sm font-medium">
                    Aulão Concluído com Sucesso!
                  </div>
                )}
              </div>
            </div>

            {/* Informações de Participação */}
            {['pergunta', 'encerrada', 'feedback'].includes(fase) && (
              <div className="pt-4 border-t border-teal-800/40 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-teal-300/70 font-medium">Respostas Recebidas:</span>
                  <span className="font-bold text-white text-base">
                    {participacao.respondidos} / {participacao.total}
                  </span>
                </div>

                {/* Distribuição A–E com contagens numéricas */}
                <div className="space-y-1.5">
                  <span className="text-xs text-teal-300/70 uppercase font-semibold block">
                    Distribuição de Respostas:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {LETRAS_ALTERNATIVAS.map((letra) => {
                      const qtd = participacao?.distribuicao?.[letra] ?? 0;
                      return (
                        <div
                          key={letra}
                          className="bg-[#0c2423] border border-teal-800/50 rounded p-1.5"
                        >
                          <span className="text-xs font-bold text-teal-300 block">
                            {letra}: {qtd}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Coluna Central / Painel de Visualização do Conteúdo ou Questão */}
          <section className="lg:col-span-2 space-y-6">
            {/* Bloco de Conteúdo */}
            {fase === 'conteudo' && (
              <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-6 shadow-lg space-y-4">
                <div className="border-b border-teal-800/40 pb-2">
                  <span className="text-xs text-teal-300/70 uppercase tracking-wider font-semibold">
                    Conteúdo Preparatório
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {questao.tema || 'Tema da Rodada'}
                  </h3>
                </div>
                <div className="space-y-4">
                  {(rodada.conteudo || []).map((bloco, idx) => (
                    <BlocoConteudo key={idx} bloco={bloco} imagens={questao.imagens || []} />
                  ))}
                  {(!rodada.conteudo || rodada.conteudo.length === 0) && (
                    <p className="text-slate-400 italic text-sm">
                      Nenhum texto preparatório nesta rodada.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bloco da Pergunta e Alternativas */}
            {['pergunta', 'encerrada', 'feedback'].includes(fase) && (
              <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-6 shadow-lg space-y-5">
                <div className="flex justify-between items-start gap-4 border-b border-teal-800/40 pb-3">
                  <div>
                    <span className="text-xs text-teal-300/70 uppercase tracking-wider font-semibold">
                      Questão {rodada.numero} {questao.ano ? `• ENEM ${questao.ano}` : ''}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {questao.tema || 'Questão'}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-100 text-base leading-relaxed">
                  {questao.enunciado}
                </p>

                {questao.imagens && questao.imagens.length > 0 && (
                  <div className="my-3 flex flex-wrap gap-4 justify-center">
                    {questao.imagens.map((img, idx) => (
                      <BlocoConteudo key={idx} bloco={img} />
                    ))}
                  </div>
                )}

                {/* Alternativas */}
                <div className="space-y-2.5 pt-2">
                  {(questao.alternativas || []).map((alt) => {
                    const ehGabarito = fase === 'feedback' && feedback?.gabarito === alt.id;
                    return (
                      <div
                        key={alt.id}
                        className={`p-3 rounded-lg border text-sm transition ${
                          ehGabarito
                            ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-100 font-medium'
                            : 'bg-[#0c2423] border-teal-800/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              ehGabarito ? 'bg-emerald-500 text-emerald-950' : 'bg-teal-800/60 text-teal-200'
                            }`}
                          >
                            {alt.id}
                          </span>
                          <span className="flex-1">{alt.texto}</span>
                        </div>

                        {fase === 'feedback' && feedback?.explicacoes?.[alt.id] && (
                          <p className="mt-2 text-xs text-slate-300 pl-7 border-t border-teal-900/40 pt-1.5">
                            {feedback.explicacoes[alt.id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {fase === 'feedback' && feedback?.gabarito && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-600/70 rounded-lg text-emerald-200 text-sm font-semibold flex items-center gap-2">
                    <span>Gabarito Oficial: Alternativa {feedback.gabarito}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Respondentes (RV-04: lista delimitada, nomes sem alternativa) */}
            {['pergunta', 'encerrada', 'feedback'].includes(fase) && (
              <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex justify-between items-center border-b border-teal-800/40 pb-2">
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Estudantes que Responderam ({participacao.respondentes?.length || 0})
                  </h4>
                  <span className="text-xs text-teal-300/70">
                    Nomes anônimos quanto à alternativa escolhida
                  </span>
                </div>

                <div
                  data-testid="lista-respondentes"
                  className="max-h-52 overflow-y-auto pr-1 space-y-1.5 text-xs text-slate-200"
                >
                  {(participacao.respondentes || []).map((resp, idx) => (
                    <div
                      key={resp.id || resp.alunoId || idx}
                      className="px-2.5 py-1.5 bg-[#0c2423] rounded border border-teal-900/40 truncate"
                    >
                      {resp.nomeExibicao || resp.nome}
                    </div>
                  ))}
                  {(!participacao.respondentes || participacao.respondentes.length === 0) && (
                    <p className="text-slate-400 italic text-xs py-2">
                      Aguardando primeiras respostas dos estudantes...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bloco de Ranking */}
            {['ranking', 'finalizada'].includes(fase) && (
              <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-6 shadow-lg space-y-4">
                <div className="border-b border-teal-800/40 pb-2">
                  <h3 className="text-lg font-bold text-white">
                    Classificação Atual
                  </h3>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {ranking.map((item) => (
                    <div
                      key={item.participanteId}
                      className="flex items-center justify-between p-3 bg-[#0c2423] border border-teal-800/40 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-teal-800/60 font-bold text-teal-200 text-xs flex items-center justify-center">
                          {item.posicao}º
                        </span>
                        <span className="font-medium text-slate-100 truncate max-w-xs md:max-w-md">
                          {item.nomeExibicao}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-teal-300">
                        {item.pontos} pts
                      </span>
                    </div>
                  ))}
                  {ranking.length === 0 && (
                    <p className="text-slate-400 italic text-sm py-4 text-center">
                      Nenhuma pontuação registrada até o momento.
                    </p>
                  )}
                </div>
              </div>
            )}

            {fase === 'espera' && (
              <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-8 text-center shadow-lg space-y-3">
                <h3 className="text-xl font-bold text-white">
                  Aulão em Espera
                </h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  Compartilhe o código de acesso com os estudantes. Quando a turma estiver pronta, clique em &ldquo;Mostrar Conteúdo&rdquo; para iniciar.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default PainelProfessor;
