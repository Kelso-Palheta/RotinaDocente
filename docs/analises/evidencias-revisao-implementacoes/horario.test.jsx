import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: { user: { uid: 'prof-teste' } },
  carregar: vi.fn(),
  salvar: vi.fn(),
  detectar: vi.fn(),
  migrar: vi.fn(),
  descartar: vi.fn(),
}));

vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: mocks.auth.user }) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('@/infraestrutura/horario/HorarioRepository', () => ({
  HorarioRepository: class {
    carregarGrade(...args) { return mocks.carregar(...args); }
    salvarGrade(...args) { return mocks.salvar(...args); }
    detectarCacheLegado() { return mocks.detectar(); }
    migrarCacheLegado(...args) { return mocks.migrar(...args); }
    descartarCacheLegado(...args) { return mocks.descartar(...args); }
  },
}));

import HorarioApp from '@/apresentacao/horario/HorarioApp';

const grade = (extra = {}) => ({
  teacherName: 'Professor Teste',
  schoolName: 'Escola Teste',
  shift: 'manha',
  schedule: {},
  customSlots: null,
  ...extra,
});

beforeEach(() => {
  mocks.auth.user = { uid: 'prof-teste' };
  mocks.carregar.mockReset();
  mocks.salvar.mockReset();
  mocks.detectar.mockReset().mockReturnValue({ disponivel: false });
  mocks.migrar.mockReset();
  mocks.descartar.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(cleanup);

test('reprodução: conclusão tardia de A permite reenviar payload para B', async () => {
  let concluirA;
  mocks.auth.user = { uid: 'conta-a' };
  mocks.carregar.mockResolvedValueOnce(grade({teacherName:'Professor A',schedule:{seg_m1:{subject:'Aula privada A'}},persistencia:{origem:'nuvem'}}));
  mocks.salvar.mockReturnValueOnce(new Promise(resolve=>{concluirA=resolve;})).mockResolvedValue({persistencia:{estado:'nuvem'}});
  const {rerender} = render(<HorarioApp/>);
  await screen.findByDisplayValue('Professor A');
  fireEvent.change(screen.getByPlaceholderText('Seu nome'),{target:{value:'Professor A editado'}});
  fireEvent.blur(screen.getByPlaceholderText('Seu nome'));
  await waitFor(()=>expect(mocks.salvar).toHaveBeenCalledTimes(1));
  mocks.auth.user={uid:'conta-b'};
  mocks.carregar.mockResolvedValueOnce(grade({teacherName:'Professor B',persistencia:{origem:'nuvem'}}));
  rerender(<HorarioApp/>);
  await screen.findByDisplayValue('Professor B');
  await act(async()=>concluirA({persistencia:{estado:'pendente'}}));
  const retry=await screen.findByRole('button',{name:/Tentar sincronizar novamente/i});
  fireEvent.click(retry);
  await waitFor(()=>expect(mocks.salvar).toHaveBeenCalledTimes(2));
  expect(mocks.salvar.mock.calls[1][0]).toBe('conta-b');
  expect(mocks.salvar.mock.calls[1][1].schedule.seg_m1.subject).toBe('Aula privada A');
});
