import { test, expect, vi, afterEach } from 'vitest';
import { HorarioRepository } from '@/infraestrutura/horario/HorarioRepository';
afterEach(() => vi.unstubAllGlobals());
test('edição somente local preserva pendência sem chamar gravação de nuvem', async () => {
  const cache = new Map(),
    set = vi.fn();
  vi.stubGlobal('localStorage', { getItem: (k) => cache.get(k) || null, setItem: (k, v) => cache.set(k, v) });
  const repo = new HorarioRepository({ firestoreDb: { collection: () => ({ doc: () => ({ set }) }) } });
  const result = await repo.salvarGrade(
    'a',
    { schedule: { seg_m1: { subject: 'Rascunho' } } },
    { somenteLocal: true },
  );
  expect(set).not.toHaveBeenCalled();
  expect(result.persistencia.estado).toBe('pendente');
  expect(JSON.parse(cache.get(repo.chaveConta('a'))).schedule.seg_m1.subject).toBe('Rascunho');
});
