import { beforeEach, expect, it, vi } from 'vitest';

// Banco sintético com retry otimista. `antesDoCommit` injeta uma escrita
// concorrente entre a leitura e a validação de revisões, simulando a entrega
// que confirma enquanto a edição ainda está em andamento.
const m = vi.hoisted(() => ({ docs: new Map(), revisions: new Map(), antesDoCommit: [], seq: 0 }));
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
      const concorrente = m.antesDoCommit.shift();
      if (concorrente) concorrente();
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

import { createAtividade, updateAtividade } from '@/lib/firebase-atividades';

const pathConjunto = 'professores/p/conjuntos_recuperacao/c1';
const conjuntoBase = {
  id: 'c1', professorId: 'p', turmaId: 't', anoLetivo: '2026', semestre: '1',
  destinatariosIds: ['a'], atividadeIds: [], escalas: {}, estado: 'rascunho', versao: 1,
};
const comParcela = () => ({
  ...conjuntoBase,
  atividadeIds: ['r1'],
  escalas: { r1: 4 },
  versao: 1,
});
const atividade = (id, notaMaxima) => ({
  id, professorId: 'p', turmaIds: ['t'], anoLetivo: '2026',
  finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c1', conjuntoVersao: 1,
  semestre: '1', destinatariosIds: ['a'], notaMaxima, titulo: id, status: 'ativa',
});
const atividadeR1 = () => ({
  ...atividade('r1', 4), createdAt: 1, updatedAt: 1,
});
const entrega = () => ({
  activityId: 'r1', professorId: 'p', turmaId: 't', alunoId: 'a',
  conjuntoRecuperacaoId: 'c1', semestre: '1', status: 'entregue',
});

beforeEach(() => {
  m.docs.clear();
  m.revisions.clear();
  m.antesDoCommit = [];
  m.seq = 0;
  m.docs.set(pathConjunto, structuredClone(comParcela()));
  m.docs.set('atividades/r1', atividadeR1());
});

it('entrega confirmada antes da edição bloqueia nova parcela', async () => {
  m.docs.set('entregas/e1', entrega());
  m.docs.set(pathConjunto, { ...comParcela(), congelado: true });

  await expect(createAtividade(atividade('r2', 6))).rejects.toThrow(/entregas|congelad/i);

  expect(m.docs.has('atividades/r2')).toBe(false);
  expect(m.docs.get(pathConjunto).atividadeIds).toEqual(['r1']);
});

it('edição confirmada antes da entrega é preservada; a entrega seguinte congela a escala', async () => {
  await createAtividade(atividade('r2', 6));
  expect(m.docs.get('atividades/r2').notaMaxima).toBe(6);
  expect(m.docs.get(pathConjunto)).toMatchObject({
    atividadeIds: expect.arrayContaining(['r1', 'r2']),
    escalas: { r1: 4, r2: 6 },
    estado: 'pronto',
    versao: 2,
  });

  m.docs.set('entregas/e1', entrega());
  m.docs.set(pathConjunto, { ...m.docs.get(pathConjunto), congelado: true });

  await expect(updateAtividade('r2', { ...atividade('r2', 5), conjuntoVersao: 2 })).rejects.toThrow(/entregas|congelad/i);
  expect(m.docs.get('atividades/r2').notaMaxima).toBe(6);
});

it('entrega concorrente entre leitura e commit força retry e recusa a parcela', async () => {
  m.antesDoCommit.push(() => {
    m.docs.set('entregas/e1', entrega());
    m.revisions.set('entregas/e1', 1);
    m.docs.set(pathConjunto, { ...m.docs.get(pathConjunto), congelado: true });
    m.revisions.set(pathConjunto, (m.revisions.get(pathConjunto) || 0) + 1);
  });

  await expect(createAtividade(atividade('r2', 6))).rejects.toThrow(/entregas|congelad/i);

  expect(m.docs.has('atividades/r2')).toBe(false);
  expect(m.docs.get(pathConjunto).atividadeIds).toEqual(['r1']);
});

it('edição concorrente da mesma escala força retry em vez de sobrescrever', async () => {
  // Primeira edição concorrente altera a escala persistida (6 pontos) depois
  // da leitura da segunda edição, que continua achando que a escala é 4.
  m.antesDoCommit.push(() => {
    m.docs.set(pathConjunto, {
      ...m.docs.get(pathConjunto),
      escalas: { r1: 6 },
      versao: 2,
    });
    m.revisions.set(pathConjunto, (m.revisions.get(pathConjunto) || 0) + 1);
  });

  await expect(updateAtividade('r1', { ...atividade('r1', 6), conjuntoVersao: undefined })).rejects.toMatchObject({
    code: 'RECUPERACAO_CONJUNTO_OBSOLETO',
  });
  expect(m.docs.get(pathConjunto).escalas).toEqual({ r1: 6 });
  expect(m.docs.get('atividades/r1').notaMaxima).toBe(4);
});
