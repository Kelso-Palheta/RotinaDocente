import { beforeEach, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ docs: new Map(), writes: [], session: null }));
const snapshot = path => ({ id: path.split('/').at(-1), exists: m.docs.has(path), data: () => m.docs.get(path) });
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    doc: path => ({ path, get: async () => snapshot(path) }),
    runTransaction: async fn => fn({
      get: async ref => snapshot(ref.path),
      set: (ref, data) => { m.writes.push({ path: ref.path, data }); m.docs.set(ref.path, data); },
    }),
  }),
}));
vi.mock('@/lib/aluno/session', () => ({ getSessionFromRequest: () => m.session }));
vi.mock('firebase-admin/firestore', () => ({ FieldValue: { serverTimestamp: () => 123 } }));

import { GET } from '@/app/api/aluno/atividade/[id]/route';
import { POST } from '@/app/api/aluno/entregar/route';
import { atividadePublica } from '@/dominio/atividades/acessoAluno';

const novo = () => btoa(`a:at:t:${'f'.repeat(64)}`);
const chave = (turmaId = 't', alunoId = 'a') => btoa(JSON.stringify([turmaId, alunoId]))
  .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

const get = token => GET(
  new Request(`http://localhost/api/aluno/atividade/at?token=${encodeURIComponent(token)}`),
  { params: Promise.resolve({ id: 'at' }) }
);
const post = (token, data = {}) => POST(new Request('http://localhost/api/aluno/entregar', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    activityId: 'at',
    token,
    respostas: { q: { tipo: 'discursiva', resposta: 'Resposta válida da recuperação' } },
    ...data,
  }),
}));

function emitir(alunoId = 'a', turmaId = 't', token = novo()) {
  m.docs.set(`atividades/at/tokens/${chave(turmaId, alunoId)}`, { token, nome: alunoId, alunoId, turmaId });
  return token;
}

beforeEach(() => {
  m.docs.clear();
  m.writes = [];
  m.session = null;
  m.docs.set('atividades/at', {
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
    questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Explique', notaMaxima: 4, rubrica: 'Privada', gabarito: 'Privado' }],
    alunosPorTurma: { t: [{ id: 'a', nome: 'Ana', necessidades: ['privado'] }] },
    materiais: [{ texto: 'Privado' }],
  });
  m.docs.set('professores/p/turmas/data', {
    turmas: [{ id: 't', alunos: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }] }],
  });
});

it('R81-05: destinatário autorizado lê a recuperação com semestre e parcela, sem gabarito, rubrica ou colegas', async () => {
  const token = emitir();
  const resposta = await get(token);
  expect(resposta.status).toBe(200);
  const { atividade } = await resposta.json();
  expect(atividade).toMatchObject({
    finalidade: 'recuperacao_semestral',
    conjuntoRecuperacaoId: 'c1',
    semestre: '1',
    notaMaxima: 4,
  });
  expect(atividade).not.toHaveProperty('bimestre');
  expect(atividade).not.toHaveProperty('destinatariosIds');
  expect(atividade).not.toHaveProperty('alunosPorTurma');
  expect(atividade).not.toHaveProperty('materiais');
  expect(atividade.questoes[0]).not.toHaveProperty('rubrica');
  expect(atividade.questoes[0]).not.toHaveProperty('gabarito');
  expect(JSON.stringify(atividade)).not.toContain('Bia');
});

it('R81-05: colega da mesma turma não acessa recuperação de outro aluno, nem por token emitido', async () => {
  const token = emitir('b');
  expect((await get(token)).status).toBe(403);
  expect((await post(token)).status).toBe(403);
  expect(m.writes).toEqual([]);
});

it('R81-05: token revogado e ausência de credencial continuam bloqueando a recuperação', async () => {
  const token = emitir();
  m.docs.get(`atividades/at/tokens/${chave()}`).revogado = true;
  expect((await get(token)).status).toBe(403);
  expect((await post(token)).status).toBe(403);
  m.docs.delete(`atividades/at/tokens/${chave()}`);
  expect((await post()).status).toBe(401);
  expect(m.writes).toEqual([]);
});

it('R81-05: entrega de recuperação recusa bimestre, finalidade, conjunto e semestre adulterados', async () => {
  const token = emitir();
  expect((await post(token, { bimestre: 3 })).status).toBe(403);
  expect((await post(token, { finalidade: 'regular' })).status).toBe(403);
  expect((await post(token, { conjuntoRecuperacaoId: 'c2' })).status).toBe(403);
  expect((await post(token, { semestre: '2' })).status).toBe(403);
  expect(m.writes).toEqual([]);
});

it('R81-05: entrega de recuperação deriva contexto no servidor e não grava bimestre', async () => {
  const token = emitir();
  const resposta = await post(token, {
    finalidade: 'recuperacao_semestral',
    conjuntoRecuperacaoId: 'c1',
    semestre: '1',
  });
  expect(resposta.status).toBe(200);
  expect(m.writes).toHaveLength(1);
  expect(m.writes[0].data).toMatchObject({
    activityId: 'at',
    alunoId: 'a',
    turmaId: 't',
    finalidade: 'recuperacao_semestral',
    conjuntoRecuperacaoId: 'c1',
    semestre: '1',
    status: 'entregue',
  });
  expect(m.writes[0].data).not.toHaveProperty('bimestre');
});

it('R81-05: projeção pública de recuperação lista apenas campos permitidos', () => {
  const publica = atividadePublica(m.docs.get('atividades/at'));
  expect(publica).toMatchObject({ finalidade: 'recuperacao_semestral', semestre: '1', conjuntoRecuperacaoId: 'c1' });
  expect(publica).not.toHaveProperty('destinatariosIds');
  expect(publica).not.toHaveProperty('gabarito');
  expect(publica.questoes[0]).not.toHaveProperty('rubrica');
});
