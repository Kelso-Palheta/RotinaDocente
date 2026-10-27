import { test, expect, vi, afterEach } from 'vitest';
import { HorarioRepository, LOCAL_STORAGE_KEY } from '@/infraestrutura/horario/HorarioRepository';
afterEach(() => vi.unstubAllGlobals());
test('ordem das chaves não cria conflito de horário com rascunho pendente', async () => {
  const local = {
    schedule: { seg_m1: { subject: 'Arte', grade: '101' }, ter_m1: { subject: 'História', grade: '101' } },
    _sync: { pendente: true },
  };
  const nuvem = {
    schedule: { ter_m1: { grade: '101', subject: 'História' }, seg_m1: { grade: '101', subject: 'Arte' } },
  };
  vi.stubGlobal('localStorage', {
    getItem: (k) => (k === `${LOCAL_STORAGE_KEY}:a` ? JSON.stringify(local) : null),
    setItem: () => {},
  });
  const repo = new HorarioRepository({
    firestoreDb: { collection: () => ({ doc: () => ({ get: async () => ({ data: () => nuvem }) }) }) },
  });
  expect((await repo.carregarGrade('a')).persistencia.conflito).toBe(false);
});
