import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  conjuntos: [],
  detalhe: null,
  atividades: [],
  entregas: [],
  criar: vi.fn(),
  lancar: vi.fn(),
}));

vi.mock('@/lib/firebase-recuperacao', () => ({
  listConjuntosRecuperacao: async () => m.conjuntos,
  getConjuntoRecuperacao: async () => m.detalhe,
  criarConjuntoRecuperacao: (...args) => m.criar(...args),
  listarAtividadesDoConjunto: async () => m.atividades,
  listarEntregasDoConjunto: async () => m.entregas,
}));
vi.mock('@/infraestrutura/diario/DiarioRepository', () => ({
  DiarioRepository: class {
    async carregar() { return { turmas: m.turmasBase || [], revision: 4 }; }
  },
}));
vi.mock('@/infraestrutura/diario/RecuperacaoRepository', () => ({
  RecuperacaoRepository: class {
    lancar(argumentos) { return m.lancar(argumentos); }
  },
}));

vi.mock('@/components/atividades/AtividadePainel', () => ({ AtividadePainel: () => <p>Painel de correção aberto</p> }));

import { RecuperacaoSemestral } from '@/components/atividades/RecuperacaoSemestral';

const turmas = [{
  id: 't1',
  nome: 'Turma 1',
  alunos: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }],
}];

const conjunto = (extra = {}) => ({
  id: 'c1',
  professorId: 'p',
  turmaId: 't1',
  anoLetivo: '2026',
  semestre: '1',
  destinatariosIds: ['a', 'b'],
  atividadeIds: [],
  estado: 'rascunho',
  versao: 3,
  ...extra,
});

const atividade = (extra = {}) => ({
  id: 'r1',
  titulo: 'Recuperação',
  turmaIds: ['t1'],
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  semestre: '1',
  notaMaxima: 10,
  status: 'ativa',
  dataEntrega: '2099-01-01',
  ...extra,
});

const props = {
  user: { uid: 'p' },
  turmas,
  ano: '2026',
  useAtividadesHook: { createAtividade: vi.fn(), deleteAtividade: vi.fn() },
  aguardarSalvamento: vi.fn().mockResolvedValue(undefined),
  recarregar: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  m.conjuntos = [];
  m.detalhe = null;
  m.atividades = [];
  m.entregas = [];
  m.turmasBase = [{ id: 't1', alunos: turmas[0].alunos, recuperacao: {} }];
  m.criar.mockReset().mockResolvedValue(conjunto());
  m.lancar.mockReset();
  vi.clearAllMocks();
});


it('REV-R81-06: botão Corrigir abre o painel sem erro', async () => {
  m.conjuntos = [conjunto({ estado: 'pronto' })];
  m.detalhe = conjunto({ atividadeIds: ['r1'], estado: 'pronto' });
  m.atividades = [atividade()];
  const erros = [];
  const capturar = e => { erros.push(e.error); e.preventDefault(); };
  window.addEventListener('error', capturar);
  try {
    render(<RecuperacaoSemestral {...props} />);
    fireEvent.click(await screen.findByRole('button', { name: /^Corrigir$/ }));
    expect(erros.map(e => e.message)).toEqual([]);
    expect(screen.getByText('Painel de correção aberto')).toBeInTheDocument();
  } finally { window.removeEventListener('error', capturar); }
});

it('REV-R81-07: troca de conta oculta imediatamente prévia e dados anteriores', async () => {
  m.conjuntos = [conjunto({ estado: 'pronto' })];
  m.detalhe = conjunto({ atividadeIds: ['r1'], estado: 'pronto' });
  m.atividades = [atividade()];
  m.entregas = [{ id: 'e1', activityId: 'r1', alunoId: 'a', turmaId: 't1', status: 'corrigido', notaFinal: 8 }];
  const view = render(<RecuperacaoSemestral {...props} />);
  fireEvent.click(await screen.findByRole('button', { name: /Conferir recuperação/i }));
  expect(await screen.findByText(/Prévia do lançamento em rec1/i)).toBeInTheDocument();
  view.rerender(<RecuperacaoSemestral {...props} user={{ uid: 'outra-conta' }} turmas={[]} />);
  expect(screen.queryByText(/Prévia do lançamento em rec1/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Lançar recuperação de Ana')).not.toBeInTheDocument();
});
