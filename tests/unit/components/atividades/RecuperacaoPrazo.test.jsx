import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  conjuntos: [],
  detalhe: null,
  atividades: [],
  entregas: [],
  turmasBase: [],
}));

vi.mock('@/lib/firebase-recuperacao', () => ({
  listConjuntosRecuperacao: async () => m.conjuntos,
  getConjuntoRecuperacao: async () => m.detalhe,
  criarConjuntoRecuperacao: vi.fn(),
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
    lancar() { return { lancados: [], ignorados: [] }; }
  },
}));

import { RecuperacaoSemestral } from '@/components/atividades/RecuperacaoSemestral';

const turmas = [{ id: 't1', nome: 'Turma 1', alunos: [{ id: 'a', nome: 'Ana' }] }];
const conjunto = (extra = {}) => ({
  id: 'c1',
  professorId: 'p',
  turmaId: 't1',
  anoLetivo: '2026',
  semestre: '1',
  destinatariosIds: ['a'],
  atividadeIds: ['r1'],
  estado: 'pronto',
  versao: 3,
  ...extra,
});
const atividade = (dataEntrega) => ({
  id: 'r1',
  titulo: 'Prazo da recuperação',
  turmaIds: ['t1'],
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  semestre: '1',
  notaMaxima: 10,
  status: 'ativa',
  dataEntrega,
});
const props = {
  user: { uid: 'p' },
  turmas,
  ano: '2026',
  useAtividadesHook: { createAtividade: vi.fn(), deleteAtividade: vi.fn() },
  aguardarSalvamento: vi.fn().mockResolvedValue(undefined),
  recarregar: vi.fn().mockResolvedValue(undefined),
};

const renderizarComPrazo = async (dataEntrega) => {
  m.conjuntos = [conjunto()];
  m.detalhe = conjunto();
  m.atividades = [atividade(dataEntrega)];
  render(<RecuperacaoSemestral {...props} />);
  await screen.findByText('Prazo da recuperação');
  return screen.getByText(/· entrega em /);
};

beforeEach(() => {
  m.conjuntos = [];
  m.detalhe = null;
  m.atividades = [];
  m.entregas = [];
  m.turmasBase = [{ id: 't1', alunos: turmas[0].alunos, recuperacao: {} }];
});

afterEach(cleanup);

describe('H81-04 — prazo da recuperação no cartão do professor', () => {
  it('interpreta texto ISO e mostra o mesmo prazo do Portal', async () => {
    const prazo = await renderizarComPrazo('2099-01-01T12:00:00.000Z');
    expect(prazo).toHaveTextContent(/2099/);
    expect(prazo).not.toHaveTextContent(/data não informada/i);
  });

  it('interpreta Timestamp do Firestore com toDate', async () => {
    const prazo = await renderizarComPrazo({ toDate: () => new Date('2099-02-02T12:00:00.000Z') });
    expect(prazo).toHaveTextContent(/2099/);
    expect(prazo).not.toHaveTextContent(/data não informada/i);
  });

  it('interpreta Date e epoch, sem inventar data para inválido ou ausente', async () => {
    const comDate = await renderizarComPrazo(new Date('2099-03-03T12:00:00.000Z'));
    expect(comDate).toHaveTextContent(/2099/);

    cleanup();
    const comEpoch = await renderizarComPrazo(new Date('2099-04-04T12:00:00.000Z').getTime());
    expect(comEpoch).toHaveTextContent(/2099/);

    cleanup();
    const invalido = await renderizarComPrazo('ontem');
    expect(invalido).toHaveTextContent(/data não informada/i);

    cleanup();
    const ausente = await renderizarComPrazo(undefined);
    expect(ausente).toHaveTextContent(/data não informada/i);
  });
});
