"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Check,
  BookOpen,
  Layers,
  Sparkles,
  HelpCircle,
  Image as ImageIcon,
  ArrowRight,
  ListPlus,
  Lightbulb,
} from "lucide-react";
import { CATEGORIAS_MAP, CATEGORIAS_DEFICIENCIA } from "@/dominio/adaptacoes/CategoriasDeficiencia";
import { ModalNovaQuestao } from "./ModalNovaQuestao";

export function PainelBancoQuestoes({
  questoes = [],
  questoesNaProva = [],
  onAdicionarAProva,
  onRemoverDaProva,
  onSalvarQuestao,
  onExcluirQuestao,
  onNavegarParaMontador,
}) {
  const [busca, setBusca] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filtroNecessidade, setFiltroNecessidade] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [questaoParaEditar, setQuestaoParaEditar] = useState(null);

  // Lista filtrada
  const filtradas = questoes.filter((q) => {
    if (filtroDisciplina && q.disciplina && q.disciplina.toLowerCase() !== filtroDisciplina.toLowerCase()) {
      return false;
    }
    if (filtroTipo && q.tipo && q.tipo.toLowerCase() !== filtroTipo.toLowerCase()) {
      return false;
    }
    if (filtroNecessidade) {
      if (!Array.isArray(q.necessidades) || !q.necessidades.includes(filtroNecessidade)) {
        return false;
      }
    }
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      const txt = `${q.enunciado || ""} ${q.tema || ""} ${q.habilidadeBNCC || ""} ${q.disciplina || ""}`.toLowerCase();
      if (!txt.includes(termo)) return false;
    }
    return true;
  });

  const idsNaProva = new Set(questoesNaProva.map((q) => q.id));

  return (
    <div className="space-y-6">
      {/* Barra de Topo: Estatísticas e Ações Rápidas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-[#e2d9f7] rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#6315D9] to-[#25104a] flex items-center justify-center text-white shadow-md shadow-[#6315D9]/10">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-base font-black text-[#25104a]">
              Banco de Questões Adaptadas
            </h2>
            <p className="text-xs text-[#5b4b86]">
              {questoes.length} {questoes.length === 1 ? "questão cadastrada" : "questões cadastradas"} disponíveis para montagem
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {questoesNaProva.length > 0 && (
            <button
              type="button"
              onClick={onNavegarParaMontador}
              className="px-4 py-2.5 bg-[#F3EDFF] hover:bg-[#E7DBFD] text-[#25104A] border border-[#E2D9F7] rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <span>Prova em Montagem:</span>
              <span className="w-5 h-5 rounded-full bg-[#6315D9] text-white flex items-center justify-center text-[10px] font-black">
                {questoesNaProva.length}
              </span>
              <ArrowRight size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setQuestaoParaEditar(null);
              setModalNovoAberto(true);
            }}
            className="px-4 py-2.5 bg-linear-to-r from-[#6315d9] to-[#5411b8] hover:opacity-95 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#6315d9]/20"
          >
            <Plus size={16} />
            Nova Questão
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="p-4 bg-white border border-[#e2d9f7] rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Busca textual */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b4b86]" size={16} />
            <input
              type="text"
              placeholder="Buscar por enunciado, tema ou código BNCC..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl text-xs font-medium text-[#25104a] placeholder-[#5b4b86]/60 focus:outline-hidden focus:border-[#6315d9]"
            />
          </div>

          {/* Filtro por Disciplina */}
          <select
            value={filtroDisciplina}
            onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl text-xs font-medium text-[#25104a] focus:outline-hidden focus:border-[#6315d9]"
          >
            <option value="">Todas as Disciplinas</option>
            <option value="Língua Portuguesa">Língua Portuguesa</option>
            <option value="Matemática">Matemática</option>
            <option value="Ciências">Ciências</option>
            <option value="História">História</option>
            <option value="Geografia">Geografia</option>
            <option value="Artes">Artes</option>
            <option value="Inglês">Inglês</option>
            <option value="Biologia">Biologia</option>
            <option value="Física">Física</option>
            <option value="Química">Química</option>
          </select>

          {/* Filtro por Necessidade DUA */}
          <select
            value={filtroNecessidade}
            onChange={(e) => setFiltroNecessidade(e.target.value)}
            className="w-full md:w-48 px-3 py-2 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl text-xs font-medium text-[#25104a] focus:outline-hidden focus:border-[#6315d9]"
          >
            <option value="">Todas as Necessidades</option>
            {CATEGORIAS_DEFICIENCIA.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full md:w-40 px-3 py-2 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl text-xs font-medium text-[#25104a] focus:outline-hidden focus:border-[#6315d9]"
          >
            <option value="">Todos os Tipos</option>
            <option value="multipla_escolha">Múltipla Escolha</option>
            <option value="verdadeiro_falso">V / F</option>
            <option value="associacao">Associação</option>
            <option value="discursiva">Discursiva</option>
          </select>
        </div>
      </div>

      {/* Grid de Questões */}
      {filtradas.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#e2d9f7] rounded-3xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f3edff] border border-[#e2d9f7] flex items-center justify-center text-[#5b4b86]">
            <BookOpen size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#25104a]">Nenhuma questão encontrada</h3>
          <p className="text-xs text-[#5b4b86] max-w-sm mx-auto">
            {busca || filtroDisciplina || filtroNecessidade || filtroTipo
              ? "Tente ajustar os filtros ou os termos da busca acima."
              : "Cadastre novas questões manualmente ou salve as questões geradas pelo Gerador de IA DUA."}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuestaoParaEditar(null);
              setModalNovoAberto(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6315d9] text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus size={14} /> Cadastrar Primeira Questão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map((q) => {
            const naProva = idsNaProva.has(q.id);
            return (
              <div
                key={q.id}
                className={`bg-white border rounded-3xl p-5 transition-all shadow-xs flex flex-col justify-between ${
                  naProva
                    ? "border-[#6315D9] ring-2 ring-[#6315D9]/10"
                    : "border-[#e2d9f7] hover:border-[#B9A6EF]"
                }`}
              >
                <div className="space-y-3">
                  {/* Badges de Metadados */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#f3edff] border border-[#e2d9f7] text-[10px] font-black text-[#25104a]">
                      {q.disciplina || "Geral"}
                    </span>
                    {q.anoEscolar && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#F3EDFF] text-[10px] font-bold text-[#4A3B7C]">
                        {q.anoEscolar}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#F3EDFF] text-[#25104A] text-[10px] font-bold">
                      {q.tipo === "multipla_escolha"
                        ? "Múltipla Escolha"
                        : q.tipo === "verdadeiro_falso"
                        ? "V/F"
                        : q.tipo === "associacao"
                        ? "Associação"
                        : "Discursiva"}
                    </span>
                    {(q.necessidades || []).map((nec) => {
                      const cat = CATEGORIAS_MAP[nec];
                      return (
                        <span
                          key={nec}
                          className="px-2 py-0.5 rounded-lg bg-[#F3EDFF] border border-[#E7DBFD] text-[#6315d9] text-[10px] font-bold"
                        >
                          {cat ? cat.nome : nec}
                        </span>
                      );
                    })}
                  </div>

                  {/* Enunciado */}
                  <p className="text-xs font-bold text-[#25104a] leading-relaxed">
                    {q.enunciado}
                  </p>

                  {/* Apoio Visual */}
                  {q.apoioVisualDescricao && (
                    <div className="p-2.5 bg-[#F3EDFF]/70 border border-[#E2D9F7]/60 rounded-xl flex items-start gap-2">
                      <ImageIcon size={14} className="text-[#6315D9] shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-[#25104A] leading-tight">
                        <strong className="font-bold">Apoio Visual:</strong> {q.apoioVisualDescricao}
                      </p>
                    </div>
                  )}

                  {/* Alternativas */}
                  {Array.isArray(q.alternativas) && q.alternativas.length > 0 && (
                    <div className="space-y-1 pl-1">
                      {q.alternativas.map((alt, i) => (
                        <div key={i} className="text-[11px] text-[#5b4b86] flex items-center gap-1.5">
                          <span className="font-bold text-[#25104a]">{alt.slice(0, 3)}</span>
                          <span>{alt.slice(3)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gabarito para o Professor */}
                  {q.gabarito && (
                    <div className="text-[11px] font-bold text-[#5411B8] bg-[#F3EDFF] px-2.5 py-1 rounded-lg inline-block">
                      Gabarito: {q.gabarito}
                    </div>
                  )}

                  {/* Scaffolding */}
                  {q.scaffolding && (
                    <div className="text-[11px] text-[#25104A] bg-[#F3EDFF]/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-[#6315D9] shrink-0" />
                      <span>{q.scaffolding}</span>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card com Ações */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#e2d9f7]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setQuestaoParaEditar(q);
                        setModalNovoAberto(true);
                      }}
                      className="p-1.5 rounded-lg text-[#5b4b86] hover:text-[#25104a] hover:bg-[#f3edff] transition-colors"
                      title="Editar questão"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Deseja realmente remover esta questão do banco?")) {
                          onExcluirQuestao(q.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#6315D9] hover:bg-[#F3EDFF] transition-colors"
                      title="Excluir questão"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (naProva) {
                        onRemoverDaProva(q.id);
                      } else {
                        onAdicionarAProva(q);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      naProva
                        ? "bg-[#6315D9] text-white shadow-xs"
                        : "bg-[#f3edff] border border-[#e2d9f7] text-[#25104a] hover:border-[#B9A6EF] hover:text-[#25104A]"
                    }`}
                  >
                    {naProva ? (
                      <>
                        <Check size={14} />
                        Na Prova
                      </>
                    ) : (
                      <>
                        <ListPlus size={14} />
                        + Adicionar à Prova
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <ModalNovaQuestao
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        onSalvar={onSalvarQuestao}
        questaoParaEditar={questaoParaEditar}
      />
    </div>
  );
}
