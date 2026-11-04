import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, expect, it, vi } from 'vitest';

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
vi.mock('@/components/atividades/TodasAtividades', () => ({ TodasAtividades: () => (
  // AtividadeForm usa o marcador no form, sem value; conteúdo fica nos controles filhos.
  <form data-diario-rascunho="true"><label>Título do rascunho<textarea defaultValue="Título anterior" /></label></form>
) }));
import Page from '@/app/atividades/page';
afterEach(() => vi.restoreAllMocks());

it('REV3-R83-01: mudança em controle filho invalida confirmação anterior durante a espera', async () => {
  let concluir;
  m.esperar.mockImplementation(() => new Promise(resolve => { concluir = resolve; }));
  m.logout.mockResolvedValue(undefined);
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(true).mockReturnValue(false);
  const user = userEvent.setup();
  render(<Page />);
  await user.click(await screen.findByTitle('Sair'));
  await waitFor(() => expect(m.esperar).toHaveBeenCalledOnce());
  const campo = screen.queryByRole('textbox', { name: 'Título do rascunho' });
  const editavel = campo && !campo.matches(':disabled') && !campo.closest('[inert]');
  if (editavel) {
    await user.clear(campo);
    await user.type(campo, 'Novo título ainda não salvo');
  }
  await act(async () => { concluir(); });
  if (editavel) {
    expect(m.logout).not.toHaveBeenCalled();
    expect(m.router.replace).not.toHaveBeenCalled();
    expect(campo).toHaveValue('Novo título ainda não salvo');
    expect(confirmar).toHaveBeenCalledTimes(2);
  } else {
    await waitFor(() => expect(m.logout).toHaveBeenCalledOnce());
  }
});
