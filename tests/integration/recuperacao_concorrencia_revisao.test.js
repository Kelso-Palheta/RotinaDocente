import { beforeEach, expect, it, vi } from 'vitest';

// Banco sintético: lote é atômico, mas não protege leituras anteriores.
// A transação implementa controle otimista/retry e recusa leitura após escrita.
const m = vi.hoisted(() => ({ docs: new Map(), revisions: new Map(), seq: 0 }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => {
  const clone = value => value === undefined ? undefined : structuredClone(value);
  const collection = (_db, ...parts) => ({ path: parts.join('/'), collection: true });
  const doc = (dbOrCollection, ...parts) => {
    const path = dbOrCollection?.collection
      ? `${dbOrCollection.path}/${parts[0] || `auto_${++m.seq}`}`
      : parts.join('/');
    return { path, id: path.split('/').at(-1) };
  };
  const snap = ref => {
    const data = clone(m.docs.get(ref.path));
    return { id: ref.id, ref, exists: () => data !== undefined, data: () => clone(data) };
  };
  const getDoc = async ref => snap(ref);
  const query = (ref, ...filters) => ({ ...ref, filters });
  const where = (field, op, value) => ({ field, op, value });
  const getDocs = async ref => ({
    docs: [...m.docs.entries()]
      .filter(([path, data]) => path.startsWith(`${ref.path}/`)
        && path.split('/').length === ref.path.split('/').length + 1
        && (ref.filters || []).every(f => f.op === 'array-contains'
          ? data[f.field]?.includes(f.value) : data[f.field] === f.value))
      .map(([path]) => snap({ path, id: path.split('/').at(-1) })),
  });
  const apply = writes => {
    for (const [type, ref, data, options] of writes) {
      if (type === 'delete') m.docs.delete(ref.path);
      else m.docs.set(ref.path, clone(options?.merge ? { ...m.docs.get(ref.path), ...data } : data));
      m.revisions.set(ref.path, (m.revisions.get(ref.path) || 0) + 1);
    }
  };
  const makeWriter = writes => ({
    set: (ref, data, options) => writes.push(['set', ref, data, options]),
    delete: ref => writes.push(['delete', ref]),
  });
  const writeBatch = () => {
    const writes = [];
    return { ...makeWriter(writes), commit: async () => apply(writes) };
  };
  const runTransaction = async (_db, fn) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const reads = new Map();
      const writes = [];
      const result = await fn({
        ...makeWriter(writes),
        get: async ref => {
          if (writes.length) throw new Error('Firestore: leituras devem preceder escritas.');
          reads.set(ref.path, m.revisions.get(ref.path) || 0);
          return snap(ref);
        },
      });
      if ([...reads].some(([path, revision]) => (m.revisions.get(path) || 0) !== revision)) continue;
      apply(writes);
      return result;
    }
    throw new Error('Conflito transacional após novas tentativas.');
  };
  return {
    collection, doc, query, where, getDoc, getDocs, writeBatch, runTransaction,
    setDoc: async (ref, data, options) => apply([['set', ref, data, options]]),
    deleteDoc: async ref => apply([['delete', ref]]),
    serverTimestamp: () => 123,
  };
});

import { createAtividade } from '@/lib/firebase-atividades';
import { atualizarConjuntoRecuperacao, cancelarConjuntoRecuperacao, criarConjuntoRecuperacao } from '@/lib/firebase-recuperacao';

const pathConjunto = 'professores/p/conjuntos_recuperacao/c1';
const conjunto = {
  id: 'c1', professorId: 'p', turmaId: 't', anoLetivo: '2026', semestre: '1',
  destinatariosIds: ['a'], atividadeIds: [], escalas: {}, estado: 'rascunho', versao: 1,
};
const atividade = (id, notaMaxima) => ({
  id, professorId: 'p', turmaIds: ['t'], anoLetivo: '2026',
  finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c1', conjuntoVersao: 1,
  semestre: '1', destinatariosIds: ['a'], notaMaxima, titulo: id, status: 'ativa',
});
const prepararEntregaExistente = () => {
  m.docs.set(pathConjunto, { ...conjunto, atividadeIds: ['r1'], escalas: { r1: 4 } });
  m.docs.set('atividades/r1', atividade('r1', 4));
  m.docs.set('entregas/e1', {
    activityId: 'r1', professorId: 'p', turmaId: 't', alunoId: 'a',
    conjuntoRecuperacaoId: 'c1', semestre: '1', status: 'entregue',
  });
};

beforeEach(() => {
  m.docs.clear(); m.revisions.clear(); m.seq = 0;
  m.docs.set(pathConjunto, structuredClone(conjunto));
});

it('REV2-R81-01: duas parcelas concorrentes não podem consumir os mesmos dez pontos', async () => {
  const resultados = await Promise.allSettled([
    createAtividade(atividade('r1', 10)),
    createAtividade(atividade('r2', 10)),
  ]);
  expect(resultados.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  const salvas = [...m.docs.entries()].filter(([path]) => path.startsWith('atividades/') && path.split('/').length === 2);
  expect(salvas.reduce((total, [, a]) => total + a.notaMaxima, 0)).toBeLessThanOrEqual(10);
});

it('REV2-R81-02: adicionar parcela após entrega de outra atividade é recusado', async () => {
  prepararEntregaExistente();
  await expect(createAtividade(atividade('r2', 6))).rejects.toThrow();
  expect(m.docs.has('atividades/r2')).toBe(false);
});

it('REV2-R81-03: alteração de destinatários com entrega preserva conjunto original', async () => {
  prepararEntregaExistente();
  await expect(atualizarConjuntoRecuperacao('p', 'c1', {
    versaoEsperada: 1, destinatariosIds: ['a', 'b'],
  })).rejects.toThrow();
  expect(m.docs.get(pathConjunto).destinatariosIds).toEqual(['a']);
});

it('REV2-R81-04: repetir cancelamento antigo não apaga reserva de um conjunto novo', async () => {
  const lock = 'professores/p/recuperacao_locks/t__2026__S1__a';
  m.docs.set(lock, { conjuntoId: 'c1' });
  await cancelarConjuntoRecuperacao('p', 'c1');
  const novo = await criarConjuntoRecuperacao('p', {
    turmaId: 't', anoLetivo: '2026', semestre: '1', destinatariosIds: ['a'],
  }, [{ id: 'a' }]);
  expect(m.docs.get(lock)?.conjuntoId).toBe(novo.id);
  await cancelarConjuntoRecuperacao('p', 'c1');
  expect(m.docs.get(lock)?.conjuntoId).toBe(novo.id);
});
