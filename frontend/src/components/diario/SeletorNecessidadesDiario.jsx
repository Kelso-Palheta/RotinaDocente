"use client";

import { CATEGORIAS_DEFICIENCIA, CATEGORIAS_MAP } from '@/dominio/adaptacoes/CategoriasDeficiencia';

/**
 * Badges de identificação rápida das necessidades do aluno (RN-43).
 * Exibidos ao lado do nome do aluno na tabela do Diário Pedagógico.
 */
export const BadgeNecessidades = ({ necessidades = [] }) => {
  if (!Array.isArray(necessidades) || necessidades.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle" aria-label="Necessidades específicas">
      {necessidades.map((id) => {
        const cat = CATEGORIAS_MAP[id];
        return (
          <span
            key={id}
            title={cat?.nome || id}
            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide bg-[#f3f8f5] border border-[#daebe5] text-[#0b5f59] leading-none whitespace-nowrap"
          >
            {cat?.tag || id}
          </span>
        );
      })}
    </span>
  );
};

/**
 * Seletor compacto de necessidades (chips) para os fluxos do Diário.
 * Multisseleção com toggle; IDs validados no salvamento (RN-43).
 */
export const SeletorNecessidadesDiario = ({ selecionadas = [], onToggle, idPrefix = 'nec' }) => {
  const selecionadasSet = new Set(selecionadas);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4f6b63]">
          Necessidades / PCD (opcional)
        </span>
        <span className="text-[10px] font-semibold text-[#566f65]">
          {selecionadas.length === 0 ? 'nenhuma' : `${selecionadas.length} selecionada(s)`}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIAS_DEFICIENCIA.map((cat) => {
          const selecionada = selecionadasSet.has(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              id={`${idPrefix}-${cat.id}`}
              aria-pressed={selecionada}
              onClick={() => onToggle && onToggle(cat.id)}
              title={cat.nome}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                selecionada
                  ? 'bg-[#f3f8f5] border-[#0f766e] text-[#0b5f59] shadow-xs'
                  : 'bg-[#f3f7f5] border-[#d5e3dc] text-[#4f6b63] hover:border-[#0f766e]/40 hover:text-[#123c3a]'
              }`}
            >
              {cat.tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Alterna uma categoria na lista de selecionadas (helper puro para uso nos forms).
 */
export function alternarNecessidade(selecionadas, id) {
  const lista = Array.isArray(selecionadas) ? selecionadas : [];
  return lista.includes(id) ? lista.filter((n) => n !== id) : [...lista, id];
}
