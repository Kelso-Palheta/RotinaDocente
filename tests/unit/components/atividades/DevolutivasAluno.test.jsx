import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { DevolutivasAluno } from '@/components/aluno/DevolutivasAluno';

it('exibe feedback geral e de cada questão no Portal sem depender de token', () => {
  render(<DevolutivasAluno historico={[{atividadeId:'a',titulo:'Artes',bimestre:3,feedback:'Comentário geral',questoes:[{numero:1,resposta:'Resposta enviada',feedback:'Reveja a perspectiva',nota:0,notaMaxima:1}]}]} />);
  expect(screen.getByText('Comentário geral')).toBeInTheDocument();
  expect(screen.getByText('Reveja a perspectiva')).toBeInTheDocument();
  expect(screen.getByText(/Resposta enviada/)).toBeInTheDocument();
});
