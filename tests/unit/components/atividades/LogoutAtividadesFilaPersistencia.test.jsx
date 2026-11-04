import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  estado: 'salvando',
  erro: '',
  aguardarSalvamento: vi.fn(),
  tentarNovamente: vi.fn(),
  logout: vi.fn(),
  chamadasLogout: 0,
  router: { push: vi.fn(), replace: vi.fn() },
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
        m.chamadasLogout += 1;
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
    podeEditar: m.estado !== 'conflito',
    estado: m.estado,
    erro: m.erro,
    persistir: vi.fn(),
    restaurar: vi.fn(),
    aguardarSalvamento: m.aguardarSalvamento,
    recarregar: vi.fn(),
    tentarNovamente: m.tentarNovamente,
  }),
}));

vi.mock('@/hooks/atividades/useAtividades', () => ({ useAtividades: () => ({}) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({
  doc: vi.fn(),
  getDoc: async () => ({ exists: () => false }),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('@/components/diario/Sidebar', () => ({
  Sidebar: ({ onLogout }) => <button title="Sair" onClick={onLogout}>Sair</button>,
}));
vi.mock('@/components/diario/ProfileModal', () => ({ ProfileModal: () => null }));
vi.mock('@/components/atividades/TodasAtividades', () => ({ TodasAtividades: () => <p>Lista geral segura</p> }));
vi.mock('@/components/atividades/AtividadesList', () => ({ AtividadesList: () => null }));
vi.mock('@/components/atividades/RecuperacaoSemestral', () => ({ RecuperacaoSemestral: () => null }));

// confirmarTrocaContexto permanece real para validar a integração entre DOM e estado canônico da fila.
import Page from '@/app/atividades/page';

beforeEach(() => {
  m.estado = 'salvando';
  m.erro = '';
  m.aguardarSalvamento.mockReset();
  m.tentarNovamente.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  m.chamadasLogout = 0;
  m.router.push.mockReset();
  m.router.replace.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('REV-R83-01 — proteção do estado canônico da fila no logout de Atividades', () => {
  it('R83-06: aguarda salvamento em curso concluir antes de chamar logout e só navega ao final', async () => {
    const user = userEvent.setup();
    let concluirSalvamento;
    let concluirLogout;
    m.estado = 'salvando';
    m.aguardarSalvamento.mockImplementation(() => new Promise((resolve) => { concluirSalvamento = resolve; }));
    m.logout.mockImplementation(() => new Promise((resolve) => { concluirLogout = resolve; }));

    render(<Page />);
    await user.click(await screen.findByTitle('Sair'));

    expect(m.aguardarSalvamento).toHaveBeenCalledTimes(1);
    expect(m.chamadasLogout).toBe(0);
    expect(m.router.replace).not.toHaveBeenCalled();

    concluirSalvamento();
    await waitFor(() => expect(m.chamadasLogout).toBe(1));
    expect(m.router.replace).not.toHaveBeenCalled();

    concluirLogout();
    await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));
  });

  it('R83-07: mantém sessão e conteúdo ativos quando o salvamento falha antes do logout e permite tentar novamente', async () => {
    const user = userEvent.setup();
    m.estado = 'salvando';
    m.aguardarSalvamento
      .mockRejectedValueOnce(new Error('Falha ao gravar rascunho na nuvem'))
      .mockResolvedValueOnce(undefined);

    render(<Page />);
    await user.click(await screen.findByTitle('Sair'));

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível concluir o salvamento antes de sair');
    expect(alerta).toHaveTextContent('Falha ao gravar rascunho na nuvem');
    expect(alerta).toHaveTextContent('Sua sessão permanece ativa');
    expect(alerta).not.toHaveTextContent('Não foi possível encerrar a sessão');
    expect(m.chamadasLogout).toBe(0);
    expect(m.router.replace).not.toHaveBeenCalled();
    expect(screen.getByText('Lista geral segura')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(m.aguardarSalvamento).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(m.chamadasLogout).toBe(1));
    await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));
  });

  it.each(['pendente', 'falha', 'conflito'])(
    'R83-08: em %s exige decisão explícita sobre alterações pendentes (recusa mantém sessão; confirmação encerra)',
    async (estado) => {
      const user = userEvent.setup();
      m.estado = estado;
      m.erro = 'Alterações ainda não confirmadas';
      const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

      render(<Page />);
      const botao = await screen.findByTitle('Sair');

      await user.click(botao);
      expect(confirmar).toHaveBeenCalledTimes(1);
      expect(m.chamadasLogout).toBe(0);
      expect(m.router.replace).not.toHaveBeenCalled();

      await user.click(botao);
      expect(confirmar).toHaveBeenCalledTimes(2);
      await waitFor(() => expect(m.chamadasLogout).toBe(1));
      await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));
    },
  );
});
