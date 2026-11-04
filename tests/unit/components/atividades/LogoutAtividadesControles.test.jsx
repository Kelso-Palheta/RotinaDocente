import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

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
  <form data-diario-rascunho="true">
    <label><input type="checkbox" />Publicar material</label>
    <label>Turmas<select multiple defaultValue={['301']}><option value="301">301</option><option value="302">302</option></select></label>
    <div role="textbox" aria-label="Texto de apoio" contentEditable suppressContentEditableWarning><p>Texto anterior</p></div>
  </form>
) }));
import Page from '@/app/atividades/page';

beforeEach(() => {
  m.esperar.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  m.router.push.mockReset();
  m.router.replace.mockReset();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it.each(['checkbox', 'selecao-multipla', 'texto-rico'])(
  'REV3-R83-02: alteração em %s invalida descarte confirmado antes da espera', async tipo => {
    let concluir;
    m.esperar.mockImplementation(() => new Promise(resolve => { concluir = resolve; }));
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(true).mockReturnValue(false);
    const user = userEvent.setup();
    render(<Page />);
    await user.click(await screen.findByTitle('Sair'));
    await waitFor(() => expect(m.esperar).toHaveBeenCalledOnce());
    if (tipo === 'checkbox') await user.click(screen.getByLabelText('Publicar material'));
    if (tipo === 'selecao-multipla') await user.selectOptions(screen.getByLabelText('Turmas'), ['301', '302']);
    if (tipo === 'texto-rico') {
      const editor = screen.getByRole('textbox', { name: 'Texto de apoio' });
      editor.innerHTML = '<p>Texto novo ainda não salvo</p>';
      fireEvent.input(editor);
    }
    await act(async () => { concluir(); });
    expect(confirmar).toHaveBeenCalledTimes(2);
    expect(m.logout).not.toHaveBeenCalled();
    expect(m.router.replace).not.toHaveBeenCalled();
    if (tipo === 'checkbox') expect(screen.getByLabelText('Publicar material')).toBeChecked();
    if (tipo === 'selecao-multipla') expect(screen.getByLabelText('Turmas')).toHaveValue(['301', '302']);
    if (tipo === 'texto-rico') expect(screen.getByRole('textbox', { name: 'Texto de apoio' })).toHaveTextContent('Texto novo ainda não salvo');
  },
);

it('REV3-R83-03: rascunho inalterado mantém a confirmação anterior sem pergunta duplicada', async () => {
  let concluir;
  m.esperar.mockImplementation(() => new Promise(resolve => { concluir = resolve; }));
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<Page />);
  await userEvent.setup().click(await screen.findByTitle('Sair'));
  await waitFor(() => expect(m.esperar).toHaveBeenCalledOnce());
  await act(async () => { concluir(); });
  expect(confirmar).toHaveBeenCalledOnce();
  await waitFor(() => expect(m.logout).toHaveBeenCalledOnce());
  expect(m.router.replace).toHaveBeenCalledWith('/');
});
