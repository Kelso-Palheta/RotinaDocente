import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ModuloAulaGamificada } from '@/components/aula-gamificada/ModuloAulaGamificada';
afterEach(cleanup);
it('docente tem três áreas no mesmo módulo', () => {
  render(<ModuloAulaGamificada />);
  expect(screen.getByRole('heading', { name: 'Aula Gamificada' })).toBeTruthy();
  expect(screen.getByRole('link', { name: /Revisão interativa/ }).getAttribute('href')).toBe('/revisao');
  expect(screen.getByRole('link', { name: /Sala de jogos/ }).getAttribute('href')).toBe('/aula-gamificada/salas');
  expect(screen.getByRole('link', { name: /Revisar sozinho/ }).getAttribute('href')).toBe('/aula-gamificada/revisao-autonoma');
});
it('aluno tem acesso às três áreas sem links de administração docente', () => {
  render(<ModuloAulaGamificada aluno />);
  expect(screen.getByRole('link', { name: /Revisão interativa/ }).getAttribute('href')).toBe('/aluno/revisao');
  expect(screen.getByRole('link', { name: /Sala de jogos/ }).getAttribute('href')).toBe('/aluno/aula-gamificada/salas');
  expect(screen.getByRole('link', { name: /Revisar sozinho/ }).getAttribute('href')).toBe('/aluno/revisar');
});
