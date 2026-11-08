import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RespostaForm } from '@/app/aluno/atividade/[id]/RespostaForm';

afterEach(cleanup);

const questaoObjetiva = (tipo) => ({
  id: 'q1',
  tipo,
  enunciado: 'Questão sintética objetiva',
  notaMaxima: 2,
  alternativas: [
    { id: 'A', texto: 'Alternativa A' },
    { id: 'B', texto: 'Alternativa B' },
  ],
});

const atividade = (questoes) => ({ id: 'atv', titulo: 'Atividade', notaMaxima: 10, questoes });

describe('RespostaForm — tipos objetivos renderizados como alternativas', () => {
  it.each(['objetiva', 'multipla_escolha'])('%s exibe as alternativas como opções de rádio', (tipo) => {
    render(<RespostaForm atividade={atividade([questaoObjetiva(tipo)])} onSubmit={vi.fn()} loading={false} />);

    const opcoes = screen.getAllByRole('radio');
    expect(opcoes).toHaveLength(2);
    expect(screen.getByLabelText(/Alternativa A/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Alternativa B/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Escreva sua resposta aqui...')).toBeNull();
  });

  it('envia a alternativa marcada de múltipla escolha', () => {
    const onSubmit = vi.fn();
    render(<RespostaForm atividade={atividade([questaoObjetiva('multipla_escolha')])} onSubmit={onSubmit} loading={false} />);

    fireEvent.click(screen.getByLabelText(/Alternativa B/));
    fireEvent.click(screen.getByRole('button', { name: /Enviar Respostas/ }));

    expect(onSubmit).toHaveBeenCalledWith(null, { q1: { tipo: 'multipla_escolha', resposta: 'B' } });
  });
});

describe('RespostaForm — resposta discursiva não vazia', () => {
  const discursiva = { id: 'q1', tipo: 'discursiva', enunciado: 'Em que ano ocorreu o fato?', notaMaxima: 2 };

  it('aceita resposta curta não vazia, como "1922", conforme o servidor', () => {
    const onSubmit = vi.fn();
    render(<RespostaForm atividade={atividade([discursiva])} onSubmit={onSubmit} loading={false} />);

    fireEvent.change(screen.getByPlaceholderText('Escreva sua resposta aqui...'), { target: { value: '1922' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Respostas/ }));

    expect(onSubmit).toHaveBeenCalledWith(null, { q1: { tipo: 'discursiva', resposta: '1922' } });
  });

  it('não libera envio com resposta vazia ou apenas espaços', () => {
    const onSubmit = vi.fn();
    render(<RespostaForm atividade={atividade([discursiva])} onSubmit={onSubmit} loading={false} />);

    const enviar = screen.getByRole('button', { name: /Enviar Respostas/ });
    expect(enviar).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Escreva sua resposta aqui...'), { target: { value: '   ' } });
    expect(enviar).toBeDisabled();
    fireEvent.click(enviar);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('aceita a combinação de objetiva e discursiva curta', () => {
    const onSubmit = vi.fn();
    const questoes = [
      { ...questaoObjetiva('objetiva'), id: 'q1' },
      { ...discursiva, id: 'q2' },
    ];
    render(<RespostaForm atividade={atividade(questoes)} onSubmit={onSubmit} loading={false} />);

    fireEvent.click(screen.getByLabelText(/Alternativa A/));
    fireEvent.change(screen.getByPlaceholderText('Escreva sua resposta aqui...'), { target: { value: '1922' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Respostas/ }));

    expect(onSubmit).toHaveBeenCalledWith(null, {
      q1: { tipo: 'objetiva', resposta: 'A' },
      q2: { tipo: 'discursiva', resposta: '1922' },
    });
  });
});
