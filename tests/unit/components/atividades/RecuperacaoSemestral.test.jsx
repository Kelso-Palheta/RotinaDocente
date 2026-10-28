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

describe('R81-07 (RN-81): tela de recuperação semestral', () => {
  it('cria conjunto vazio com turma, ano, semestre e destinatários escolhidos', async () => {
    render(<RecuperacaoSemestral {...props} />);
    expect(await screen.findByText(/Nenhum conjunto de recuperação/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Novo conjunto/i }));
    fireEvent.click(screen.getByLabelText('Ana'));
    fireEvent.change(screen.getByLabelText('Semestre da recuperação'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Criar conjunto/i }));

    await waitFor(() => expect(m.criar).toHaveBeenCalledTimes(1));
    expect(m.criar.mock.calls[0][1]).toEqual({
      turmaId: 't1',
      anoLetivo: '2026',
      semestre: '2',
      destinatariosIds: ['a'],
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/Conjunto criado/i);
  });

  it('mostra pontos restantes e impede conferir enquanto a distribuição não fecha 10', async () => {
    m.conjuntos = [conjunto()];
    m.detalhe = conjunto({ atividadeIds: ['r1'] });
    m.atividades = [atividade({ notaMaxima: 4 })];

    render(<RecuperacaoSemestral {...props} />);
    expect(await screen.findByText(/4,00 de 10 pontos distribuídos/i)).toBeInTheDocument();
    expect(screen.getByText(/Restam 6,00 pontos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conferir recuperação/i })).toBeDisabled();
  });

  it('confere sem gravar, mostra pendências e lança apenas alunos completos', async () => {
    m.conjuntos = [conjunto({ estado: 'pronto' })];
    m.detalhe = conjunto({ atividadeIds: ['r1'], estado: 'pronto' });
    m.atividades = [atividade({ notaMaxima: 10 })];
    m.entregas = [
      { id: 'e1', activityId: 'r1', alunoId: 'a', turmaId: 't1', status: 'corrigido', notaFinal: 8 },
    ];
    m.lancar.mockResolvedValue({
      lancados: [{ alunoId: 'a', campo: 'rec1', total: 8 }],
      ignorados: [],
    });

    render(<RecuperacaoSemestral {...props} />);

    fireEvent.click(await screen.findByRole('button', { name: /Conferir recuperação/i }));
    expect(await screen.findByText(/Prévia do lançamento em rec1/i)).toBeInTheDocument();
    expect(props.aguardarSalvamento).toHaveBeenCalled();
    expect(m.lancar).not.toHaveBeenCalled();

    const lancarAna = screen.getByLabelText('Lançar recuperação de Ana');
    const lancarBia = screen.getByLabelText('Lançar recuperação de Bia');
    expect(lancarAna).toBeChecked();
    expect(lancarBia).toBeDisabled();
    expect(screen.getByText(/1 completo\(s\), 1 pendente\(s\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Lançar recuperação$/i }));
    await waitFor(() => expect(m.lancar).toHaveBeenCalledTimes(1));
    expect(m.lancar.mock.calls[0][0]).toMatchObject({
      base: { revision: 4 },
      conjunto: { id: 'c1', versao: 3 },
      previa: { conjuntoId: 'c1' },
      selecionados: ['a'],
      por: 'p',
    });
    expect(props.recarregar).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/Recuperação lançada para 1 aluno/i);
    expect(screen.queryByText(/Prévia do lançamento/i)).not.toBeInTheDocument();
  });
});
