"use client";

import { useState, useEffect } from 'react';
import { AtividadePainel } from './AtividadePainel';
import { AtividadeForm } from './AtividadeForm';

const StatusBadge = ({ status }) => {
  const map = {
    ativa: 'bg-green-50 text-green-600 border-green-200',
    encerrada: 'bg-slate-50 text-slate-500 border-slate-200',
    rascunho: 'bg-amber-50 text-amber-600 border-amber-200'
  };
  const labels = { ativa: 'Ativa', encerrada: 'Encerrada', rascunho: 'Rascunho' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || map.ativa}`}>
      {labels[status] || status}
    </span>
  );
};

export const TodasAtividades = ({
  turmas,
  user,
  useAtividadesHook,
  onAddAtv = () => {},
  onRemoveAtv = () => {},
  onSetNota = () => {}
}) => {
  const { todasAtividades, loading, loadAllAtividades, createAtividade, deleteAtividade, entregasCounts, loadEntregasCounts } = useAtividadesHook;
  const [showForm, setShowForm] = useState(false);
  const [painelAtividade, setPainelAtividade] = useState(null);
  const [filtroTurma, setFiltroTurma] = useState('todas');
  const [filtroBimestre, setFiltroBimestre] = useState('todos');

  useEffect(() => {
    loadAllAtividades();
  }, [loadAllAtividades]);

  useEffect(() => {
    if (todasAtividades.length > 0) {
      loadEntregasCounts(todasAtividades.map(a => a.id));
    }
  }, [todasAtividades, loadEntregasCounts]);

  const filtradas = todasAtividades.filter((atv) => {
    if (filtroTurma !== 'todas' && !atv.turmaIds?.includes(filtroTurma)) return false;
    if (filtroBimestre !== 'todos' && atv.bimestre !== Number(filtroBimestre)) return false;
    return true;
  });

  const handleCreate = async (data) => {
    const id = await createAtividade(data);
    for (const turmaId of data.turmaIds) {
      onAddAtv(turmaId, data.bimestre, data.titulo, data.notaMaxima, data.id || id);
    }
    loadAllAtividades();
  };

  const handleDelete = async (atvId) => {
    if (!window.confirm('Excluir esta atividade? Todas as entregas e notas serão removidas.')) return;
    const atv = todasAtividades.find(a => a.id === atvId);
    await deleteAtividade(atvId, () => {
      if (atv) {
        for (const turmaId of atv.turmaIds || []) {
          onRemoveAtv(turmaId, atv.bimestre, atv.id);
        }
      }
    });
    loadAllAtividades();
    setPainelAtividade(null);
  };

  if (painelAtividade) {
    return (
      <AtividadePainel
        atividade={painelAtividade}
        onBack={() => { setPainelAtividade(null); loadAllAtividades(); }}
        onDelete={handleDelete}
        onAtividadeUpdated={(fresh) => setPainelAtividade(fresh)}
        useAtividadesHook={useAtividadesHook}
        turmas={turmas}
        user={user}
        onSyncAtvMapa={(turmaId, oldBimestre, newBimestre, atvId, titulo, max, isRemoved) => {
          if (isRemoved) {
            onRemoveAtv(turmaId, oldBimestre, atvId);
            return;
          }
          if (String(oldBimestre) !== String(newBimestre)) {
            onRemoveAtv(turmaId, oldBimestre, atvId);
          }
          onAddAtv(turmaId, newBimestre, titulo, max, atvId);
        }}
        onSetNota={onSetNota}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Banco de Atividades</h3>
          <span className="text-xs text-slate-400 font-mono">({filtradas.length})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (!window.confirm('Sincronizar todas as notas corrigidas para o mapa bimestral?')) return;
              try {
                const result = await useAtividadesHook.sincronizarTodasAsNotas();
                alert(`${result.sincronizadas} notas sincronizadas.${result.erros > 0 ? ` ${result.erros} erros.` : ''} Recarregue a página.`);
                window.location.reload();
              } catch (err) {
                alert('Erro: ' + err.message);
              }
            }}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-white text-xs font-semibold transition-all"
          >
            Sincronizar notas
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-violet-500 hover:bg-violet-400 rounded-lg text-white text-xs font-semibold transition-all btn-3d-primary"
          >
            + Nova Atividade
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={filtroTurma}
          onChange={(e) => setFiltroTurma(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-violet-400/50 shadow-sm"
        >
          <option value="todas">Todas as turmas</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>

        <select
          value={filtroBimestre}
          onChange={(e) => setFiltroBimestre(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-violet-400/50 shadow-sm"
        >
          <option value="todos">Todos os bimestres</option>
          {[1, 2, 3, 4].map((b) => (
            <option key={b} value={b}>{b}º Bimestre</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">
            {todasAtividades.length === 0
              ? 'Nenhuma atividade criada ainda.'
              : 'Nenhuma atividade com estes filtros.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((atv) => {
            const prazo = atv.dataEntrega?.toDate?.() || new Date(atv.dataEntrega);
            const encerrada = prazo < new Date();

            return (
              <button
                key={atv.id}
                onClick={() => setPainelAtividade(atv)}
                className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-violet-300 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{atv.titulo}</h4>
                      <StatusBadge status={encerrada ? 'encerrada' : atv.status || 'ativa'} />
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {atv.bimestre}º bimestre
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Nota máx: {atv.notaMaxima?.toFixed?.(1)?.replace?.('.', ',') || atv.notaMaxima} &middot; Entrega: {prazo.toLocaleDateString('pt-BR')}
                      {entregasCounts[atv.id] != null && (
                        <span className={`ml-2 font-semibold ${entregasCounts[atv.id].pendentes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ({entregasCounts[atv.id].total} entrega{entregasCounts[atv.id].total !== 1 ? 's' : ''}
                          {entregasCounts[atv.id].pendentes > 0 ? `, ${entregasCounts[atv.id].pendentes} pendente${entregasCounts[atv.id].pendentes !== 1 ? 's' : ''}` : ''})
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {atv.turmaIds?.map((tid) => {
                        const t = turmas.find(tu => tu.id === tid);
                        return t ? (
                          <span key={tid} className="px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded text-[10px] font-medium">
                            {t.nome}
                          </span>
                        ) : null;
                      })}
                      {atv.questoes && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-medium">
                          {atv.questoes.length} questão{atv.questoes.length !== 1 ? 'ões' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 flex-shrink-0 mt-1 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showForm && (
        <AtividadeForm
          turmas={turmas}
          onCreate={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
