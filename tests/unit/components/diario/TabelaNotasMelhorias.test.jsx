import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({ collection: vi.fn(), query: vi.fn(), where: vi.fn(), getDocs: vi.fn(async () => ({ forEach() {} })) }));
vi.mock('@/lib/diario/fichaAlunoExport', () => ({ generateFichaAluno360PDF: vi.fn() }));
import { TabelaNotas } from '@/components/diario/TabelaNotas';
const turma = { id: 't', nome: '202', alunos: [{ id: 'a', nome: 'Ana Lima' }, { id: 'b', nome: 'Bia Santos' }], bimestres: { '1': { config: {}, atividades: [], notas: { a: { simulado: 2 } } } } };
const props = () => ({ turma, bimestre: 1, onSetNota: vi.fn(), onAddAtv: vi.fn(), onRemoveAtv: vi.fn(), onUpdateConfig: vi.fn(), onImportarSimulado: vi.fn() });
it('busca e filtra pendências sem depender da ordem dos nomes', () => {
  render(<TabelaNotas {...props()} />);
  fireEvent.change(screen.getByLabelText('Buscar aluno'), { target: { value: 'Bia' } });
  expect(screen.queryByText('Ana Lima')).toBeNull();
  expect(screen.getByText('Bia Santos')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Buscar aluno'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Filtrar notas'), { target: { value: 'pendentes' } });
  expect(screen.queryByText('Ana Lima')).toBeNull();
});
it('critério inválido não é salvo e prévia exige confirmação explícita', () => {
  const p = props(); render(<TabelaNotas {...p} />);
  fireEvent.click(screen.getByRole('button', { name: /Critérios/ }));
  fireEvent.change(screen.getByLabelText('Simulado Máx (Lançamento)'), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Conferir critérios' }));
  expect(p.onUpdateConfig).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(/maior que zero/);
  fireEvent.change(screen.getByLabelText('Simulado Máx (Lançamento)'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Conferir critérios' }));
  expect(screen.getByRole('button', { name: 'Aplicar critérios' })).toBeInTheDocument();
  expect(p.onUpdateConfig).not.toHaveBeenCalled();
});
it('colagem mostra correspondência antes de aplicar somente prontos', () => {
  const p = props(); render(<TabelaNotas {...p} />);
  fireEvent.click(screen.getByRole('button', { name: 'Colar notas do simulado' }));
  fireEvent.change(screen.getByLabelText('Nomes e notas'), { target: { value: 'Bia Santos\t4,5\nAna Lima\t3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Conferir colagem' }));
  expect(p.onImportarSimulado).not.toHaveBeenCalled();
  expect(screen.getByText(/nota existente/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Aplicar 1 nota/ }));
  expect(p.onImportarSimulado).toHaveBeenCalledWith('t', 1, [{ nome: 'Bia Santos', nota: 4.5 }]);
});
it('menu textual abre linha do tempo e prévia familiar antes da exportação', () => {
  render(<TabelaNotas {...props()} />);
  const row = screen.getByText('Ana Lima').closest('tr');
  fireEvent.click(within(row).getByText('Relatório e perfil do aluno'));
  expect(screen.getByRole('region', { name: 'Perfil e linha do tempo do aluno' })).toBeInTheDocument();
  expect(screen.getByLabelText('Privacidade da linha do tempo')).toHaveValue('familia');
});
it('editar cadastro mostra nome e nascimento antes de salvar', () => {
  const p = { ...props(), onUpdateAluno: vi.fn() }; render(<TabelaNotas {...p} />);
  const linha = within(screen.getByText('Ana Lima').closest('tr'));
  fireEvent.click(linha.getByText('Ações do aluno'));
  fireEvent.click(linha.getByRole('button', { name: 'Editar cadastro' }));
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Maria Lima' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar cadastro' }));
  expect(p.onUpdateAluno).toHaveBeenCalledWith('t', 'a', { nome: 'Ana Maria Lima', dataNascimento: '' });
});
