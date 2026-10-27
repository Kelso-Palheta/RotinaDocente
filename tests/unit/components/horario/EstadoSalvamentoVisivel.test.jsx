import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
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

test('UT-54 origem na nuvem aparece como sincronizado', async () => {
  mocks.carregar.mockResolvedValue(grade({ persistencia: { origem: 'nuvem' } }));

  render(<HorarioApp />);
  await screen.findByText(/Total de Aulas/i);

  expect(screen.getByTestId('sync-status')).toHaveTextContent('Sincronizado na nuvem');
});

test('UT-54 origem local aparece como somente neste dispositivo', async () => {
  mocks.carregar.mockResolvedValue(grade({ persistencia: { origem: 'local' } }));

  render(<HorarioApp />);
  await screen.findByText(/Total de Aulas/i);

  expect(screen.getByTestId('sync-status')).toHaveTextContent('Salvo apenas neste dispositivo');
});

test('UT-54 falha ao salvar não é anunciada como sincronizada', async () => {
  mocks.carregar.mockResolvedValue(grade({ persistencia: { origem: 'nuvem' } }));
  mocks.salvar.mockResolvedValue({ ...grade(), persistencia: { local: 'falha', nuvem: 'falha', estado: 'falha' } });

  render(<HorarioApp />);
  await screen.findByText(/Total de Aulas/i);

  fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: 'Professor Alterado' } });
  fireEvent.blur(screen.getByPlaceholderText('Seu nome'));

  await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Não foi possível salvar'));
  expect(screen.queryByText(/Sincronizado na nuvem/)).toBeNull();
  expect(screen.getByRole('button', { name: /Tentar sincronizar novamente/i })).toBeInTheDocument();
});

test('UT-54 alteração pendente oferece nova tentativa', async () => {
  mocks.carregar.mockResolvedValue(grade({ persistencia: { origem: 'local' } }));
  mocks.salvar.mockResolvedValue({ ...grade(), persistencia: { local: 'ok', nuvem: 'falha', estado: 'pendente' } });

  render(<HorarioApp />);
  await screen.findByText(/Total de Aulas/i);

  fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: 'Professor Alterado' } });
  fireEvent.blur(screen.getByPlaceholderText('Seu nome'));

  await waitFor(() => expect(screen.getByTestId('sync-status')).toHaveTextContent('Alterações ainda não enviadas'));
  expect(screen.getByRole('button', { name: /Tentar sincronizar novamente/i })).toBeInTheDocument();
});

test('UT-53 rascunho legado só é importado com confirmação explícita', async () => {
  mocks.carregar.mockResolvedValue(grade({ persistencia: { origem: 'padrao' } }));
  mocks.detectar.mockReturnValue({ disponivel: true, aulas: 2, atualizadoEm: '2026-01-02T10:00:00.000Z' });
  mocks.migrar.mockReturnValue(grade({ schedule: { seg_m1: { subject: 'Rascunho antigo' } } }));

  render(<HorarioApp />);
  await screen.findByText(/Total de Aulas/i);

  expect(screen.getByTestId('legacy-draft')).toBeInTheDocument();
  expect(mocks.migrar).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Importar rascunho' }));
  expect(mocks.migrar).toHaveBeenCalledWith('prof-teste', true);
  await waitFor(() => expect(screen.queryByTestId('legacy-draft')).toBeNull());
});

test('UT-53 descartar remove a oferta sem importar', async () => {
  mocks.carregar.mockResolvedValue(grade({ persistencia: { origem: 'padrao' } }));
  mocks.detectar.mockReturnValue({ disponivel: true, aulas: 2, atualizadoEm: '2026-01-02T10:00:00.000Z' });

  render(<HorarioApp />);
  await screen.findByText(/Total de Aulas/i);

  fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
  expect(mocks.descartar).toHaveBeenCalledWith('prof-teste');
  expect(mocks.migrar).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByTestId('legacy-draft')).toBeNull());
});

test('UT-55 ao trocar de conta a grade anterior não permanece editável', async () => {
  let liberarContaB;
  const pendente = new Promise((resolve) => { liberarContaB = resolve; });

  mocks.carregar.mockImplementation((uid) => {
    if (uid === 'conta-b') return pendente;
    return Promise.resolve(grade({ teacherName: 'Professor Conta A', persistencia: { origem: 'nuvem' } }));
  });

  mocks.auth.user = { uid: 'conta-a' };
  const { rerender } = render(<HorarioApp />);
  await waitFor(() => expect(screen.getByDisplayValue('Professor Conta A')).toBeInTheDocument());

  mocks.auth.user = { uid: 'conta-b' };
  rerender(<HorarioApp />);

  await waitFor(() => expect(screen.queryByDisplayValue('Professor Conta A')).toBeNull());
  expect(screen.queryByText(/Total de Aulas/i)).toBeNull();

  liberarContaB(grade({ teacherName: 'Professor Conta B', persistencia: { origem: 'nuvem' } }));
  await waitFor(() => expect(screen.getByDisplayValue('Professor Conta B')).toBeInTheDocument());
});
