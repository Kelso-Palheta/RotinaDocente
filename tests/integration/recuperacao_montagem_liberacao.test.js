import { beforeEach, expect, it, vi } from 'vitest';

// Banco sintético equivalente ao da reprodução REV3-R81-01: lote atômico,
// transação com controle otimista e leitura antes de escrita.
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

import { createAtividade, createTokensForAtividade, updateAtividade } from '@/lib/firebase-atividades';
import { listarAtividadesDoConjunto, listarEntregasDoConjunto } from '@/lib/firebase-recuperacao';
import { converterAdaptadaParaAtividadeOnline } from '@/dominio/adaptacoes/publicadorAtividadeOnline';
import { prepararLancamentoRecuperacao, aplicarLancamentoRecuperacao } from '@/aplicacao/diario/lancarRecuperacao';
import { POST } from '@/app/api/aluno/entregar/route';
import { chaveVinculoAtividade, criarTokenAtividade } from '@/utils/diario/tokenUtils';

const CONJUNTO = 'professores/p/conjuntos_recuperacao/c1';
const DIARIO = 'professores/p/turmas/data';

const semear = ({ destinatarios = ['a'], alunos = ['a', 'b'] } = {}) => {
  m.docs.set(CONJUNTO, {
    id: 'c1', professorId: 'p', turmaId: 't', anoLetivo: '2026', semestre: '1',
    destinatariosIds: destinatarios, atividadeIds: [], escalas: {},
    estado: 'rascunho', versao: 1,
  });
  m.docs.set(DIARIO, {
    revision: 1,
    turmas: [{
      id: 't',
      anoLetivo: 2026,
      alunos: alunos.map(id => ({ id, nome: id === 'a' ? 'Ana' : 'Bia' })),
      recuperacao: {},
      recuperacaoLancamentos: {},
    }],
  });
};

const parcela = (id, notaMaxima, extra = {}) => ({
  id,
  professorId: 'p',
  turmaIds: ['t'],
  anoLetivo: '2026',
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  conjuntoVersao: 1,
  semestre: '1',
  destinatariosIds: ['a'],
  notaMaxima,
  titulo: id,
  status: 'ativa',
  dataEntrega: '2099-01-01',
  alunosPorTurma: { t: [{ id: 'a', nome: 'Ana' }] },
  questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Explique', notaMaxima }],
  ...extra,
});

const tokenDe = (atividadeId, alunoId = 'a') => {
  const token = criarTokenAtividade(alunoId, atividadeId, 't');
  m.docs.set(`atividades/${atividadeId}/tokens/${chaveVinculoAtividade('t', alunoId)}`, {
    token, nome: alunoId, alunoId, turmaId: 't', revogado: false,
  });
  return token;
};

const tokenGravado = (atividadeId, alunoId = 'a') => (
  m.docs.get(`atividades/${atividadeId}/tokens/${chaveVinculoAtividade('t', alunoId)}`)?.token
);

const entregar = (atividadeId, token) => {
  const atividade = m.docs.get(`atividades/${atividadeId}`);
  const questao = atividade?.questoes?.[0];
  return POST(new Request('http://localhost/api/aluno/entregar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      activityId: atividadeId,
      token,
      respostas: {
        [questao?.id || 'q']: {
          tipo: questao?.tipo || 'discursiva',
          resposta: 'Resposta válida da parcela',
        },
      },
    }),
  }));
};

const conjuntoAtual = () => m.docs.get(CONJUNTO);
const entregasGravadas = () => [...m.docs.keys()].filter(path => path.startsWith('entregas/'));

beforeEach(() => {
  m.docs.clear();
  m.revisions.clear();
  m.seq = 0;
});

