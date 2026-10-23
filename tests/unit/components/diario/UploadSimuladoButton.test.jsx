import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ImportarSimuladoModal } from '@/components/diario/ImportarSimuladoModal';
import { extrairNotasSimulado } from '@/utils/diario/importarSimuladoIA';

vi.mock('@/utils/diario/importarSimuladoIA', () => ({ extrairNotasSimulado: vi.fn() }));
const turma = { id: 't', nome: '203', alunos: [], bimestres: { '3': { notas: {} } } };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('botão visível abre seletor e apresenta os arquivos escolhidos', () => {
  render(<ImportarSimuladoModal turma={turma} bimestre={3} onConfirm={vi.fn()} onClose={vi.fn()} />);
  const input = screen.getByLabelText('Arquivos com notas do simulado');
  const click = vi.spyOn(input, 'click').mockImplementation(() => {});
  const button = screen.getByRole('button', { name: 'Selecionar arquivo' });
  expect(button).toBeVisible();
  expect(screen.getByRole('button', { name: 'Ler arquivos' })).toBeDisabled();
  fireEvent.click(button);
  expect(click).toHaveBeenCalledTimes(1);
  fireEvent.change(input, { target: { files: [new File(['x'], 'lista.pdf'), new File(['y'], 'foto.png')] } });
  expect(screen.getByText('lista.pdf')).toBeVisible();
  expect(screen.getByText('foto.png')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Ler arquivos' })).toBeEnabled();
});

it('bloqueia selecionar arquivo durante a leitura', async () => {
  let finish;
  vi.mocked(extrairNotasSimulado).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<ImportarSimuladoModal turma={turma} bimestre={3} onConfirm={vi.fn()} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Arquivos com notas do simulado'), { target: { files: [new File(['x'], 'lista.pdf')] } });
  fireEvent.click(screen.getByRole('button', { name: 'Ler arquivos' }));
  expect(screen.getByRole('button', { name: 'Selecionar arquivo' })).toBeDisabled();
  await act(async () => finish([]));
  expect(screen.getByRole('button', { name: 'Selecionar arquivo' })).toBeEnabled();
});
