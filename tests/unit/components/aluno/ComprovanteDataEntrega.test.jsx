import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, it, expect } from 'vitest';
import { ConfirmacaoView } from '@/app/aluno/atividade/[id]/ConfirmacaoView';

afterEach(cleanup);

it('UT-45 apresenta a data serializada da entrega', () => {
  render(<ConfirmacaoView submittedAt="2026-10-27T12:30:00" />);
  expect(screen.getByText(/27\/10\/2026/)).toBeInTheDocument();
  expect(screen.getByText(/12:30/)).toBeInTheDocument();
});

it('UT-45 declara indisponibilidade em vez de usar a data atual', () => {
  render(<ConfirmacaoView submittedAt={undefined} />);
  expect(screen.getByText(/Data de entrega indisponível/)).toBeInTheDocument();
  expect(screen.queryByText(/Sua resposta foi enviada em \d{2}\/\d{2}\/\d{4}/)).toBeNull();
});

it('UT-45 aceita timestamp em segundos sem perder o instante', () => {
  render(<ConfirmacaoView submittedAt={{ seconds: Math.floor(new Date('2026-10-27T12:30:00').getTime() / 1000) }} />);
  expect(screen.getByText(/27\/10\/2026/)).toBeInTheDocument();
});
