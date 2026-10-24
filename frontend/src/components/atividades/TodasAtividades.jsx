"use client";

import { useState, useEffect } from 'react';
import { AtividadePainel } from './AtividadePainel';
import { AtividadeForm } from './AtividadeForm';
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
  const [resumoSync, setResumoSync] = useState('');
  const [enviando, setEnviando] = useState(false);
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

  const escopo = {
    ...(filtroTurma !== 'todas' ? { turmaId: filtroTurma } : {}),
    ...(filtroBimestre !== 'todos' ? { bimestre: filtroBimestre } : {}),
  };
  const temFiltro = Object.keys(escopo).length > 0;
  const filtradas = todasAtividades.filter(atv => atv.status !== 'arquivada' && turmas.some(t => atv.turmaIds?.includes(t.id)) && atividadeNoEscopo(atv, escopo));

  const handleCreate = async (data) => {
    const id = await createAtividade(data);
    for (const turmaId of data.turmaIds) {
      await onAddAtv(turmaId, data.bimestre, data.titulo, data.notaMaxima, data.id || id);
    }
    loadAllAtividades();
  };

  const handleDelete = async (atvId) => {
    if (!window.confirm('Arquivar esta atividade em todas as turmas vinculadas? Entregas, notas e devolutivas serão preservadas. O acesso para novas respostas será encerrado.')) return;
    await deleteAtividade(atvId);
    loadAllAtividades();
    setPainelAtividade(null);
  };

  if (painelAtividade) {
    return (
      <AtividadePainel
        key={`${painelAtividade.id}:${painelAtividade.bimestre}:${filtroTurma}`}
        sincronizacaoAutomatica={false}
        atividade={painelAtividade}
        currentTurmaId={filtroTurma !== 'todas' ? filtroTurma : undefined}
        onBack={() => { setPainelAtividade(null); loadAllAtividades(); }}
        onDelete={handleDelete}
        onAtividadeUpdated={(fresh) => setPainelAtividade(fresh)}
        useAtividadesHook={useAtividadesHook}
        turmas={turmas}
        user={user}
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

  return (
    <div>
      {useAtividadesHook.erro && <p role="alert" className="bg-red-50 p-3 text-sm">{useAtividadesHook.erro} <button onClick={() => loadAllAtividades()} className="underline">Tentar carregar novamente</button></p>}
      {resumoSync && <p role="status" className="bg-blue-50 p-3 text-sm mb-3">{resumoSync}</p>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Todas as atividades</h3>
          <span className="text-xs text-slate-400 font-mono">({filtradas.length})</span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={enviando}
            onClick={async () => {
              if (!window.confirm(temFiltro ? 'Sincronizar somente as notas das turmas e bimestres filtrados?' : 'Sincronizar todas as notas corrigidas, de todas as turmas, anos e bimestres, para o Diário?')) return;
              setEnviando(true);
              try {
                const result = temFiltro
                  ? await useAtividadesHook.sincronizarTodasAsNotas(escopo)
                  : await useAtividadesHook.sincronizarTodasAsNotas();
                setResumoSync(`${result.sincronizadas} notas sincronizadas.${result.erros > 0 ? ` ${result.erros} erros; tente novamente.` : ''} Notas enviadas ao Diário; publicação no Portal é feita pelo Diário.`);
              } catch (err) {
                setResumoSync('Falha ao sincronizar: ' + err.message);
              } finally { setEnviando(false); }
            }}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-white text-xs font-semibold transition-all"
          >
            {temFiltro ? 'Sincronizar notas filtradas' : 'Sincronizar todas as notas'}
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
          aria-label="Filtrar atividades por turma"
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
          aria-label="Filtrar atividades por bimestre"
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
          contextoInicial={{ ...(filtroTurma !== 'todas' ? { turmaId: filtroTurma } : {}), ...(filtroBimestre !== 'todos' ? { bimestre: Number(filtroBimestre) } : {}) }}
          onCreate={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
