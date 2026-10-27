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
    carregarGrade(...args) {
      return mocks.carregar(...args);
    }
    salvarGrade(...args) {
      return mocks.salvar(...args);
    }
    detectarCacheLegado() {
      return mocks.detectar();
    }
    migrarCacheLegado(...args) {
      return mocks.migrar(...args);
    }
    descartarCacheLegado(...args) {
      return mocks.descartar(...args);
    }
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

test('conflito conserva edições locais sem escrever nuvem até reenvio confirmado', async () => {
  mocks.carregar.mockResolvedValue(
    grade({
      teacherName: 'Professor',
      persistencia: {
        origem: 'local',
        estado: 'pendente',
        conflito: true,
        nuvem: grade({ teacherName: 'Nuvem' }),
      },
    }),
  );
  mocks.salvar.mockResolvedValue({ persistencia: { estado: 'pendente' } });
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<HorarioApp />);
  await screen.findByDisplayValue('Professor');
  fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: 'Professor editado' } });
  fireEvent.blur(screen.getByPlaceholderText('Seu nome'));
  await waitFor(() =>
    expect(mocks.salvar).toHaveBeenCalledWith(
      'prof-teste',
      expect.objectContaining({ teacherName: 'Professor editado' }),
      { somenteLocal: true },
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: /Tentar sincronizar novamente/i }));
  expect(mocks.salvar).toHaveBeenCalledTimes(1);
  window.confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: /Tentar sincronizar novamente/i }));
  await waitFor(() => expect(mocks.salvar).toHaveBeenCalledTimes(2));
  expect(mocks.salvar.mock.calls[1][2]?.somenteLocal).not.toBe(true);
});
