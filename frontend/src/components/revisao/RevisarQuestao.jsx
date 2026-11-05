'use client';

import React from 'react';
import { BlocoConteudo } from './revisaoUtils';
import { fonteOficialValida, validarQuestaoConferencia } from '@/dominio/revisao/preparacao';

/**
 * RevisarQuestao — Componente controlado para conferência docente de questão do acervo.
 *
 * Contrato: RevisarQuestao({ questao, confirmacoes, ocupado, erro, onConfirmacoesChange, onAprovar })
 */
export function RevisarQuestao({
  questao,
  confirmacoes = {
    transcricao: false,
    gabarito: false,
    imagens: false,
    explicacoes: false,
  },
  ocupado = false,
  erro = null,
  onConfirmacoesChange,
  onAprovar,
}) {
  if (!questao) {
    return (
      <div className="p-8 text-center text-slate-400 bg-[#25104A] rounded-2xl border border-[#A78BFA]/40">
        Nenhuma questão selecionada para conferência.
      </div>
    );
  }

  const alternativas = Array.isArray(questao.alternativas) ? questao.alternativas.filter(a => a && typeof a === 'object') : [];
  const explicacoes = questao.explicacoes || {};
  const fontes = Array.isArray(questao.fontes) ? questao.fontes.filter(f => f && typeof f === 'object') : [];
  const imagensDaQuestao = Array.isArray(questao.imagens) ? questao.imagens.filter(i => i && typeof i === 'object') : [];
  const todasConfirmadas = ['transcricao', 'gabarito', 'imagens', 'explicacoes'].every(campo => confirmacoes?.[campo] === true);
  const motivoBloqueioAprovacao = !todasConfirmadas
    ? 'É necessário confirmar todos os 4 itens de validação docente.'
    : validarQuestaoConferencia(questao);

  const podeAprovar = !motivoBloqueioAprovacao && !ocupado;

  const handleCheckboxChange = (campo) => {
    if (!onConfirmacoesChange || ocupado) return;
    onConfirmacoesChange({
      ...confirmacoes,
      [campo]: confirmacoes[campo] !== true,
    });
  };

  const handleAprovar = () => {
    if (podeAprovar && onAprovar) {
      onAprovar(questao.id);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 bg-[#25104A] text-slate-100 font-sans space-y-8">
      {/* Cabeçalho da Conferência */}
      <header className="border-b border-[#A78BFA]/40 pb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-bold text-[#00DDEB] uppercase tracking-widest">
            Conferência Pedagógica • {questao.ano ? `ENEM ${questao.ano}` : 'ENEM'}
          </span>
          {questao.aplicacoes && questao.aplicacoes.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#431099]/60 text-[#E7DBFD] border border-[#A78BFA]/40">
              {questao.aplicacoes.join(', ')}
            </span>
          )}
          <span
            className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
              questao.status === 'revisada'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                : 'bg-amber-950/80 text-amber-300 border-amber-600'
            }`}
          >
            {questao.status === 'revisada' ? 'Revisada' : 'Rascunho'}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          {questao.tema || 'Conferência de Questão'}
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Identificador: {questao.id}
        </p>
      </header>

      {/* Alerta de Erro */}
      {erro && (
        <div
          role="alert"
          className="p-4 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-200 text-sm flex items-start gap-3 shadow-lg"
        >
          <span className="font-bold text-rose-400">Erro:</span>
          <span>{erro}</span>
        </div>
      )}

      {/* Conteúdo Preparatório (se houver) */}
      {questao.conteudoRevisao && questao.conteudoRevisao.length > 0 && (
        <section className="bg-[#431099]/70 border border-[#A78BFA]/40 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-[#E7DBFD] uppercase tracking-wider border-b border-[#A78BFA]/40 pb-2">
            Conteúdo Preparatório de Apoio
          </h2>
          <div className="space-y-4">
            {questao.conteudoRevisao.map((bloco, idx) => (
              <BlocoConteudo
                key={idx}
                bloco={bloco}
                imagens={imagensDaQuestao}
              />
            ))}
          </div>
        </section>
      )}

      {/* Enunciado e Imagens da Questão */}
      <section className="bg-[#431099]/70 border border-[#A78BFA]/40 rounded-2xl p-6 shadow-xl space-y-6">
        <h2 className="text-base font-bold text-[#E7DBFD] uppercase tracking-wider border-b border-[#A78BFA]/40 pb-2">
          Texto Base e Enunciado
        </h2>

        {/* Renderização pura e segura (sem dangerouslySetInnerHTML) */}
        <p className="text-base md:text-lg text-slate-100 leading-relaxed whitespace-pre-line">
          {questao.enunciado}
        </p>

        {imagensDaQuestao.length > 0 && (
          <div className="space-y-4 pt-2">
            {imagensDaQuestao.map((img) => (
              <BlocoConteudo
                key={img.id}
                bloco={img}
                imagens={imagensDaQuestao}
              />
            ))}
          </div>
        )}
      </section>

      {/* Alternativas A–E e Explicações Detalhadas */}
      <section className="bg-[#431099]/70 border border-[#A78BFA]/40 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#A78BFA]/40 pb-3">
          <h2 className="text-base font-bold text-[#E7DBFD] uppercase tracking-wider">
            Alternativas e Justificativas Pedagógicas
          </h2>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-600/60">
            Gabarito Oficial: Alternativa {questao.gabarito}
          </span>
        </div>

        <div className="space-y-4">
          {alternativas.map((alt) => {
            const ehGabarito = alt.id === questao.gabarito;
            const explicacao = explicacoes[alt.id];

            return (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border transition ${
                  ehGabarito
                    ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-100'
                    : 'bg-[#301658] border-[#A78BFA]/50 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                      ehGabarito
                        ? 'bg-emerald-500 text-emerald-950'
                        : 'bg-[#5411B8]/70 text-[#E7DBFD]'
                    }`}
                  >
                    {alt.id}
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">{alt.texto}</p>
                    {explicacao ? (
                      <div className="p-3 bg-black/30 rounded-lg border border-[#A78BFA]/40 text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold text-[#E7DBFD] block mb-0.5">
                          Justificativa Pedagógica ({alt.id}):
                        </span>
                        {explicacao}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-300 italic">
                        ⚠️ Explicação pedagógica pendente para a alternativa {alt.id}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fontes Oficiais Documentadas */}
      <section className="bg-[#431099]/70 border border-[#A78BFA]/40 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-[#E7DBFD] uppercase tracking-wider border-b border-[#A78BFA]/40 pb-2">
          Fontes Oficiais INEP
        </h2>

        <div className="space-y-3">
          {fontes.map((f, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-[#301658] rounded-xl border border-[#A78BFA]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="font-bold text-white block">
                  Aplicação: {f.aplicacao} • Caderno {f.caderno} • Questão {f.numeroQuestao} (Página {f.pagina})
                </span>
                {f.consultadoEm && (
                  <span className="text-slate-400 text-[11px]">
                    Consultado em: {f.consultadoEm}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {fonteOficialValida(f.provaUrl) && (
                  <a
                    href={f.provaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#431099]/60 border border-[#A78BFA]/60 text-[#E7DBFD] hover:bg-[#5411B8]/70 transition font-medium inline-flex items-center gap-1"
                  >
                    Prova Oficial Caderno {f.caderno} ↗
                  </a>
                )}
                {fonteOficialValida(f.gabaritoUrl) && (
                  <a
                    href={f.gabaritoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#431099]/60 border border-[#A78BFA]/60 text-[#E7DBFD] hover:bg-[#5411B8]/70 transition font-medium inline-flex items-center gap-1"
                  >
                    Gabarito Oficial INEP ↗
                  </a>
                )}
              </div>
            </div>
          ))}
          {fontes.length === 0 && (
            <p className="text-xs text-rose-300 italic">
              Nenhuma fonte oficial vinculada a este registro.
            </p>
          )}
        </div>
      </section>

      {/* Seção de Confirmações Docentes (Checkboxes Explícitos) */}
      <section className="bg-[#431099] border-2 border-[#A78BFA]/60 rounded-2xl p-6 shadow-2xl space-y-5">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Checklist de Homologação Docente
          </h2>
          <p className="text-xs text-[#E7DBFD]/80 mt-0.5">
            Marque cada item individualmente após conferência direta com os cadernos oficiais.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 bg-[#301658] rounded-xl border border-[#A78BFA]/50 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={confirmacoes?.transcricao === true}
              onChange={() => handleCheckboxChange('transcricao')}
              disabled={ocupado}
              className="w-4 h-4 mt-0.5 rounded text-[#00DDEB] bg-slate-900 border-[#A78BFA] focus:ring-[#00DDEB]"
            />
            <span className="text-slate-200">
              <strong className="text-white">Transcrição do Enunciado e Alternativas:</strong> Confirmo a transcrição fiel do texto-base, enunciado e das 5 opções com o caderno oficial.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 bg-[#301658] rounded-xl border border-[#A78BFA]/50 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={confirmacoes?.gabarito === true}
              onChange={() => handleCheckboxChange('gabarito')}
              disabled={ocupado}
              className="w-4 h-4 mt-0.5 rounded text-[#00DDEB] bg-slate-900 border-[#A78BFA] focus:ring-[#00DDEB]"
            />
            <span className="text-slate-200">
              <strong className="text-white">Gabarito Oficial:</strong> Confirmo a exatidão do gabarito oficial indicado pela documentação do INEP.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 bg-[#301658] rounded-xl border border-[#A78BFA]/50 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={confirmacoes?.imagens === true}
              onChange={() => handleCheckboxChange('imagens')}
              disabled={ocupado}
              className="w-4 h-4 mt-0.5 rounded text-[#00DDEB] bg-slate-900 border-[#A78BFA] focus:ring-[#00DDEB]"
            />
            <span className="text-slate-200">
              <strong className="text-white">Imagens e Obras Artísticas:</strong> Confirmo a legibilidade e fidelidade das imagens e reproduções de obras.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 bg-[#301658] rounded-xl border border-[#A78BFA]/50 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={confirmacoes?.explicacoes === true}
              onChange={() => handleCheckboxChange('explicacoes')}
              disabled={ocupado}
              className="w-4 h-4 mt-0.5 rounded text-[#00DDEB] bg-slate-900 border-[#A78BFA] focus:ring-[#00DDEB]"
            />
            <span className="text-slate-200">
              <strong className="text-white">Justificativas Pedagógicas:</strong> Confirmo as explicações das 5 alternativas e sua consistência pedagógica.
            </span>
          </label>
        </div>

        {/* Rodapé e Ação de Aprovação */}
        <div className="pt-4 border-t border-[#A78BFA]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {motivoBloqueioAprovacao && (
              <p className="text-xs text-amber-300 font-medium">
                ⚠️ {motivoBloqueioAprovacao}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="aprovar questão para uso em sala"
            onClick={handleAprovar}
            disabled={!podeAprovar}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm tracking-wide shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {ocupado ? 'Registrando Homologação...' : 'Aprovar Questão para Uso em Sala'}
          </button>
        </div>
      </section>
    </div>
  );
}
