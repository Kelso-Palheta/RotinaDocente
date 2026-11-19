'use client';

import React, { useState } from 'react';
import { listarAvaliacoes } from './api';

export default function HistoricoAvaliacoes({
  turmas = [],
  contextoAvaliacao = null,
  dadosIniciais = null,
  onAbrirRelatorio,
  obterToken,
}) {
  const [itens, setItens] = useState(dadosIniciais?.itens || []);
  const [totalFiltrado, setTotalFiltrado] = useState(dadosIniciais?.totalFiltrado ?? 0);
  const [proximoCursor, setProximoCursor] = useState(dadosIniciais?.proximoCursor || null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtros, setFiltros] = useState({
    ano: '',
    finalidade: '',
    turmaId: '',
    bimestre: '',
    disciplina: '',
    conteudo: '',
    alunoId: '',
    de: '',
    ate: '',
  });
  const anosLista = contextoAvaliacao?.anos || [];

  const buscar = async ({ resetar = true, cursor = null } = {}) => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await listarAvaliacoes({
        filtros: { ...filtros, limite: 20, ...(cursor ? { cursor } : {}) },
        obterToken,
      });
      setItens((prev) => (resetar ? res.itens || [] : [...prev, ...(res.itens || [])]));
      setTotalFiltrado(res.totalFiltrado ?? 0);
      setProximoCursor(res.proximoCursor || null);
    } catch (e) {
      setErro(e?.message || 'Erro ao carregar histórico.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <section className="rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-6 space-y-4 text-[#25104A]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-head text-xl font-black">Histórico e Avaliações</h2>
          <p className="text-xs font-semibold text-[#5B4B86]">
            {totalFiltrado} registros encontrados · Paginação completa
          </p>
        </div>
        <button
          type="button"
          disabled={carregando}
          onClick={() => buscar({ resetar: true })}
          className="min-h-10 rounded-xl bg-[#6315D9] px-4 py-2 text-xs font-extrabold text-white"
        >
          {carregando ? 'Buscando...' : 'Atualizar / Filtrar'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <select
          aria-label="Filtrar por finalidade"
          value={filtros.finalidade}
          onChange={(e) => setFiltros((f) => ({ ...f, finalidade: e.target.value }))}
          className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 text-xs font-bold"
        >
          <option value="">Todas as finalidades</option>
          <option value="avaliativa">Avaliativa</option>
          <option value="revisao">Revisão</option>
        </select>

        <select
          aria-label="Filtrar por turma"
          value={filtros.turmaId}
          onChange={(e) => setFiltros((f) => ({ ...f, turmaId: e.target.value }))}
          className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 text-xs font-bold"
        >
          <option value="">Todas as turmas</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por bimestre"
          value={filtros.bimestre}
          onChange={(e) => setFiltros((f) => ({ ...f, bimestre: e.target.value }))}
          className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 text-xs font-bold"
        >
          <option value="">Todos os bimestres</option>
          <option value="1">1º Bimestre</option>
          <option value="2">2º Bimestre</option>
          <option value="3">3º Bimestre</option>
          <option value="4">4º Bimestre</option>
        </select>

        <input
          type="text"
          aria-label="Filtrar por disciplina"
          placeholder="Disciplina..."
          value={filtros.disciplina}
          onChange={(e) => setFiltros((f) => ({ ...f, disciplina: e.target.value }))}
          className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 text-xs font-bold"
        />

        <select
          aria-label="Filtrar por ano letivo"
          value={filtros.ano}
          onChange={(e) => setFiltros((f) => ({ ...f, ano: e.target.value }))}
          className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 text-xs font-bold"
        >
          <option value="">Todos os anos</option>
          {anosLista.map((a) => (
            <option key={a.id} value={a.id}>{a.rotulo}</option>
          ))}
        </select>

        <input
          type="text"
          aria-label="Filtrar por conteúdo"
          placeholder="Conteúdo..."
          value={filtros.conteudo}
          onChange={(e) => setFiltros((f) => ({ ...f, conteudo: e.target.value }))}
          className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 text-xs font-bold"
        />

        <input
          type="text"
          aria-label="Filtrar por aluno"
          placeholder="ID do aluno..."
          value={filtros.alunoId}
          onChange={(e) => setFiltros((f) => ({ ...f, alunoId: e.target.value }))}
          className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 text-xs font-bold"
        />

        <div className="flex gap-1">
          <input
            type="date"
            aria-label="Data inicial"
            value={filtros.de}
            onChange={(e) => setFiltros((f) => ({ ...f, de: e.target.value }))}
            className="min-h-10 flex-1 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-2 text-xs font-bold"
          />
          <input
            type="date"
            aria-label="Data final"
            value={filtros.ate}
            onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value }))}
            className="min-h-10 flex-1 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-2 text-xs font-bold"
          />
        </div>
      </div>

      {erro && <p role="alert" className="text-xs font-bold text-red-700">{erro}</p>}

      {itens.length === 0 ? (
        <p className="text-sm text-[#5B4B86]">Nenhuma sala encontrada para os filtros selecionados.</p>
      ) : (
        <ul className="space-y-2.5">
          {itens.map((item) => (
            <li
              key={item.codigo}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2D9F7] bg-[#F8F5FF] p-3.5"
            >
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#FFE500] px-2 py-0.5 text-[11px] font-black uppercase">
                    {item.finalidade === 'avaliativa' ? 'Avaliativa' : 'Revisão'}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#6315D9]">{item.codigo}</span>
                  <span className="text-xs font-bold text-[#5B4B86]">{item.modalidade}</span>
                </div>
                <strong className="block text-sm font-black">{item.titulo}</strong>
              </div>
              <button
                type="button"
                onClick={() => onAbrirRelatorio?.(item.codigo)}
                className="min-h-10 rounded-xl bg-[#6315D9] px-3.5 py-1.5 text-xs font-extrabold text-white"
              >
                Abrir relatório
              </button>
            </li>
          ))}
        </ul>
      )}

      {proximoCursor && (
        <button
          type="button"
          disabled={carregando}
          onClick={() => buscar({ resetar: false, cursor: proximoCursor })}
          className="min-h-10 w-full rounded-xl border border-[#6315D9] bg-white px-4 py-2 text-xs font-extrabold text-[#6315D9] hover:bg-[#F3EDFF]"
        >
          Carregar mais resultados
        </button>
      )}
    </section>
  );
}
