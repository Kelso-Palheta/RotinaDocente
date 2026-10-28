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
  const getDocs = async ref => ({
    docs: [...m.docs.entries()]
      .filter(([path]) => path.startsWith(`${ref.path}/`))
      .filter(([path]) => path.split('/').length === ref.path.split('/').length + 1)
      .filter(([, data]) => (ref.filtros || []).every(([campo, op, valor]) => (op === '==' ? data[campo] === valor : true)))
      .map(([path]) => snap({ path })),
  });
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
  cancelarConjuntoRecuperacao,
  criarConjuntoRecuperacao,
} from '@/lib/firebase-recuperacao';

const alunos = [{ id: 'a' }, { id: 'b' }];
const contexto = (extra = {}) => ({
  turmaId: 't1', anoLetivo: '2026', semestre: 1, destinatariosIds: ['a', 'b'], ...extra,
});
const pathConjunto = id => `professores/p1/conjuntos_recuperacao/${id}`;
const chave = (ano, alunoId) => `professores/p1/recuperacao_locks/t1__${ano}__S1__${alunoId}`;

beforeEach(() => {
  m.docs.clear();
  m.writes = [];
  m.seq = 0;
});

it('remoção de destinatário não apaga reserva que pertence a outro conjunto', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', contexto(), alunos);
  m.docs.set(chave('2026', 'b'), { conjuntoId: 'c-outro' });

  const atualizado = await atualizarConjuntoRecuperacao('p1', conjunto.id, {
    versaoEsperada: 1,
    destinatariosIds: ['a'],
  });

  expect(atualizado.versao).toBe(2);
  expect(m.docs.get(chave('2026', 'b'))).toEqual({ conjuntoId: 'c-outro' });
  expect(m.docs.get(chave('2026', 'a'))).toMatchObject({ conjuntoId: conjunto.id });
  expect(m.docs.get(pathConjunto(conjunto.id)).destinatariosIds).toEqual(['a']);
});

it('mudança de contexto antes das entregas move todas as reservas para o contexto novo', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', contexto(), alunos);

  await atualizarConjuntoRecuperacao('p1', conjunto.id, {
    versaoEsperada: 1,
    anoLetivo: '2025',
  });

  expect(m.docs.has(chave('2026', 'a'))).toBe(false);
  expect(m.docs.has(chave('2026', 'b'))).toBe(false);
  expect(m.docs.get(chave('2025', 'a'))).toMatchObject({ conjuntoId: conjunto.id, anoLetivo: '2025' });
  expect(m.docs.get(chave('2025', 'b'))).toMatchObject({ conjuntoId: conjunto.id, anoLetivo: '2025' });
  expect(m.docs.get(pathConjunto(conjunto.id))).toMatchObject({ anoLetivo: '2025', versao: 2 });
});

it('mudança de contexto após entrega é recusada e preserva as reservas originais', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', contexto(), alunos);
  m.docs.set('entregas/e1', { activityId: 'r1', professorId: 'p1', conjuntoRecuperacaoId: conjunto.id, status: 'entregue' });

  await expect(atualizarConjuntoRecuperacao('p1', conjunto.id, {
    versaoEsperada: 1,
    anoLetivo: '2025',
  })).rejects.toMatchObject({ code: 'RECUPERACAO_CONGELADA' });

  expect(m.docs.get(pathConjunto(conjunto.id))).toMatchObject({ anoLetivo: '2026', versao: 1 });
  expect(m.docs.get(chave('2026', 'a'))).toMatchObject({ conjuntoId: conjunto.id });
  expect(m.docs.get(chave('2026', 'b'))).toMatchObject({ conjuntoId: conjunto.id });
  expect(m.docs.has(chave('2025', 'a'))).toBe(false);
});

it('mudança de contexto não apaga reserva alheia que ocupa a chave antiga', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', contexto(), alunos);
  m.docs.set(chave('2026', 'a'), { conjuntoId: 'c-outro' });

  await atualizarConjuntoRecuperacao('p1', conjunto.id, {
    versaoEsperada: 1,
    anoLetivo: '2025',
  });

  expect(m.docs.get(chave('2026', 'a'))).toEqual({ conjuntoId: 'c-outro' });
  expect(m.docs.has(chave('2026', 'b'))).toBe(false);
  expect(m.docs.get(chave('2025', 'a'))).toMatchObject({ conjuntoId: conjunto.id });
  expect(m.docs.get(chave('2025', 'b'))).toMatchObject({ conjuntoId: conjunto.id });
});

it('mudança de contexto com atividades já distribuídas é recusada e preserva as reservas', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', contexto(), alunos);
  m.docs.set(pathConjunto(conjunto.id), {
    ...m.docs.get(pathConjunto(conjunto.id)),
    atividadeIds: ['r1'],
    escalas: { r1: 10 },
    estado: 'pronto',
  });

  await expect(atualizarConjuntoRecuperacao('p1', conjunto.id, {
    versaoEsperada: 1,
    anoLetivo: '2025',
  })).rejects.toThrow(/atividades/i);

  expect(m.docs.get(pathConjunto(conjunto.id))).toMatchObject({ anoLetivo: '2026', versao: 1 });
  expect(m.docs.get(chave('2026', 'a'))).toMatchObject({ conjuntoId: conjunto.id });
  expect(m.docs.get(chave('2026', 'b'))).toMatchObject({ conjuntoId: conjunto.id });
  expect(m.docs.has(chave('2025', 'a'))).toBe(false);
});

it('cancelamento após mudança de contexto remove as reservas novas e não deixa as antigas', async () => {
  const conjunto = await criarConjuntoRecuperacao('p1', contexto(), alunos);
  await atualizarConjuntoRecuperacao('p1', conjunto.id, { versaoEsperada: 1, anoLetivo: '2025' });

  await cancelarConjuntoRecuperacao('p1', conjunto.id);

  expect(m.docs.has(chave('2025', 'a'))).toBe(false);
  expect(m.docs.has(chave('2025', 'b'))).toBe(false);
  expect(m.docs.has(chave('2026', 'a'))).toBe(false);
  expect(m.docs.has(chave('2026', 'b'))).toBe(false);
  expect(m.docs.get(pathConjunto(conjunto.id))).toMatchObject({ estado: 'cancelado', versao: 3 });
});
