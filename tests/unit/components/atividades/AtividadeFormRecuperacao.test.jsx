import { render, fireEvent, screen } from '@testing-library/react';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';

const turmas = [{
  id: 't1',
  nome: 'Turma 1',
  alunos: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }],
}];

const contexto = {
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  semestre: '2',
  anoLetivo: '2026',
  turmaId: 't1',
  destinatariosIds: ['a'],
  pontosRestantes: 4,
};

const preencherQuestao = (nota) => {
  fireEvent.click(screen.getByRole('button', { name: /\+ Discursiva/i }));
  fireEvent.change(screen.getByPlaceholderText(/Enunciado da questão/i), { target: { value: 'Explique o conceito.' } });
  fireEvent.change(screen.getByTitle('Nota máxima desta questão'), { target: { value: String(nota) } });
};

describe('R81-09 (RN-81): formulário de atividade de recuperação', () => {
  it('troca o bimestre pelo semestre e informa o orçamento de 10 pontos', () => {
    render(<AtividadeForm turmas={turmas} onCreate={vi.fn()} onClose={vi.fn()} contextoInicial={contexto} />);

    expect(screen.queryByLabelText(/Bimestre/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Semestre/i)).toHaveValue('2');
    expect(screen.getByRole('status').textContent).toMatch(/2º semestre/);
    expect(screen.getByRole('status').textContent).toMatch(/pode valer até 4,00 pontos/);
    expect(screen.queryByText(/Turmas \*/)).not.toBeInTheDocument();
    expect(screen.getByText(/1 aluno em recuperação/)).toBeInTheDocument();
  });

  it('bloqueia atividade acima do saldo restante antes de gravar', () => {
    const onCreate = vi.fn();
    render(<AtividadeForm turmas={turmas} onCreate={onCreate} onClose={vi.fn()} contextoInicial={contexto} />);

    fireEvent.change(screen.getByPlaceholderText(/Redação — A Amazônia/i), { target: { value: 'Recuperação' } });
    preencherQuestao(5);
    fireEvent.click(screen.getByRole('button', { name: /Criar Atividade/i }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText(/Restam 4,00 para distribuir/)).toBeInTheDocument();
  });

  it('envia finalidade, semestre e destinatários, sem bimestre, apenas para os alunos selecionados', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<AtividadeForm turmas={turmas} onCreate={onCreate} onClose={vi.fn()} contextoInicial={contexto} />);

    fireEvent.change(screen.getByPlaceholderText(/Redação — A Amazônia/i), { target: { value: 'Recuperação 2º semestre' } });
    preencherQuestao(3.5);
    fireEvent.click(screen.getByRole('button', { name: /Criar Atividade/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const payload = onCreate.mock.calls[0][0];
    expect(payload).toMatchObject({
      titulo: 'Recuperação 2º semestre',
      finalidade: 'recuperacao_semestral',
      conjuntoRecuperacaoId: 'c1',
      semestre: '2',
      anoLetivo: '2026',
      destinatariosIds: ['a'],
      turmaIds: ['t1'],
      notaMaxima: 3.5,
    });
    expect(payload).not.toHaveProperty('bimestre');
    expect(payload.alunosPorTurma).toEqual({ t1: [{ id: 'a', nome: 'Ana' }] });
  });
});
