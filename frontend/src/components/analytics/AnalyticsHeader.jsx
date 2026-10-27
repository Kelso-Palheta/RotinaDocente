'use client';
import Link from 'next/link';
import { rotuloPeriodo } from '@/dominio/analytics/analise';
export function AnalyticsHeader({
  turmas = [],
  turmaSelecionadaId,
  onSelectTurma,
  bimestreSelecionado,
  onSelectBimestre,
  anos = [],
  ano,
  onSelectAno,
  arquivadas,
  onArquivadas,
  onExportPDF,
  exportingPDF = false,
  exportDisabled = false,
}) {
  const input = 'border border-slate-300 bg-white text-slate-900 rounded-lg p-2 text-sm';
  return (
    <header className="bg-white border rounded-2xl p-4 space-y-3">
      <div className="flex gap-4 flex-wrap justify-between items-center">
        <div>
          <Link href="/" className="underline text-sm">
            Voltar ao Hub
          </Link>
          <h1 className="text-xl font-bold">Dashboard Analytics</h1>
          <p className="text-sm text-slate-600">Acompanhe notas, pendências e evolução.</p>
        </div>
        <button
          onClick={onExportPDF}
          disabled={exportingPDF || exportDisabled || !turmas.length}
          className="btn-brand-navy rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {exportingPDF ? 'Gerando PDF…' : 'Conferir e exportar PDF'}
        </button>
      </div>
      <div className="flex gap-3 flex-wrap items-end">
        <label className="text-sm">
          Ano letivo
          <select
            aria-label="Ano letivo"
            className={`block ${input}`}
            value={ano}
            onChange={(e) => onSelectAno(e.target.value)}
          >
            <option value="legado">Legado — ano não informado</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Turma
          <select
            aria-label="Turma"
            className={`block ${input}`}
            value={turmaSelecionadaId || 'todas'}
            onChange={(e) => onSelectTurma(e.target.value === 'todas' ? null : e.target.value)}
          >
            <option value="todas">Todas as turmas ({turmas.length})</option>
            {turmaSelecionadaId && !turmas.some((t) => t.id === turmaSelecionadaId) && (
              <option value={turmaSelecionadaId}>Turma indisponível — selecione novamente</option>
            )}
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {t.disciplina ? ` · ${t.disciplina}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Período
          <select
            aria-label="Período"
            className={`block ${input}`}
            value={bimestreSelecionado}
            onChange={(e) => onSelectBimestre(e.target.value)}
          >
            {['1', '2', '3', '4', 's1', 's2', 'ano'].map((p) => (
              <option key={p} value={p}>
                {rotuloPeriodo(p)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm pb-2">
          <input type="checkbox" checked={arquivadas} onChange={(e) => onArquivadas(e.target.checked)} />{' '}
          Turmas arquivadas
        </label>
      </div>
    </header>
  );
}
