import { test, expect, vi, afterEach } from 'vitest';
import { HorarioRepository, LOCAL_STORAGE_KEY } from '@/infraestrutura/horario/HorarioRepository';
afterEach(() => vi.unstubAllGlobals());
test('RN-80 preserva rascunho pendente ao recarregar', async () => {
  const map = new Map();
  vi.stubGlobal('localStorage', { getItem: (k) => map.get(k) || null, setItem: (k, v) => map.set(k, v) });
  const doc = {
    set: async () => {
      throw Error('Offline fictício');
    },
    get: async () => ({ data: () => ({ schedule: { seg_m1: { subject: 'Versão antiga' } } }) }),
  };
  const repo = new HorarioRepository({ firestoreDb: { collection: () => ({ doc: () => doc }) } });
  const salvo = await repo.salvarGrade('a', { schedule: { seg_m1: { subject: 'Edição ainda pendente' } } });
  expect(salvo.persistencia.estado).toBe('pendente');
  const loaded = await repo.carregarGrade('a');
  expect(loaded.schedule.seg_m1.subject).toBe('Edição ainda pendente');
  expect(loaded.persistencia.estado).toBe('pendente');
  expect((await repo.carregarGrade('a', { somenteReal: true })).schedule.seg_m1.subject).toBe(
    'Versão antiga',
  );
  expect(JSON.parse(map.get(repo.chaveConta('a'))).schedule.seg_m1.subject).toBe('Edição ainda pendente');
});
test('RN-80 nuvem vazia preserva oferta de legado até decisão explícita', async () => {
  const map = new Map([[LOCAL_STORAGE_KEY, JSON.stringify({ schedule: { seg_m1: { subject: 'Legado' } } })]]);
  vi.stubGlobal('localStorage', { getItem: (k) => map.get(k) || null, setItem: (k, v) => map.set(k, v) });
  const doc = { get: async () => ({ data: () => ({ schedule: {} }) }) };
  const repo = new HorarioRepository({ firestoreDb: { collection: () => ({ doc: () => doc }) } });
  expect(repo.detectarCacheLegado().disponivel).toBe(true);
  await repo.carregarGrade('a');
  expect(repo.detectarCacheLegado().disponivel).toBe(true);
});
