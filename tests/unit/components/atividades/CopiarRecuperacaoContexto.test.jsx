import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';
const conteudo = { titulo: 'Cópia', questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Explique', notaMaxima: 3, rubrica: '', alternativas: [], imagens: [] }] };
const contexto = { finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c2', conjuntoVersao: 1, semestre: '2', anoLetivo: '2026', turmaId: 't2', destinatariosIds: ['b'], pontosRestantes: 3, prazoInicial: '2027-11-04T23:59' };
function montar(extra = {}) { render(<AtividadeForm turmas={[{ id: 't2', nome: 'B', alunos: [{ id: 'b', nome: 'Bia' }] }]} onCreate={vi.fn()} onClose={vi.fn()} conteudoInicial={conteudo} contextoInicial={{ ...contexto, ...extra }} />); }
it('semestre da cópia é fixo no conjunto e o prazo oferece seletor de data/hora', () => {
  montar();
  expect(screen.getByLabelText(/Semestre/i)).toBeDisabled();
  expect(screen.getByLabelText(/Semestre/i)).toHaveValue('2');
  expect(screen.getByLabelText(/Data de entrega/i)).toHaveAttribute('type', 'datetime-local');
});
it('pontuação revisada que fecha o saldo informa liberação antes de salvar', () => {
  montar();
  expect(screen.getByText(/Esta cópia fechará os 10 pontos.*liberará/i)).toBeInTheDocument();
});
it('prazo de cópia ausente não é substituído por data automática', () => {
  montar({ prazoInicial: '' });
  expect(screen.getByLabelText(/Data de entrega/i)).toHaveValue('');
});
