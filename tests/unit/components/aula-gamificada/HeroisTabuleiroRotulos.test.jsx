import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('@/components/aula-gamificada/jogos/ControladorAudioJogo', () => ({
  default: () => null,
  usePreferenciaMovimentoReduzido: () => [true, vi.fn()],
}));
import JogoHerois from '@/components/aula-gamificada/jogos/JogoHerois';
import JogoTabuleiro from '@/components/aula-gamificada/jogos/JogoTabuleiro';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';
afterEach(cleanup);
it.each([JogoHerois, JogoTabuleiro])('identifica a alternativa pela letra quando o banco usa ID interno', Jogo => {
  const questao = { id: 'q', enunciado: 'Qual transformação?', alternativas: [{ id: 'alt-1', texto: 'Evaporação' }] };
  render(<Jogo questao={questao} estado={{ equipes: [{ id: 'azul', nome: 'Azul' }], equipeAluno: { id: 'azul' }, tabuleiroEstado: { equipeDaVezId: 'azul' } }} />);
  expect(screen.getByRole('button', { name: /^A\s+Evaporação$/ })).toBeInTheDocument();
});

it('apresenta o ranking recebido do Tabuleiro como classificação de equipes', () => {
  const ranking = [{ id: 'azul', nome: 'Equipe Azul', pontos: 1000, posicaoTabuleiro: 2, posicao: 1 }];
  const estado = normalizarEstadoSala({ sala: { modalidade: 'tabuleiro', fase: 'ranking' }, ranking });
  expect(estado.rankingEquipes).toEqual(ranking);
  expect(estado.ranking).toEqual([]);
});

it('mostra a casa alcançada no placar do Tabuleiro', () => {
  render(<SalaAlunoView estado={{ sala: { codigo: 'TEST42', modalidade: 'tabuleiro', fase: 'ranking' }, ranking: [{ id: 'azul', nome: 'Equipe Azul', pontos: 1000, posicaoTabuleiro: 2, posicao: 1 }] }} />);
  expect(screen.getByText(/Casa 2/)).toBeInTheDocument();
});
