import { useState, useCallback } from 'react';
import {
  createAtividade as fbCreate,
  updateAtividade as fbUpdate,
  deleteAtividade as fbDelete,
  listAtividades as fbList,
  listAllAtividades as fbListAll,
  createTokensForAtividade,
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
  const [pendentesTurma, setPendentesTurma] = useState(0);
  const [pendentesTodas, setPendentesTodas] = useState(0);
  const [entregasCounts, setEntregasCounts] = useState({});

  const loadAtividades = useCallback(async (turmaId) => {
    if (!professorId || !turmaId) return;
    setLoading(true);
    try {
      const list = await fbList(professorId, turmaId);
      setAtividades(list);
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    } finally {
      setLoading(false);
    }
  }, [professorId]);

  const loadAllAtividades = useCallback(async () => {
    if (!professorId) return;
    setLoading(true);
    try {
      const list = await fbListAll(professorId);
      list.sort((a, b) => {
        const da = a.dataEntrega?.toDate?.() || new Date(a.dataEntrega || 0);
        const db = b.dataEntrega?.toDate?.() || new Date(b.dataEntrega || 0);
        return db - da;
      });
      setTodasAtividades(list);
    } catch (err) {
      console.error('Erro ao carregar todas as atividades:', err);
    } finally {
      setLoading(false);
    }
  }, [professorId]);

  const loadPendentes = useCallback(async (turmaId, bimestre) => {
    if (!professorId) return;
    try {
      if (turmaId && bimestre) {
        const count = await countEntregasPendentes('turma', { turmaId, bimestre });
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

    // Cria tokens para todos os alunos das turmas vinculadas
    for (const turmaId of data.turmaIds) {
      if (data.alunosPorTurma?.[turmaId]) {
        await createTokensForAtividade(id, turmaId, data.alunosPorTurma[turmaId]);
      }
    }

    return id;
  }, [professorId]);

  const updateAtividade = useCallback(async (id, data) => {
    await fbUpdate(id, data);
  }, []);

  const deleteAtividade = useCallback(async (id, onRemoveFromMapa) => {
    await fbDelete(id);
    if (onRemoveFromMapa) onRemoveFromMapa(id);
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
    atividades,
    todasAtividades,
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
