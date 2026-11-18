import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('@/components/aula-gamificada/jogos/ControladorAudioJogo', () => ({
  default: () => null,
  usePreferenciaMovimentoReduzido: () => [true, vi.fn()],
}));
import JogoHerois from '@/components/aula-gamificada/jogos/JogoHerois';
import JogoTabuleiro from '@/components/aula-gamificada/jogos/JogoTabuleiro';
afterEach(cleanup);
it.each([JogoHerois, JogoTabuleiro])('identifica a alternativa pela letra quando o banco usa ID interno', Jogo => {
  const questao = { id: 'q', enunciado: 'Qual transformação?', alternativas: [{ id: 'alt-1', texto: 'Evaporação' }] };
  render(<Jogo questao={questao} estado={{ equipes: [{ id: 'azul', nome: 'Azul' }], equipeAluno: { id: 'azul' }, tabuleiroEstado: { equipeDaVezId: 'azul' } }} />);
  expect(screen.getByRole('button', { name: /^A\s+Evaporação$/ })).toBeInTheDocument();
});
