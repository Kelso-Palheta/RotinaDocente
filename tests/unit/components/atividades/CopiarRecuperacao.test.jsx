import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  listar: vi.fn(),
  obter: vi.fn(),
  criar: vi.fn(),
  salvar: vi.fn(),
  fechar: vi.fn(),
}));

vi.mock('@/lib/firebase-recuperacao', () => ({
  listConjuntosRecuperacao: (...args) => m.listar(...args),
  getConjuntoRecuperacao: (...args) => m.obter(...args),
  criarConjuntoRecuperacao: (...args) => m.criar(...args),
}));

vi.mock('@/components/atividades/AtividadeForm', () => ({
  AtividadeForm: ({ conteudoInicial, onCreate, onClose }) => (
    <div role="dialog" aria-label="Formulário de cópia">
      <p>Conteúdo copiado: {conteudoInicial?.titulo}</p>
      <button
        type="button"
        onClick={() => onCreate({
          id: 'atv_copia',
          titulo: conteudoInicial?.titulo,
          turmaIds: ['t2'],
          finalidade: 'recuperacao_semestral',
          conjuntoRecuperacaoId: 'c2',
          conjuntoVersao: 3,
          semestre: '2',
          anoLetivo: '2026',
          destinatariosIds: ['b'],
          notaMaxima: 4,
          dataEntrega: new Date('2099-05-01T23:59:00'),
          questoes: conteudoInicial?.questoes,
        })}
      >
        Salvar revisão
      </button>
      <button type="button" onClick={onClose}>Cancelar revisão</button>
    </div>
  ),
}));

import { CopiarRecuperacaoModal } from '@/components/atividades/CopiarRecuperacaoModal';

const turmaA = { id: 't1', nome: 'Turma A', anoLetivo: 2026, alunos: [{ id: 'a', nome: 'Ana' }] };
const turmaB = { id: 't2', nome: 'Turma B', anoLetivo: 2026, alunos: [{ id: 'b', nome: 'Bia' }, { id: 'c', nome: 'Caio' }] };

const origem = (extra = {}) => ({
  id: 'r1',
  professorId: 'p',
  titulo: 'Recuperação de frações',
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  conjuntoVersao: 2,
  semestre: '1',
  anoLetivo: '2026',
  turmaIds: ['t1'],
  destinatariosIds: ['a'],
  notaMaxima: 4,
  status: 'ativa',
  dataEntrega: new Date('2026-03-01T23:59:00'),
  questoes: [{
    id: 'q1', tipo: 'discursiva', enunciado: 'Explique.', notaMaxima: 4, rubrica: 'Clareza',
    alternativas: [], imagens: [],
  }],
  textosBase: [],
  materiais: [],
  materialApoio: null,
  ...extra,
});

const destino = (extra = {}) => ({
  id: 'c2',
  professorId: 'p',
  turmaId: 't2',
  anoLetivo: '2026',
  semestre: '2',
  destinatariosIds: ['b'],
  atividadeIds: [],
  escalas: {},
  estado: 'rascunho',
  versao: 3,
  ...extra,
});

const props = (extra = {}) => ({
  user: { uid: 'p' },
  origem: origem(),
  turmas: [turmaA, turmaB],
  ano: '2026',
  onClose: m.fechar,
  onSalvar: m.salvar,
  ...extra,
});

beforeEach(() => {
  m.listar.mockReset().mockResolvedValue([destino(), destino({ id: 'c1', turmaId: 't1', destinatariosIds: ['a'] })]);
  m.obter.mockReset().mockImplementation(async (_uid, id) => id === 'c2'
    ? destino()
    : destino({ id, turmaId: 't1', destinatariosIds: ['a'] }));
  m.criar.mockReset().mockResolvedValue(destino({ id: 'c3', versao: 1 }));
  m.salvar.mockReset().mockResolvedValue('atv_copia');
  m.fechar.mockReset();
});

