"use client";

import { useState, useEffect, useCallback } from 'react';
import { AtividadeForm } from './AtividadeForm';
import { AtividadePainel } from './AtividadePainel';
import { atividadeNoEscopo } from '@/dominio/diario/sincronizacaoAtividades';

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

export const AtividadesList = ({
  turma,
  user,
  bimestre,
  turmas,
  useAtividadesHook,
  onAddAtv,
  onRemoveAtv,
  onUpdateAtvMax,
  onSetNota
}) => {
  const { atividades, loading, loadAtividades, createAtividade, deleteAtividade, entregasCounts, loadEntregasCounts } = useAtividadesHook;
  const [showForm, setShowForm] = useState(false);
  const [resumoSync, setResumoSync] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [painelAtividade, setPainelAtividade] = useState(null);

  useEffect(() => {
    if (turma?.id) loadAtividades(turma.id);
  }, [turma?.id, loadAtividades]);

  useEffect(() => {
    const ids = atividades.filter(a => a.status !== 'arquivada' && atividadeNoEscopo(a, { turmaId: turma?.id, bimestre })).map(a => a.id);
    if (ids.length > 0) loadEntregasCounts(ids);
  }, [atividades, bimestre, turma?.id, loadEntregasCounts]);

  const handleCreate = useCallback(async (data) => {
    const id = await createAtividade(data);

    for (const turmaId of data.turmaIds) {
      await onAddAtv(turmaId, data.bimestre, data.titulo, data.notaMaxima, data.id || id);
    }

    if (turma?.id) loadAtividades(turma.id);
  }, [createAtividade, onAddAtv, turma, loadAtividades]);

  const handleDelete = useCallback(async (atvId) => {
    if (!window.confirm('Arquivar esta atividade em todas as turmas vinculadas? Entregas, notas e devolutivas serão preservadas. O acesso para novas respostas será encerrado.')) return;

    await deleteAtividade(atvId);
    if (turma?.id) loadAtividades(turma.id);
    setPainelAtividade(null);
  }, [deleteAtividade, turma, loadAtividades]);

  if (painelAtividade && atividadeNoEscopo(painelAtividade, { turmaId: turma?.id, bimestre })) {
    return (
      <AtividadePainel
        key={`${painelAtividade.id}:${painelAtividade.bimestre}:${turma?.id}`}
        sincronizacaoAutomatica={false}
        atividade={painelAtividade}
        user={user}
        currentTurmaId={turma?.id}
        onBack={() => { setPainelAtividade(null); if (turma?.id) loadAtividades(turma.id); }}
        onDelete={handleDelete}
        onAtividadeUpdated={(atv) => { setPainelAtividade(atv); if (turma?.id) loadAtividades(turma.id); }}
        useAtividadesHook={useAtividadesHook}
        turmas={turmas}
        onSyncAtvMapa={async (turmaId, oldBimestre, newBimestre, atvId, titulo, max, isRemoved) => {
          if (isRemoved) {
            await onRemoveAtv(turmaId, oldBimestre, atvId);
            return;
          }
          if (String(oldBimestre) !== String(newBimestre)) {
            await onRemoveAtv(turmaId, oldBimestre, atvId);
          }
          await onAddAtv(turmaId, newBimestre, titulo, max, atvId);
        }}
        onSetNota={onSetNota}
      />
    );
  }

  const atividadesFiltradas = atividades.filter(a => a.status !== 'arquivada' && atividadeNoEscopo(a, { turmaId: turma?.id, bimestre }));

  return (
    <div>
      {useAtividadesHook.erro && <p role="alert" className="bg-red-50 p-3 text-sm">{useAtividadesHook.erro} <button onClick={() => loadAtividades(turma.id)} className="underline">Tentar carregar novamente</button></p>}
      {resumoSync && <p role="status" className="bg-blue-50 p-3 text-sm mb-3">{resumoSync}</p>}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Atividades</h3>
        <div className="flex gap-2">
          <button
            disabled={enviando}
            onClick={async () => {
              if (!window.confirm(`Sincronizar somente as notas da turma ${turma.nome}, ${bimestre}º bimestre?`)) return;
              setEnviando(true);
              try {
                const result = await useAtividadesHook.sincronizarTodasAsNotas({ turmaId: turma.id, bimestre });
                setResumoSync(`${result.sincronizadas} notas sincronizadas.${result.erros > 0 ? ` ${result.erros} erros; tente novamente.` : ''} Notas enviadas ao Diário; publicação no Portal é feita pelo Diário.`);
              } catch (err) {
                setResumoSync('Falha ao sincronizar: ' + err.message);
              } finally { setEnviando(false); }
            }}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-white text-xs font-semibold transition-all"
          >
            Sincronizar turma e bimestre
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-violet-500 hover:bg-violet-400 rounded-lg text-white text-xs font-semibold transition-all btn-3d-primary"
          >
            + Nova Atividade
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : atividadesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">
            Nenhuma atividade neste bimestre.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {atividadesFiltradas.map((atv) => {
            const prazo = atv.dataEntrega?.toDate?.() || new Date(atv.dataEntrega);
            const agora = new Date();
            const encerrada = prazo < agora;

            return (
              <button
                key={atv.id}
                onClick={() => setPainelAtividade(atv)}
                className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-violet-300 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{atv.titulo}</h4>
                      <StatusBadge status={encerrada ? 'encerrada' : atv.status || 'ativa'} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Nota máx: {atv.notaMaxima?.toFixed?.(1)?.replace?.('.', ',') || atv.notaMaxima} &middot; Entrega: {prazo.toLocaleDateString('pt-BR')}
                      {entregasCounts[atv.id] != null && (
                        <span className={`ml-2 font-semibold ${entregasCounts[atv.id].pendentes > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                          ({entregasCounts[atv.id].total} entregue{entregasCounts[atv.id].total !== 1 ? 's' : ''}
                          {entregasCounts[atv.id].pendentes > 0 ? `, ${entregasCounts[atv.id].pendentes} pendente${entregasCounts[atv.id].pendentes !== 1 ? 's' : ''}` : ''})
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {atv.turmaIds?.map((tid) => {
                        const t = turmas.find(tu => tu.id === tid);
                        return t ? (
                          <span key={tid} className="px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded text-[10px] font-medium">
                            {t.nome}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-400 flex-shrink-0 mt-1 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          contextoInicial={{ turmaId: turma?.id, bimestre }}
          onCreate={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
