import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createAtividade as fbCreate,
  updateAtividade as fbUpdate,
  deleteAtividade as fbDelete,
  listAtividades as fbList,
  listAllAtividades as fbListAll,
  syncAlunoLogin,
  syncNotasAluno,
  syncSingleNotasAluno,
  countEntregasPendentes,
  countEntregasPorAtividade,
  sincronizarTodasAsNotas
} from '@/lib/firebase-atividades';

export function useAtividades(professorId) {
  const [atividades, setAtividades] = useState([]);
  const [todasAtividades, setTodasAtividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const conta = useRef(professorId);
  const pedidos = useRef({ turma: 0, todas: 0, contagem: 0 });
  const [donoLista, setDonoLista] = useState(professorId);
  const [pendentesTurma, setPendentesTurma] = useState(0);
  const [pendentesTodas, setPendentesTodas] = useState(0);
  const [entregasCounts, setEntregasCounts] = useState({});
  useEffect(() => {
    conta.current = professorId;
    const sequencias = pedidos.current;
    sequencias.turma++; sequencias.todas++; sequencias.contagem++;
    let ativo = true;
    queueMicrotask(() => {
      if (ativo) { setAtividades([]); setTodasAtividades([]); setEntregasCounts({}); setErro(''); setLoading(false); setDonoLista(professorId); }
    });
    return () => { ativo = false; sequencias.turma++; sequencias.todas++; };
  }, [professorId]);

  const loadAtividades = useCallback(async turmaId => {
    if (!professorId || !turmaId) return;
    const pedido = ++pedidos.current.turma;
    const atual = () => pedido === pedidos.current.turma && conta.current === professorId;
    setLoading(true); setAtividades([]); setErro('');
    try { const lista = await fbList(professorId, turmaId); if (atual()) setAtividades(lista); }
    catch (error) { if (atual()) { setAtividades([]); setErro(error.message); } }
    finally { if (atual()) setLoading(false); }
  }, [professorId]);

  const loadAllAtividades = useCallback(async () => {
    if (!professorId) return;
    const pedido = ++pedidos.current.todas;
    const atual = () => pedido === pedidos.current.todas && conta.current === professorId;
    setLoading(true); setTodasAtividades([]); setErro('');
    try {
      const lista = await fbListAll(professorId);
      lista.sort((a,b) => (b.dataEntrega?.toDate?.() || new Date(b.dataEntrega || 0)) - (a.dataEntrega?.toDate?.() || new Date(a.dataEntrega || 0)));
      if (atual()) setTodasAtividades(lista);
    } catch (error) { if (atual()) { setTodasAtividades([]); setErro(error.message); } }
    finally { if (atual()) setLoading(false); }
  }, [professorId]);

  const loadPendentes = useCallback(async (turmaId, bimestre) => {
    if (!professorId) return;
    try {
      if (turmaId && bimestre) {
        const count = await countEntregasPendentes('turma', { professorId, turmaId, bimestre });
        setPendentesTurma(count);
      }
      const countAll = await countEntregasPendentes('todas', { professorId });
      setPendentesTodas(countAll);
    } catch (err) {
      console.error('Erro ao carregar pendentes:', err);
    }
  }, [professorId]);

  const loadEntregasCounts = useCallback(async (ids) => {
    if (!ids.length) return;
    try {
      const counts = await countEntregasPorAtividade(ids);
      setEntregasCounts(counts);
    } catch (err) {
      console.error('Erro ao carregar contagens:', err);
    }
  }, []);

  const createAtividade = useCallback(async (data) => {
    if (!professorId) throw new Error('Usuário não autenticado');

    const atvData = {
      ...data,
      professorId,
      status: 'ativa'
    };

    const id = await fbCreate(atvData);

    // Atividade e acessos são gravados juntos pela infraestrutura.

    return id;
  }, [professorId]);

  const updateAtividade = useCallback(async (id, data) => {
    await fbUpdate(id, data);
  }, []);

  const deleteAtividade = useCallback(async (id, onRemoveFromMapa) => {
    await fbDelete(id);
    if (onRemoveFromMapa) await onRemoveFromMapa(id);
  }, []);

  const publicarNotas = useCallback(async (turma) => {
    if (!professorId) return;
    await syncNotasAluno(professorId, turma.id, turma);
  }, [professorId]);

  const publicarNotaAluno = useCallback(async (turmaId, alunoId, bimestres) => {
    if (!professorId) return;
    await syncSingleNotasAluno(professorId, turmaId, alunoId, bimestres);
  }, [professorId]);

  const syncLogin = useCallback(async (aluno, turmaId) => {
    if (!professorId) return;
    return syncAlunoLogin(professorId, aluno, turmaId);
  }, [professorId]);

  const sincronizarNotas = useCallback((escopo = null) => {
    if (!professorId) throw new Error('Usuário não autenticado.');
    return sincronizarTodasAsNotas(professorId, escopo);
  }, [professorId]);

  return {
    atividades: donoLista === professorId ? atividades : [],
    todasAtividades: donoLista === professorId ? todasAtividades : [],
    erro,
    loading,
    pendentesTurma,
    pendentesTodas,
    entregasCounts,
    loadAtividades,
    loadAllAtividades,
    loadPendentes,
    loadEntregasCounts,
    createAtividade,
    updateAtividade,
    deleteAtividade,
    publicarNotas,
    publicarNotaAluno,
    syncLogin,
    sincronizarTodasAsNotas: sincronizarNotas
  };
}
