import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { PrepararAulao } from '@/components/revisao/PrepararAulao';

afterEach(() => {
  cleanup();
});

const turmasMock = [
  { id: 'turma-3a', nome: '3º Ano A — Ensino Médio' },
  { id: 'turma-3b', nome: '3º Ano B — Ensino Médio' },
  { id: 'turma-ext', nome: 'Turma Extensivo ENEM Noturno' },
];

const questoesMock = [
  {
    id: 'q1-apta',
    ano: 2024,
    aplicacoes: ['regular'],
    tema: 'Arte Contemporânea e Espaço Urbano',
    status: 'revisada',
    apta: true,
  },
  {
    id: 'q2-apta',
    ano: 2023,
    aplicacoes: ['regular', 'reaplicacao'],
    tema: 'Modernismo Brasileiro e Antropofagia',
    status: 'revisada',
    apta: true,
  },
  {
    id: 'q3-inapta',
    ano: 2022,
    aplicacoes: ['ppl'],
    tema: 'Patrimônio Imaterial e Cultura Popular',
    status: 'rascunho',
    apta: false,
  },
];

const selecaoValidaBase = {
  titulo: 'Aulão Especial ENEM Arte 2026',
  turmaIds: ['turma-3a'],
  questaoIds: ['q1-apta', 'q2-apta'],
  duracaoSegundos: 60,
};

