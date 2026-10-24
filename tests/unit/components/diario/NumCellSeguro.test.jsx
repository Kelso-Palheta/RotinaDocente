import { render, screen, fireEvent } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import { NumCell } from '@/components/diario/NumCell';

it('rejeita nota inválida sem trocar por nota truncada', () => {
  const onChange = vi.fn();
  render(<NumCell value={2} max={5} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button'));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '8abc' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(/número/i);
});
it('Esc cancela sem commit e Enter avança para próxima célula', () => {
  const onChange = vi.fn();
  const { container } = render(<div><NumCell value={2} max={5} onChange={onChange} /><NumCell value={3} max={5} onChange={onChange} /></div>);
  fireEvent.click(screen.getAllByRole('button')[0]);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '4' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button')[0]);
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(onChange).toHaveBeenCalledWith(2);
  expect(container.querySelectorAll('[data-nota-cell]')[1]).toHaveFocus();
});
it('Esc devolve foco à célula e Tab na última célula sai da grade', () => {
  const { container } = render(<div><NumCell value={2} max={5} onChange={() => {}} /><button>Depois da grade</button></div>);
  fireEvent.click(screen.getByRole('button', { name: 'Nota: 2,00' }));
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
  expect(container.querySelector('[data-nota-cell]')).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Nota: 2,00' }));
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Depois da grade' })).toHaveFocus();
});
