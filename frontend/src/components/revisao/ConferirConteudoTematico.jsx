"use client";

import React from "react";
import { BlocoAulaTematica } from "./BlocoAulaTematica";
const urlSegura = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
};

/**
 * ConferirConteudoTematico — Interface docente para conferência e homologação da aula temática.
 *
 * Contrato: ConferirConteudoTematico({
 *   conteudo,
 *   confirmacoes,
 *   ocupado,
 *   erro,
 *   onConfirmacoesChange,
 *   onAprovar,
 *   onVoltar
 * })
 */
export function ConferirConteudoTematico({
  conteudo = {},
  confirmacoes = { conteudo: false, imagens: false, cobertura: false },
  ocupado = false,
  erro = null,
  onConfirmacoesChange,
  onAprovar,
  onVoltar,
}) {
  const todasConfirmadas = Boolean(
    ["conteudo", "imagens", "cobertura"].every(
      (k) => confirmacoes?.[k] === true,
    ),
  );
  const podeAprovar =
    todasConfirmadas &&
    !ocupado &&
    Boolean(conteudo?.id) &&
    Array.isArray(conteudo.blocos) &&
    conteudo.blocos.length > 0 &&
    conteudo.fontes?.length > 0 &&
    conteudo.fontes.every((f) => urlSegura(f.url));

  const handleToggleConfirmacao = (campo) => {
    if (onConfirmacoesChange && !ocupado) {
      onConfirmacoesChange({
        ...confirmacoes,
        [campo]: !confirmacoes[campo],
      });
    }
  };

  return (
    <div
      data-tema="vibrante"
      className="w-full min-h-screen text-[#FFFDF7] p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 font-sans"
      style={{ backgroundColor: "#25104A" }}
    >
      {/* Topo / Cabeçalho da Conferência */}
      <header className="bg-[#6334E3]/30 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] uppercase font-black tracking-widest text-[#00DDEB] bg-[#00DDEB]/20 border border-[#00DDEB]/50 px-3 py-1 rounded-full">
              Conferência Docente de Aula Temática
            </span>
            {conteudo?.duracaoEstimadaMinutos && (
              <span className="text-xs font-black text-[#FFE14D] bg-[#FFE14D]/20 border border-[#FFE14D]/40 px-3 py-1 rounded-full">
                ⏱ {conteudo.duracaoEstimadaMinutos} min estimados
              </span>
            )}
            <span className="text-xs font-bold text-[#FFFDF7]/80 bg-[#25104A] border border-[#6334E3]/50 px-2.5 py-0.5 rounded-full uppercase">
              Status: {conteudo?.status || "rascunho"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FFFDF7] tracking-tight">
            {conteudo?.titulo || "Aula Temática"}
          </h1>

          {conteudo?.resumo && (
            <p className="text-sm md:text-base text-[#FFFDF7]/90 leading-relaxed max-w-3xl">
              {conteudo.resumo}
            </p>
          )}
        </div>

        {onVoltar && (
          <button
            type="button"
            onClick={onVoltar}
            disabled={ocupado}
            className="self-start md:self-center px-4 py-2.5 rounded-xl border-2 border-[#6334E3] bg-[#25104A] hover:bg-[#6334E3]/40 text-[#FFFDF7] font-bold text-xs transition disabled:opacity-50"
          >
            ← Voltar para a Preparação
          </button>
        )}
      </header>

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

      {/* Seção 1: Objetivos de Aprendizagem */}
      <section className="bg-[#6334E3]/20 border-2 border-[#6334E3]/50 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-black text-[#FFE14D] uppercase tracking-wider flex items-center gap-2">
          <span>🎯</span> Objetivos de Aprendizagem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(conteudo?.objetivos || []).map((obj) => (
            <div
              key={obj.id}
              className="p-3.5 rounded-2xl bg-[#25104A]/80 border border-[#6334E3]/40 space-y-1"
            >
              <span className="text-[10px] font-mono font-bold text-[#00DDEB] uppercase tracking-wider block">
                ID: {obj.id}
              </span>
              <p className="text-sm text-[#FFFDF7]/90 leading-snug">
                {obj.descricao}
              </p>
            </div>
          ))}
          {(!conteudo?.objetivos || conteudo.objetivos.length === 0) && (
            <p className="text-xs text-[#FFFDF7]/60 italic">
              Nenhum objetivo cadastrado.
            </p>
          )}
        </div>
      </section>

      {/* Seção 2: Blocos Didáticos da Aula */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#6334E3]/40 pb-2">
          <h2 className="text-lg font-black text-[#00DDEB] uppercase tracking-wider flex items-center gap-2">
            <span>📚</span> Blocos Didáticos da Aula (
            {conteudo?.blocos?.length || 0})
          </h2>
          <span className="text-xs text-[#FFFDF7]/70 font-semibold">
            Sequência projetável apresentada aos alunos
          </span>
        </div>

        <div className="space-y-4">
          {(conteudo?.blocos || []).map((bloco, idx) => (
            <BlocoAulaTematica
              key={bloco.id || idx}
              bloco={bloco}
              imagens={conteudo.imagens || []}
              aula={{
                indiceBloco: idx,
                totalBlocos: conteudo.blocos.length,
              }}
            />
          ))}
          {(!conteudo?.blocos || conteudo.blocos.length === 0) && (
            <div className="p-6 text-center text-sm text-[#FFFDF7]/70 italic bg-[#6334E3]/10 rounded-2xl border border-dashed border-[#6334E3]/40">
              Nenhum bloco didático estruturado.
            </div>
          )}
        </div>
      </section>

      {/* Seção 3: Imagens e Recursos Visuais Homologados */}
      {conteudo?.imagens && conteudo.imagens.length > 0 && (
        <section className="bg-[#6334E3]/20 border-2 border-[#6334E3]/50 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-black text-[#FFE14D] uppercase tracking-wider flex items-center gap-2">
            <span>🖼</span> Imagens e Recursos Visuais (
            {conteudo.imagens.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conteudo.imagens.map((img) => (
              <div
                key={img.id}
                className="p-4 rounded-2xl bg-[#25104A]/90 border border-[#6334E3]/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#00DDEB]">
                    {img.id}
                  </span>
                  <span className="text-[10px] text-[#FFFDF7]/60 truncate max-w-[180px]">
                    {img.arquivo}
                  </span>
                </div>
                {!conteudo.blocos?.some(b => b.tipo === 'imagem' && b.imagemId === img.id) && (
                  <p className="text-[#FFFDF7] font-semibold">{img.legenda || img.alt}</p>
                )}
                {img.fonteUrl && (
                  <p className="text-[#00DDEB] truncate">
                    <span className="text-[#FFFDF7]/70">Fonte: </span>
                    <a
                      href={urlSegura(img.fonteUrl) ? img.fonteUrl : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[#54EEF8]"
                    >
                      {img.fonteUrl}
                    </a>
                  </p>
                )}
                {img.licenca && (
                  <p className="text-[#FFFDF7]/70">
                    <span className="font-semibold">Licença: </span>
                    {img.licenca}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Seção 4: Fontes Bibliográficas e Documentais */}
      {conteudo?.fontes && conteudo.fontes.length > 0 && (
        <section className="bg-[#6334E3]/20 border-2 border-[#6334E3]/50 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-black text-[#00DDEB] uppercase tracking-wider flex items-center gap-2">
            <span>📖</span> Fontes Primárias e Bibliografia Consultada
          </h2>

          <ul className="space-y-2 text-xs">
            {conteudo.fontes.map((f, idx) => (
              <li
                key={idx}
                className="p-3 rounded-xl bg-[#25104A]/90 border border-[#6334E3]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <span className="font-bold text-[#FFFDF7]">{f.titulo}</span>
                <div className="flex items-center gap-3 shrink-0">
                  {f.consultadoEm && (
                    <span className="text-[#FFFDF7]/60">
                      Consultado em: {f.consultadoEm}
                    </span>
                  )}
                  {f.url && (
                    <a
                      href={urlSegura(f.url) ? f.url : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#00DDEB]/20 border border-[#00DDEB]/40 text-[#00DDEB] font-bold hover:bg-[#00DDEB]/30 transition"
                    >
                      Acessar Fonte ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {conteudo.questoesVinculadas?.length > 0 && (
        <section className="rounded-2xl border border-[#6334E3] p-5 space-y-3">
          <h2 className="font-bold text-[#FFE14D]">
            Questões associadas a esta aula (
            {conteudo.questoesVinculadas.length})
          </h2>
          <p className="text-sm">
            Confira se os conceitos da aula cobrem estes assuntos antes de
            confirmar a cobertura.
          </p>
          <ul className="space-y-2 max-h-64 overflow-auto">
            {conteudo.questoesVinculadas.map((q) => (
              <li key={q.id} className="text-sm">
                {q.ano} · {q.tema}
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* Seção 5: Checklist Docente Obrigatório */}
      <section className="bg-[#6334E3]/30 border-2 border-[#FFE14D]/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="border-b border-[#6334E3]/40 pb-3">
          <span className="text-xs uppercase font-black text-[#FFE14D] tracking-widest block">
            Homologação Pedagógica
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#FFFDF7] mt-1">
            Checklist de Conferência da Aula
          </h2>
          <p className="text-xs text-[#FFFDF7]/80 mt-1">
            Marque os três critérios obrigatórios para liberar este conteúdo
            para o aulão.
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Critério 1: Conteúdo */}
          <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#25104A]/90 border border-[#6334E3]/50 cursor-pointer hover:bg-[#6334E3]/20 transition">
            <input
              type="checkbox"
              data-testid="checkbox-confirmacao-conteudo"
              checked={Boolean(confirmacoes?.conteudo)}
              disabled={ocupado}
              onChange={() => handleToggleConfirmacao("conteudo")}
              className="mt-1 w-5 h-5 rounded border-2 border-[#00DDEB] text-[#00DDEB] focus:ring-[#00DDEB] focus:ring-offset-0 bg-[#25104A]"
            />
            <div className="flex-1 text-sm">
              <span className="font-black text-[#FFFDF7] block">
                1. Correção Conceitual e Linguagem Didática
              </span>
              <span className="text-xs text-[#FFFDF7]/80">
                Confirmo a clareza conceitual, a linguagem adequada ao Ensino
                Médio e a correção pedagógica do texto da aula.
              </span>
            </div>
          </label>

          {/* Critério 2: Imagens */}
          <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#25104A]/90 border border-[#6334E3]/50 cursor-pointer hover:bg-[#6334E3]/20 transition">
            <input
              type="checkbox"
              data-testid="checkbox-confirmacao-imagens"
              checked={Boolean(confirmacoes?.imagens)}
              disabled={ocupado}
              onChange={() => handleToggleConfirmacao("imagens")}
              className="mt-1 w-5 h-5 rounded border-2 border-[#00DDEB] text-[#00DDEB] focus:ring-[#00DDEB] focus:ring-offset-0 bg-[#25104A]"
            />
            <div className="flex-1 text-sm">
              <span className="font-black text-[#FFFDF7] block">
                2. Pertinência e Licenciamento das Imagens
              </span>
              <span className="text-xs text-[#FFFDF7]/80">
                Confirmo a pertinência pedagógica, legibilidade projetada e os
                créditos/licenças das imagens.
              </span>
            </div>
          </label>

          {/* Critério 3: Cobertura */}
          <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#25104A]/90 border border-[#6334E3]/50 cursor-pointer hover:bg-[#6334E3]/20 transition">
            <input
              type="checkbox"
              data-testid="checkbox-confirmacao-cobertura"
              checked={Boolean(confirmacoes?.cobertura)}
              disabled={ocupado}
              onChange={() => handleToggleConfirmacao("cobertura")}
              className="mt-1 w-5 h-5 rounded border-2 border-[#00DDEB] text-[#00DDEB] focus:ring-[#00DDEB] focus:ring-offset-0 bg-[#25104A]"
            />
            <div className="flex-1 text-sm">
              <span className="font-black text-[#FFFDF7] block">
                3. Cobertura dos Objetivos de Aprendizagem
              </span>
              <span className="text-xs text-[#FFFDF7]/80">
                Confirmo que a aula cobre integralmente os objetivos de
                aprendizagem das questões associadas, sem revelar respostas
                antecipadas.
              </span>
            </div>
          </label>
        </div>

        {/* Botão de Ação: Aprovar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#FFFDF7]/70 italic">
            {!todasConfirmadas
              ? "Todos os 3 critérios acima devem ser confirmados pelo professor."
              : "Todos os critérios confirmados. O conteúdo pode ser homologado."}
          </p>

          <button
            type="button"
            disabled={!podeAprovar}
            onClick={() => onAprovar && onAprovar(conteudo.id)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-[#B7F247] hover:bg-[#D0F87E] active:scale-95 text-[#25104A] transition shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Aprovar Conteúdo da Aula
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConferirConteudoTematico;
