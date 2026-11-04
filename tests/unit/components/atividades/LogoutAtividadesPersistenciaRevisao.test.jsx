import { render, screen } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ estado: 'falha', logout: vi.fn(), router: { push: vi.fn(), replace: vi.fn() }, turma: { id: 't', nome: '301', alunos: [], bimestres: {} } }));
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => m.router }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { uid: 'p' }, perfil: { modulos_permitidos: ['gerador-atividades'] }, loading: false, logout: m.logout }) }));
vi.mock('@/hooks/diario/usePersistenciaDiario', () => ({ usePersistenciaDiario: () => ({ turmas: [m.turma], carregando: false, podeEditar: m.estado !== 'conflito', estado: m.estado, erro: 'Rascunho não confirmado na nuvem', persistir: vi.fn(), restaurar: vi.fn(), aguardarSalvamento: vi.fn().mockRejectedValue(new Error('Rascunho não confirmado')), recarregar: vi.fn(), tentarNovamente: vi.fn() }) }));
vi.mock('@/hooks/atividades/useAtividades', () => ({ useAtividades: () => ({}) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({ doc: vi.fn(), getDoc: async () => ({ exists: () => false }), setDoc: vi.fn(), serverTimestamp: vi.fn() }));
vi.mock('@/components/diario/Sidebar', () => ({ Sidebar: ({ onLogout }) => <button title="Sair" onClick={onLogout}>Sair</button> }));
vi.mock('@/components/diario/ProfileModal', () => ({ ProfileModal: () => null }));
vi.mock('@/components/atividades/TodasAtividades', () => ({ TodasAtividades: () => <p>Atividades</p> }));
vi.mock('@/components/atividades/AtividadesList', () => ({ AtividadesList: () => null }));
vi.mock('@/components/atividades/RecuperacaoSemestral', () => ({ RecuperacaoSemestral: () => null }));
// confirmarTrocaContexto é real: o estado da fila não pode ficar invisível ao guard.
import Page from '@/app/atividades/page';
beforeEach(() => {
  m.router.replace.mockReset(); m.router.push.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(false);
});
it.each(['salvando', 'pendente', 'falha', 'conflito'])('REV-R83-01: estado canônico %s não permite limpar a sessão sem resolver ou confirmar o rascunho', async estado => {
  m.estado = estado;
  render(<Page />);
  const botao = await screen.findByTitle('Sair');
  await userEvent.setup().click(botao);
  // Não há formulário aberto, apenas alterações do Diário na fila da conta.
  // Havendo confirmação, o usuário a recusa; salvamento em curso deve aguardar/bloquear.
  expect(m.logout).not.toHaveBeenCalled();
  expect(m.router.replace).not.toHaveBeenCalled();
});
