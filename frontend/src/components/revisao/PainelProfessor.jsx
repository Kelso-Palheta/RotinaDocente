'use client';

import { MarcaFestival } from './MarcaFestival';
import React from 'react';
import { BadgeConexao, BlocoConteudo, LETRAS_ALTERNATIVAS } from './revisaoUtils';
import { CORES_ALTERNATIVAS, temaStyles } from './RevisaoTema';
import { PodioRevisao } from './PodioRevisao';
import { BlocoAulaTematica } from './BlocoAulaTematica';

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
    <div
      data-tema="vibrante"
      className={`w-full min-h-screen text-[#FFFDF7] p-4 md:p-6 lg:p-8 font-sans ${temaStyles.palco}`}
      style={{ backgroundColor: '#25104A' }}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="festival-moldura rounded-2xl px-3 py-1"><MarcaFestival /></div>
        {/* Cabeçalho do Painel Docente */}
        <header className="arte-banner-festival bg-[#6334E3]/30 border-2 border-[#6334E3]/60 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-[#6334E3] text-[#FFFDF7] text-xs font-black px-3 py-1 rounded-full border border-[#00DDEB]/50 uppercase tracking-widest">
                Painel do Professor
              </span>
              <BadgeConexao conexao={conexao} />
              {rodada?.numero && rodada?.total && (
                <span className="text-xs text-[#FFE14D] font-extrabold bg-[#FFE14D]/20 px-3 py-0.5 rounded-full border border-[#FFE14D]/40">
                  Rodada {rodada.numero} de {rodada.total}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#FFFDF7] tracking-tight">
              {sala.titulo || 'Revisão ao Vivo'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#25104A]/90 border-2 border-[#00DDEB] rounded-2xl px-5 py-2.5 text-center shadow-lg">
              <span className="text-[10px] uppercase font-black text-[#00DDEB] tracking-widest block">
                Código da Sala
              </span>
              <span className="text-2xl font-mono font-black text-[#FFE14D] tracking-wider">
                {sala.codigo || '------'}
              </span>
            </div>
          </div>
        </header>

        {/* Fita de Etapas da Metodologia Arte em Jogo */}
        <div className="bg-[#431099] border border-[#A78BFA] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FFFDF7]">
            <span className="text-[#00DDEB]">👤 Controle de Etapas</span>
            <span className="text-[#6334E3]">|</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto py-1">
            <span
              className={`px-3 py-1 rounded-full transition ${
                fase === 'conteudo'
                  ? 'bg-[#00DDEB] text-[#25104A] font-black shadow'
                  : 'text-[#FFFDF7]/70'
              }`}
            >
              Conteúdo
            </span>
            <span className="text-[#6334E3]">→</span>
            <span
              className={`px-3 py-1 rounded-full transition ${
                ['pergunta', 'encerrada'].includes(fase)
                  ? 'bg-[#00DDEB] text-[#25104A] font-black shadow'
                  : 'text-[#FFFDF7]/70'
              }`}
            >
              Pergunta
            </span>
            <span className="text-[#6334E3]">→</span>
            <span
              className={`px-3 py-1 rounded-full transition ${
                fase === 'feedback'
                  ? 'bg-[#00DDEB] text-[#25104A] font-black shadow'
                  : 'text-[#FFFDF7]/70'
              }`}
            >
              Explicação
            </span>
            <span className="text-[#6334E3]">→</span>
            <span
              className={`px-3 py-1 rounded-full transition ${
                ['ranking', 'finalizada'].includes(fase)
                  ? 'bg-[#00DDEB] text-[#25104A] font-black shadow'
                  : 'text-[#FFFDF7]/70'
              }`}
            >
              Ranking
            </span>
          </div>
          {fase === 'pergunta' && (
            <button
              type="button"
              disabled={acaoBloqueada}
              onClick={() => onAcao('encerrar_pergunta')}
              className="py-2.5 px-4 rounded-xl font-black bg-[#FF4F9B] hover:bg-[#FF80B6] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
            >
              Encerrar Pergunta
            </button>
          )}
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-950/90 border-2 border-[#FF4F9B] text-[#FFFDF7] text-sm flex items-start gap-3 shadow-lg"
          >
            <span className="font-black text-[#FF4F9B]">Erro:</span>
            <p className="flex-1 font-medium">{erro}</p>
          </div>
        )}

        {/* Corpo Principal por Fase */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de Controle e Ações */}
          <section className="lg:col-span-1 bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col justify-between backdrop-blur-md">
            <div className="space-y-4">
              <div className="border-b border-[#6334E3]/40 pb-3">
                <span className="text-xs text-[#00DDEB] uppercase tracking-widest font-black">
                  Fase Atual
                </span>
                <h2 className="text-xl font-black text-[#FFE14D] capitalize mt-0.5">
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
                    className="w-full py-3.5 px-4 rounded-xl font-black bg-[#00DDEB] hover:bg-[#54EEF8] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                  >
                    Mostrar Conteúdo
                  </button>
                )}

                {fase === 'conteudo' && !estado?.aula && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('abrir_pergunta')}
                    className="w-full py-3.5 px-4 rounded-xl font-black bg-[#B7F247] hover:bg-[#D0F87E] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                  >
                    Abrir Pergunta
                  </button>
                )}

                {fase === 'conteudo' && estado?.aula && (
                  <div className="space-y-2">
                    {!estado.aula.ultimoBloco ? (
                      <button
                        type="button"
                        disabled={acaoBloqueada}
                        onClick={() => onAcao('avancar_conteudo')}
                        className="w-full py-3.5 px-4 rounded-xl font-black bg-[#00DDEB] hover:bg-[#54EEF8] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                      >
                        Avançar Bloco
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={acaoBloqueada}
                        onClick={() => onAcao('abrir_pergunta')}
                        className="w-full py-3.5 px-4 rounded-xl font-black bg-[#B7F247] hover:bg-[#D0F87E] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                      >
                        Concluir Aula e Abrir Pergunta
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={acaoBloqueada || estado.aula.indiceBloco === 0}
                      onClick={() => onAcao('voltar_conteudo')}
                      className="w-full py-2.5 px-4 rounded-xl font-bold bg-[#25104A] hover:bg-[#6334E3]/40 border border-[#6334E3]/60 text-[#FFFDF7] transition disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                    >
                      ← Voltar Bloco
                    </button>
                  </div>
                )}

                {fase === 'encerrada' && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('mostrar_feedback')}
                    className="w-full py-3.5 px-4 rounded-xl font-black bg-[#00DDEB] hover:bg-[#54EEF8] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                  >
                    Mostrar Feedback
                  </button>
                )}

                {fase === 'feedback' && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('mostrar_ranking')}
                    className="w-full py-3.5 px-4 rounded-xl font-black bg-[#FF8A3D] hover:bg-[#FFAA70] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                  >
                    Mostrar Ranking
                  </button>
                )}

                {fase === 'ranking' && !ehUltimaRodada && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao(estado?.proximaAcao || 'proxima_rodada')}
                    className="w-full py-3.5 px-4 rounded-xl font-black bg-[#00DDEB] hover:bg-[#54EEF8] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                  >
                    {estado?.textoProximaAcao ||
                      (estado?.aula ? 'Iniciar Próxima Pergunta' : 'Próxima Rodada')}
                  </button>
                )}

                {fase === 'ranking' && ehUltimaRodada && (
                  <button
                    type="button"
                    disabled={acaoBloqueada}
                    onClick={() => onAcao('finalizar')}
                    className="w-full py-3.5 px-4 rounded-xl font-black bg-[#FF4F9B] hover:bg-[#FF80B6] active:scale-98 text-[#25104A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm tracking-wide"
                  >
                    Finalizar Aulão
                  </button>
                )}

                {fase === 'finalizada' && (
                  <div className="p-4 text-center rounded-2xl bg-[#B7F247]/20 border-2 border-[#B7F247] text-[#B7F247] text-sm font-black shadow-md">
                    Aulão Concluído com Sucesso!
                  </div>
                )}
              </div>
            </div>

            {/* Informações de Participação */}
            {['pergunta', 'encerrada', 'feedback'].includes(fase) && (
              <div className="pt-4 border-t border-[#6334E3]/40 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#00DDEB] font-extrabold uppercase text-xs tracking-wider">
                    Respostas Recebidas:
                  </span>
                  <span className="font-black text-[#FFFDF7] text-base">
                    {participacao.respondidos} / {participacao.total}
                  </span>
                </div>

                {/* Distribuição A–E com contagens numéricas */}
                <div className="space-y-2">
                  <span className="text-xs text-[#FFFDF7]/80 uppercase font-bold block">
                    Distribuição de Respostas:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {LETRAS_ALTERNATIVAS.map((letra) => {
                      const qtd = participacao?.distribuicao?.[letra] ?? 0;
                      const cor = CORES_ALTERNATIVAS[letra] || {
                        bg: '#FFE14D',
                        text: '#25104A',
                      };
                      return (
                        <div
                          key={letra}
                          style={{ backgroundColor: cor.bg }}
                          className="rounded-xl p-2 shadow"
                        >
                          <span
                            style={{ color: cor.text }}
                            className="text-xs font-black block"
                          >
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
            {fase === 'conteudo' && estado?.aula && (
              <BlocoAulaTematica
                bloco={estado.aula.bloco}
                aula={estado.aula}
                imagens={estado.aula.bloco?.imagens || []}
              />
            )}

            {fase === 'conteudo' && !estado?.aula && (
              <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                <div className="border-b border-[#6334E3]/40 pb-2">
                  <span className="text-xs text-[#00DDEB] uppercase tracking-widest font-black">
                    Conteúdo Preparatório
                  </span>
                  <h3 className="text-xl font-black text-[#FFFDF7] mt-1">
                    {questao.tema || 'Tema da Rodada'}
                  </h3>
                </div>
                <div className="space-y-4">
                  {(rodada.conteudo || []).map((bloco, idx) => (
                    <BlocoConteudo key={idx} bloco={bloco} imagens={questao.imagens || []} />
                  ))}
                  {(!rodada.conteudo || rodada.conteudo.length === 0) && (
                    <p className="text-[#FFFDF7]/70 italic text-sm">
                      Nenhum texto preparatório nesta rodada.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bloco da Pergunta e Alternativas */}
            {['pergunta', 'encerrada', 'feedback'].includes(fase) && (
              <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-xl space-y-5 backdrop-blur-md">
                <div className="flex justify-between items-start gap-4 border-b border-[#6334E3]/40 pb-3">
                  <div>
                    <span className="text-xs text-[#00DDEB] uppercase tracking-widest font-black">
                      Questão {rodada.numero} {questao.ano ? `• ENEM ${questao.ano}` : ''}
                    </span>
                    <h3 className="text-xl font-black text-[#FFFDF7] mt-0.5">
                      {questao.tema || 'Questão'}
                    </h3>
                  </div>
                </div>

                <p className="text-[#FFFDF7] text-base leading-relaxed font-medium">
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
                <div className="space-y-3 pt-2">
                  {(questao.alternativas || []).map((alt) => {
                    const ehGabarito = fase === 'feedback' && feedback?.gabarito === alt.id;
                    const corBadge = CORES_ALTERNATIVAS[alt.id] || {
                      bg: '#FFE14D',
                      text: '#25104A',
                    };
                    return (
                      <div
                        key={alt.id}
                        className={`p-3.5 rounded-2xl border-2 text-sm transition ${
                          ehGabarito
                            ? 'bg-[#B7F247]/20 border-[#B7F247] text-[#FFFDF7] font-semibold shadow-lg'
                            : 'bg-[#25104A]/90 border-[#6334E3]/40 text-[#FFFDF7]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            style={{
                              backgroundColor: ehGabarito ? '#B7F247' : corBadge.bg,
                              color: '#25104A',
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-black shadow"
                          >
                            {alt.id}
                          </span>
                          <span className="flex-1 font-medium">{alt.texto}</span>
                        </div>

                        {fase === 'feedback' && feedback?.explicacoes?.[alt.id] && (
                          <p className="mt-2 text-xs text-[#FFFDF7]/80 pl-9 border-t border-[#6334E3]/30 pt-2 leading-relaxed">
                            {feedback.explicacoes[alt.id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {fase === 'feedback' && feedback?.gabarito && (
                  <div className="p-3.5 bg-[#B7F247]/20 border-2 border-[#B7F247] rounded-xl text-[#B7F247] text-sm font-black flex items-center gap-2 shadow-md">
                    <span>Gabarito Oficial: Alternativa {feedback.gabarito}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Respondentes (RV-04: lista delimitada, nomes sem alternativa) */}
            {['pergunta', 'encerrada', 'feedback'].includes(fase) && (
              <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-xl space-y-3.5 backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-[#6334E3]/40 pb-2">
                  <h4 className="text-sm font-black text-[#FFFDF7] tracking-wider uppercase">
                    Estudantes que Responderam ({participacao.respondentes?.length || 0})
                  </h4>
                  <span className="text-xs text-[#00DDEB] font-bold">
                    Nomes anônimos quanto à alternativa escolhida
                  </span>
                </div>

                <div
                  data-testid="lista-respondentes"
                  className="max-h-52 overflow-y-auto pr-1 space-y-1.5 text-xs text-[#FFFDF7]"
                >
                  {(participacao.respondentes || []).map((resp, idx) => (
                    <div
                      key={resp.id || resp.alunoId || idx}
                      className="px-3 py-1.5 bg-[#25104A]/90 rounded-xl border border-[#6334E3]/50 truncate font-semibold"
                    >
                      {resp.nomeExibicao || resp.nome}
                    </div>
                  ))}
                  {(!participacao.respondentes || participacao.respondentes.length === 0) && (
                    <p className="text-[#FFFDF7]/60 italic text-xs py-2">
                      Aguardando primeiras respostas dos estudantes...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bloco de Ranking */}
            {['ranking', 'finalizada'].includes(fase) && (
              <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                <div className="border-b border-[#6334E3]/40 pb-2">
                  <h3 className="text-xl font-black text-[#FFE14D]">
                    Classificação Atual
                  </h3>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {estado?.schemaVersion === 2 && <PodioRevisao ranking={ranking}/>}
              {ranking.map((item, idx) => (
                    <div
                      key={item.participanteId || idx}
                      className="flex items-center justify-between p-3.5 bg-[#25104A] border-2 border-[#6334E3]/40 rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-[#6334E3] font-black text-[#FFFDF7] text-xs flex items-center justify-center">
                          {item.posicao || idx + 1}º
                        </span>
                        <span className="font-bold text-[#FFFDF7] truncate max-w-xs md:max-w-md">
                          {item.nomeExibicao}
                        </span>
                      </div>
                      <span className="font-mono font-black text-[#FFE14D]">
                        {item.pontos} pts
                      </span>
                    </div>
                  ))}
                  {ranking.length === 0 && (
                    <p className="text-[#FFFDF7]/60 italic text-sm py-4 text-center">
                      Nenhuma pontuação registrada até o momento.
                    </p>
                  )}
                </div>
              </div>
            )}

            {fase === 'espera' && (
              <div className="bg-[#6334E3]/25 border-2 border-[#6334E3]/60 rounded-3xl p-8 text-center shadow-xl space-y-4 backdrop-blur-md">
                <h3 className="text-2xl font-black text-[#FFFDF7]">
                  Aulão em Espera
                </h3>
                <p className="text-[#FFFDF7]/90 text-sm max-w-md mx-auto leading-relaxed">
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
