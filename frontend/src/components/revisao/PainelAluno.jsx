'use client';

import React from 'react';
import { useCronometroRevisao } from './useCronometroRevisao';
import { BadgeConexao, BlocoConteudo, formatarTempo } from './revisaoUtils';
import { CORES_ALTERNATIVAS, temaStyles } from './RevisaoTema';

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
    <div
      data-tema="vibrante"
      className={`w-full min-h-screen text-[#FFFDF7] flex flex-col font-sans p-3 sm:p-4 md:p-6 max-w-2xl mx-auto ${temaStyles.palco}`}
      style={{ backgroundColor: '#25104A' }}
    >
      {/* Topo do Aluno: Sala, Rodada e Conexão */}
      <header className="bg-[#6334E3]/30 border-2 border-[#6334E3]/60 rounded-2xl p-3.5 mb-4 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-extrabold text-[#00DDEB] tracking-wider block truncate">
            {sala.titulo || 'Festival ENEM Arte'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-sm font-black text-[#FFE14D] tracking-wide">
              {sala.codigo || '------'}
            </span>
            {rodada?.numero && rodada?.total && (
              <span className="text-xs text-[#FFFDF7]/80 font-bold">
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
              className="p-3 bg-amber-950/90 border-2 border-[#FFE14D] rounded-xl text-[#FFE14D] text-xs flex items-center gap-2 shadow-lg"
            >
              <span className="font-bold">Aviso:</span>
              <span>Sem conexão com o servidor. Aguarde para responder.</span>
            </div>
          )}

          {(erro || envioFalha) && (
            <div
              role="alert"
              className="p-3.5 bg-rose-950/90 border-2 border-[#FF4F9B] rounded-xl text-[#FFFDF7] text-xs flex flex-col gap-2 shadow-lg"
            >
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#FF4F9B]">Erro:</span>
                <p className="flex-1">
                  {erro || 'Ocorreu uma falha no envio da resposta.'}
                </p>
              </div>

              {envioFalha && envio?.alternativa && (
                <div className="flex items-center justify-between pt-1 border-t border-rose-900/60">
                  <span className="font-semibold text-[#FF4F9B] text-xs">
                    Sua escolha: Alternativa {envio.alternativa}
                  </span>
                  <button
                    type="button"
                    onClick={onTentarNovamente}
                    disabled={ocupado || estaDesconectado}
                    className="px-3.5 py-1.5 bg-[#FF4F9B] hover:bg-[#FF80B6] active:scale-95 text-[#25104A] font-extrabold rounded-lg text-xs transition disabled:opacity-50 shadow"
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
      <main key={`${sala.id || ""}:${rodada.id || ""}:${fase}`} className={`${temaStyles.animacaoEntrada} flex-1 flex flex-col justify-between space-y-4`}>
        {/* FASE: ESPERA */}
        {fase === 'espera' && (
          <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/70 rounded-3xl p-8 text-center my-auto space-y-5 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-[#FFE14D] text-[#25104A] flex items-center justify-center mx-auto text-2xl font-black shadow-lg transform rotate-3">
              ★
            </div>
            <h2 className="text-2xl font-black text-[#FFFDF7] tracking-tight">
              Você está na sala!
            </h2>
            <p className="text-[#FFFDF7]/90 text-sm max-w-sm mx-auto leading-relaxed">
              Aguardando o professor iniciar a revisão. Preste atenção na projeção!
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00DDEB]/20 border border-[#00DDEB]/50 text-[#00DDEB] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00DDEB] animate-ping" />
              Sintonizado no Aulão
            </div>
          </div>
        )}

        {/* FASE: CONTEUDO */}
        {fase === 'conteudo' && (
          <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            <div className="border-b border-[#6334E3]/40 pb-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#00DDEB] uppercase tracking-widest font-black">
                  Conteúdo de Apoio
                </span>
                <h2 className="text-lg font-extrabold text-[#FFFDF7] mt-0.5">
                  {questao.tema || 'Tópico da Rodada'}
                </h2>
              </div>
              <span className="text-xl">🎨</span>
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
            <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-2xl p-4 md:p-5 shadow-xl space-y-3.5 backdrop-blur-md">
              <div className="flex justify-between items-center border-b border-[#6334E3]/40 pb-2.5">
                <span className="text-xs text-[#FFE14D] font-extrabold uppercase tracking-wider bg-[#FFE14D]/20 px-2.5 py-0.5 rounded-md border border-[#FFE14D]/40">
                  Questão {rodada.numero}
                </span>

                {/* Timer Visual (aria-hidden para não poluir leitores de tela a cada segundo) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#FFFDF7]/70 font-semibold">Tempo:</span>
                  <span
                    data-testid="timer-visual-segundos"
                    aria-hidden="true"
                    className={`font-mono text-base font-black px-2.5 py-0.5 rounded-md ${
                      segundosRestantes <= 10
                        ? 'bg-[#FF4F9B] text-[#25104A] animate-pulse'
                        : 'bg-[#00DDEB]/20 text-[#00DDEB] border border-[#00DDEB]/50'
                    }`}
                  >
                    {formatarTempo(segundosRestantes)}
                  </span>
                </div>
              </div>

              <p className="text-sm md:text-base text-[#FFFDF7] font-medium leading-relaxed">
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
              <p role="status" className="text-sm text-[#FFE14D] font-bold bg-[#FFE14D]/10 p-3 rounded-xl border border-[#FFE14D]/40 text-center">
                Tempo encerrado. Aguarde a explicação do professor.
              </p>
            )}

            {/* Status do Envio */}
            {envioAtivo && (
              <div
                role="status"
                className="p-3 bg-[#6334E3]/50 border-2 border-[#00DDEB] rounded-xl text-[#00DDEB] text-xs flex items-center justify-center gap-2 font-bold shadow-md"
              >
                <span className="w-3.5 h-3.5 border-2 border-[#00DDEB] border-t-transparent rounded-full animate-spin" />
                <span>Enviando resposta...</span>
              </div>
            )}

            {envioConfirmado && (
              <div
                role="status"
                className={`p-3 bg-[#6334E3]/40 border-2 border-[#00DDEB] rounded-xl text-[#00DDEB] text-xs text-center font-extrabold flex items-center justify-center gap-2 shadow-lg ${temaStyles.confirmadoAnimado}`}
              >
                <span>✓ Resposta confirmada: Alternativa {envio.alternativa}</span>
              </div>
            )}

            {/* Lista de Alternativas (Botões acessíveis com min-h de 48px) */}
            <div className="space-y-3">
              {(questao.alternativas || []).map((alt) => {
                const foiSelecionada = envio?.alternativa === alt.id;
                const corBadge = CORES_ALTERNATIVAS[alt.id] || {
                  bg: '#FFE14D',
                  text: '#25104A',
                };

                return (
                  <button
                    key={alt.id}
                    type="button"
                    disabled={alternativasBloqueadas}
                    onClick={() => onResponder && onResponder(alt.id)}
                    aria-pressed={foiSelecionada}
                    className={`w-full min-h-[50px] p-3.5 rounded-2xl border-2 text-left text-sm transition-all flex items-start gap-3.5 focus-visible:ring-4 focus-visible:ring-[#00DDEB] focus-visible:outline-none ${
                      foiSelecionada && envioConfirmado
                        ? 'bg-[#6334E3]/70 border-[#00DDEB] text-[#FFFDF7] font-bold shadow-xl scale-[1.01]'
                        : foiSelecionada && envioAtivo
                        ? 'bg-[#6334E3]/60 border-[#FFE14D] text-[#FFFDF7] font-bold'
                        : 'bg-[#25104A]/90 hover:bg-[#6334E3]/40 border-[#6334E3]/50 text-[#FFFDF7] active:scale-[0.99] shadow-md'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <span
                      data-testid={`badge-alternativa-${alt.id}`}
                      aria-hidden="true"
                      style={{
                        backgroundColor: corBadge.bg,
                        color: corBadge.text,
                      }}
                      className="w-8 h-8 rounded-xl text-sm font-black flex items-center justify-center shrink-0 shadow-md"
                    >
                      {alt.id}
                    </span>
                    <span className="pt-1 leading-snug flex-1 font-medium">
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
          <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/70 rounded-3xl p-6 text-center space-y-4 shadow-2xl my-auto backdrop-blur-md">
            <span className="text-xs uppercase font-extrabold text-[#FFE14D] tracking-widest bg-[#FFE14D]/20 px-3 py-1 rounded-full border border-[#FFE14D]/40 inline-block">
              Tempo Encerrado
            </span>
            <h2 className="text-2xl font-black text-[#FFFDF7]">
              Pergunta Encerrada
            </h2>
            <p className="text-[#FFFDF7]/90 text-sm leading-relaxed max-w-sm mx-auto">
              {envioConfirmado
                ? `Você respondeu Alternativa ${envio.alternativa}. Aguarde a explicação e a revelação do gabarito!`
                : 'Aguarde o professor exibir o gabarito e os comentários.'}
            </p>
          </div>
        )}

        {/* FASE: FEEDBACK */}
        {fase === 'feedback' && (
          <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/70 rounded-2xl p-5 space-y-4 shadow-2xl backdrop-blur-md">
            <div className="border-b border-[#6334E3]/40 pb-3">
              <span className="text-xs text-[#00DDEB] font-extrabold uppercase tracking-widest block">
                Correção Pedagógica • Questão {rodada.numero}
              </span>
              <h2 className="text-xl font-black text-[#FFFDF7] mt-1">
                Gabarito Oficial: Alternativa {feedback?.gabarito || '—'}
              </h2>

              {envioConfirmado && feedback?.gabarito && (
                <div className="mt-2.5 text-xs font-extrabold">
                  {envio.alternativa === feedback.gabarito ? (
                    <span className="text-[#B7F247] bg-[#B7F247]/20 px-3 py-1 rounded-lg border border-[#B7F247]/50 inline-block">
                      ✓ Você acertou!
                    </span>
                  ) : (
                    <span className="text-[#25104A] bg-[#FF4F9B] px-3 py-1 rounded-lg border border-[#FF4F9B]/50 inline-block">
                      ✗ Você marcou Alternativa {envio.alternativa}.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Comentários das Alternativas */}
            <div className="space-y-3">
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
                    className={`p-3.5 rounded-2xl border-2 transition ${
                      ehGabarito
                        ? 'bg-[#B7F247]/20 border-[#B7F247] text-[#FFFDF7]'
                        : 'bg-[#25104A]/80 border-[#6334E3]/40 text-[#FFFDF7]/90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        style={{
                          backgroundColor: ehGabarito ? '#B7F247' : corBadge.bg,
                          color: '#25104A',
                        }}
                        className="w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 shadow"
                      >
                        {alt.id}
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-sm font-semibold">{alt.texto}</p>
                        {explicacao && (
                          <p className="text-xs text-[#FFFDF7]/80 pt-1 border-t border-[#6334E3]/30 leading-relaxed">
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
        )}

        {/* FASE: RANKING / FINALIZADA */}
        {['ranking', 'finalizada'].includes(fase) && (
          <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/70 rounded-3xl p-6 text-center space-y-5 shadow-2xl my-auto backdrop-blur-md">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#FFE14D] bg-[#FFE14D]/20 px-3 py-1 rounded-full border border-[#FFE14D]/40">
                Classificação
              </span>
              <h2 className="text-2xl font-black text-[#FFFDF7] mt-2">
                Quadro de Pontuação
              </h2>
            </div>

            {ranking && ranking.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-left">
                {ranking.map((item, idx) => (
                  <div
                    key={item.participanteId || idx}
                    data-posicao={item.posicao}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      item.posicao === 1
                        ? 'bg-[#FFE14D]/20 border-[#FFE14D] text-[#FFFDF7] font-bold'
                        : item.posicao === 2
                        ? 'bg-[#00DDEB]/20 border-[#00DDEB] text-[#FFFDF7]'
                        : item.posicao === 3
                        ? 'bg-[#FF4F9B]/20 border-[#FF4F9B] text-[#FFFDF7]'
                        : 'bg-[#25104A] border-[#6334E3]/40 text-[#FFFDF7]/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#6334E3]/60 font-black text-[11px] flex items-center justify-center text-[#FFFDF7]">
                        {item.posicao || idx + 1}º
                      </span>
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">
                        {item.nomeExibicao}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-[#FFE14D]">
                      {item.pontos} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#FFFDF7]/70 italic py-4">
                Aguardando consolidação dos resultados...
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PainelAluno;
