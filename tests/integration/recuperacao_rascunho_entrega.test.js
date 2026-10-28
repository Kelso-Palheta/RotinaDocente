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


vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    doc: path => ({ path }),
    runTransaction: async fn => {
      const writes = [];
      const result = await fn({
        get: async ref => {
          const value = m.docs.get(ref.path);
          return { exists: value !== undefined, data: () => value === undefined ? undefined : structuredClone(value) };
        },
        set: (ref, data, options) => writes.push([ref, data, options]),
      });
      for (const [ref, data, options] of writes) {
        m.docs.set(ref.path, structuredClone(options?.merge ? { ...m.docs.get(ref.path), ...data } : data));
        m.revisions.set(ref.path, (m.revisions.get(ref.path) || 0) + 1);
      }
      return result;
    },
  }),
}));
vi.mock('@/lib/aluno/session', () => ({ getSessionFromRequest: () => null }));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 123 } }));

import { createAtividade } from '@/lib/firebase-atividades';
import { POST } from '@/app/api/aluno/entregar/route';
import { chaveVinculoAtividade } from '@/utils/diario/tokenUtils';

beforeEach(() => {
  m.docs.clear(); m.revisions.clear(); m.seq = 0;
  m.docs.set('professores/p/conjuntos_recuperacao/c1', {
    id: 'c1', professorId: 'p', turmaId: 't', anoLetivo: '2026', semestre: '1',
    destinatariosIds: ['a'], atividadeIds: [], escalas: {}, estado: 'rascunho', versao: 1,
  });
  m.docs.set('professores/p/turmas/data', {
    revision: 1, turmas: [{ id: 't', anoLetivo: 2026, alunos: [{ id: 'a', nome: 'Ana' }] }],
  });
});

it('REV3-R81-01: parcela de conjunto ainda com 4 de 10 pontos não pode receber entrega e congelar montagem', async () => {
  await createAtividade({
    id: 'r1', professorId: 'p', turmaIds: ['t'], anoLetivo: '2026',
    finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c1', conjuntoVersao: 1,
    semestre: '1', destinatariosIds: ['a'], notaMaxima: 4, titulo: 'Primeira parcela',
    status: 'ativa', dataEntrega: '2099-01-01',
    alunosPorTurma: { t: [{ id: 'a', nome: 'Ana' }] },
    questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Explique', notaMaxima: 4 }],
  });
  const grupo = m.docs.get('professores/p/conjuntos_recuperacao/c1');
  expect(grupo.estado).toBe('rascunho');
  expect(grupo.escalas).toEqual({ r1: 4 });
  const acesso = m.docs.get(`atividades/r1/tokens/${chaveVinculoAtividade('t', 'a')}`);
  const response = await POST(new Request('http://localhost/api/aluno/entregar', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ activityId: 'r1', token: acesso?.token,
      respostas: { q: { tipo: 'discursiva', resposta: 'Resposta válida da primeira parcela' } } }),
  }));
  expect([403, 409]).toContain(response.status);
  expect(m.docs.get('professores/p/conjuntos_recuperacao/c1').congelado).not.toBe(true);
  expect([...m.docs.keys()].filter(path => path.startsWith('entregas/'))).toHaveLength(0);
});