it('REV3-R81-02: 4+6 só libera as parcelas ao fechar 10; entrega congela e prévia soma', async () => {
  semear({ destinatarios: ['a', 'b'] });
  await createAtividade(parcela('r1', 4));

  expect(conjuntoAtual()).toMatchObject({
    estado: 'rascunho',
    atividadeIds: ['r1'],
    escalas: { r1: 4 },
    liberado: false,
  });
  expect(m.docs.get('atividades/r1').status).toBe('rascunho');

  const token = tokenDe('r1');
  const bloqueada = await entregar('r1', token);
  expect([403, 409]).toContain(bloqueada.status);
  expect(conjuntoAtual().congelado).not.toBe(true);
  expect(entregasGravadas()).toHaveLength(0);

  await createAtividade(parcela('r2', 6, {
    conjuntoVersao: 2,
    destinatariosIds: ['a', 'b'],
    alunosPorTurma: { t: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }] },
  }));

  expect(conjuntoAtual()).toMatchObject({
    estado: 'pronto',
    atividadeIds: ['r1', 'r2'],
    escalas: { r1: 4, r2: 6 },
    liberado: true,
  });
  expect(m.docs.get('atividades/r1').status).toBe('ativa');
  expect(m.docs.get('atividades/r2').status).toBe('ativa');

  const entregaSegunda = await entregar('r2', tokenGravado('r2'));
  expect(entregaSegunda.status).toBe(200);
  expect(conjuntoAtual().congelado).toBe(true);

  await expect(updateAtividade('r1', {
    ...m.docs.get('atividades/r1'),
    conjuntoVersao: conjuntoAtual().versao,
    notaMaxima: 3,
  })).rejects.toThrow(/congelad/i);

  const entregaPrimeira = await entregar('r1', token);
  expect(entregaPrimeira.status).toBe(200);
  expect(entregasGravadas()).toHaveLength(2);

  for (const [id, nota] of [['r1', 2], ['r2', 4]]) {
    const caminho = `entregas/${id}__${chaveVinculoAtividade('t', 'a')}`;
    m.docs.set(caminho, { ...m.docs.get(caminho), status: 'corrigido', notaFinal: nota });
  }

  const atividades = await listarAtividadesDoConjunto('p', 'c1');
  const entregas = await listarEntregasDoConjunto(atividades.map(a => a.id));
  const turmas = structuredClone(m.docs.get(DIARIO).turmas);
  const previa = prepararLancamentoRecuperacao({ turmas, conjunto: conjuntoAtual(), atividades, entregas });

  expect(previa.completos).toBe(1);
  expect(previa.pendentes).toBe(1);
  expect(previa.campo).toBe('rec1');
  expect(previa.alunos[0]).toMatchObject({ alunoId: 'a', total: 6 });
  expect(previa.alunos[1]).toMatchObject({ alunoId: 'b', completo: false });

  const { turmas: depois, lancados } = aplicarLancamentoRecuperacao({ turmas, previa });
  expect(lancados).toHaveLength(1);
  expect(depois[0].recuperacao.a.rec1).toBe(6);
});

it('REV3-R81-02: atividade única de 10 nasce liberada e aceita entrega', async () => {
  semear();
  await createAtividade(parcela('r1', 10));

  expect(conjuntoAtual()).toMatchObject({
    estado: 'pronto',
    escalas: { r1: 10 },
    liberado: true,
  });
  expect(m.docs.get('atividades/r1').status).toBe('ativa');

  const token = tokenDe('r1');
  const resposta = await entregar('r1', token);
  expect(resposta.status).toBe(200);
  expect(conjuntoAtual().congelado).toBe(true);
});

it('REV3-R81-02: parcela adaptada entra como subconjunto e libera junto com a parcela comum', async () => {
  semear({ destinatarios: ['a', 'b'], alunos: ['a', 'b'] });

  const adaptada = converterAdaptadaParaAtividadeOnline({
    adaptacao: {
      titulo: 'Recuperação adaptada',
      aluno: { nome: 'Ana', necessidades: ['tea'] },
      atividadeAdaptada: {
        instrucoesAluno: 'Resolva com calma.',
        questoes: [{ numero: 1, enunciado: 'Explique o cálculo.', alternativas: [] }],
      },
    },
    turmaId: 't',
    alunoId: 'a',
    professorId: 'p',
    prazoEntrega: '2099-01-01T23:59:00Z',
    recuperacao: {
      conjuntoId: 'c1',
      conjuntoVersao: 1,
      semestre: '1',
      anoLetivo: '2026',
      pontosMaximos: 4,
    },
  });
  adaptada.id = 'r1';
  await createAtividade(adaptada);
  await createTokensForAtividade('r1', 't', [{ id: 'a', nome: 'Ana' }]);

  expect(conjuntoAtual()).toMatchObject({ estado: 'rascunho', escalas: { r1: 4 } });
  expect(m.docs.get('atividades/r1')).toMatchObject({
    alunoExclusivoId: 'a',
    destinatariosIds: ['a'],
    status: 'rascunho',
  });

  await createAtividade(parcela('r2', 6, {
    conjuntoVersao: 2,
    destinatariosIds: ['a', 'b'],
    alunosPorTurma: { t: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }] },
  }));

  expect(conjuntoAtual()).toMatchObject({
    estado: 'pronto',
    escalas: { r1: 4, r2: 6 },
    liberado: true,
  });
  expect(m.docs.get('atividades/r1').status).toBe('ativa');

  const token = tokenDe('r1');
  const resposta = await entregar('r1', token);
  expect(resposta.status).toBe(200);
  expect(conjuntoAtual().congelado).toBe(true);
});

it('REV3-R81-02: gate do conjunto recusa parcela ativa de montagem mesmo com token válido', async () => {
  semear();
  m.docs.set('atividades/r1', parcela('r1', 4, { status: 'ativa' }));
  m.docs.set(CONJUNTO, {
    ...conjuntoAtual(),
    atividadeIds: ['r1'],
    escalas: { r1: 4 },
  });

  const token = tokenDe('r1');
  const resposta = await entregar('r1', token);

  expect(resposta.status).toBe(409);
  expect(conjuntoAtual().congelado).not.toBe(true);
  expect(entregasGravadas()).toHaveLength(0);
});
