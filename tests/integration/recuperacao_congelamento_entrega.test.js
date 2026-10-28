import { beforeEach, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ docs: new Map(), writes: [] }));
const snapshot = path => ({
  id: path.split('/').at(-1),
  exists: m.docs.has(path),
  data: () => m.docs.get(path),
});
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    doc: path => ({ path }),
    runTransaction: async fn => {
      const pendentes = [];
      const resultado = await fn({
        get: async ref => snapshot(ref.path),
        set: (ref, data, options) => pendentes.push({ path: ref.path, data, options }),
      });
      for (const { path, data, options } of pendentes) {
        m.docs.set(path, options?.merge ? { ...(m.docs.get(path) || {}), ...data } : data);
        m.writes.push({ path, data, options });
      }
      return resultado;
    },
  }),
}));
vi.mock('@/lib/aluno/session', () => ({ getSessionFromRequest: () => null }));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 123 } }));

import { POST } from '@/app/api/aluno/entregar/route';

const novo = () => btoa(`a:at:t:${'f'.repeat(64)}`);
const chave = (turmaId = 't', alunoId = 'a') => btoa(JSON.stringify([turmaId, alunoId]))
  .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

const post = token => POST(new Request('http://localhost/api/aluno/entregar', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    activityId: 'at',
    token,
    respostas: { q: { tipo: 'discursiva', resposta: 'Resposta válida da recuperação' } },
  }),
}));

function emitir(alunoId = 'a', turmaId = 't') {
  const token = novo();
  m.docs.set(`atividades/at/tokens/${chave(turmaId, alunoId)}`, {
    token, nome: alunoId, alunoId, turmaId,
  });
  return token;
}

const conjunto = (extra = {}) => ({
  professorId: 'p', turmaId: 't', anoLetivo: '2026', semestre: '1',
  destinatariosIds: ['a'], atividadeIds: ['at'], estado: 'rascunho', versao: 1, ...extra,
});

const atividade = (extra = {}) => ({
  professorId: 'p',
  titulo: 'Recuperação — 1º semestre',
  turmaIds: ['t'],
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  semestre: '1',
  destinatariosIds: ['a'],
  status: 'ativa',
  dataEntrega: '2099-01-01',
  notaMaxima: 4,
  questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Explique', notaMaxima: 4 }],
  ...extra,
});

beforeEach(() => {
  m.docs.clear();
  m.writes = [];
  m.docs.set('atividades/at', atividade());
  m.docs.set('professores/p/turmas/data', {
    turmas: [{ id: 't', alunos: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }] }],
  });
  m.docs.set('professores/p/conjuntos_recuperacao/c1', conjunto());
});

it('entrega de recuperação congela o conjunto na mesma transação', async () => {
  const token = emitir();

  const resposta = await post(token);

  expect(resposta.status).toBe(200);
  const congelamento = m.writes.find(w => w.path === 'professores/p/conjuntos_recuperacao/c1');
  expect(congelamento).toMatchObject({
    data: { congelado: true, congeladoPorAtividadeId: 'at' },
    options: { merge: true },
  });
  expect(m.docs.get('professores/p/conjuntos_recuperacao/c1')).toMatchObject({
    congelado: true,
    destinatariosIds: ['a'],
  });
  expect(m.writes.find(w => w.path.startsWith('entregas/'))?.data).toMatchObject({
    conjuntoRecuperacaoId: 'c1',
    semestre: '1',
    status: 'entregue',
  });
});

it('entrega regular não toca no conjunto de recuperação', async () => {
  m.docs.set('atividades/at', atividade({ finalidade: 'regular', bimestre: 3, conjuntoRecuperacaoId: undefined, semestre: undefined, destinatariosIds: undefined }));
  const token = emitir();

  const resposta = await post(token);

  expect(resposta.status).toBe(200);
  expect(m.writes.filter(w => w.path.includes('conjuntos_recuperacao'))).toEqual([]);
  expect(m.writes.find(w => w.path.startsWith('entregas/'))?.data).toMatchObject({ bimestre: 3 });
});

it('conjunto cancelado recusa a entrega sem gravar nada', async () => {
  m.docs.set('professores/p/conjuntos_recuperacao/c1', conjunto({ estado: 'cancelado', versao: 2 }));
  const token = emitir();

  const resposta = await post(token);

  expect(resposta.status).toBe(409);
  expect(m.writes).toEqual([]);
});

it('aluno removido do conjunto não entrega, mesmo com token e atividade antigos', async () => {
  m.docs.set('professores/p/conjuntos_recuperacao/c1', conjunto({ destinatariosIds: ['b'], versao: 2 }));
  const token = emitir();

  const resposta = await post(token);

  expect(resposta.status).toBe(403);
  expect(m.writes).toEqual([]);
});
