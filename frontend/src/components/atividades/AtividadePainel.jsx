"use client";
import { decodeToken } from '@/utils/diario/tokenUtils';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { aplicarSincronizacaoAtividades, entregaNoEscopo } from '@/dominio/diario/sincronizacaoAtividades';
import { useEntregas } from '@/hooks/atividades/useEntregas';
import { getAtividade } from '@/lib/firebase-atividades';
import { EntregaDrawer } from './EntregaDrawer';
import { SimilaridadePainel } from './SimilaridadePainel';
import { textoComparavel } from '@/dominio/atividades/similaridadeRespostas';
import { ehAtividadeRecuperacao } from '@/dominio/atividades/recuperacaoSemestral';
import { rotuloPeriodo } from '@/dominio/atividades/correcaoManual';
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

const chaveAluno = (turmaId, alunoId) => JSON.stringify([turmaId, alunoId]);

export const AtividadePainel = ({ atividade: atividadeInicial, currentTurmaId, onBack, onDelete, onAtividadeUpdated, useAtividadesHook, turmas = [], onSyncAtvMapa, onSetNota, user, sincronizacaoAutomatica = true }) => {
  const [atividade, setAtividade] = useState(atividadeInicial);
  const recuperacao = ehAtividadeRecuperacao(atividade);

  const handleNotaChanged = useCallback((info) => {
    if (!onSetNota || !sincronizacaoAutomatica || recuperacao) return;
    const result = aplicarSincronizacaoAtividades({
      turmas,
      atividades: [atividade],
      entregas: [{ ...info, activityId: atividade.id, status: 'corrigido', bimestre: info.bimestre ?? atividade.bimestre }],
      escopo: { turmaId: currentTurmaId, bimestre: atividade.bimestre },
    });
    for (const alteracao of result.alteracoes) {
      onSetNota(alteracao.turmaId, alteracao.bimestre, alteracao.alunoId, alteracao.atvId, info.notaFinal);
    }
  }, [atividade, turmas, currentTurmaId, onSetNota, sincronizacaoAutomatica, recuperacao]);

  const { entregas: recebidas, corrigindo, corrigirManualmente, corrigirEntrega, similaridades = [], gruposSimilaridade = [], erro: erroEntregas } = useEntregas(atividade.id, handleNotaChanged, { turmaId: currentTurmaId, bimestre: atividade.bimestre });
  const entregas = useMemo(() => recebidas.filter(entrega => entregaNoEscopo(entrega, { turmaId: currentTurmaId, bimestre: atividade.bimestre })), [recebidas, currentTurmaId, atividade.bimestre]);
  const [alunosInfo, setAlunosInfo] = useState({});
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [modoDrawer, setModoDrawer] = useState('visualizar');
  const [showUrls, setShowUrls] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [nivelCorrecao, setNivelCorrecao] = useState('normal');
  const [mensagem, setMensagem] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [previaSync, setPreviaSync] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [lote, setLote] = useState(null);
  const loteRef = useRef(false);
  const [mostrarSimilaridade, setMostrarSimilaridade] = useState(false);

  useEffect(() => {
    let ativo = true;
    const load = async () => {
      setLoadingAlunos(true);
      const info = {};
      const vinculadas = (currentTurmaId ? turmas.filter(t => t.id === currentTurmaId) : turmas.filter(t => atividade.turmaIds?.includes(t.id)));
      for (const t of vinculadas) for (const aluno of t.alunos || []) {
        if (!atividade.alunoExclusivoId || atividade.alunoExclusivoId === aluno.id) info[chaveAluno(t.id, aluno.id)] = { alunoId: aluno.id, nome: aluno.nome, turmaId: t.id, token: null };
      }
      try {
        const snap = await getDocs(collection(db, 'atividades', atividade.id, 'tokens'));
        snap.forEach(d => {
          const data = d.data();
          if (!data.revogado && (!currentTurmaId || data.turmaId === currentTurmaId) && atividade.turmaIds?.includes(data.turmaId) && (!atividade.alunoExclusivoId || atividade.alunoExclusivoId === data.alunoId)) {
            const key = chaveAluno(data.turmaId, data.alunoId);
            const anterior = info[key];
            // Token com segredo tem prioridade sobre o legado, independentemente da ordem de leitura.
            const novo = decodeToken(data.token)?.segredo;
            if (!anterior?.token || novo) info[key] = { alunoId: data.alunoId, nome: data.nome, turmaId: data.turmaId, token: data.token };
          }
        });
      } catch (error) { if (ativo) setErroAcao('Não foi possível carregar os links de acesso: ' + error.message); }
      if (ativo) { setAlunosInfo(info); setLoadingAlunos(false); }
    };
    load();
    return () => { ativo = false; };
  }, [atividade.id, atividade.turmaIds, atividade.alunoExclusivoId, currentTurmaId, turmas]);

  const gruposSimilaridadeExibicao = useMemo(() => {
    const base = gruposSimilaridade.length
      ? gruposSimilaridade
      : (similaridades || []).map(grupo => ({
          alunos: grupo.map(entrega => ({
            alunoId: entrega.alunoId,
            turmaId: entrega.turmaId ?? null,
            entregaId: entrega.id ?? null,
            texto: textoComparavel(entrega),
          })),
          pares: [],
          similaridadeMinima: 0,
          similaridadeMaxima: 0,
        }));
    return base.map(grupo => ({
      ...grupo,
      alunos: (grupo.alunos || []).map(aluno => ({
        ...aluno,
        nome: alunosInfo[chaveAluno(aluno.turmaId, aluno.alunoId)]?.nome || aluno.alunoId,
      })),
    }));
  }, [gruposSimilaridade, similaridades, alunosInfo]);

  const abrirEntregaDoGrupo = useCallback((aluno) => {
    const entrega = entregas.find(item => (aluno.entregaId && item.id === aluno.entregaId)
      || (item.alunoId === aluno.alunoId && item.turmaId === aluno.turmaId));
    setMostrarSimilaridade(false);
    if (!entrega) return;
    setModoDrawer('visualizar');
    setSelectedEntrega(entrega);
  }, [entregas]);

  const syncedRef = useRef(new Set());
  useEffect(() => {
    if (!onSetNota || !sincronizacaoAutomatica) return;
    for (const entrega of entregas) {
      if (!['corrigido', 'revisado'].includes(entrega.status)) continue;
      const nota = entrega.notaRevisada ?? entrega.notaFinal;
      const chave = `${entrega.id}:${nota}`;
      if (nota == null || syncedRef.current.has(chave)) continue;
      syncedRef.current.add(chave);
      handleNotaChanged({ turmaId: entrega.turmaId, bimestre: entrega.bimestre ?? atividade.bimestre, alunoId: entrega.alunoId, notaFinal: nota });
    }
  }, [entregas, atividade.bimestre, handleNotaChanged, onSetNota, sincronizacaoAutomatica]);

  const sincronizarCorrecao = useCallback(async (entrega, bim) => {
    if (recuperacao) { setMensagem('Correção salva. Confira a recuperação e lance a nota quando concluir.'); return; }
    if (!sincronizacaoAutomatica) { setMensagem('Correção salva. Confira e sincronize as notas quando concluir a revisão.'); return; }
    try {
      const sync = await useAtividadesHook.sincronizarTodasAsNotas({ turmaId: entrega.turmaId, bimestre: bim, atividadeId: atividade.id, alunoId: entrega.alunoId });
      const publicacao = sync?.publicacoes?.find(item => item.turmaId === entrega.turmaId && item.alunoId === entrega.alunoId && item.bimestre === bim);
      if (publicacao) await useAtividadesHook.publicarNotaAluno?.(entrega.turmaId, entrega.alunoId, { [bim]: publicacao.dadosBimestre });
    } catch (error) {
      setErroAcao('Correção salva, mas o envio da nota falhou: ' + error.message);
    }
  }, [atividade.id, useAtividadesHook, sincronizacaoAutomatica, recuperacao]);

  const handleCorrigirManual = useCallback(async (entregaId, dados) => {
    const entrega = entregas.find(item => item.id === entregaId);
    const fresh = await getAtividade(atividade.id);
    if (!entrega || !fresh || String(fresh.bimestre) !== String(atividade.bimestre) || !fresh.turmaIds?.includes(entrega.turmaId)) throw new Error('Entrega fora da turma/bimestre selecionados.');
    await corrigirManualmente(entregaId, fresh, dados, user?.uid);
    await sincronizarCorrecao(entrega, String(fresh.bimestre));
  }, [atividade.id, atividade.bimestre, entregas, corrigirManualmente, user?.uid, sincronizarCorrecao]);

  const handleCorrigir = useCallback(async (entregaId, emLote = false) => {
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
      if (!atvCompleta || String(atvCompleta.bimestre) !== String(atividade.bimestre) || !atvCompleta.turmaIds?.includes(entregaAtual.turmaId)) {
        throw new Error('A atividade mudou de turma ou bimestre. Reabra o painel antes de corrigir.');
      }
      const resultado = await corrigirEntrega(entregaId, atvCompleta, nivelCorrecao);
      if (!resultado || !atvCompleta) return;

      const bim = String(atvCompleta.bimestre ?? entregaAtual.bimestre);
      await sincronizarCorrecao(entregaAtual, bim);

      // RN-77: imagem omitida ou resposta truncada não pode passar em silêncio.
      const avisos = resultado.avisos || (resultado.avisoCorrecao ? [resultado.avisoCorrecao] : []);
      if (avisos.length) setMensagem(avisos.join(' '));
      return { ...resultado, avisos };

    } catch (err) {
      setErroAcao('Erro na correção: ' + err.message);
      if (emLote) throw err;
      alert('Erro na correção: ' + err.message);
    }
  }, [atividade.id, atividade.bimestre, entregas, corrigirEntrega, nivelCorrecao, sincronizarCorrecao]);

  const handleCorrigirTodas = useCallback(async () => {
    if (loteRef.current) return;
    const pendentes = entregas.filter(e => ['entregue', 'erro_correcao'].includes(e.status));
    if (!pendentes.length) return;
    if (!window.confirm(`Corrigir ${pendentes.length} entrega(s) com IA?`)) return;
    loteRef.current = true; setErroAcao('');
    let feitas = 0; const falhas = []; let comAviso = 0;
    try {
      for (const e of pendentes) {
        setLote({ feitas, total: pendentes.length });
        try {
          const resultado = await handleCorrigir(e.id, true);
          if (resultado?.avisos?.length) comAviso++;
        } catch { falhas.push(e.alunoId); }
        feitas++;
      }
      setMensagem(`Lote concluído: ${feitas - falhas.length} ${feitas - falhas.length === 1 ? 'corrigida' : 'corrigidas'}, ${falhas.length} ${falhas.length === 1 ? 'falha' : 'falhas'}.${falhas.length ? ' Tente novamente somente as entregas com erro.' : ''}${comAviso ? ` ${comAviso} ${comAviso === 1 ? 'corrigida' : 'corrigidas'} sem alguma imagem — revise manualmente.` : ''}`);
    } finally { loteRef.current = false; setLote(null); }
  }, [entregas, handleCorrigir]);
  const confirmarSync = async () => {
    setSincronizando(true); setErroAcao('');
    try {
      const r = await useAtividadesHook.sincronizarTodasAsNotas({ ...(currentTurmaId ? { turmaId: currentTurmaId } : {}), bimestre: atividade.bimestre, atividadeId: atividade.id });
      setMensagem(`${r.sincronizadas || 0} notas sincronizadas com o Diário. Publicação no Portal: use Conferir e publicar no Diário.`);
      setPreviaSync(false);
    } catch (error) { setErroAcao(error.message); }
    finally { setSincronizando(false); }
  };

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
    : alunosSorted.filter(([, info]) => entregasFiltradas.some(e => e.alunoId === info.alunoId && e.turmaId === info.turmaId));

  const pendentes = entregas.filter(e => ['entregue', 'erro_correcao'].includes(e.status)).length;
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
          {!sincronizacaoAutomatica && !recuperacao && <button type="button" onClick={() => setPreviaSync(true)} className="btn-brand-navy px-3 py-1.5 text-xs">Conferir e sincronizar notas</button>}
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
              disabled={Boolean(lote) || Boolean(corrigindo)}
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
            Arquivar
          </button>
        </div>
      </div>

      {(erroEntregas || erroAcao) && <p role="alert" className="bg-red-50 text-red-800 rounded p-3 text-sm mb-3">{erroEntregas || erroAcao}</p>}
      {mensagem && <p role="status" className="bg-blue-50 text-blue-900 rounded p-3 text-sm mb-3">{mensagem}</p>}
      {lote && <p role="status" className="p-2 text-sm">Corrigindo lote: {lote.feitas}/{lote.total}. Aguarde a conclusão.</p>}
      {similaridades.length > 0 && (
        <div role="status" className="bg-amber-50 text-amber-900 rounded p-3 text-sm mb-3 flex flex-wrap items-center justify-between gap-2">
          <span>Alerta de similaridade: {similaridades.length} {similaridades.length === 1 ? 'grupo' : 'grupos'} para revisão humana. As notas foram mantidas.</span>
          <button type="button" onClick={() => setMostrarSimilaridade(true)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 border border-amber-300">
            Ver {similaridades.length === 1 ? 'grupo' : 'grupos'}
          </button>
        </div>
      )}
      {mostrarSimilaridade && <SimilaridadePainel grupos={gruposSimilaridadeExibicao} onAbrir={abrirEntregaDoGrupo} onFechar={() => setMostrarSimilaridade(false)} />}
      {previaSync && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="Conferir sincronização" className="bg-white rounded-xl p-6 max-w-lg w-full"><h3 className="font-bold">Conferir notas antes de enviar</h3><p className="text-sm my-2">{atividade.titulo} · {rotuloPeriodo(atividade)} · {currentTurmaId ? `Turma ${turmas.find(t => t.id === currentTurmaId)?.nome || currentTurmaId}` : 'Turmas vinculadas'}</p><ul className="max-h-52 overflow-auto text-sm">{entregas.filter(e => ['corrigido','revisado'].includes(e.status)).map(e => <li key={e.id}>{alunosInfo[chaveAluno(e.turmaId, e.alunoId)]?.nome || e.alunoId}: {e.notaRevisada ?? e.notaFinal ?? 'Sem nota'}</li>)}</ul><p className="text-xs my-3">Envia somente esta atividade ao Diário. Para disponibilizar notas no Portal, confira e publique pelo Diário.</p><div className="flex gap-3 justify-end"><button disabled={sincronizando} onClick={() => setPreviaSync(false)}>Cancelar</button><button disabled={sincronizando} onClick={confirmarSync} className="btn-brand-primary px-3 py-2">{sincronizando ? 'Sincronizando…' : 'Confirmar sincronização'}</button></div></section></div>}
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
                for (const [chave, info] of alunosVisiveis) {
                  const alunoId = info.alunoId;
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
                  const entrega = entregasFiltradas.find(e => e.alunoId === alunoId && e.turmaId === info.turmaId);
                  const nota = entrega?.notaRevisada ?? entrega?.notaFinal;
                  rows.push(
                    <tr key={chave} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
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
                              {corrigindo === entrega.id ? 'Corrigindo...' : 'Corrigir com IA'}
                            </button>
                          )}
                          {entrega?.status === 'erro_correcao' && (
                            <button
                              onClick={() => handleCorrigir(entrega.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded text-[10px] font-semibold transition-all"
                            >
                              Corrigir com IA
                            </button>
                          )}
                          {entrega && <button type="button" onClick={() => { setModoDrawer('manual'); setSelectedEntrega(entrega); }} className="btn-brand-navy px-2 py-1 text-[10px] font-semibold">Corrigir manualmente</button>}
                          {entrega && (
                            <button
                              onClick={() => { setModoDrawer('visualizar'); setSelectedEntrega(entrega); }}
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
          key={selectedEntrega.id}
          entrega={entregas.find(item => item.id === selectedEntrega.id) || selectedEntrega}
          modoInicial={modoDrawer}
          corrigindo={corrigindo === selectedEntrega.id}
          atividade={atividade}
          alunoNome={alunosInfo[chaveAluno(selectedEntrega.turmaId, selectedEntrega.alunoId)]?.nome || 'Aluno'}
          onManual={dados => handleCorrigirManual(selectedEntrega.id, dados)}
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
                  await onSyncAtvMapa(turmaId, atividade.bimestre, payload.bimestre, payload.id || atividade.id, payload.titulo, payload.notaMaxima, false);
                }
                // Remove from turmas that were unchecked
                const turmasAntigas = atividade.turmaIds || [];
                for (const tId of turmasAntigas) {
                  if (!payload.turmaIds.includes(tId)) {
                    await onSyncAtvMapa(tId, atividade.bimestre, payload.bimestre, payload.id || atividade.id, payload.titulo, payload.notaMaxima, true);
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
