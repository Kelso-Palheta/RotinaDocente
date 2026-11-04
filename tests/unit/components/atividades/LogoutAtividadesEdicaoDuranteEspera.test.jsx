import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ esperar: vi.fn(), logout: vi.fn(), router: { push: vi.fn(), replace: vi.fn() }, turma: { id: 't', nome: '301', alunos: [], bimestres: {} } }));
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => m.router }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { uid: 'p' }, perfil: { modulos_permitidos: ['gerador-atividades'] }, loading: false, logout: m.logout }) }));
vi.mock('@/hooks/diario/usePersistenciaDiario', () => ({ usePersistenciaDiario: () => ({ turmas: [m.turma], carregando: false, podeEditar: true, estado: 'salvando', erro: '', persistir: vi.fn(), restaurar: vi.fn(), aguardarSalvamento: m.esperar, recarregar: vi.fn(), tentarNovamente: vi.fn() }) }));
vi.mock('@/hooks/atividades/useAtividades', () => ({ useAtividades: () => ({}) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({ doc: vi.fn(), getDoc: async () => ({ exists: () => false }), setDoc: vi.fn(), serverTimestamp: vi.fn() }));
vi.mock('@/components/diario/Sidebar', () => ({ Sidebar: ({ onLogout }) => <button title="Sair" onClick={onLogout}>Sair</button> }));
vi.mock('@/components/diario/ProfileModal', () => ({ ProfileModal: () => null }));
vi.mock('@/components/atividades/AtividadesList', () => ({ AtividadesList: () => null }));
vi.mock('@/components/atividades/RecuperacaoSemestral', () => ({ RecuperacaoSemestral: () => null }));
vi.mock('@/components/atividades/TodasAtividades', async () => {
  const React = await import('react');
  return { TodasAtividades: () => {
    const [editando, setEditando] = React.useState(false);
    return <div><button onClick={() => setEditando(true)}>Abrir novo rascunho</button>{editando && <textarea data-testid="rascunho-novo" data-diario-rascunho="true" defaultValue="Alteração ainda não salva" />}</div>;
  } };
});
// Guard real: um formulário que surge durante a espera precisa continuar protegido.
import Page from '@/app/atividades/page';
it('REV2-R83-01: não descarta edição surgida enquanto aguarda o salvamento para sair', async () => {
  let concluir;
  m.esperar.mockImplementation(() => new Promise(resolve => { concluir = resolve; }));
  m.logout.mockResolvedValue(undefined);
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<Page />);
  const user = userEvent.setup();
  await user.click(await screen.findByTitle('Sair'));
  await waitFor(() => expect(m.esperar).toHaveBeenCalledOnce());
  const abrir = screen.queryByRole('button', { name: 'Abrir novo rascunho' });
  // Bloquear a edição durante a espera também é uma solução válida.
  if (abrir && !abrir.matches(':disabled') && !abrir.closest('[inert]')) await user.click(abrir);
  const novoRascunho = screen.queryByTestId('rascunho-novo');
  await act(async () => { concluir(); });
  if (novoRascunho) {
    expect(m.logout).not.toHaveBeenCalled();
    expect(m.router.replace).not.toHaveBeenCalled();
    expect(screen.getByTestId('rascunho-novo')).toHaveValue('Alteração ainda não salva');
  } else {
    await waitFor(() => expect(m.logout).toHaveBeenCalledOnce());
  }
  confirmar.mockRestore();
});
