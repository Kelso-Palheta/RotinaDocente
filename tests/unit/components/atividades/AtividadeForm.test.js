// tests/unit/components/atividades/AtividadeForm.test.js
import { render, fireEvent, screen } from '@testing-library/react';
import AtividadeForm from '@/components/atividades/AtividadeForm';

describe('AtividadeForm - edição de dataEntrega', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();

  const defaultProps = {
    turmas: [{ id: 't1', nome: 'Turma 1' }],
    onCreate: mockCreate,
    onUpdate: mockUpdate,
    onClose: vi.fn(),
    initialData: {
      id: 'atividade-123',
      titulo: 'Atividade Teste',
      bimestre: '1',
      turmas: ['t1'],
      dataEntrega: new Date('2024-12-01'),
      questoes: [],
      textosBase: [],
      materiais: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deve chamar onUpdate ao alterar apenas dataEntrega', async () => {
    render(<AtividadeForm {...defaultProps} />);

    // altera a data de entrega
    const dateInput = screen.getByLabelText(/Data de entrega/i);
    fireEvent.change(dateInput, { target: { value: '2024-12-15' } });

    // submete o formulário
    const salvarBtn = screen.getByRole('button', { name: /Salvar/i });
    fireEvent.click(salvarBtn);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const [idChamado, payload] = mockUpdate.mock.calls[0];
    expect(idChamado).toBe('atividade-123');
    expect(new Date(payload.dataEntrega)).toEqual(new Date('2024-12-15'));
    // verifica que outros campos permanecem iguais ao inicial
    expect(payload.titulo).toBe(defaultProps.initialData.titulo);
    expect(payload.bimestre).toBe(defaultProps.initialData.bimestre);
    expect(payload.turmas).toEqual(defaultProps.initialData.turmas);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('não deve chamar onCreate ao editar atividade existente', async () => {
    render(<AtividadeForm {...defaultProps} />);
    const salvarBtn = screen.getByRole('button', { name: /Salvar/i });
    fireEvent.click(salvarBtn);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  test('não deve atualizar se título estiver vazio', async () => {
    const propsComTituloVazio = {
      ...defaultProps,
      initialData: { ...defaultProps.initialData, titulo: '' },
    };
    render(<AtividadeForm {...propsComTituloVazio} />);
    const salvarBtn = screen.getByRole('button', { name: /Salvar/i });
    fireEvent.click(salvarBtn);
    // validação impede chamada a update ou create
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    // deve aparecer mensagem de erro (ex.: "Título obrigatório")
    expect(screen.getByText(/título.*obrigatório/i)).toBeInTheDocument();
  });
});
