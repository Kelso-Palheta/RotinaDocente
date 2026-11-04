import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  estado: 'salvando',
  esperar: vi.fn(),
  logout: vi.fn(),
  router: { push: vi.fn(), replace: vi.fn() },
  turma: { id: 't', nome: '301', alunos: [], bimestres: {} },
}));

vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => m.router }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'p' },
    perfil: { modulos_permitidos: ['gerador-atividades'] },
    loading: false,
    logout: m.logout,
  }),
}));
vi.mock('@/hooks/diario/usePersistenciaDiario', () => ({
  usePersistenciaDiario: () => ({
    turmas: [m.turma],
    carregando: false,
    podeEditar: true,
    estado: m.estado,
    erro: '',
    persistir: vi.fn(),
    restaurar: vi.fn(),
    aguardarSalvamento: m.esperar,
    recarregar: vi.fn(),
    tentarNovamente: vi.fn(),
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
vi.mock('@/components/atividades/AtividadesList', () => ({ AtividadesList: () => null }));
vi.mock('@/components/atividades/RecuperacaoSemestral', () => ({ RecuperacaoSemestral: () => null }));
vi.mock('@/components/atividades/TodasAtividades', async () => {
  const React = await import('react');
  return {
    TodasAtividades: () => {
      const [editando, setEditando] = React.useState(false);
      return (
        <div>
          <button onClick={() => setEditando(true)}>Abrir novo rascunho</button>
          {editando && <textarea data-testid="rascunho-novo" data-diario-rascunho="true" defaultValue="Alteração ainda não salva" />}
        </div>
      );
    },
  };
});

import Page from '@/app/atividades/page';

beforeEach(() => {
  m.estado = 'salvando';
  m.esperar.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  m.router.push.mockReset();
  m.router.replace.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('REV2-R83-01 — proteção de toda a transição até o logout e prevenção de chamadas duplicadas', () => {
  it('R83-09: após recusar descarte de rascunho surgido na espera, permite nova tentativa de saída com confirmação explícita', async () => {
    const user = userEvent.setup();
    let concluirPrimeiraEspera;
    m.esperar
      .mockImplementationOnce(() => new Promise((resolve) => { concluirPrimeiraEspera = resolve; }))
      .mockResolvedValueOnce(undefined);
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

    render(<Page />);
    const botaoSair = await screen.findByTitle('Sair');

    await user.click(botaoSair);
    await waitFor(() => expect(m.esperar).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: 'Abrir novo rascunho' }));
    expect(screen.getByTestId('rascunho-novo')).toHaveValue('Alteração ainda não salva');

    await act(async () => { concluirPrimeiraEspera(); });

    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(m.logout).not.toHaveBeenCalled();
    expect(m.router.replace).not.toHaveBeenCalled();

    // Segunda tentativa: o professor confirma explicitamente o descarte e conclui o logout sem dupla pergunta.
    await user.click(botaoSair);
    expect(confirmar).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(m.logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));
  });

  it('R83-10: cliques repetidos em Sair durante a espera da fila ou durante o logout não duplicam chamadas', async () => {
    const user = userEvent.setup();
    let concluirEspera;
    let concluirLogout;
    m.esperar.mockImplementation(() => new Promise((resolve) => { concluirEspera = resolve; }));
    m.logout.mockImplementation(() => new Promise((resolve) => { concluirLogout = resolve; }));

    render(<Page />);
    const botaoSair = await screen.findByTitle('Sair');

    await user.click(botaoSair);
    await user.click(botaoSair);
    expect(m.esperar).toHaveBeenCalledTimes(1);
    expect(m.logout).not.toHaveBeenCalled();

    await act(async () => { concluirEspera(); });
    await waitFor(() => expect(m.logout).toHaveBeenCalledTimes(1));

    await user.click(botaoSair);
    expect(m.logout).toHaveBeenCalledTimes(1);

    await act(async () => { concluirLogout(); });
    await waitFor(() => expect(m.router.replace).toHaveBeenCalledWith('/'));
    expect(m.logout).toHaveBeenCalledTimes(1);
  });
});
