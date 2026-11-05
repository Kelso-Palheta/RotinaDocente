'use client';

import React, { useState, useMemo } from 'react';
import { validarPreparacao } from '@/dominio/revisao/preparacao';

/**
 * PrepararAulao — Componente controlado para montagem e configuração do aulão.
 *
 * Contrato: PrepararAulao({ turmas, questoes, selecao, ocupado, erro, onAlterar, onCriar, onAbrirRevisao })
 */
export function PrepararAulao({
  turmas = [],
  questoes = [],
  selecao = { titulo: '', turmaIds: [], questaoIds: [], duracaoSegundos: 60 },
  ocupado = false,
  erro = null,
  onAlterar,
  onCriar,
  onAbrirRevisao,
  textoAcao,
  podeEditarTurmas = true,
  modoEdicao = false,
  codigoSala = '',
  onRecarregar = null,
  onCancelar = null,
}) {
  // Filtros locais (não descartam a seleção de questoes)
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [filtroTema, setFiltroTema] = useState('');

  const questaoMap = useMemo(() => {
    return new Map(questoes.map((q) => [q.id, q]));
  }, [questoes]);

  // Lista de questões selecionadas na ordem de questaoIds
  const questoesSelecionadas = useMemo(() => {
    return (selecao.questaoIds || []).map((id) => {
      return questaoMap.get(id) || { id, tema: 'Questão não encontrada', apta: false };
    });
  }, [selecao.questaoIds, questaoMap]);

  const motivoBloqueio = validarPreparacao(selecao, turmas, questoes);

  const podeCriar = !motivoBloqueio && !ocupado;

  // Filtragem do catálogo disponível
  const questoesFiltradas = useMemo(() => {
    return questoes.filter((q) => {
      if (filtroAno && String(q.ano) !== String(filtroAno)) return false;
      if (
        filtroModalidade &&
        !(q.aplicacoes || []).includes(filtroModalidade)
      ) {
        return false;
      }
      if (
        filtroTema &&
        !q.tema?.toLowerCase().includes(filtroTema.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [questoes, filtroAno, filtroModalidade, filtroTema]);

  // Handlers controlados
  const handleTituloChange = (e) => {
    if (onAlterar && !ocupado) {
      onAlterar({ ...selecao, titulo: e.target.value });
    }
  };

  const handleDuracaoChange = (e) => {
    if (onAlterar && !ocupado) {
      const val = e.target.value === '' ? '' : Number(e.target.value);
      onAlterar({
        ...selecao,
        duracaoSegundos: val,
      });
    }
  };

  const handleToggleTurma = (turmaId) => {
    if (!onAlterar || ocupado) return;
    const jaSelecionada = (selecao.turmaIds || []).includes(turmaId);
    const novaLista = jaSelecionada
      ? selecao.turmaIds.filter((id) => id !== turmaId)
      : [...(selecao.turmaIds || []), turmaId];
    onAlterar({ ...selecao, turmaIds: novaLista });
  };

  const handleAdicionarQuestao = (questaoId) => {
    if (!onAlterar || ocupado) return;
    const q = questaoMap.get(questaoId);
    if (!q || q.apta !== true) return;
    if ((selecao.questaoIds || []).includes(questaoId)) return;
    onAlterar({
      ...selecao,
      questaoIds: [...(selecao.questaoIds || []), questaoId],
    });
  };

  const handleRemoverQuestao = (questaoId) => {
    if (!onAlterar || ocupado) return;
    onAlterar({
      ...selecao,
      questaoIds: (selecao.questaoIds || []).filter((id) => id !== questaoId),
    });
  };

  const handleMoverQuestao = (index, direcao) => {
    if (!onAlterar || ocupado) return;
    const lista = [...(selecao.questaoIds || [])];
    const destino = index + direcao;
    if (destino < 0 || destino >= lista.length) return;
    const item = lista[index];
    lista[index] = lista[destino];
    lista[destino] = item;
    onAlterar({ ...selecao, questaoIds: lista });
  };

  const handleCriar = (e) => {
    e.preventDefault();
    if (podeCriar && onCriar) {
      onCriar(selecao);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-[#081a19] text-slate-100 font-sans space-y-8">
      {/* Cabeçalho */}
      <header className="border-b border-teal-800/40 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-1">
            {modoEdicao ? `Edição de Sala • ${codigoSala}` : 'Planejamento Docente • Revisão ENEM Arte'}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {modoEdicao ? `Editar Sala: ${codigoSala}` : 'Preparar Novo Aulão ao Vivo'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Configure as turmas participantes, o tempo por questão e ordene os itens revisados do acervo.
          </p>
        </div>
        {onCancelar && (
          <button
            type="button"
            disabled={ocupado}
            onClick={onCancelar}
            className="px-4 py-2 rounded-xl border border-teal-600 hover:bg-teal-800/50 text-xs font-bold text-teal-200 transition"
          >
            Cancelar edição
          </button>
        )}
      </header>

      {/* Alerta de Erro */}
      {erro && (
        <div
          role="alert"
          className="p-4 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span className="font-bold text-rose-400">Erro:</span>
            <span>{erro}</span>
          </div>
          {onRecarregar && (
            <button
              type="button"
              onClick={onRecarregar}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs uppercase tracking-wider transition whitespace-nowrap"
            >
              Recarregar dados da sala
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleCriar} className="space-y-8">
        {/* Seção 1: Configurações Gerais (Título e Duração) */}
        <section className="bg-[#123c3a]/70 border border-teal-800/40 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-teal-800/40 pb-3">
            1. Dados Gerais da Sessão
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label
                htmlFor="input-titulo-aulao"
                className="block text-xs font-semibold uppercase tracking-wider text-teal-300"
              >
                Título do Aulão <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-titulo-aulao"
                type="text"
                value={selecao?.titulo || ''}
                onChange={handleTituloChange}
                disabled={ocupado}
                maxLength={120}
                placeholder="Ex: Aulão Especial ENEM Arte — Vanguardas e Espaço Urbano"
                className="w-full px-4 py-2.5 bg-[#0c2423] border border-teal-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 transition disabled:opacity-50 text-sm"
              />
              <span className="text-xs text-slate-400 block text-right">
                {(selecao?.titulo || '').length}/120 caracteres
              </span>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="input-duracao-segundos"
                className="block text-xs font-semibold uppercase tracking-wider text-teal-300"
              >
                Duração por Questão (segundos) <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-duracao-segundos"
                type="number"
                min={10}
                max={600}
                value={selecao?.duracaoSegundos ?? ''}
                onChange={handleDuracaoChange}
                disabled={ocupado}
                className="w-full px-4 py-2.5 bg-[#0c2423] border border-teal-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 transition disabled:opacity-50 text-sm"
              />
              <span className="text-xs text-slate-400 block">
                Permitido: 10 a 600 segundos (10s a 10min).
              </span>
            </div>
          </div>

          {/* Seleção de Turmas */}
          <div className="space-y-3 pt-4 border-t border-teal-800/40">
            <span className="block text-xs font-semibold uppercase tracking-wider text-teal-300">
              Turmas Participantes <span className="text-rose-400">*</span>
            </span>
            {!podeEditarTurmas && (
              <p className="text-xs text-amber-300 font-medium bg-amber-950/40 border border-amber-600/40 p-2.5 rounded-xl">
                Participantes já estão na sala de espera. As turmas e a lista de alunos estão congeladas.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {turmas.map((turma) => {
                const checked = (selecao.turmaIds || []).includes(turma.id);
                return (
                  <label
                    key={turma.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm transition select-none ${
                      checked
                        ? 'bg-teal-900/60 border-teal-500 text-teal-100 font-medium'
                        : 'bg-[#0c2423] border-teal-800/40 text-slate-300 hover:border-teal-700/60'
                    } ${ocupado || !podeEditarTurmas ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => podeEditarTurmas && handleToggleTurma(turma.id)}
                      disabled={ocupado || !podeEditarTurmas}
                      className="w-4 h-4 rounded text-teal-600 bg-slate-900 border-teal-700 focus:ring-teal-400"
                    />
                    <span>{turma.nome}</span>
                  </label>
                );
              })}
              {turmas.length === 0 && (
                <p className="text-sm text-slate-400 italic">
                  Nenhuma turma cadastrada no momento.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Seção 2: Questões Selecionadas e Ordem de Execução */}
        <section className="bg-[#123c3a]/70 border border-teal-800/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-800/40 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                2. Questões Selecionadas ({questoesSelecionadas.length})
              </h2>
              <p className="text-xs text-slate-300">
                A ordem definida nesta lista dita a sequência exata das rodadas durante a aula.
              </p>
            </div>
            {questoesSelecionadas.length > 0 && (
              <span className="text-xs font-mono font-semibold text-teal-300 bg-teal-950 px-2.5 py-1 rounded-full border border-teal-700/60">
                {questoesSelecionadas.length} {questoesSelecionadas.length === 1 ? 'rodada' : 'rodadas'}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {questoesSelecionadas.map((q, idx) => {
              const ehPrimeiro = idx === 0;
              const ehUltimo = idx === questoesSelecionadas.length - 1;
              const ehInapta = q.apta !== true;

              return (
                <div
                  key={`${q.id}:${idx}`}
                  data-testid="item-questao-selecionada"
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    ehInapta
                      ? 'bg-rose-950/40 border-rose-700/60'
                      : 'bg-[#0c2423] border-teal-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-teal-800/70 border border-teal-600/70 text-teal-200 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                          {q.ano ? `ENEM ${q.ano}` : 'ENEM'}
                        </span>
                        {q.aplicacoes && q.aplicacoes.length > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/40">
                            {q.aplicacoes.join(', ')}
                          </span>
                        )}
                        {ehInapta && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-600 font-bold">
                            Não Apta / Rascunho
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mt-1">
                        {q.tema}
                      </h3>
                      <span className="text-xs text-slate-400 block font-mono">
                        ID: {q.id}
                      </span>
                    </div>
                  </div>

                  {/* Ações de Reordenação e Remoção */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      aria-label={`mover ${q.id} para cima`}
                      onClick={() => handleMoverQuestao(idx, -1)}
                      disabled={ehPrimeiro || ocupado}
                      className="p-1.5 rounded-lg bg-teal-900/50 border border-teal-700/40 text-teal-200 hover:bg-teal-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-semibold"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={`mover ${q.id} para baixo`}
                      onClick={() => handleMoverQuestao(idx, 1)}
                      disabled={ehUltimo || ocupado}
                      className="p-1.5 rounded-lg bg-teal-900/50 border border-teal-700/40 text-teal-200 hover:bg-teal-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-semibold"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      aria-label={`remover questão ${q.id}`}
                      onClick={() => handleRemoverQuestao(q.id)}
                      disabled={ocupado}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-rose-300 hover:bg-rose-900/60 disabled:opacity-40 transition text-xs font-medium ml-2"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}

            {questoesSelecionadas.length === 0 && (
              <div className="p-8 border border-dashed border-teal-800/40 rounded-xl text-center text-slate-400 text-sm">
                Nenhuma questão adicionada ainda. Selecione questões no catálogo abaixo.
              </div>
            )}
          </div>
        </section>

        {/* Seção 3: Catálogo de Questões com Filtros */}
        <section className="bg-[#123c3a]/70 border border-teal-800/40 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-teal-800/40 pb-3">
            <h2 className="text-lg font-bold text-white">
              3. Catálogo de Questões do Acervo
            </h2>
            <p className="text-xs text-slate-300">
              Filtre por ano, aplicação ou tema. Somente questões com revisão concluída podem ser incluídas na sessão.
            </p>
          </div>

          {/* Filtros Locais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0c2423] p-4 rounded-xl border border-teal-800/40">
            <div>
              <label
                htmlFor="filtro-ano"
                className="block text-xs font-semibold text-teal-300 uppercase mb-1"
              >
                Filtrar por Ano
              </label>
              <input
                id="filtro-ano"
                type="text"
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                placeholder="Ex: 2024"
                className="w-full px-3 py-1.5 bg-[#081a19] border border-teal-700/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div>
              <label
                htmlFor="filtro-modalidade"
                className="block text-xs font-semibold text-teal-300 uppercase mb-1"
              >
                Filtrar por Aplicação
              </label>
              <select
                id="filtro-modalidade"
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#081a19] border border-teal-700/60 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="">Todas as modalidades</option>
                <option value="regular">Regular</option>
                <option value="ppl">PPL</option>
                <option value="reaplicacao">Reaplicação</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-tema"
                className="block text-xs font-semibold text-teal-300 uppercase mb-1"
              >
                Filtrar por Tema
              </label>
              <input
                id="filtro-tema"
                type="text"
                value={filtroTema}
                onChange={(e) => setFiltroTema(e.target.value)}
                placeholder="Ex: Contemporânea"
                className="w-full px-3 py-1.5 bg-[#081a19] border border-teal-700/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Lista do Catálogo Filtrado */}
          <div
            data-testid="catalogo-questoes-disponiveis"
            className="space-y-3 max-h-96 overflow-y-auto pr-1"
          >
            {questoesFiltradas.map((q) => {
              const jaAdicionada = (selecao.questaoIds || []).includes(q.id);

              return (
                <div
                  key={q.id}
                  className="p-4 bg-[#0c2423] border border-teal-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-teal-300 uppercase">
                        ENEM {q.ano}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/40">
                        {(q.aplicacoes || []).join(', ')}
                      </span>
                      {q.apta === true ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600 font-semibold">
                          Apta para Sala
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600 font-semibold">
                          Revisão Pendente
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1">
                      {q.tema}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {q.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {q.apta === true ? (
                      <button
                        type="button"
                        aria-label={`adicionar questão ${q.id}`}
                        onClick={() => handleAdicionarQuestao(q.id)}
                        disabled={jaAdicionada || ocupado}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          jaAdicionada
                            ? 'bg-teal-950 border border-teal-800 text-teal-400/60 cursor-default'
                            : 'bg-teal-600 hover:bg-teal-500 text-teal-950 font-bold shadow'
                        } disabled:opacity-50`}
                      >
                        {jaAdicionada ? 'Já Adicionada' : '+ Adicionar'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`adicionar questão ${q.id}`}
                          disabled
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                        >
                          Inapta
                        </button>
                        {onAbrirRevisao && (
                          <button
                            type="button"
                            aria-label={`inspecionar questão ${q.id}`}
                            onClick={() => onAbrirRevisao(q.id)}
                            disabled={ocupado}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/60 border border-amber-700/60 text-amber-200 hover:bg-amber-900/60 transition"
                          >
                            Inspecionar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {questoesFiltradas.length === 0 && (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                Nenhuma questão encontrada com os filtros atuais.
              </p>
            )}
          </div>
        </section>

        {/* Rodapé e Botão de Criação */}
        <footer className="pt-4 border-t border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {motivoBloqueio && (
              <p className="text-xs text-amber-300 font-medium">
                ⚠️ {motivoBloqueio}
              </p>
            )}
          </div>

          <button
            type="submit"
            aria-label={modoEdicao ? 'salvar alterações' : 'criar aulão'}
            disabled={!podeCriar}
            className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-sm tracking-wide shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {ocupado ? (modoEdicao ? 'Salvando...' : 'Criando Sessão...') : (textoAcao || 'Criar Aulão')}
          </button>
        </footer>
      </form>
    </div>
  );
}
