import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AtividadePainel } from '@/components/atividades/AtividadePainel';

const m = vi.hoisted(() => ({
  atividade: { id: 'at', titulo: 'Tecnologias musicais', bimestre: 3, turmaIds: ['t'], notaMaxima: 2 },
  similaridades: [],
  gruposSimilaridade: [],
}));

vi.mock('@/hooks/atividades/useEntregas', () => ({
  useEntregas: () => ({
    entregas: [
      { id: 'e-ana', activityId: 'at', turmaId: 't', alunoId: 'ana', bimestre: 3, status: 'corrigido', notaFinal: 1.5 },
      { id: 'e-bruno', activityId: 'at', turmaId: 't', alunoId: 'bruno', bimestre: 3, status: 'corrigido', notaFinal: 1.5 },
    ],
    corrigindo: null,
    corrigirManualmente: vi.fn(),
    corrigirEntrega: vi.fn(),
    similaridades: m.similaridades,
    gruposSimilaridade: m.gruposSimilaridade,
  }),
}));

vi.mock('@/components/atividades/EntregaDrawer', () => ({
  EntregaDrawer: ({ entrega }) => (entrega ? <p>Drawer de {entrega.alunoId}</p> : null),
}));
vi.mock('@/components/atividades/UrlCopyPanel', () => ({ UrlCopyPanel: () => null }));
vi.mock('@/components/atividades/AtividadeForm', () => ({ AtividadeForm: () => null }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({
  collection: () => ({}),
  getDocs: async () => ({ forEach: () => {} }),
}));
vi.mock('@/lib/firebase-atividades', () => ({ getAtividade: async () => m.atividade }));

const grupo = () => ({
  alunos: [
    { alunoId: 'ana', turmaId: 't', entregaId: 'e-ana', texto: 'A mitose gera duas células filhas idênticas à célula mãe.' },
    { alunoId: 'bruno', turmaId: 't', entregaId: 'e-bruno', texto: 'A mitose gera duas células filhas idênticas à célula mãe.' },
  ],
  pares: [{ a: 'ana', b: 'bruno', similaridade: 0.96 }],
  similaridadeMinima: 0.96,
  similaridadeMaxima: 0.96,
});

const props = () => ({
  atividade: m.atividade,
  user: { uid: 'p' },
  currentTurmaId: 't',
  turmas: [{ id: 't', nome: '203', alunos: [{ id: 'ana', nome: 'Ana Silva' }, { id: 'bruno', nome: 'Bruno Costa' }] }],
  sincronizacaoAutomatica: false,
  useAtividadesHook: { sincronizarTodasAsNotas: vi.fn(async () => ({})), publicarNotaAluno: vi.fn() },
});

afterEach(() => { cleanup(); vi.clearAllMocks(); m.similaridades = []; m.gruposSimilaridade = []; });

it('UT-63 (RN-78): alerta no singular abre painel com nomes, percentual e revisão da entrega', async () => {
  m.similaridades = [grupo().alunos];
  m.gruposSimilaridade = [grupo()];
  const p = props();
  render(<AtividadePainel {...p} />);

  expect(await screen.findByText(/1 grupo para revisão humana/)).toBeInTheDocument();
  expect(p.useAtividadesHook.sincronizarTodasAsNotas).not.toHaveBeenCalled();
  expect(p.useAtividadesHook.publicarNotaAluno).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Ver grupo' }));

  const dialog = screen.getByRole('dialog', { name: 'Grupos com respostas parecidas' });
  expect(within(dialog).getByText('Ana Silva')).toBeInTheDocument();
  expect(within(dialog).getByText('Bruno Costa')).toBeInTheDocument();
  expect(within(dialog).getAllByText(/96%/).length).toBeGreaterThan(0);
  expect(within(dialog).getByText(/Nenhuma nota foi alterada/i)).toBeInTheDocument();

  fireEvent.click(within(dialog).getAllByRole('button', { name: 'Abrir correção' })[0]);
  expect(await screen.findByText('Drawer de ana')).toBeInTheDocument();
});

it('UT-63 (RN-78): dois grupos usam plural e identificam cada grupo', async () => {
  m.similaridades = [grupo().alunos, grupo().alunos];
  m.gruposSimilaridade = [grupo(), grupo()];
  render(<AtividadePainel {...props()} />);

  expect(await screen.findByText(/2 grupos para revisão humana/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ver grupos' }));

  const dialog = screen.getByRole('dialog', { name: 'Grupos com respostas parecidas' });
  expect(within(dialog).getByText(/Grupo 2/)).toBeInTheDocument();
});
