import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfirmacaoView } from '@/app/aluno/atividade/[id]/ConfirmacaoView';

afterEach(cleanup);

describe('ConfirmacaoView — sem ação duplicada e sem rolagem artificial', () => {
  it('não repete o botão de voltar (o cabeçalho da atividade já oferece a saída)', () => {
    render(<ConfirmacaoView submittedAt="2026-10-27T12:30:00" />);

    expect(screen.queryByRole('link', { name: /voltar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /voltar/i })).toBeNull();
  });

  it('não ocupa a altura total da tela dentro do container da atividade', () => {
    const { container } = render(<ConfirmacaoView submittedAt="2026-10-27T12:30:00" />);

    expect(container.firstChild.className).not.toMatch(/min-h-screen/);
  });

  it('preserva a data do comprovante', () => {
    render(<ConfirmacaoView submittedAt="2026-10-27T12:30:00" />);

    expect(screen.getByText(/Sua resposta foi enviada em 27\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByText('Entrega recebida!')).toBeInTheDocument();
  });
});
