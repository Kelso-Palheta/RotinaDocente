'use client';

import React from 'react';
import { useCronometroRevisao } from './useCronometroRevisao';
import { BadgeConexao, BlocoConteudo, formatarTempo } from './revisaoUtils';

export function PainelAluno({
  estado,
  envio = { status: 'nao_enviado', alternativa: null },
  ocupado = false,
  erro = null,
  onResponder,
  onTentarNovamente,
}) {
  const sala = estado?.sala || {};
  const rodada = estado?.rodada || {};
  const questao = rodada?.questao || {};
  const feedback = estado?.feedback;
  const ranking = estado?.ranking || [];
  const fase = estado?.fase || 'espera';
  const conexao = estado?.conexao || 'conectando';

  const segundosRestantes = useCronometroRevisao(estado);

  const tempoEsgotado = fase === 'pergunta' && segundosRestantes <= 0;
  const estaDesconectado = conexao !== 'conectado';
  const envioAtivo = envio?.status === 'enviando';
  const envioConfirmado = envio?.status === 'confirmado';
  const envioFalha = envio?.status === 'falha';

  const alternativasBloqueadas = Boolean(
    ocupado ||
      estaDesconectado ||
      tempoEsgotado ||
      envioAtivo ||
      envioConfirmado ||
      envioFalha ||
      fase !== 'pergunta'
  );

  return (
    <div className="w-full min-h-screen bg-[#0c2423] text-slate-100 flex flex-col font-sans p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
      {/* Topo do Aluno: Sala, Rodada e Conexão */}
      <header className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-3.5 mb-4 shadow-md flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider block truncate">
            {sala.titulo || 'Revisão ENEM'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-sm font-extrabold text-white">
              {sala.codigo || '------'}
            </span>
            {rodada?.numero && rodada?.total && (
              <span className="text-xs text-teal-300/80 font-medium">
                • {rodada.numero}/{rodada.total}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <BadgeConexao conexao={conexao} />
        </div>
      </header>

      {/* Alertas de Erro ou Desconexão */}
      {(erro || envioFalha || estaDesconectado) && (
        <div className="space-y-3 mb-4">
          {estaDesconectado && (
            <div
              role="alert"
              className="p-3 bg-amber-950/80 border border-amber-700/80 rounded-lg text-amber-200 text-xs flex items-center gap-2"
            >
              <span className="font-bold">Aviso:</span>
              <span>Sem conexão com o servidor. Aguarde para responder.</span>
            </div>
          )}

          {(erro || envioFalha) && (
            <div
              role="alert"
              className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-lg text-rose-200 text-xs flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-400">Erro:</span>
                <p className="flex-1">
                  {erro || 'Ocorreu uma falha no envio da resposta.'}
                </p>
              </div>

              {envioFalha && envio?.alternativa && (
                <div className="flex items-center justify-between pt-1 border-t border-rose-900/60">
                  <span className="font-semibold text-rose-300 text-xs">
                    Sua escolha: Alternativa {envio.alternativa}
                  </span>
                  <button
                    type="button"
                    onClick={onTentarNovamente}
                    disabled={ocupado || estaDesconectado}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold rounded text-xs transition disabled:opacity-50"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Principal por Fase */}
      <main className="flex-1 flex flex-col justify-between space-y-4">
        {/* FASE: ESPERA */}
        {fase === 'espera' && (
          <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-6 text-center my-auto space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-teal-800/50 text-teal-300 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h2 className="text-xl font-bold text-white">
              Você está na sala!
            </h2>
            <p className="text-slate-300 text-sm">
              Aguardando o professor iniciar a revisão. Preste atenção na projeção!
            </p>
          </div>
        )}

        {/* FASE: CONTEUDO */}
        {fase === 'conteudo' && (
          <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="border-b border-teal-800/40 pb-2">
              <span className="text-xs text-teal-300 uppercase tracking-wider font-bold">
                Conteúdo de Apoio
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {questao.tema || 'Tópico da Rodada'}
              </h2>
            </div>

            <div className="space-y-4">
              {(rodada.conteudo || []).map((bloco, idx) => (
                <BlocoConteudo key={idx} bloco={bloco} imagens={questao.imagens || []} />
              ))}
            </div>
          </div>
        )}

        {/* FASE: PERGUNTA */}
        {fase === 'pergunta' && (
          <div className="space-y-4">
            {/* Barra de Cronômetro e Enunciado */}
            <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-4 shadow-md space-y-3">
              <div className="flex justify-between items-center border-b border-teal-800/40 pb-2">
                <span className="text-xs text-teal-300 font-bold uppercase tracking-wider">
                  Questão {rodada.numero}
                </span>

                {/* Timer Visual (aria-hidden para não poluir leitores de tela a cada segundo) */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Tempo:</span>
                  <span
                    data-testid="timer-visual-segundos"
                    aria-hidden="true"
                    className={`font-mono text-sm font-bold ${
                      segundosRestantes <= 10 ? 'text-rose-400 animate-pulse' : 'text-teal-300'
                    }`}
                  >
                    {formatarTempo(segundosRestantes)}
                  </span>
                </div>
              </div>

              <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed">
                {questao.enunciado}
              </p>

              {questao.imagens && questao.imagens.length > 0 && (
                <div className="my-2">
                  {questao.imagens.map((img, idx) => (
                    <BlocoConteudo key={idx} bloco={img} />
                  ))}
                </div>
              )}
            </div>

            {tempoEsgotado && (
              <p role="status" className="text-sm text-amber-200">
                Tempo encerrado. Aguarde a explicação do professor.
              </p>
            )}

            {/* Status do Envio */}
            {envioAtivo && (
              <div
                role="status"
                className="p-3 bg-teal-950/80 border border-teal-700/80 rounded-lg text-teal-200 text-xs flex items-center justify-center gap-2 font-medium"
              >
                <span className="w-3 h-3 border-2 border-teal-300 border-t-transparent rounded-full animate-spin" />
                <span>Enviando resposta...</span>
              </div>
            )}

            {envioConfirmado && (
              <div
                role="status"
                className="p-3 bg-emerald-950/80 border border-emerald-600/80 rounded-lg text-emerald-200 text-xs text-center font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>✓ Resposta confirmada: Alternativa {envio.alternativa}</span>
              </div>
            )}

            {/* Lista de Alternativas (Botões acessíveis com min-h de 44px) */}
            <div className="space-y-2.5">
              {(questao.alternativas || []).map((alt) => {
                const foiSelecionada = envio?.alternativa === alt.id;
                return (
                  <button
                    key={alt.id}
                    type="button"
                    disabled={alternativasBloqueadas}
                    onClick={() => onResponder && onResponder(alt.id)}
                    aria-pressed={foiSelecionada}
                    className={`w-full min-h-[48px] p-3 rounded-xl border text-left text-sm transition flex items-start gap-3 focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:outline-none ${
                      foiSelecionada && envioConfirmado
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100 font-semibold shadow'
                        : foiSelecionada && envioAtivo
                        ? 'bg-teal-950/90 border-teal-500 text-teal-100 font-semibold'
                        : 'bg-[#123c3a] hover:bg-[#154644] border-teal-800/50 text-slate-200 active:scale-[0.99]'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        foiSelecionada
                          ? 'bg-teal-400 text-teal-950 font-black'
                          : 'bg-teal-900/60 text-teal-200'
                      }`}
                    >
                      {alt.id}
                    </span>
                    <span className="pt-0.5 leading-snug flex-1">
                      {alt.id}) {alt.texto}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FASE: ENCERRADA */}
        {fase === 'encerrada' && (
          <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-6 text-center space-y-3 shadow-lg my-auto">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Tempo Encerrado
            </span>
            <h2 className="text-xl font-bold text-white">
              Pergunta Encerrada
            </h2>
            <p className="text-slate-300 text-sm">
              {envioConfirmado
                ? `Você respondeu Alternativa ${envio.alternativa}. Aguarde a explicação e a revelação do gabarito!`
                : 'Aguarde o professor exibir o gabarito e os comentários.'}
            </p>
          </div>
        )}

        {/* FASE: FEEDBACK */}
        {fase === 'feedback' && (
          <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="border-b border-teal-800/40 pb-3">
              <span className="text-xs text-teal-300 font-bold uppercase tracking-wider">
                Correção • Questão {rodada.numero}
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                Gabarito Oficial: Alternativa {feedback?.gabarito || '—'}
              </h2>

              {envioConfirmado && feedback?.gabarito && (
                <div className="mt-2 text-xs font-bold">
                  {envio.alternativa === feedback.gabarito ? (
                    <span className="text-emerald-400">✓ Você acertou!</span>
                  ) : (
                    <span className="text-rose-400">
                      ✗ Você marcou Alternativa {envio.alternativa}.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Comentários das Alternativas */}
            <div className="space-y-2.5">
              {(questao.alternativas || []).map((alt) => {
                const ehGabarito = feedback?.gabarito === alt.id;
                const explicacao = feedback?.explicacoes?.[alt.id];

                return (
                  <div
                    key={alt.id}
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      ehGabarito
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-100 font-medium'
                        : 'bg-[#0c2423] border-teal-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ehGabarito
                            ? 'bg-emerald-500 text-emerald-950 font-black'
                            : 'bg-teal-900/60 text-teal-200'
                        }`}
                      >
                        {alt.id}
                      </span>
                      <span className="font-semibold">{alt.texto}</span>
                    </div>
                    {explicacao && (
                      <p className="mt-1.5 pl-6 text-slate-300 border-t border-teal-900/30 pt-1">
                        {explicacao}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FASE: RANKING & FINALIZADA */}
        {(fase === 'ranking' || fase === 'finalizada') && (
          <div className="bg-[#123c3a] border border-teal-800/40 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="border-b border-teal-800/40 pb-2 text-center">
              <span className="text-xs text-teal-300 font-bold uppercase tracking-wider">
                {fase === 'finalizada' ? 'Resultado Final' : 'Classificação'}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {fase === 'finalizada' ? 'Aulão Finalizado' : 'Quadro de Pontuação'}
              </h2>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-sm">
              {ranking.map((item, idx) => (
                <div
                  key={item.participanteId || idx}
                  className="flex items-center justify-between p-2.5 bg-[#0c2423] border border-teal-800/40 rounded-lg"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-6 h-6 rounded-full bg-teal-800/60 font-bold text-teal-200 text-xs flex items-center justify-center shrink-0">
                      {item.posicao}º
                    </span>
                    <span className="font-medium text-slate-100 truncate">
                      {item.nomeExibicao}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-teal-300 text-xs shrink-0">
                    {item.pontos} pts
                  </span>
                </div>
              ))}
              {ranking.length === 0 && (
                <p className="text-slate-400 italic text-center py-4 text-xs">
                  Aguardando pontuação...
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PainelAluno;
