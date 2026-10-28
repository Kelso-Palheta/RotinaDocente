import { beforeEach, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ docs: new Map(), writes: [], seq: 0 }));

vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => {
  const collection = (_db, ...parts) => ({ path: parts.join('/'), tipo: 'colecao' });
  const doc = (primeiro, ...parts) => {
    if (!parts.length && primeiro?.tipo === 'colecao') {
      m.seq += 1;
      return { path: `${primeiro.path}/doc_${m.seq}`, id: `doc_${m.seq}` };
    }
    if (parts.length === 1 && typeof parts[0] === 'object' && parts[0]?.path) {
      m.seq += 1;
      return { path: `${parts[0].path}/doc_${m.seq}`, id: `doc_${m.seq}` };
    }
    const caminho = [primeiro, ...parts]
      .map(p => (typeof p === 'string' ? p : p?.path || ''))
      .filter(Boolean)
      .join('/');
    return { path: caminho, id: caminho.split('/').at(-1) };
  };
  const query = (ref, ...filtros) => ({ ...ref, filtros });
  const where = (...partes) => partes;
  const snap = ref => ({
    id: ref.path.split('/').at(-1),
    exists: () => m.docs.has(ref.path),
    data: () => m.docs.get(ref.path),
    ref,
  });
  const getDoc = async ref => snap(ref);
  const getDocs = async ref => {
    const pai = ref.path;
    const docs = [...m.docs.entries()]
      .filter(([path]) => path.startsWith(`${pai}/`))
      .filter(([path]) => path.split('/').length === pai.split('/').length + 1)
      .filter(([, data]) => (ref.filtros || []).every(([campo, op, valor]) => (op === '==' ? data[campo] === valor : true)))
      .map(([path]) => snap({ path }));
    return { docs };
  };
  const runTransaction = async (_db, fn) => {
    const pendentes = [];
    const tx = {
      get: async ref => snap(ref),
      set: (ref, value, options) => pendentes.push(['set', ref.path, value, options]),
      delete: ref => pendentes.push(['delete', ref.path]),
    };
    const resultado = await fn(tx);
    for (const [tipo, path, value] of pendentes) {
      if (tipo === 'delete') m.docs.delete(path);
      else m.docs.set(path, { ...(m.docs.get(path) || {}), ...value });
      m.writes.push([tipo, path, value]);
    }
    return resultado;
  };
  return {
    collection, doc, query, where, getDoc, getDocs, runTransaction,
    serverTimestamp: () => 123,
  };
});

import {
  atualizarConjuntoRecuperacao,
  criarConjuntoRecuperacao,
  listConjuntosRecuperacao,
} from '@/lib/firebase-recuperacao';

const alunos = [{ id: 'ana' }, { id: 'bruno' }, { id: 'carla' }];

const dados = (extra = {}) => ({
  turmaId: 't1',
  anoLetivo: '2026',
  semestre: 1,
  destinatariosIds: ['ana', 'bruno'],
  ...extra,
});

beforeEach(() => {
  m.docs.clear();
  m.writes = [];
  m.seq = 0;
});

it('REV-R81-17: criação grava conjunto e locks no mesmo contexto', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', dados(), alunos);
  expect(conjunto.versao).toBe(1);
  expect(conjunto.anoLetivo).toBe('2026');
  expect(m.docs.get(`professores/p1/conjuntos_recuperacao/${conjunto.id}`)).toMatchObject({ professorId: 'p1', versao: 1 });
  expect(m.docs.has('professores/p1/recuperacao_locks/t1__2026__S1__ana')).toBe(true);
  expect(m.docs.has('professores/p1/recuperacao_locks/t1__2026__S1__bruno')).toBe(true);
});

it('REV-R81-18: lock existente bloqueia a criação sem gravar o conjunto', async () => {
  m.docs.set('professores/p1/recuperacao_locks/t1__2026__S1__ana', { conjuntoId: 'c-outro' });
  const antes = m.docs.size;
  await expect(criarConjuntoRecuperacao('p1', dados({ destinatariosIds: ['ana'] }), alunos))
    .rejects.toMatchObject({ code: 'RECUPERACAO_CONFLITO' });
  expect(m.docs.size).toBe(antes);
  expect((await listConjuntosRecuperacao('p1', { turmaId: 't1' }))).toHaveLength(0);
});

it('REV-R81-18b: conjunto vigente encontrado na listagem também bloqueia', async () => {
  await criarConjuntoRecuperacao('p1', dados(), alunos);
  const antes = m.docs.size;
  await expect(criarConjuntoRecuperacao('p1', dados({ destinatariosIds: ['ana'] }), alunos))
    .rejects.toMatchObject({ code: 'RECUPERACAO_CONFLITO' });
  expect(m.docs.size).toBe(antes);
  expect((await listConjuntosRecuperacao('p1', { turmaId: 't1' }))).toHaveLength(1);
});

it('REV-R81-19: edição com versão antiga é recusada', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', dados(), alunos);
  await expect(atualizarConjuntoRecuperacao('p1', conjunto.id, { versaoEsperada: 9, destinatariosIds: ['ana'] }))
    .rejects.toMatchObject({ code: 'RECUPERACAO_CONFLITO' });
  expect(m.docs.get(`professores/p1/conjuntos_recuperacao/${conjunto.id}`).destinatariosIds).toEqual(['ana', 'bruno']);
});

it('REV-R81-20: edição troca locks e incrementa a versão', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', dados(), alunos);
  const atualizado = await atualizarConjuntoRecuperacao('p1', conjunto.id, {
    versaoEsperada: 1,
    destinatariosIds: ['ana', 'carla'],
  });
  expect(atualizado.versao).toBe(2);
  expect(m.docs.has('professores/p1/recuperacao_locks/t1__2026__S1__bruno')).toBe(false);
  expect(m.docs.has('professores/p1/recuperacao_locks/t1__2026__S1__carla')).toBe(true);
  expect(m.docs.get(`professores/p1/conjuntos_recuperacao/${conjunto.id}`).versao).toBe(2);
});