describe('R82-02/R82-07: modal de destino e revisão', () => {
  it('mostra origem, destino, novo prazo, saldo e aviso de liberação ao fechar 10', async () => {
    m.listar.mockResolvedValue([destino({ escalas: { antiga: 6 }, atividadeIds: ['antiga'] })]);

    render(<CopiarRecuperacaoModal {...props()} />);

    const dialog = await screen.findByRole('dialog', { name: /Copiar recuperação/i });
    expect(within(dialog).getByText(/Recuperação de frações/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Turma B/)).toBeInTheDocument();
    expect(within(dialog).getByText(/2º semestre/)).toBeInTheDocument();
    expect(within(dialog).getByText(/2026/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Bia/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Restam 4,00 pontos/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: /Novo prazo/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/fechará 10 pontos e o conjunto será liberado/i)).toBeInTheDocument();
  });

  it('revalida o destino atual e abre o formulário com conteúdo projetado', async () => {
    render(<CopiarRecuperacaoModal {...props()} />);

    fireEvent.click(await screen.findByRole('button', { name: /Revisar conteúdo e prazo/i }));

    expect(await screen.findByRole('dialog', { name: /Formulário de cópia/i })).toBeInTheDocument();
    expect(screen.getByText(/Conteúdo copiado: Recuperação de frações/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Salvar revisão/i })).toHaveFocus());
    expect(m.obter).toHaveBeenCalledWith('p', 'c2');

    fireEvent.click(screen.getByRole('button', { name: /Salvar revisão/i }));

    await waitFor(() => expect(m.salvar).toHaveBeenCalledTimes(1));
    expect(m.salvar.mock.calls[0][0]).toMatchObject({
      id: 'atv_copia',
      conjuntoRecuperacaoId: 'c2',
      turmaIds: ['t2'],
      destinatariosIds: ['b'],
    });
    expect(m.salvar.mock.calls[0][1]).toMatchObject({
      destino: { id: 'c2', versao: 3 },
      turmaDestino: { id: 't2' },
    });
    expect(m.fechar).toHaveBeenCalled();
  });

  it('recusa atividade adaptada com explicação e sem carregar destinos', async () => {
    render(<CopiarRecuperacaoModal {...props({ origem: origem({ alunoExclusivoId: 'a', alunoNome: 'Ana' }) })} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/adaptada individualizada/i);
    expect(m.listar).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Revisar conteúdo e prazo/i })).not.toBeInTheDocument();
  });

  it('explica quando não há destino e permite criar conjunto explicitamente', async () => {
    m.listar.mockResolvedValue([destino({ id: 'c1', turmaId: 't1', destinatariosIds: ['a'] })]);

    render(<CopiarRecuperacaoModal {...props()} />);

    expect(await screen.findByText(/Nenhum conjunto elegível/i)).toBeInTheDocument();
    expect(screen.getByText(/mesma turma da origem/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Criar novo conjunto/i }));

    expect(await screen.findByText(/Novo conjunto de recuperação semestral/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Turma da recuperação')).toHaveFocus());
    fireEvent.click(screen.getByLabelText('Bia'));
    fireEvent.click(screen.getByRole('button', { name: /Criar conjunto/i }));

    await waitFor(() => expect(m.criar).toHaveBeenCalledTimes(1));
    expect(m.criar.mock.calls[0][1]).toMatchObject({
      turmaId: 't2', anoLetivo: '2026', semestre: '1', destinatariosIds: ['b'],
    });
    expect(await screen.findByText(/Turma B/)).toBeInTheDocument();
  });

  it('cancelar depois de criar conjunto não apaga o conjunto criado', async () => {
    m.listar.mockResolvedValue([destino({ id: 'c1', turmaId: 't1', destinatariosIds: ['a'] })]);

    render(<CopiarRecuperacaoModal {...props()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Criar novo conjunto/i }));
    fireEvent.click(await screen.findByLabelText('Bia'));
    fireEvent.click(screen.getByRole('button', { name: /Criar conjunto/i }));
    await waitFor(() => expect(m.criar).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));

    expect(m.fechar).toHaveBeenCalled();
    expect(m.criar).toHaveBeenCalledTimes(1);
    expect(m.listar).toHaveBeenCalled();
  });

  it('mantém foco no diálogo, fecha com Escape e mantém controles alcançáveis', async () => {
    render(<CopiarRecuperacaoModal {...props()} />);

    const dialog = await screen.findByRole('dialog', { name: /Copiar recuperação/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.contains(document.activeElement)).toBe(true);

    const botoes = within(dialog).getAllByRole('button').filter(botao => !botao.disabled);
    botoes.at(-1).focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(botoes[0]);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(m.fechar).toHaveBeenCalled();
  });
});
