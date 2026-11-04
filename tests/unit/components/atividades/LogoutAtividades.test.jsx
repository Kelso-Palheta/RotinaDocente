import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  logout: vi.fn(),
  confirmar: vi.fn(),
  chamadas: { logout: 0 },
  usuario: { uid: 'p', displayName: 'Professora Teste', email: 'professora@exemplo.com' },
  perfil: { modulos_permitidos: ['gerador-atividades'] },
  turma: { id: 't', nome: '301', alunos: [], bimestres: { 1: { atividades: [], notas: {} } } },
}));

vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => m.router }));

vi.mock('@/lib/auth-context', async () => {
  const React = await import('react');
  return {
    useAuth: () => {
      const [user, setUser] = React.useState(m.usuario);
      const logout = React.useCallback(async () => {
        // Espelha o contexto real: o usuário é limpo antes de aguardar o signOut.
        m.chamadas.logout += 1;
        setUser(null);
        return m.logout();
      }, []);
      return { user, perfil: m.perfil, loading: false, logout };
    },
  };
});

vi.mock('@/hooks/diario/usePersistenciaDiario', () => ({
  usePersistenciaDiario: () => ({
    turmas: [m.turma],
    carregando: false,
    podeEditar: true,
    estado: 'salvo',
    erro: '',
    persistir: vi.fn(),
    restaurar: vi.fn(),
    aguardarSalvamento: vi.fn(),
    recarregar: vi.fn(),
    tentarNovamente: vi.fn(),
  }),
}));

vi.mock('@/utils/diario/confirmarTrocaContexto', () => ({
  confirmarTrocaContexto: () => m.confirmar(),
}));
vi.mock('@/hooks/atividades/useAtividades', () => ({ useAtividades: () => ({}) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({
  doc: vi.fn(),
  getDoc: async () => ({ exists: () => false }),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('@/components/atividades/TodasAtividades', () => ({ TodasAtividades: () => <p>Lista geral segura</p> }));
vi.mock('@/components/atividades/AtividadesList', () => ({ AtividadesList: () => null }));
vi.mock('@/components/atividades/RecuperacaoSemestral', () => ({ RecuperacaoSemestral: () => <p>Recuperação aberta</p> }));
vi.mock('@/components/diario/ProfileModal', () => ({ ProfileModal: () => null }));

import Page from '@/app/atividades/page';

const botaoSair = () => screen.getByTitle('Sair');

beforeEach(() => {
  m.router.push.mockReset();
  m.router.replace.mockReset();
  m.logout.mockReset();
  m.confirmar.mockReset();
  m.confirmar.mockReturnValue(true);
  m.chamadas.logout = 0;
});

afterEach(cleanup);

describe('RN-83 — Sair da página de Atividades encerra a sessão', () => {
  it('R83-01: chama o logout do contexto e só navega depois que a promessa resolve', async () => {
    const user = userEvent.setup();
    let concluir;
    m.logout.mockImplementation(() => new Promise((resolve) => { concluir = resolve; }));

    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    await user.click(botaoSair());

    expect(m.chamadas.logout).toBe(1);
    expect(screen.getByRole('status')).toHaveTextContent('Encerrando sessão');
    expect(m.router.replace).not.toHaveBeenCalled();

    concluir();
    await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));
  });

  it('R83-02: respeita a proteção de alterações não salvas antes de encerrar', async () => {
    const user = userEvent.setup();
    m.confirmar.mockReturnValue(false);
    m.logout.mockResolvedValue(undefined);

    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    await user.click(botaoSair());

    expect(m.confirmar).toHaveBeenCalledTimes(1);
    expect(m.chamadas.logout).toBe(0);
    expect(m.router.replace).not.toHaveBeenCalled();
    expect(screen.getByText('Salvo na nuvem')).toBeInTheDocument();
  });

  it('R83-03: exibe erro acessível e não navega quando o encerramento falha', async () => {
    const user = userEvent.setup();
    m.logout.mockRejectedValue(new Error('Falha de rede ao encerrar'));

    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    await user.click(botaoSair());

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível encerrar a sessão');
    expect(alerta).toHaveTextContent('Falha de rede ao encerrar');
    expect(m.chamadas.logout).toBe(1);
    expect(m.router.replace).not.toHaveBeenCalled();
    expect(screen.queryByText('Salvo na nuvem')).not.toBeInTheDocument();
  });

  it('R83-04: permite tentar novamente e concluir o encerramento após a falha', async () => {
    const user = userEvent.setup();
    m.logout
      .mockRejectedValueOnce(new Error('Rede indisponível'))
      .mockResolvedValueOnce(undefined);

    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    await user.click(botaoSair());
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível encerrar a sessão');

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(m.chamadas.logout).toBe(2));
    await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));
  });

  it('R83-04: oferece saída explícita para o Hub sem alegar encerramento', async () => {
    const user = userEvent.setup();
    m.logout.mockRejectedValue(new Error('Rede indisponível'));

    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    await user.click(botaoSair());
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Ir para o Hub' }));

    expect(m.chamadas.logout).toBe(1);
    expect(m.router.replace).toHaveBeenCalledWith('/');
  });

  it('R83-05: não limpa tokens ou storages diretamente na página', async () => {
    const user = userEvent.setup();
    const limparLocal = vi.spyOn(Storage.prototype, 'clear');
    const limparSessao = vi.spyOn(window.sessionStorage, 'clear');
    m.logout.mockResolvedValue(undefined);

    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    await user.click(botaoSair());
    await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));

    expect(limparLocal).not.toHaveBeenCalled();
    expect(limparSessao).not.toHaveBeenCalled();
    limparLocal.mockRestore();
    limparSessao.mockRestore();
  });
});
