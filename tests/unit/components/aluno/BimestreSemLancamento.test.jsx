import React from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import { afterEach, it, expect } from 'vitest';
import { BimestreCard } from '@/components/aluno/BimestreCard';

afterEach(cleanup);

const turma = (notas) => ({ bimestres: { 1: { atividades: [{ id: 'trabalho', nome: 'Trabalho sintético', max: 5 }], notas } } });

it('UT-47 critério sem lançamento não vira zero', () => {
  render(<BimestreCard numero={1} turma={turma({ a: { simulado: 3 } })} alunoId="a" />);
  const linha = screen.getByText('Trabalho sintético').parentElement;
  expect(within(linha).queryByText('0,00')).toBeNull();
  expect(linha).toHaveTextContent('—');
  expect(screen.getByText(/Ainda não publicado/)).toBeInTheDocument();
});

it('UT-47 zero lançado permanece explícito', () => {
  render(<BimestreCard numero={1} turma={turma({ a: { simulado: 0, trabalho: 0 } })} alunoId="a" />);
  const simulado = screen.getByText('Simulado Oficial').parentElement;
  const linha = screen.getByText('Trabalho sintético').parentElement;
  expect(within(simulado).getByText('0,00')).toBeInTheDocument();
  expect(linha).toHaveTextContent('0,00');
  expect(screen.queryByText(/Ainda não publicado/)).toBeNull();
});

it('UT-47 total e fórmula continuam iguais com nota parcial', () => {
  render(<BimestreCard numero={1} turma={turma({ a: { simulado: 3 } })} alunoId="a" />);
  const total = screen.getByText('Total do Bimestre').parentElement;
  expect(total).toHaveTextContent('3,00');
});
