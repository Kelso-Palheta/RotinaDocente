import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  conjuntos: [],
  detalhe: null,
  atividades: [],
  entregas: [],
  criar: vi.fn(),
  cancelar: vi.fn(),
  lancar: vi.fn(),
}));

vi.mock('@/lib/firebase-recuperacao', () => ({
  listConjuntosRecuperacao: async () => m.conjuntos,
  getConjuntoRecuperacao: async () => m.detalhe,
  criarConjuntoRecuperacao: (...args) => m.criar(...args),
  cancelarConjuntoRecuperacao: (...args) => m.cancelar(...args),
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
vi.mock('@/components/atividades/AtividadeForm', () => ({
  AtividadeForm: ({ onCreate }) => (
    <div>
      <p>Formulário de parcela</p>
      <button type="button" onClick={() => onCreate({ titulo: 'Nova parcela', notaMaxima: 4 })}>Salvar parcela de teste</button>
    </div>
  ),
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
  escalas: {},
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

const props = (extra = {}) => ({
  user: { uid: 'p' },
  turmas,
  ano: '2026',
  useAtividadesHook: { createAtividade: vi.fn(), deleteAtividade: vi.fn() },
  aguardarSalvamento: vi.fn().mockResolvedValue(undefined),
  recarregar: vi.fn().mockResolvedValue(undefined),
  ...extra,
});

beforeEach(() => {
  m.conjuntos = [];
  m.detalhe = null;
  m.atividades = [];
  m.entregas = [];
  m.turmasBase = [{ id: 't1', alunos: turmas[0].alunos, recuperacao: {} }];
  m.criar.mockReset().mockResolvedValue(conjunto());
  m.cancelar.mockReset().mockResolvedValue(undefined);
  m.lancar.mockReset();
  vi.clearAllMocks();
});

describe('REV3-R81-02: tela separa montagem de liberação discente', () => {
  it('mostra montagem 4 de 10 e não anuncia disponibilidade', async () => {
    m.conjuntos = [conjunto({ atividadeIds: ['r1'], escalas: { r1: 4 } })];
    m.detalhe = conjunto({ atividadeIds: ['r1'], escalas: { r1: 4 } });
    m.atividades = [atividade({ notaMaxima: 4, status: 'rascunho' })];

    render(<RecuperacaoSemestral {...props()} />);

    expect(await screen.findByText(/Montagem: 4,00 de 10 pontos/i)).toBeInTheDocument();
    expect(screen.getByText(/4,00 de 10 pontos distribuídos/i)).toBeInTheDocument();
    expect(screen.getByText(/Restam 6,00 pontos/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recuperação liberada para os alunos/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conferir recuperação/i })).toBeDisabled();
  });

  it('anuncia a liberação somente quando o conjunto está pronto e completo', async () => {
    const pronto = conjunto({
      atividadeIds: ['r1', 'r2'],
      escalas: { r1: 4, r2: 6 },
      estado: 'pronto',
      liberado: true,
    });
    m.conjuntos = [pronto];
    m.detalhe = pronto;
    m.atividades = [
      atividade({ id: 'r1', titulo: 'Parcela 1', notaMaxima: 4 }),
      atividade({ id: 'r2', titulo: 'Parcela 2', notaMaxima: 6 }),
    ];

    render(<RecuperacaoSemestral {...props()} />);

    expect(await screen.findByText(/Recuperação liberada para os alunos/i)).toBeInTheDocument();
    expect(screen.queryByText(/Montagem:/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conferir recuperação/i })).toBeEnabled();
  });

  it('avisa que a primeira parcela salva segue em montagem, sem liberar o Portal', async () => {
    const useAtividadesHook = {
      createAtividade: vi.fn().mockImplementation(async () => {
        m.atividades = [atividade({ notaMaxima: 4, status: 'rascunho' })];
        return 'r1';
      }),
      deleteAtividade: vi.fn(),
    };
    m.conjuntos = [conjunto()];
    m.detalhe = conjunto();
    m.atividades = [];

    render(<RecuperacaoSemestral {...props({ useAtividadesHook })} />);

    fireEvent.click(await screen.findByRole('button', { name: /Criar primeira atividade/i }));
    fireEvent.click(screen.getByRole('button', { name: /Salvar parcela de teste/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/segue em montagem: 4,00 de 10 pontos/i);
    expect(screen.getByRole('status')).not.toHaveTextContent(/liberadas para os alunos/i);
    expect(useAtividadesHook.createAtividade).toHaveBeenCalledTimes(1);
  });

  it('avisa a liberação quando a última parcela fecha exatamente dez pontos', async () => {
    const useAtividadesHook = {
      createAtividade: vi.fn().mockImplementation(async () => {
        m.atividades = [
          atividade({ id: 'r1', titulo: 'Parcela 1', notaMaxima: 4 }),
          atividade({ id: 'r2', titulo: 'Parcela 2', notaMaxima: 6 }),
        ];
        m.detalhe = conjunto({
          atividadeIds: ['r1', 'r2'],
          escalas: { r1: 4, r2: 6 },
          estado: 'pronto',
          liberado: true,
          versao: 4,
        });
        return 'r2';
      }),
      deleteAtividade: vi.fn(),
    };
    m.conjuntos = [conjunto({ atividadeIds: ['r1'], escalas: { r1: 4 } })];
    m.detalhe = conjunto({ atividadeIds: ['r1'], escalas: { r1: 4 } });
    m.atividades = [atividade({ notaMaxima: 4, status: 'rascunho' })];

    render(<RecuperacaoSemestral {...props({ useAtividadesHook })} />);

    fireEvent.click(await screen.findByRole('button', { name: /Adicionar atividade/i }));
    fireEvent.click(screen.getByRole('button', { name: /Salvar parcela de teste/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/distribuição fechou exatamente 10 pontos e as parcelas foram liberadas/i);
    expect(await screen.findByText(/Recuperação liberada para os alunos/i)).toBeInTheDocument();
  });

  it('cancela somente depois da confirmação e preserva o aviso de entregas existentes', async () => {
    m.conjuntos = [conjunto({ atividadeIds: ['r1'], escalas: { r1: 4 } })];
    m.detalhe = conjunto({ atividadeIds: ['r1'], escalas: { r1: 4 } });
    m.atividades = [atividade({ notaMaxima: 4, status: 'rascunho' })];
    m.cancelar.mockImplementation(async () => {
      m.detalhe = { ...m.detalhe, estado: 'cancelado', versao: 4 };
    });

    render(<RecuperacaoSemestral {...props()} />);

    fireEvent.click(await screen.findByRole('button', { name: /Cancelar conjunto/i }));
    expect(m.cancelar).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog', { name: /Confirmar cancelamento do conjunto/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar cancelamento/i }));

    await waitFor(() => expect(m.cancelar).toHaveBeenCalledWith('p', 'c1'));
    expect(await screen.findByRole('status')).toHaveTextContent(/Conjunto cancelado/i);
    expect(await screen.findByText('Conjunto cancelado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Adicionar atividade|Criar primeira atividade/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conferir recuperação/i })).toBeDisabled();
  });
});
