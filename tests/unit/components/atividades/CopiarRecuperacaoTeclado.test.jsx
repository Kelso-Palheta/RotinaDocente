import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AtividadeForm } from '@/components/atividades/AtividadeForm';
const base = { titulo: 'Cópia', questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Explique', notaMaxima: 4, rubrica: '', alternativas: [], imagens: [] }] };
function montar(onClose = vi.fn()) { render(<AtividadeForm turmas={[{ id: 't2', nome: 'B' }]} conteudoInicial={base} contextoInicial={{ finalidade: 'recuperacao_semestral', semestre: '2', turmaId: 't2', conjuntoRecuperacaoId: 'c2', destinatariosIds: ['b'], prazoInicial: '2027-11-04T23:59' }} onCreate={vi.fn()} onClose={onClose} />); }
it('teclado permanece dentro do diálogo da revisão da cópia', () => {
  montar();
  const dialog = screen.getByRole('dialog', { name: /Copiar atividade de recuperação/i });
  const primeiro = dialog.querySelector('button');
  const ultimo = screen.getByRole('button', { name: 'Criar cópia' });
  ultimo.focus(); fireEvent.keyDown(ultimo, { key: 'Tab' });
  expect(primeiro).toHaveFocus();
  fireEvent.keyDown(primeiro, { key: 'Tab', shiftKey: true });
  expect(ultimo).toHaveFocus();
});
it('Escape não descarta alterações de cópia sem confirmação', () => {
  const fechar = vi.fn();
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
  montar(fechar);
  fireEvent.change(screen.getByDisplayValue('Cópia'), { target: { value: 'Revisada' } });
  fireEvent.keyDown(screen.getByDisplayValue('Revisada'), { key: 'Escape' });
  expect(confirmar).toHaveBeenCalled();
  expect(fechar).not.toHaveBeenCalled();
  confirmar.mockRestore();
});
