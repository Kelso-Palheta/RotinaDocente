'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { DiarioRepository } from '@/infraestrutura/diario/DiarioRepository';
import { FilaPersistenciaDiario } from '@/aplicacao/diario/FilaPersistenciaDiario';
const criarPadrao = uid => new DiarioRepository(uid);

export function usePersistenciaDiario(userId, { criarRepository = criarPadrao } = {}) {
  const [snapshot, setSnapshot] = useState({ userId: null, turmas: [], historico: [], estado: 'carregando', carregando: true, erro: '' });
  const filaRef = useRef(null);
  useEffect(() => {
    if (!userId) { filaRef.current = null; return; }
    let ativo = true;
    const fila = new FilaPersistenciaDiario({ userId, repository: criarRepository(userId), storage: typeof window !== 'undefined' ? window.localStorage : null,
      onChange: dados => { if (ativo) setSnapshot({ ...dados, userId, podeEditar: Boolean(fila.base) && dados.estado !== 'conflito' }); } });
    filaRef.current = fila;
    fila.carregar().catch(() => {});
    const online = () => { if (fila.estado === 'falha' && fila.base) fila.tentarNovamente().catch(() => {}); };
    const sair = event => { if (['salvando', 'pendente', 'falha', 'conflito'].includes(fila.estado)) { fila.guardar(); event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('online', online); window.addEventListener('beforeunload', sair);
    return () => { ativo = false; fila.cancelarCarregamento(); if (fila.base && fila.estado !== 'carregando') fila.guardar(fila.estado !== 'salvo'); window.removeEventListener('online', online); window.removeEventListener('beforeunload', sair); };
  }, [userId, criarRepository]);
  const persistir = useCallback((turmas, meta) => {
    if (!filaRef.current || filaRef.current.userId !== userId) return Promise.reject(new Error('Aguarde o carregamento da sua conta.'));
    return filaRef.current.salvar(turmas, meta);
  }, [userId]);
  const obterFila = useCallback(() => {
    const fila = filaRef.current;
    if (!fila || fila.userId !== userId) throw new Error('A conta mudou. Reabra esta operação na conta correta.');
    return fila;
  }, [userId]);
  const restaurar = useCallback(async (turmas, meta) => obterFila().salvarConfirmado(turmas, meta), [obterFila]);
  const tentarNovamente = useCallback(async () => { const fila = obterFila(); return fila.base ? fila.tentarNovamente() : fila.carregar(); }, [obterFila]);
  const recarregar = useCallback(async () => obterFila().carregar({ descartarRascunho: true }), [obterFila]);
  const desfazer = useCallback(async registro => obterFila().desfazer(registro), [obterFila]);
  const aguardarSalvamento = useCallback(async () => {
    const fila = obterFila();
    await fila.fila;
    obterFila();
    if (fila.estado !== 'salvo') throw new Error(fila.erro || 'Aguarde o salvamento na nuvem antes de publicar.');
  }, [obterFila]);
  const atual = !userId ? { turmas: [], historico: [], estado: 'pendente', carregando: false, erro: '', podeEditar: false } : snapshot.userId === userId ? snapshot : { turmas: [], historico: [], estado: 'carregando', carregando: true, erro: '', podeEditar: false };
  return { ...atual, persistir, restaurar, tentarNovamente, recarregar, desfazer, aguardarSalvamento };
}
