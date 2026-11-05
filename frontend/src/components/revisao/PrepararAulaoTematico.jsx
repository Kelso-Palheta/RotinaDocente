"use client";

import React, { useState, useMemo } from "react";
import { validarSelecaoTematica } from "@/dominio/revisao/tematico";

/**
 * PrepararAulaoTematico — Componente controlado para montagem do aulão temático v2.
 *
 * Contrato: PrepararAulaoTematico({
 *   trilhas,
 *   conteudos,
 *   questoes,
 *   turmas,
 *   selecao,
 *   ocupado,
 *   erro,
 *   onAlterar,
 *   onCriar,
 *   onAbrirConteudo,
 *   onAbrirRevisao
 * })
 */
export function PrepararAulaoTematico({
  trilhas = [],
  conteudos = [],
  questoes = [],
  turmas = [],
  selecao = {
    titulo: "",
    turmaIds: [],
    questaoIds: [],
    duracaoSegundos: 60,
    conteudoIds: [],
    quantidadeQuestoes: 5,
    duracaoPorQuestao: {},
  },
  ocupado = false,
  erro = null,
  onAlterar,
  onCriar,
  onAbrirConteudo,
  onAbrirRevisao,
  textoAcao,
  podeEditarTurmas = true,
  modoEdicao = false,
  codigoSala = '',
  onRecarregar = null,
  onCancelar = null,
}) {
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroModalidade, setFiltroModalidade] = useState("");
  const [buscaTexto, setBuscaTexto] = useState("");
  const [avisoRemocao, setAvisoRemocao] = useState(null);
  const [avisoInsuficiencia, setAvisoInsuficiencia] = useState(null);

  const conteudosMap = useMemo(() => {
    return new Map((conteudos || []).map((c) => [c.id, c]));
  }, [conteudos]);

  const questoesMap = useMemo(() => {
    return new Map((questoes || []).map((q) => [q.id, q]));
  }, [questoes]);

  const conteudoIdsSelecionados = useMemo(() => {
    return selecao.conteudoIds || [];
  }, [selecao.conteudoIds]);
  const quantidadeDesejada = selecao.quantidadeQuestoes;

  // Questões contextuais vinculadas aos conteúdos selecionados (deduplicadas por ID)
  const questoesContexto = useMemo(() => {
    if (conteudoIdsSelecionados.length === 0) return [];

    const idsVistos = new Set();
    const lista = [];

    for (const q of questoes) {
      const qConteudos = q.conteudoIds || [];
      const temVinculo = qConteudos.some((cid) =>
        conteudoIdsSelecionados.includes(cid),
      );
      if (temVinculo && !idsVistos.has(q.id)) {
        idsVistos.add(q.id);
        lista.push(q);
      }
    }
    return lista;
  }, [questoes, conteudoIdsSelecionados]);

  const totalCompativeis = questoesContexto.length;
  const totalAptas = questoesContexto.filter((q) => q.apta === true).length;

  // Questões atualmente selecionadas (preserva ordem de selecao.questaoIds)
  const questoesSelecionadas = useMemo(() => {
    return (selecao.questaoIds || []).map((id) => {
      return (
        questoesMap.get(id) || {
          id,
          tema: "Questão não encontrada",
          apta: false,
          conteudoIds: [],
        }
      );
    });
  }, [selecao.questaoIds, questoesMap]);

  // Validação dos conteúdos selecionados: todos devem ser aptos
  const conteudosInaptos = useMemo(() => {
    return conteudoIdsSelecionados
      .map((id) => conteudosMap.get(id))
      .filter((c) => !c || c.apta !== true);
  }, [conteudoIdsSelecionados, conteudosMap]);

  // Validação das questões selecionadas
  const questoesInaptasNaSelecao = useMemo(() => {
    return questoesSelecionadas.filter((q) => q.apta !== true);
  }, [questoesSelecionadas]);

  // Validação de quantidade exata e limites
  const quantidadeExata =
    (selecao.questaoIds || []).length === quantidadeDesejada;
  const quantidadeValida =
    Number.isInteger(quantidadeDesejada) &&
    quantidadeDesejada >= 1 &&
    quantidadeDesejada <= 20;

  const duracaoPadraoValida =
    Number.isInteger(selecao.duracaoSegundos) &&
    selecao.duracaoSegundos >= 10 &&
    selecao.duracaoSegundos <= 600;

  const duracoesIndividuaisValidas = useMemo(() => {
    const duracoes = selecao.duracaoPorQuestao || {};
    for (const [id, tempo] of Object.entries(duracoes)) {
      if (!(selecao.questaoIds || []).includes(id)) continue;
      if (!Number.isInteger(tempo) || tempo < 10 || tempo > 600) {
        return false;
      }
    }
    return true;
  }, [selecao.duracaoPorQuestao, selecao.questaoIds]);

  const tituloValido = Boolean(
    selecao.titulo &&
      selecao.titulo.trim().length >= 1 &&
      selecao.titulo.trim().length <= 120,
  );

  const turmasValidas = Boolean((selecao.turmaIds || []).length > 0);

  let erroContexto = null;
  try {
    validarSelecaoTematica(selecao, {
      conteudos,
      questoes: questoes.map((q) => ({
        questaoId: q.id,
        conteudoIds: q.conteudoIds || [],
      })),
    });
  } catch (e) {
    erroContexto = e.message;
  }
  const idsTurmas = new Set(turmas.map((t) => t.id));
  const podeCriar = Boolean(
    !erroContexto &&
      selecao.turmaIds?.every((id) => idsTurmas.has(id)) &&
      new Set(selecao.turmaIds).size === selecao.turmaIds.length &&
      !ocupado &&
      tituloValido &&
      turmasValidas &&
      conteudoIdsSelecionados.length > 0 &&
      conteudosInaptos.length === 0 &&
      questoesInaptasNaSelecao.length === 0 &&
      quantidadeValida &&
      quantidadeExata &&
      duracaoPadraoValida &&
      duracoesIndividuaisValidas,
  );

  // Filtragem secundária do catálogo contextual
  const questoesCatalogoFiltradas = useMemo(() => {
    return questoesContexto.filter((q) => {
      if (filtroAno && String(q.ano) !== String(filtroAno)) return false;
      if (
        filtroModalidade &&
        !(q.aplicacoes || []).includes(filtroModalidade)
      ) {
        return false;
      }
      if (
        buscaTexto &&
        !q.tema?.toLowerCase().includes(buscaTexto.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [questoesContexto, filtroAno, filtroModalidade, buscaTexto]);

  // Handlers
  const handleToggleConteudo = (conteudoId) => {
    if (!onAlterar || ocupado) return;

    let novosConteudos;
    if (conteudoIdsSelecionados.includes(conteudoId)) {
      novosConteudos = conteudoIdsSelecionados.filter(
        (id) => id !== conteudoId,
      );
    } else {
      novosConteudos = [...conteudoIdsSelecionados, conteudoId];
    }

    // Ao remover conteúdos, remove questões que deixaram de ser compatíveis
    const novosContextoIds = new Set(
      questoes
        .filter((q) =>
          (q.conteudoIds || []).some((cid) => novosConteudos.includes(cid)),
        )
        .map((q) => q.id),
    );

    const questoesAtuais = selecao.questaoIds || [];
    const novasQuestoesIds = questoesAtuais.filter((id) =>
      novosContextoIds.has(id),
    );

    const novasDuracoes = { ...(selecao.duracaoPorQuestao || {}) };
    for (const id of Object.keys(novasDuracoes)) {
      if (!novasQuestoesIds.includes(id)) {
        delete novasDuracoes[id];
      }
    }

    const removidas = questoesAtuais.length - novasQuestoesIds.length;
    if (removidas > 0) {
      setAvisoRemocao(
        `${removidas} questão(ões) incompatíveis foram removidas da seleção.`,
      );
    } else {
      setAvisoRemocao(null);
    }
    setAvisoInsuficiencia(null);

    onAlterar({
      ...selecao,
      conteudoIds: novosConteudos,
      questaoIds: novasQuestoesIds,
      duracaoPorQuestao: novasDuracoes,
    });
  };

  const handleToggleTurma = (turmaId) => {
    if (!onAlterar || ocupado) return;
    const turmasAtuais = selecao.turmaIds || [];
    const novasTurmas = turmasAtuais.includes(turmaId)
      ? turmasAtuais.filter((id) => id !== turmaId)
      : [...turmasAtuais, turmaId];

    onAlterar({ ...selecao, turmaIds: novasTurmas });
  };

  const handleToggleQuestao = (questaoId) => {
    if (!onAlterar || ocupado) return;
    const questoesAtuais = selecao.questaoIds || [];
    let novasQuestoes;
    const novasDuracoes = { ...(selecao.duracaoPorQuestao || {}) };

    if (questoesAtuais.includes(questaoId)) {
      novasQuestoes = questoesAtuais.filter((id) => id !== questaoId);
      delete novasDuracoes[questaoId];
    } else {
      const q = questoesMap.get(questaoId);
      if (!q || q.apta !== true) return; // Bloqueio estrito de questões inaptas
      novasQuestoes = [...questoesAtuais, questaoId];
    }

    onAlterar({
      ...selecao,
      questaoIds: novasQuestoes,
      duracaoPorQuestao: novasDuracoes,
    });
  };

  const handleMoverQuestao = (index, direcao) => {
    if (!onAlterar || ocupado) return;
    const novaOrdem = [...(selecao.questaoIds || [])];
    const destino = index + direcao;
    if (destino < 0 || destino >= novaOrdem.length) return;

    const [item] = novaOrdem.splice(index, 1);
    novaOrdem.splice(destino, 0, item);

    onAlterar({ ...selecao, questaoIds: novaOrdem });
  };

  const handleDuracaoIndividualChange = (questaoId, valorString) => {
    if (!onAlterar || ocupado) return;
    const novasDuracoes = { ...(selecao.duracaoPorQuestao || {}) };

    if (valorString === "") {
      delete novasDuracoes[questaoId];
    } else {
      novasDuracoes[questaoId] = Number(valorString);
    }

    onAlterar({ ...selecao, duracaoPorQuestao: novasDuracoes });
  };

  const handleCompletarComAptas = () => {
    if (!onAlterar || ocupado) return;
    const selecionadosSet = new Set(selecao.questaoIds || []);
    const aptasDisponiveis = questoesContexto.filter(
      (q) => q.apta === true && !selecionadosSet.has(q.id),
    );

    const espacosRestantes = Math.max(
      0,
      quantidadeDesejada - selecionadosSet.size,
    );
    const paraAdicionar = aptasDisponiveis
      .slice(0, espacosRestantes)
      .map((q) => q.id);

    const novoResultado = [...(selecao.questaoIds || []), ...paraAdicionar];

    if (novoResultado.length < quantidadeDesejada) {
      setAvisoInsuficiencia(
        `O tema possui menos questões aptas (${totalAptas}) do que a meta estipulada (${quantidadeDesejada}). Foram selecionadas todas as ${totalAptas} aptas disponíveis.`,
      );
    } else {
      setAvisoInsuficiencia(null);
    }

    onAlterar({ ...selecao, questaoIds: novoResultado });
  };

  return (
    <div
      data-tema="vibrante"
      className="w-full min-h-screen text-[#FFFDF7] p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 font-sans"
      style={{ backgroundColor: "#25104A" }}
    >
      {/* Cabeçalho */}
      <header className="bg-[#6334E3]/30 border-2 border-[#6334E3]/60 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <span className="text-[11px] uppercase font-black tracking-widest text-[#00DDEB] bg-[#00DDEB]/20 border border-[#00DDEB]/50 px-3 py-1 rounded-full">
            {modoEdicao ? `Edição de Sala • ${codigoSala || ''}` : 'Configuração Pedagógica Temática v2'}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#FFFDF7] mt-2 tracking-tight">
            {modoEdicao ? `Editar Sala: ${codigoSala || ''}` : 'Preparar Aulão por Conteúdo'}
          </h1>
          <p className="text-xs sm:text-sm text-[#FFFDF7]/80 mt-1">
            Escolha as aulas introdutórias, defina a quantidade exata e organize
            os desafios contextualizados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancelar && (
            <button
              type="button"
              disabled={ocupado}
              onClick={onCancelar}
              className="px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border border-[#A78BFA] text-[#FFFDF7] hover:bg-[#6334E3]/40 transition disabled:opacity-40"
            >
              Cancelar edição
            </button>
          )}
          <button
            type="button"
            disabled={!podeCriar}
            onClick={() => podeCriar && onCriar && onCriar(selecao)}
            className="px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-[#00DDEB] hover:bg-[#54EEF8] active:scale-95 text-[#25104A] transition shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ocupado ? (modoEdicao ? 'Salvando...' : 'Criando...') : (textoAcao || 'Criar Aulão')}
          </button>
        </div>
      </header>

      {/* Alertas */}
      {(erro || erroContexto) && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-950/90 border-2 border-[#FF4F9B] text-[#FFFDF7] text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span className="font-black text-[#FF4F9B]">Erro:</span>
            <p className="flex-1 font-medium">{erro || erroContexto}</p>
          </div>
          {onRecarregar && (
            <button
              type="button"
              onClick={onRecarregar}
              className="px-3.5 py-2 rounded-xl bg-[#FFE14D] text-[#25104A] font-black text-xs uppercase hover:bg-yellow-300 transition whitespace-nowrap"
            >
              Recarregar dados da sala
            </button>
          )}
        </div>
      )}

      {avisoRemocao && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#FFE14D]/15 border-2 border-[#FFE14D] text-[#FFE14D] text-xs font-bold flex items-center justify-between"
        >
          <span>ℹ {avisoRemocao}</span>
          <button
            type="button"
            onClick={() => setAvisoRemocao(null)}
            className="text-xs underline hover:text-[#FFFDF7]"
          >
            Dispensar
          </button>
        </div>
      )}

      {avisoInsuficiencia && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#FF4F9B]/15 border-2 border-[#FF4F9B] text-[#FF4F9B] text-xs font-bold"
        >
          ⚠ {avisoInsuficiencia}
        </div>
      )}

      {/* Configurações Gerais: Título, Turmas, Metas e Tempos */}
      <section className="bg-[#6334E3]/20 border-2 border-[#6334E3]/50 rounded-3xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-black text-[#FFE14D] uppercase tracking-wider">
          1. Parâmetros da Sala e Turmas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Título do Aulão */}
          <div className="space-y-2">
            <label
              htmlFor="input-titulo-aulao"
              className="text-xs font-black uppercase text-[#00DDEB]"
            >
              Título do Aulão (1 a 120 caracteres)
            </label>
            <input
              id="input-titulo-aulao"
              type="text"
              value={selecao.titulo || ""}
              disabled={ocupado}
              onChange={(e) =>
                onAlterar && onAlterar({ ...selecao, titulo: e.target.value })
              }
              placeholder="Ex: Aulão de Vanguardas e Arte Moderna"
              className="w-full px-4 py-3 rounded-2xl bg-[#25104A] border-2 border-[#6334E3]/60 text-[#FFFDF7] text-sm focus:outline-none focus:border-[#00DDEB] font-semibold"
            />
          </div>

          {/* Duração Padrão por Pergunta */}
          <div className="space-y-2">
            <label
              htmlFor="input-duracao-padrao"
              className="text-xs font-black uppercase text-[#00DDEB]"
            >
              Tempo Padrão por Pergunta (10 a 600 segundos)
            </label>
            <input
              id="input-duracao-padrao"
              type="number"
              min={10}
              max={600}
              value={selecao.duracaoSegundos ?? 60}
              disabled={ocupado}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                onAlterar && onAlterar({ ...selecao, duracaoSegundos: val });
              }}
              className="w-full px-4 py-3 rounded-2xl bg-[#25104A] border-2 border-[#6334E3]/60 text-[#FFFDF7] text-sm focus:outline-none focus:border-[#00DDEB] font-mono font-bold"
            />
          </div>

          {/* Quantidade Exata de Questões */}
          <div className="space-y-2">
            <label
              htmlFor="input-quantidade-questoes"
              className="text-xs font-black uppercase text-[#FFE14D]"
            >
              Meta Exata de Questões (1 a 20)
            </label>
            <input
              id="input-quantidade-questoes"
              type="number"
              min={1}
              max={20}
              value={selecao.quantidadeQuestoes ?? 5}
              disabled={ocupado}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                onAlterar && onAlterar({ ...selecao, quantidadeQuestoes: val });
              }}
              className="w-full px-4 py-3 rounded-2xl bg-[#25104A] border-2 border-[#FFE14D]/60 text-[#FFE14D] text-sm focus:outline-none focus:border-[#FFE14D] font-mono font-black"
            />
          </div>

          {/* Seleção de Turmas */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-[#00DDEB] block">
              Turmas Participantes
            </span>
            {!podeEditarTurmas && (
              <p className="text-xs text-[#FFE14D] font-bold bg-[#FFE14D]/10 border border-[#FFE14D]/40 p-2.5 rounded-xl">
                Participantes já estão na sala de espera. As turmas e a lista de alunos estão congeladas.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {(turmas || []).map((t) => {
                const checked = (selecao.turmaIds || []).includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={ocupado || !podeEditarTurmas}
                    onClick={() => podeEditarTurmas && handleToggleTurma(t.id)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                      checked
                        ? "bg-[#00DDEB] border-[#00DDEB] text-[#25104A]"
                        : "bg-[#25104A] border-[#6334E3]/60 text-[#FFFDF7]/80 hover:bg-[#6334E3]/40"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {checked ? "✓ " : "+ "}
                    {t.nome}
                  </button>
                );
              })}
              {(!turmas || turmas.length === 0) && (
                <span className="text-xs text-[#FFFDF7]/60 italic">
                  Nenhuma turma cadastrada.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seleção de Conteúdos por Trilha */}
      <section className="bg-[#6334E3]/20 border-2 border-[#6334E3]/50 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#6334E3]/40 pb-3">
          <div>
            <h2 className="text-lg font-black text-[#00DDEB] uppercase tracking-wider">
              2. Conteúdos e Aulas Introdutórias
            </h2>
            <p className="text-xs text-[#FFFDF7]/80">
              Selecione as aulas temáticas que serão ministradas antes das
              questões.
            </p>
          </div>
          <span className="text-xs font-mono font-black text-[#FFE14D]">
            {conteudoIdsSelecionados.length} conteúdo(s) marcado(s)
          </span>
        </div>

        {/* Agrupamento por Trilhas */}
        <div className="space-y-6">
          {(trilhas || []).map((trilha) => {
            const conteudosDaTrilha = (conteudos || []).filter(
              (c) => c.trilhaId === trilha.id,
            );
            if (conteudosDaTrilha.length === 0) return null;

            return (
              <div key={trilha.id} className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#FFFDF7]/70 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00DDEB]" />
                  Trilha: {trilha.titulo}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conteudosDaTrilha.map((c) => {
                    const marcado = conteudoIdsSelecionados.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between gap-3 ${
                          marcado
                            ? "bg-[#6334E3]/50 border-[#00DDEB] shadow-lg"
                            : "bg-[#25104A]/90 border-[#6334E3]/50 text-[#FFFDF7]/90"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            data-testid={`checkbox-conteudo-${c.id}`}
                            checked={marcado}
                            disabled={ocupado}
                            onChange={() => handleToggleConteudo(c.id)}
                            className="mt-1 w-5 h-5 rounded border-2 border-[#00DDEB] text-[#00DDEB] bg-[#25104A] focus:ring-[#00DDEB]"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-[#FFFDF7]">
                                {c.titulo}
                              </span>
                              {c.apta !== true && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FF4F9B]/20 text-[#FF4F9B] border border-[#FF4F9B]/50">
                                  Pendente de Aprovação
                                </span>
                              )}
                              {c.duracaoEstimadaMinutos && (
                                <span className="text-[10px] text-[#FFE14D] font-mono">
                                  ⏱ {c.duracaoEstimadaMinutos} min
                                </span>
                              )}
                            </div>
                            {c.resumo && (
                              <p className="text-xs text-[#FFFDF7]/75 line-clamp-2 leading-relaxed">
                                {c.resumo}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botão de Conferência / Inspeção */}
                        {onAbrirConteudo && (
                          <div className="pt-2 border-t border-[#6334E3]/40 flex justify-end">
                            <button
                              type="button"
                              data-testid={`btn-conferir-conteudo-${c.id}`}
                              disabled={ocupado}
                              onClick={() => onAbrirConteudo(c.id)}
                              className="text-xs text-[#00DDEB] hover:text-[#54EEF8] font-bold underline"
                            >
                              🔍 Inspecionar Conteúdo
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aviso de Conteúdos Inaptos */}
        {conteudosInaptos.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/80 border-2 border-[#FFE14D] text-[#FFE14D] text-xs space-y-1">
            <span className="font-bold">Aviso pedagógico:</span>
            <p>
              Você selecionou conteúdo pendente de aprovação docente (
              {conteudosInaptos
                .map((c) => c?.titulo || "Conteúdo não encontrado")
                .join(", ")}
              ). A criação de sala permanecerá bloqueada até que o conteúdo seja
              aprovado.
            </p>
          </div>
        )}
      </section>

      {/* Questões Selecionadas e Ordem de Apresentação */}
      <section className="bg-[#6334E3]/20 border-2 border-[#6334E3]/50 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#6334E3]/40 pb-3">
          <div>
            <h2 className="text-lg font-black text-[#FFE14D] uppercase tracking-wider">
              3. Questões Selecionadas ({questoesSelecionadas.length} de{" "}
              {quantidadeDesejada})
            </h2>
            <p className="text-xs text-[#FFFDF7]/80">
              Reordene as questões e defina exceções de tempo individuais caso
              necessário.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={ocupado || totalAptas === 0}
              onClick={handleCompletarComAptas}
              className="px-4 py-2 rounded-xl bg-[#FFE14D] hover:bg-[#FFF085] text-[#25104A] font-black text-xs transition shadow disabled:opacity-40"
            >
              ⚡ Completar com aptas
            </button>
          </div>
        </div>

        {/* Status de Quantidade */}
        {!quantidadeExata && (
          <div className="p-3.5 rounded-xl bg-[#6334E3]/40 border border-[#FFE14D]/60 text-xs text-[#FFE14D] font-bold flex items-center justify-between">
            <span>
              {questoesSelecionadas.length < quantidadeDesejada
                ? `Selecione exatamente ${quantidadeDesejada} questões (${questoesSelecionadas.length} de ${quantidadeDesejada} questões selecionadas. Faltam ${
                    quantidadeDesejada - questoesSelecionadas.length
                  } questões).`
                : `Remova ${
                    questoesSelecionadas.length - quantidadeDesejada
                  } questão(ões) para atingir exatamente ${quantidadeDesejada}.`}
            </span>
          </div>
        )}

        {/* Lista de Selecionadas */}
        <div className="space-y-3">
          {questoesSelecionadas.map((q, idx) => {
            const tempoIndividual = selecao.duracaoPorQuestao?.[q.id] ?? "";
            return (
              <div
                key={q.id}
                data-testid={`selecionada-${q.id}`}
                className="p-4 rounded-2xl bg-[#25104A]/90 border border-[#6334E3]/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#6334E3] text-[#FFE14D] font-black text-sm flex items-center justify-center shrink-0">
                    {idx + 1}º
                  </span>
                  <div>
                    <span className="font-extrabold text-sm text-[#FFFDF7] block">
                      {q.tema || "Questão"}
                    </span>
                    <span className="text-[11px] text-[#FFFDF7]/70 font-mono">
                      ID: {q.id} {q.ano ? `• ENEM ${q.ano}` : ""}
                    </span>
                  </div>
                </div>

                {/* Controles de Tempo e Reordenação */}
                <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[#FFFDF7]/70">Tempo (s):</span>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      data-testid={`input-tempo-${q.id}`}
                      placeholder={String(selecao.duracaoSegundos ?? 60)}
                      value={tempoIndividual}
                      disabled={ocupado}
                      onChange={(e) =>
                        handleDuracaoIndividualChange(q.id, e.target.value)
                      }
                      className="w-20 px-2 py-1.5 rounded-lg bg-[#25104A] border border-[#6334E3] text-[#FFE14D] font-mono font-bold text-xs text-center focus:border-[#00DDEB] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`btn-mover-cima-${q.id}`}
                      disabled={ocupado || idx === 0}
                      onClick={() => handleMoverQuestao(idx, -1)}
                      className="w-8 h-8 rounded-lg bg-[#6334E3]/50 hover:bg-[#6334E3] text-[#FFFDF7] font-bold text-xs disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      data-testid={`btn-mover-baixo-${q.id}`}
                      disabled={
                        ocupado || idx === questoesSelecionadas.length - 1
                      }
                      onClick={() => handleMoverQuestao(idx, 1)}
                      className="w-8 h-8 rounded-lg bg-[#6334E3]/50 hover:bg-[#6334E3] text-[#FFFDF7] font-bold text-xs disabled:opacity-30"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      data-testid={`btn-remover-${q.id}`}
                      disabled={ocupado}
                      onClick={() => handleToggleQuestao(q.id)}
                      className="w-8 h-8 rounded-lg bg-[#FF4F9B]/20 hover:bg-[#FF4F9B]/40 text-[#FF4F9B] border border-[#FF4F9B]/40 font-bold text-xs disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {questoesSelecionadas.length === 0 && (
            <p className="text-center text-xs text-[#FFFDF7]/60 italic py-6">
              Nenhuma questão selecionada ainda. Escolha no catálogo contextual
              abaixo ou clique em &ldquo;Completar com aptas&rdquo;.
            </p>
          )}
        </div>
      </section>

      {/* Catálogo Contextual Disponível */}
      <section className="bg-[#6334E3]/20 border-2 border-[#6334E3]/50 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#6334E3]/40 pb-3">
          <div>
            <h2 className="text-lg font-black text-[#00DDEB] uppercase tracking-wider">
              4. Catálogo Contextual de Questões
            </h2>
            <p className="text-xs text-[#FFFDF7]/80">
              Questões comprovadamente vinculadas aos conteúdos selecionados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-[#FFE14D] bg-[#FFE14D]/20 border border-[#FFE14D]/40 px-3 py-1 rounded-full">
              {totalCompativeis} compatíveis ({totalAptas} aptas)
            </span>
          </div>
        </div>

        {/* Sem conteúdo selecionado */}
        {conteudoIdsSelecionados.length === 0 && (
          <div className="p-8 text-center space-y-2 bg-[#25104A]/60 rounded-2xl border border-dashed border-[#6334E3]/40">
            <p className="text-sm font-bold text-[#FFE14D]">
              Nenhum conteúdo selecionado. Selecione ao menos um conteúdo para
              visualizar questões.
            </p>
            <p className="text-xs text-[#FFFDF7]/70">
              O catálogo de questões só é disponibilizado após a escolha dos
              temas que serão abordados na aula.
            </p>
          </div>
        )}

        {/* Catálogo ativo com filtros secundários */}
        {conteudoIdsSelecionados.length > 0 && (
          <div className="space-y-4">
            {/* Filtros secundários */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Buscar por tema..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#25104A] border border-[#6334E3] text-xs text-[#FFFDF7] focus:outline-none focus:border-[#00DDEB]"
              />
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#25104A] border border-[#6334E3] text-xs text-[#FFFDF7] focus:outline-none focus:border-[#00DDEB]"
              >
                <option value="">Todos os anos</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2019">2019</option>
              </select>
              <select
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#25104A] border border-[#6334E3] text-xs text-[#FFFDF7] focus:outline-none focus:border-[#00DDEB]"
              >
                <option value="">Todas as modalidades</option>
                <option value="regular">Regular</option>
                <option value="ppl">PPL</option>
                <option value="reaplicacao">Reaplicação</option>
              </select>
            </div>

            {/* Grid de Questões */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {questoesCatalogoFiltradas.map((q) => {
                const jaSelecionada = (selecao.questaoIds || []).includes(q.id);
                return (
                  <div
                    key={q.id}
                    data-testid={`catalogo-questao-${q.id}`}
                    className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between gap-3 ${
                      jaSelecionada
                        ? "bg-[#6334E3]/40 border-[#FFE14D]"
                        : "bg-[#25104A]/90 border-[#6334E3]/40 text-[#FFFDF7]/90"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#00DDEB]">
                          {q.id}
                        </span>
                        {q.apta === true ? (
                          <span className="text-[10px] font-bold text-[#B7F247] bg-[#B7F247]/20 border border-[#B7F247]/40 px-2 py-0.5 rounded-md">
                            Apta
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#FF4F9B] bg-[#FF4F9B]/20 border border-[#FF4F9B]/40 px-2 py-0.5 rounded-md">
                            Rascunho
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-[#FFFDF7]">
                        {q.tema}
                      </h4>
                      <p className="text-[11px] text-[#FFFDF7]/70">
                        {q.ano ? `ENEM ${q.ano}` : ""}{" "}
                        {q.aplicacoes ? `• ${q.aplicacoes.join(", ")}` : ""}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#6334E3]/30 flex items-center justify-between gap-2">
                      {onAbrirRevisao && (
                        <button
                          type="button"
                          data-testid={`btn-inspecionar-${q.id}`}
                          disabled={ocupado}
                          onClick={() => onAbrirRevisao(q.id)}
                          className="text-xs text-[#00DDEB] hover:text-[#54EEF8] font-bold underline"
                        >
                          Inspecionar
                        </button>
                      )}

                      <button
                        type="button"
                        data-testid={`btn-adicionar-${q.id}`}
                        disabled={ocupado || q.apta !== true}
                        onClick={() => handleToggleQuestao(q.id)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition ${
                          jaSelecionada
                            ? "bg-[#FF4F9B] text-[#25104A] hover:bg-[#FF80B6]"
                            : "bg-[#00DDEB] text-[#25104A] hover:bg-[#54EEF8]"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {jaSelecionada ? "Remover" : "Adicionar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {questoesCatalogoFiltradas.length === 0 && (
              <p className="text-center text-xs text-[#FFFDF7]/60 italic py-6">
                Nenhuma questão contextual encontrada com os filtros informados.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default PrepararAulaoTematico;
