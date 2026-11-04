"use client";

import React from "react";
import {
  CATEGORIAS_DEFICIENCIA,
  CATEGORIAS_MAP,
} from "@/dominio/adaptacoes/CategoriasDeficiencia";
import {
  Sparkles,
  Layers,
  Brain,
  Eye,
  EyeOff,
  Ear,
  Activity,
  BookA,
  Calculator,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

const ICON_COMPONENTS = {
  Brain,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  Ear,
  Activity,
  BookA,
  Calculator,
  Compass,
};

export function SeletorNecessidades({
  selecionadas = [],
  onToggle,
  nivelSuporte = 1,
  onChangeNivelSuporte,
  hiperfoco = "",
  onChangeHiperfoco,
}) {
  const isMultiDeficiencia = selecionadas.length > 1;

  return (
    <div className="space-y-6">
      {/* Header com contador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#d5e3dc]">
        <div>
          <h3 className="text-base font-bold text-[#123c3a] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e] animate-pulse"></span>
            Necessidades Específicas / Deficiências
          </h3>
          <p className="text-xs text-[#4f6b63]">
            Selecione 1 ou mais categorias para estudantes com múltipla deficiência ou comorbidades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            id="badge-selecao-contagem"
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              selecionadas.length > 0
                ? "bg-[#f3f8f5] text-[#0b5f59] border border-[#daebe5]"
                : "bg-[#F3F7F5] text-[#566F65]"
            }`}
          >
            {selecionadas.length === 0
              ? "Nenhuma selecionada"
              : selecionadas.length === 1
              ? "1 categoria selecionada"
              : `${selecionadas.length} categorias (Múltipla Deficiência)`}
          </span>
        </div>
      </div>

      {/* Alerta de Sinergia Multi-Deficiência */}
      {isMultiDeficiencia && (
        <div
          id="banner-multi-deficiencia"
          className="p-3.5 bg-gradient-to-r from-[#F3F8F5] to-[#F3F8F5] border border-[#D5E3DC]/80 rounded-2xl flex items-start gap-3 shadow-xs animate-fadeIn"
        >
          <div className="p-1.5 rounded-lg bg-[#DAEBE5] text-[#123C3A] flex-shrink-0 mt-0.5">
            <Layers size={18} />
          </div>
          <div className="text-xs text-[#123c3a] space-y-0.5">
            <p className="font-bold text-[#123C3A]">
              Harmonização DUA Multi-Deficiência Ativada (RN-32)
            </p>
            <p className="text-[#4f6b63]">
              O motor pedagógico irá unificar as diretrizes de{" "}
              <strong className="text-[#123c3a]">
                {selecionadas.map((id) => CATEGORIAS_MAP[id]?.nome || id).join(" + ")}
              </strong>
              , eliminando contradições de formato e aplicando sinergia de acessibilidade.
            </p>
          </div>
        </div>
      )}

      {/* Grid de 10 Categorias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {CATEGORIAS_DEFICIENCIA.map((cat) => {
          const isSelected = selecionadas.includes(cat.id);
          const IconComp = ICON_COMPONENTS[cat.icone] || Brain;

          return (
            <button
              key={cat.id}
              id={`btn-categoria-${cat.id}`}
              type="button"
              onClick={() => onToggle && onToggle(cat.id)}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between relative group ${
                isSelected
                  ? "bg-[#f3f8f5] border-[#0f766e] shadow-sm ring-2 ring-[#0f766e]/20"
                  : "bg-white border-[#d5e3dc] hover:border-[#0f766e]/40 hover:bg-[#f3f8f5]"
              }`}
            >
              {/* Checkmark ativo */}
              {isSelected && (
                <div className="absolute top-3 right-3 text-[#0f766e] animate-scaleIn">
                  <CheckCircle2 size={18} className="fill-[#f3f8f5]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isSelected
                        ? "bg-[#0f766e] text-white shadow-xs"
                        : "bg-[#f3f7f5] border border-[#d5e3dc] text-[#4f6b63]"
                    }`}
                  >
                    <IconComp size={18} />
                  </div>
                  <h4
                    className={`text-sm font-bold leading-tight ${
                      isSelected ? "text-[#0b5f59]" : "text-[#123c3a]"
                    }`}
                  >
                    {cat.nome}
                  </h4>
                </div>

                <p className="text-xs text-[#4f6b63] leading-relaxed line-clamp-2">
                  {cat.descricao}
                </p>
              </div>

              {/* Tag DUA */}
              <div className="mt-3 pt-2.5 border-t border-[#F3F7F5] flex items-center justify-between text-[11px]">
                <span className="text-[#566f65] truncate font-medium">
                  {cat.diretrizesDUA[0] || "Diretriz DUA"}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-[#0f766e]/10 text-[#0b5f59]"
                      : "bg-[#F3F7F5] text-[#566F65]"
                  }`}
                >
                  {isSelected ? "Ativo" : "Selecionar"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Nível de Suporte (DSM-5 / CID-11) */}
      <div className="p-5 bg-white border border-[#d5e3dc] rounded-2xl space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-[#123c3a] flex items-center gap-2">
            <Activity size={16} className="text-[#0f766e]" />
            Nível de Suporte Necessário
          </label>
          <span className="text-xs font-semibold text-[#4f6b63]">
            Grau de mediação exigido
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              nivel: 1,
              titulo: "Nível 1 — Leve",
              sub: "Apoio inicial, adaptações de formato e tempo flexível",
            },
            {
              nivel: 2,
              titulo: "Nível 2 — Moderado",
              sub: "Apoio substancial, enunciados curtos e distratores reduzidos",
            },
            {
              nivel: 3,
              titulo: "Nível 3 — Intenso",
              sub: "Apoio contínuo, scaffolding profundo e comunicação concreta",
            },
          ].map((item) => (
            <button
              key={item.nivel}
              id={`btn-nivel-suporte-${item.nivel}`}
              type="button"
              onClick={() => onChangeNivelSuporte && onChangeNivelSuporte(item.nivel)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                nivelSuporte === item.nivel
                  ? "bg-[#f3f8f5] border-[#0f766e] ring-2 ring-[#0f766e]/20"
                  : "bg-[#f3f7f5] border-[#d5e3dc] hover:bg-white text-[#4f6b63]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold ${
                    nivelSuporte === item.nivel ? "text-[#0b5f59]" : "text-[#123c3a]"
                  }`}
                >
                  {item.titulo}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    nivelSuporte === item.nivel ? "bg-[#0f766e]" : "bg-[#B7D3C8]"
                  }`}
                />
              </div>
              <p className="text-[11px] text-[#4f6b63] leading-snug">{item.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Campo de Hiperfoco / Âncora de Interesse */}
      <div className="p-4 bg-gradient-to-r from-[#F3F8F5]/50 to-[#F3F8F5]/40 border border-[#D5E3DC]/70 rounded-2xl space-y-2">
        <label
          htmlFor="input-hiperfoco"
          className="text-xs font-bold text-[#123c3a] flex items-center gap-1.5"
        >
          <Lightbulb size={15} className="text-[#0F766E]" />
          Âncora de Engajamento / Hiperfoco do Estudante (Opcional, mas Altamente Recomendado):
        </label>
        <p className="text-[11px] text-[#4f6b63]">
          Estudantes com TEA ou TDAH conectam-se muito melhor aos conteúdos quando os problemas e enunciados utilizam temas que eles adoram.
        </p>
        <input
          id="input-hiperfoco"
          type="text"
          value={hiperfoco}
          onChange={(e) => onChangeHiperfoco && onChangeHiperfoco(e.target.value)}
          placeholder="Ex: Dinossauros, Sistema Solar, Carros de Corrida, Futebol, Games..."
          className="w-full bg-white border border-[#d5e3dc] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#123c3a] placeholder-[#566f65] outline-none transition-all"
        />
      </div>
    </div>
  );
}
