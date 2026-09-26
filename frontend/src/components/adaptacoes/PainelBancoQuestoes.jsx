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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-[#dce0f0] rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-indigo-500 to-[#101942] flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-base font-black text-[#101942]">
              Banco de Questões Adaptadas
            </h2>
            <p className="text-xs text-[#6070a0]">
              {questoes.length} {questoes.length === 1 ? "questão cadastrada" : "questões cadastradas"} disponíveis para montagem
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {questoesNaProva.length > 0 && (
            <button
              type="button"
              onClick={onNavegarParaMontador}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <span>Prova em Montagem:</span>
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
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
            className="px-4 py-2.5 bg-linear-to-r from-[#f60c49] to-[#d40840] hover:opacity-95 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#f60c49]/20"
          >
            <Plus size={16} />
            Nova Questão
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="p-4 bg-white border border-[#dce0f0] rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Busca textual */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6070a0]" size={16} />
            <input
              type="text"
              placeholder="Buscar por enunciado, tema ou código BNCC..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl text-xs font-medium text-[#101942] placeholder-[#6070a0]/60 focus:outline-hidden focus:border-[#f60c49]"
            />
          </div>

          {/* Filtro por Disciplina */}
          <select
            value={filtroDisciplina}
            onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
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
            className="w-full md:w-48 px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
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
            className="w-full md:w-40 px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
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
        <div className="p-12 text-center bg-white border border-[#dce0f0] rounded-3xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f8f9fd] border border-[#dce0f0] flex items-center justify-center text-[#6070a0]">
            <BookOpen size={24} />
          </div>
          <h3 className="text-sm font-bold text-[#101942]">Nenhuma questão encontrada</h3>
          <p className="text-xs text-[#6070a0] max-w-sm mx-auto">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f60c49] text-white rounded-xl text-xs font-bold shadow-sm"
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
                    ? "border-indigo-400 ring-2 ring-indigo-500/10"
                    : "border-[#dce0f0] hover:border-gray-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Badges de Metadados */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#f8f9fd] border border-[#dce0f0] text-[10px] font-black text-[#101942]">
                      {q.disciplina || "Geral"}
                    </span>
                    {q.anoEscolar && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-700">
                        {q.anoEscolar}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold">
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
                          className="px-2 py-0.5 rounded-lg bg-pink-50 border border-pink-100 text-[#f60c49] text-[10px] font-bold"
                        >
                          {cat ? cat.nome : nec}
                        </span>
                      );
                    })}
                  </div>

                  {/* Enunciado */}
                  <p className="text-xs font-bold text-[#101942] leading-relaxed">
                    {q.enunciado}
                  </p>

                  {/* Apoio Visual */}
                  {q.apoioVisualDescricao && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2">
                      <ImageIcon size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-amber-900 leading-tight">
                        <strong className="font-bold">Apoio Visual:</strong> {q.apoioVisualDescricao}
                      </p>
                    </div>
                  )}

                  {/* Alternativas */}
                  {Array.isArray(q.alternativas) && q.alternativas.length > 0 && (
                    <div className="space-y-1 pl-1">
                      {q.alternativas.map((alt, i) => (
                        <div key={i} className="text-[11px] text-[#6070a0] flex items-center gap-1.5">
                          <span className="font-bold text-[#101942]">{alt.slice(0, 3)}</span>
                          <span>{alt.slice(3)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gabarito para o Professor */}
                  {q.gabarito && (
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                      Gabarito: {q.gabarito}
                    </div>
                  )}

                  {/* Scaffolding */}
                  {q.scaffolding && (
                    <div className="text-[11px] text-indigo-700 bg-indigo-50/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-indigo-600 shrink-0" />
                      <span>{q.scaffolding}</span>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card com Ações */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#dce0f0]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setQuestaoParaEditar(q);
                        setModalNovoAberto(true);
                      }}
                      className="p-1.5 rounded-lg text-[#6070a0] hover:text-[#101942] hover:bg-[#f8f9fd] transition-colors"
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
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-[#f8f9fd] border border-[#dce0f0] text-[#101942] hover:border-indigo-300 hover:text-indigo-700"
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