describe('PrepararAulao — Seleção, Ordenação, Filtros e Validações', () => {
  it('renderiza título, turmas, questões selecionadas e duração inicial', () => {
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    const inputTitulo = screen.getByLabelText(/título do aulão/i);
    expect(inputTitulo).toHaveValue('Aulão Especial ENEM Arte 2026');

    const inputDuracao = screen.getByLabelText(/duração por questão/i);
    expect(inputDuracao).toHaveValue(60);

    // Turma 3A deve estar marcada
    const checkTurma3A = screen.getByLabelText(/3º Ano A/i);
    expect(checkTurma3A).toBeChecked();

    // Turma 3B não marcada
    const checkTurma3B = screen.getByLabelText(/3º Ano B/i);
    expect(checkTurma3B).not.toBeChecked();

    // Questões selecionadas renderizadas na ordem
    const itensSelecionados = screen.getAllByTestId('item-questao-selecionada');
    expect(itensSelecionados).toHaveLength(2);
    expect(itensSelecionados[0]).toHaveTextContent(/Arte Contemporânea/i);
    expect(itensSelecionados[1]).toHaveTextContent(/Modernismo Brasileiro/i);
  });

  it('notifica onAlterar ao editar título', () => {
    const onAlterar = vi.fn();
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase}
        ocupado={false}
        erro={null}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    const inputTitulo = screen.getByLabelText(/título do aulão/i);
    fireEvent.change(inputTitulo, { target: { value: 'Novo Título' } });

    expect(onAlterar).toHaveBeenCalledWith({
      ...selecaoValidaBase,
      titulo: 'Novo Título',
    });
  });

  it('notifica onAlterar ao alternar seleção de turmas', () => {
    const onAlterar = vi.fn();
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase}
        ocupado={false}
        erro={null}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    const checkTurma3B = screen.getByLabelText(/3º Ano B/i);
    fireEvent.click(checkTurma3B);

    expect(onAlterar).toHaveBeenCalledWith({
      ...selecaoValidaBase,
      turmaIds: ['turma-3a', 'turma-3b'],
    });
  });

  it('adiciona questão apta e bloqueia adição de questão inapta, permitindo inspecionar', () => {
    const onAlterar = vi.fn();
    const onAbrirRevisao = vi.fn();
    const selecaoSemQuestoes = { ...selecaoValidaBase, questaoIds: [] };

    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoSemQuestoes}
        ocupado={false}
        erro={null}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
        onAbrirRevisao={onAbrirRevisao}
      />
    );

    // Questão 1 (apta): botão Adicionar habilitado
    const btnAdicionarQ1 = screen.getByRole('button', { name: /adicionar questão q1-apta/i });
    expect(btnAdicionarQ1).toBeEnabled();
    fireEvent.click(btnAdicionarQ1);

    expect(onAlterar).toHaveBeenCalledWith({
      ...selecaoSemQuestoes,
      questaoIds: ['q1-apta'],
    });

    // Questão 3 (inapta): botão Adicionar desabilitado ou indisponível para inclusão
    const btnAdicionarQ3 = screen.queryByRole('button', { name: /adicionar questão q3-inapta/i });
    if (btnAdicionarQ3) {
      expect(btnAdicionarQ3).toBeDisabled();
    }

    // Questão 3 tem botão para abrir revisão docente
    const btnRevisarQ3 = screen.getByRole('button', { name: /inspecionar questão q3-inapta/i });
    fireEvent.click(btnRevisarQ3);
    expect(onAbrirRevisao).toHaveBeenCalledWith('q3-inapta');
  });

  it('reordena questões selecionadas para cima e para baixo', () => {
    const onAlterar = vi.fn();
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase} // ['q1-apta', 'q2-apta']
        ocupado={false}
        erro={null}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    // Mover q2 para cima
    const btnSubirQ2 = screen.getByRole('button', { name: /mover q2-apta para cima/i });
    fireEvent.click(btnSubirQ2);

    expect(onAlterar).toHaveBeenCalledWith({
      ...selecaoValidaBase,
      questaoIds: ['q2-apta', 'q1-apta'],
    });

    // Mover q1 para baixo
    const btnDescerQ1 = screen.getByRole('button', { name: /mover q1-apta para baixo/i });
    fireEvent.click(btnDescerQ1);

    expect(onAlterar).toHaveBeenCalledWith({
      ...selecaoValidaBase,
      questaoIds: ['q2-apta', 'q1-apta'],
    });
  });

  it('remove questão da seleção', () => {
    const onAlterar = vi.fn();
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase} // ['q1-apta', 'q2-apta']
        ocupado={false}
        erro={null}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    const btnRemoverQ1 = screen.getByRole('button', { name: /remover questão q1-apta/i });
    fireEvent.click(btnRemoverQ1);

    expect(onAlterar).toHaveBeenCalledWith({
      ...selecaoValidaBase,
      questaoIds: ['q2-apta'],
    });
  });

  it('filtros locais de ano e tema não descartam a seleção de questões', () => {
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    // Filtra catálogo por ano 2023
    const inputFiltroAno = screen.getByLabelText(/filtrar por ano/i);
    fireEvent.change(inputFiltroAno, { target: { value: '2023' } });

    // No catálogo de disponíveis, q1 não aparece
    const catalogoDisponiveis = screen.getByTestId('catalogo-questoes-disponiveis');
    expect(catalogoDisponiveis).not.toHaveTextContent(/Arte Contemporânea/i);
    expect(catalogoDisponiveis).toHaveTextContent(/Modernismo Brasileiro/i);

    // Mas a lista de selecionadas continua com as 2 questões intactas!
    const selecionadas = screen.getAllByTestId('item-questao-selecionada');
    expect(selecionadas).toHaveLength(2);
  });

  it('bloqueia criação se ID selecionado for desconhecido ou inapto, informando o motivo', () => {
    const selecaoComInapta = {
      ...selecaoValidaBase,
      questaoIds: ['q1-apta', 'q3-inapta'], // q3-inapta está na seleção!
    };
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoComInapta}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    const btnCriar = screen.getByRole('button', { name: /criar aulão/i });
    expect(btnCriar).toBeDisabled();

    // Mensagem de impedimento explicando o motivo
    expect(screen.getByText(/contém questões não aptas ou não localizadas/i)).toBeInTheDocument();
  });

  it('valida limites de título e duração (10 a 600 segundos)', () => {
    const { rerender } = render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={{ ...selecaoValidaBase, titulo: '' }}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /criar aulão/i })).toBeDisabled();

    // Duração abaixo de 10s
    rerender(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={{ ...selecaoValidaBase, duracaoSegundos: 5 }}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /criar aulão/i })).toBeDisabled();

    // Duração acima de 600s
    rerender(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={{ ...selecaoValidaBase, duracaoSegundos: 601 }}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /criar aulão/i })).toBeDisabled();

    // Sem turmas
    rerender(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={{ ...selecaoValidaBase, turmaIds: [] }}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /criar aulão/i })).toBeDisabled();
  });

  it('quando válida, aciona onCriar com a seleção completa', () => {
    const onCriar = vi.fn();
    render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase}
        ocupado={false}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={onCriar}
        onAbrirRevisao={vi.fn()}
      />
    );

    const btnCriar = screen.getByRole('button', { name: /criar aulão/i });
    expect(btnCriar).toBeEnabled();
    fireEvent.click(btnCriar);

    expect(onCriar).toHaveBeenCalledWith(selecaoValidaBase);
  });

  it('quando ocupado bloqueia controles e quando tem erro exibe role="alert"', () => {
    const { rerender } = render(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase}
        ocupado={true}
        erro={null}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/título do aulão/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /criar aulão/i })).toBeDisabled();

    rerender(
      <PrepararAulao
        turmas={turmasMock}
        questoes={questoesMock}
        selecao={selecaoValidaBase}
        ocupado={false}
        erro="Falha ao criar sala no servidor."
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={vi.fn()}
      />
    );

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(/Falha ao criar sala no servidor/i);
    // Preserva conteúdo preenchido
    expect(screen.getByLabelText(/título do aulão/i)).toHaveValue('Aulão Especial ENEM Arte 2026');
  });
});
