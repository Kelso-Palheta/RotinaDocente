"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEntregas } from '@/hooks/atividades/useEntregas';
import { getAtividade } from '@/lib/firebase-atividades';
import { EntregaDrawer } from './EntregaDrawer';
import { UrlCopyPanel } from './UrlCopyPanel';
import { AtividadeForm } from './AtividadeForm';
import { db } from '@/lib/firebase';
import { getDocs, collection } from 'firebase/firestore';

const statusColors = {
  entregue: 'bg-blue-50 text-blue-600 border-blue-200',
  corrigido: 'bg-green-50 text-green-600 border-green-200',
  erro_correcao: 'bg-red-50 text-red-600 border-red-200',
  revisado: 'bg-violet-50 text-violet-600 border-violet-200'
};

const statusLabels = {
  entregue: 'Entregue',
  corrigido: 'Corrigido',
  erro_correcao: 'Erro na correção',
  revisado: 'Revisado'
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
    {statusLabels[status] || status}
  </span>
);

export const AtividadePainel = ({ atividade: atividadeInicial, currentTurmaId, onBack, onDelete, onAtividadeUpdated, useAtividadesHook, turmas = [], onSyncAtvMapa, onSetNota, user }) => {
  const [atividade, setAtividade] = useState(atividadeInicial);

  const handleNotaChanged = useCallback((info) => {
    if (onSetNota) {
      const bim = info.bimestre || atividade.bimestre;
      onSetNota(info.turmaId, bim, info.alunoId, atividade.id, info.notaFinal);
    }
  }, [atividade.id, atividade.bimestre, onSetNota]);

  const { entregas, corrigindo, overrideNota, corrigirEntrega } = useEntregas(atividade.id, handleNotaChanged);
  const [alunosInfo, setAlunosInfo] = useState({});
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [showUrls, setShowUrls] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [nivelCorrecao, setNivelCorrecao] = useState('normal');

  useEffect(() => {
    const load = async () => {
      setLoadingAlunos(true);
      const info = {};
      try {
        const snap = await getDocs(collection(db, 'atividades', atividade.id, 'tokens'));
        snap.forEach((d) => {
          const data = d.data();
          if (!currentTurmaId || data.turmaId === currentTurmaId) {
            info[data.alunoId] = { nome: data.nome, turmaId: data.turmaId, token: data.token };
          }
        });
      } catch { /* ignora */ }

      // Fallback: se não há tokens, carrega alunos direto das turmas vinculadas
      if (Object.keys(info).length === 0) {
        const turmasVinculadas = currentTurmaId
          ? [turmas.find(t => t.id === currentTurmaId)].filter(Boolean)
          : (atividade.turmaIds || []).map(tid => turmas.find(t => t.id === tid)).filter(Boolean);
        for (const t of turmasVinculadas) {
          for (const aluno of (t.alunos || [])) {
            if (!info[aluno.id]) {
              info[aluno.id] = { nome: aluno.nome, turmaId: t.id, token: null };
            }
          }
        }
      }

      setAlunosInfo(info);
      setLoadingAlunos(false);
    };
    load();
  }, [atividade.id, atividade.turmaIds, currentTurmaId, turmas]);

  const syncedRef = useRef(new Set());
  useEffect(() => {
    if (!onSetNota) return;
    for (const e of entregas) {
      if ((e.status === 'corrigido' || e.status === 'revisado') && !syncedRef.current.has(e.id)) {
        const nota = e.notaRevisada ?? e.notaFinal;
        if (nota != null) {
          syncedRef.current.add(e.id);
          const bim = e.bimestre || atividade.bimestre;
          onSetNota(e.turmaId, bim, e.alunoId, atividade.id, nota);
        }
      }
    }
  }, [entregas, atividade.id, atividade.bimestre, onSetNota]);

  const handleCorrigir = useCallback(async (entregaId) => {
    const entregaAtual = entregas.find(e => e.id === entregaId);
    if (!entregaAtual) return;

    if (entregaAtual.notaRevisada != null) {
      const manter = !window.confirm(
        `Este aluno já tem nota ${entregaAtual.notaRevisada.toFixed(2).replace('.', ',')} (definida manualmente).\n\n` +
        `A correção por IA irá substituir esta nota. Deseja continuar?`
      );
      if (manter) return;
    }

    try {
      const atvCompleta = await getAtividade(atividade.id);
      const resultado = await corrigirEntrega(entregaId, atvCompleta, nivelCorrecao);
      if (!resultado || !atvCompleta) return;

      const bim = String(atvCompleta.bimestre || entregaAtual.bimestre);
      for (const tid of (atvCompleta.turmaIds || [entregaAtual.turmaId])) {
        onSetNota?.(tid, bim, entregaAtual.alunoId, atividade.id, resultado.notaFinal);
      }

      try {
        await useAtividadesHook.sincronizarTodasAsNotas(entregaAtual.turmaId);
      } catch (syncErr) {
        console.error('Erro ao sincronizar notas:', syncErr);
      }

      useAtividadesHook.publicarNotaAluno(entregaAtual.turmaId, entregaAtual.alunoId, {});
    } catch (err) {
      alert('Erro na correção: ' + err.message);
    }
  }, [atividade.id, entregas, corrigirEntrega, nivelCorrecao, useAtividadesHook, onSetNota]);

  const handleCorrigirTodas = useCallback(async () => {
    const pendentes = entregas.filter(e => e.status === 'entregue');
    if (pendentes.length === 0) {
      alert('Nenhuma entrega pendente de correção.');
      return;
    }
    if (!window.confirm(`Corrigir ${pendentes.length} entrega(s) com IA?`)) return;
    for (const e of pendentes) {
      await handleCorrigir(e.id);
    }
  }, [entregas, handleCorrigir]);

  const entregasFiltradas = filtroStatus === 'todos'
    ? entregas
    : entregas.filter(e => e.status === filtroStatus);

  const multiplaTurmas = (atividade.turmaIds?.length || 0) > 1;

  const alunosSorted = Object.entries(alunosInfo).sort(([, a], [, b]) => {
    const tc = (a.turmaId || '').localeCompare(b.turmaId || '', 'pt-BR');
    return tc !== 0 ? tc : (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });

  const alunosVisiveis = filtroStatus === 'todos'
    ? alunosSorted
    : alunosSorted.filter(([alunoId]) => entregasFiltradas.some(e => e.alunoId === alunoId));

  const pendentes = entregas.filter(e => e.status === 'entregue').length;
  const corrigidas = entregas.filter(e => e.status === 'corrigido' || e.status === 'revisado').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{atividade.titulo}</h3>
          <p className="text-xs text-slate-400">
            {currentTurmaId && (
              <span className="text-violet-500 font-medium">{turmas.find(t => t.id === currentTurmaId)?.nome || currentTurmaId} &middot; </span>
            )}
            {corrigidas}/{entregas.length} corrigidas &middot; {pendentes} pendentes
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {pendentes > 0 && (
            <select
              value={nivelCorrecao}
              onChange={(e) => setNivelCorrecao(e.target.value)}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-violet-400/50"
              title="Profundidade da correção"
            >
              <option value="superficial">Superficial</option>
              <option value="normal">Normal</option>
              <option value="profunda">Profunda</option>
            </select>
          )}
          {pendentes > 0 && (
            <button
              onClick={handleCorrigirTodas}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 rounded-lg text-white text-xs font-semibold transition-all"
            >
              Corrigir Todas ({pendentes})
            </button>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium transition-all"
          >
            Editar
          </button>
          <button
            onClick={() => setShowUrls(true)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium transition-all"
          >
            URLs
          </button>
          <button
            onClick={() => onDelete(atividade.id)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs text-red-500 font-medium transition-all"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', 'entregue', 'corrigido', 'erro_correcao', 'revisado'].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all
              ${filtroStatus === s
                ? 'bg-violet-500 text-white'
                : 'bg-slate-50 text-slate-400 hover:bg-slate-200 border border-slate-200'}`}
          >
            {s === 'todos' ? 'Todos' : statusLabels[s] || s}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aluno</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nota</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Entregue em</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loadingAlunos && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                    Carregando alunos...
                  </td>
                </tr>
              )}
              {(() => {
                if (!loadingAlunos && alunosVisiveis.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                        Nenhuma entrega com este status.
                      </td>
                    </tr>
                  );
                }
                const rows = [];
                let lastTurmaId = null;
                for (const [alunoId, info] of alunosVisiveis) {
                  if (multiplaTurmas && info.turmaId !== lastTurmaId) {
                    lastTurmaId = info.turmaId;
                    const turmaNome = turmas.find(t => t.id === info.turmaId)?.nome || info.turmaId;
                    rows.push(
                      <tr key={`h-${info.turmaId}`} className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={5} className="px-4 py-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Turma {turmaNome}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  const entrega = entregasFiltradas.find(e => e.alunoId === alunoId);
                  const nota = entrega?.notaRevisada ?? entrega?.notaFinal;
                  rows.push(
                    <tr key={alunoId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900 text-sm">{info.nome}</span>
                      </td>
                      <td className="px-4 py-3">
                        {entrega ? <StatusBadge status={entrega.status} /> : (
                          <span className="text-xs text-slate-400">Pendente</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {nota != null ? (
                          <span className="font-mono text-sm text-slate-900 tabular-nums">
                            {nota.toFixed(2).replace('.', ',')}
                            <span className="text-slate-400 text-xs">/{atividade.notaMaxima.toFixed(1).replace('.', ',')}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {entrega?.submittedAt?.toDate ? entrega.submittedAt.toDate().toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {entrega?.status === 'entregue' && (
                            <button
                              onClick={() => handleCorrigir(entrega.id)}
                              disabled={corrigindo === entrega.id}
                              className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-500 rounded text-[10px] font-semibold transition-all disabled:opacity-50"
                            >
                              {corrigindo === entrega.id ? 'Corrigindo...' : 'Corrigir IA'}
                            </button>
                          )}
                          {entrega?.status === 'erro_correcao' && (
                            <button
                              onClick={() => handleCorrigir(entrega.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded text-[10px] font-semibold transition-all"
                            >
                              Re-corrigir
                            </button>
                          )}
                          {entrega && (
                            <button
                              onClick={() => setSelectedEntrega(entrega)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-200 text-slate-900 rounded text-[10px] font-medium transition-all"
                            >
                              Ver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEntrega && (
        <EntregaDrawer
          entrega={selectedEntrega}
          atividade={atividade}
          alunoNome={alunosInfo[selectedEntrega.alunoId]?.nome || 'Aluno'}
          onOverride={(novaNota) => overrideNota(selectedEntrega.id, novaNota, user?.uid)}
          onCorrigir={() => handleCorrigir(selectedEntrega.id)}
          onClose={() => setSelectedEntrega(null)}
        />
      )}

      {showUrls && (
        <UrlCopyPanel
          activityId={atividade.id}
          alunosInfo={alunosInfo}
          onClose={() => setShowUrls(false)}
        />
      )}

      {showEdit && (
        <AtividadeForm
          turmas={turmas}
          initialData={atividade}
          onUpdate={async (id, payload) => {
            await useAtividadesHook.updateAtividade(id, payload);
            const fresh = await getAtividade(id);
            if (fresh) {
              setAtividade(fresh);
              onAtividadeUpdated?.(fresh);
              if (onSyncAtvMapa) {
                // Sync all current turmas
                for (const turmaId of payload.turmaIds) {
                  onSyncAtvMapa(turmaId, atividade.bimestre, payload.bimestre, payload.id || atividade.id, payload.titulo, payload.notaMaxima, false);
                }
                // Remove from turmas that were unchecked
                const turmasAntigas = atividade.turmaIds || [];
                for (const tId of turmasAntigas) {
                  if (!payload.turmaIds.includes(tId)) {
                    onSyncAtvMapa(tId, atividade.bimestre, payload.bimestre, payload.id || atividade.id, payload.titulo, payload.notaMaxima, true);
                  }
                }
              }
            }
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
};
