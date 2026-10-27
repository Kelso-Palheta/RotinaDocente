import { it, expect, vi, afterEach } from 'vitest';

const estado = vi.hoisted(() => ({ notas: 'ok', atividades: 'ok', entregas: 'ok', tokens: 'ok' }));

vi.mock('@/lib/aluno/session', () => ({
  getSessionFromRequest: () => ({ loginKey: 'lk', login: 'ana1234', nome: 'Ana' }),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => ({
    doc: (path) => ({
      get: async () => {
        if (path.includes('/vinculos/')) return { exists: true, data: () => ({ professorUid: 'p', turmaId: 't', alunoId: 'a' }) };
        if (path.startsWith('notasAluno/')) {
          if (estado.notas === 'falha') throw new Error('notas indisponíveis');
          return { exists: true, data: () => ({ bimestres: { 1: { total: 8 } } }) };
        }
        if (path.includes('/tokens/')) {
          if (estado.tokens === 'falha') throw new Error('tokens indisponíveis');
          return { exists: true, data: () => ({ alunoId: 'a', turmaId: 't', token: 'tok' }) };
        }
        return { exists: false };
      },
    }),
    collection: (path) => ({
      where() { return this; },
      get: async () => {
        if (path === 'atividades') {
          if (estado.atividades === 'falha') throw new Error('atividades indisponíveis');
          return { docs: [{ id: 'atv1', data: () => ({ professorId: 'p', turmaIds: ['t'], status: 'publicada', titulo: 'Atividade sintética' }) }] };
        }
        if (path === 'entregas') {
          if (estado.entregas === 'falha') throw new Error('entregas indisponíveis');
          return { docs: [] };
        }
        return { docs: [] };
      },
    }),
  }),
}));

import { GET } from '@/app/api/aluno/boletim/route';

const URL_BOLETIM = 'http://localhost/api/aluno/boletim?professorUid=p&turmaId=t&alunoId=a';

afterEach(() => {
  vi.restoreAllMocks();
  Object.assign(estado, { notas: 'ok', atividades: 'ok', entregas: 'ok', tokens: 'ok' });
});

it('UT-48 falha de notas, atividades e entregas é declarada por seção', async () => {
  Object.assign(estado, { notas: 'falha', atividades: 'falha', entregas: 'falha' });
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  const response = await GET(new Request(URL_BOLETIM));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.falhas).toEqual({ notas: true, atividades: true, entregas: true });
  expect(data.notas).toEqual({});
  expect(data.atividades).toEqual([]);
});

it('UT-48 falha de tokens não derruba notas e atividades lidas', async () => {
  Object.assign(estado, { tokens: 'falha' });
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  const response = await GET(new Request(URL_BOLETIM));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.falhas).toEqual({ tokens: true });
  expect(data.notas.bimestres[1].total).toBe(8);
  expect(data.atividades.map((a) => a.id)).toEqual(['atv1']);
  expect(data.tokens).toEqual({});
});

it('UT-48 sem falhas, nenhuma seção é sinalizada', async () => {
  const response = await GET(new Request(URL_BOLETIM));
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.falhas).toEqual({});
  expect(data.notas.bimestres[1].total).toBe(8);
  expect(data.tokens).toEqual({ atv1: 'tok' });
});
