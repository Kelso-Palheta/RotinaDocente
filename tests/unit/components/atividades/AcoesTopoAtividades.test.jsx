import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  turma: { id: 't', nome: '301', alunos: [], bimestres: { 1: { atividades: [], notas: {} } } },
}));

vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => m.router }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'p' },
    perfil: { modulos_permitidos: ['gerador-atividades'] },
    loading: false,
    logout: vi.fn(),
  }),
}));
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
vi.mock('@/hooks/atividades/useAtividades', () => ({ useAtividades: () => ({}) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({
  doc: vi.fn(),
  getDoc: async () => ({ exists: () => false }),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('@/utils/diario/confirmarTrocaContexto', () => ({ confirmarTrocaContexto: () => true }));
vi.mock('@/components/atividades/TodasAtividades', () => ({ TodasAtividades: () => <p>Lista geral segura</p> }));
vi.mock('@/components/atividades/AtividadesList', () => ({ AtividadesList: () => null }));
vi.mock('@/components/atividades/RecuperacaoSemestral', () => ({ RecuperacaoSemestral: () => <p>Recuperação aberta</p> }));
vi.mock('@/components/diario/Sidebar', () => ({ Sidebar: () => <aside>Turmas</aside> }));
vi.mock('@/components/diario/ProfileModal', () => ({ ProfileModal: () => null }));

import Page from '@/app/atividades/page';

const acoes = [
  'Abrir menu',
  'Hub',
  /Versão Adaptada/i,
  /Portal do Aluno/i,
  /Recuperação semestral/i,
  /Todas as atividades/i,
];

afterEach(cleanup);

describe('H81-05 — barra de ações do professor', () => {
  it('mantém todas as ações com nome acessível e quebra de linha, sem rolagem horizontal', async () => {
    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    const barra = screen.getByTestId('acoes-topo');
    const grupo = screen.getByTestId('acoes-topo-grupo');
    expect(barra.className).toContain('flex-wrap');
    expect(barra.className).not.toContain('overflow-x-auto');
    expect(grupo.className).toContain('flex-wrap');
    expect(grupo.className).not.toContain('overflow-x-auto');

    for (const nome of acoes) {
      expect(screen.getByRole('button', { name: nome })).toBeEnabled();
    }

    // Em 390 px os rótulos 'Hub' e 'Versão Adaptada' ficam ocultos por CSS;
    // o nome acessível precisa continuar completo.
    expect(screen.getByRole('button', { name: 'Hub' })).toHaveAttribute('aria-label', 'Hub');
    expect(screen.getByRole('button', { name: 'Versão Adaptada (DUA)' })).toHaveAttribute('aria-label', 'Versão Adaptada (DUA)');
  });

  it('preserva a ordem de foco e as funções de Hub, adaptação, recuperação e todas as atividades', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await screen.findByText('Salvo na nuvem');

    const focados = [];
    for (let passo = 0; passo < acoes.length; passo += 1) {
      await user.tab();
      const ativo = document.activeElement;
      focados.push(ativo?.getAttribute('aria-label') || ativo?.textContent || '');
    }
    expect(focados.some((nome) => /Abrir menu/i.test(nome))).toBe(true);
    expect(focados.some((nome) => /Versão Adaptada/i.test(nome))).toBe(true);
    expect(focados.some((nome) => /Portal do Aluno/i.test(nome))).toBe(true);
    expect(focados.some((nome) => /Recuperação semestral/i.test(nome))).toBe(true);
    expect(focados.some((nome) => /Todas as atividades/i.test(nome))).toBe(true);

    await user.click(screen.getByRole('button', { name: /Hub/i }));
    expect(m.router.push).toHaveBeenCalledWith('/');

    await user.click(screen.getByRole('button', { name: /Versão Adaptada/i }));
    expect(m.router.push).toHaveBeenCalledWith('/adaptacoes');

    await user.click(screen.getByRole('button', { name: /Recuperação semestral/i }));
    expect(await screen.findByText('Recuperação aberta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Todas as atividades/i }));
    expect(await screen.findByText('Lista geral segura')).toBeInTheDocument();
  });
});
