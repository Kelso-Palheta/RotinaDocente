"use client";
import { useEffect } from 'react';

const percentual = valor => `${Math.round(Number(valor) * 100)}%`;

const recortar = (texto, limite = 240) => {
  const limpo = String(texto || '').trim();
  return limpo.length > limite ? `${limpo.slice(0, limite)}…` : limpo;
};

/**
 * Painel de revisão dos grupos apontados pelo alerta de similaridade (RN-78).
 * Somente leitura: não calcula nem altera nota.
 */
export function SimilaridadePainel({ grupos = [], onAbrir, onFechar }) {
  useEffect(() => {
    const aoTeclar = evento => { if (evento.key === 'Escape') onFechar?.(); };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Grupos com respostas parecidas"
        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-auto"
      >
        <header className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-[#25104a]">Respostas parecidas</h3>
          <button type="button" onClick={onFechar} className="text-xs font-semibold text-[#6E5F94] hover:text-[#25104A]">Fechar</button>
        </header>
        <p className="text-xs text-[#5b4b86] my-3">
          Nenhuma nota foi alterada. O alerta aproxima respostas com 70% ou mais de semelhança de escrita —
          leia os trechos e decida. Vocabulário parecido em ordem diferente não entra no grupo.
        </p>

        {grupos.length === 0 && <p className="text-sm text-[#5b4b86]">Nenhum grupo para revisar.</p>}

        {grupos.map((grupo, indice) => {
          const nome = alunoId => grupo.alunos.find(aluno => aluno.alunoId === alunoId)?.nome || alunoId;
          return (
            <article key={indice} className="border border-[#e2d9f7] rounded-xl p-4 mb-3">
              <h4 className="text-sm font-bold text-[#25104a]">
                Grupo {indice + 1} · {grupo.alunos.length} alunos
                {Number.isFinite(grupo.similaridadeMaxima) && grupo.similaridadeMaxima > 0
                  ? ` · ${percentual(grupo.similaridadeMinima)} a ${percentual(grupo.similaridadeMaxima)}`
                  : ''}
              </h4>

              <ul className="mt-2 space-y-2">
                {grupo.alunos.map(aluno => (
                  <li key={aluno.alunoId} className="flex flex-col sm:flex-row sm:items-start gap-2 border-t border-[#F3EDFF] pt-2 first:border-0 first:pt-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#25104A]">{aluno.nome || aluno.alunoId}</p>
                      <p className="text-xs text-[#5b4b86] whitespace-pre-wrap">{recortar(aluno.texto)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAbrir?.(aluno)}
                      className="btn-brand-navy px-2 py-1 text-[10px] font-semibold self-start"
                    >
                      Abrir correção
                    </button>
                  </li>
                ))}
              </ul>

              {grupo.pares?.length > 0 && (
                <p className="text-[11px] text-[#5b4b86] mt-2">
                  Pares: {grupo.pares.map(par => `${nome(par.a)} × ${nome(par.b)} ${percentual(par.similaridade)}`).join(' · ')}
                </p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
