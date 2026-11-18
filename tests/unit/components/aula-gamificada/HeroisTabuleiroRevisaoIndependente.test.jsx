// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ estado: null }));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { uid: 'prof' }, loading: false }) }));
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'prof', getIdToken: async () => 'token' } } }));
vi.mock('@/components/aula-gamificada/useSalaGamificada', () => ({
  useCronometroServidor: () => 60,
  useSalaGamificada: () => ({ estado: mocks.estado, conexao: 'conectado', ocupado: false, reconectar: vi.fn(), enviarComando: vi.fn() }),
}));
import JogoHerois from '@/components/aula-gamificada/jogos/JogoHerois';
import JogoTabuleiro from '@/components/aula-gamificada/jogos/JogoTabuleiro';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';
import { SalaDocenteView } from '@/components/aula-gamificada/SalaDocenteView';
const questao = { id: 'q', enunciado: 'Qual é a transformação?', alternativas: [
  { id: 'A', texto: 'Evaporação' }, { id: 'B', texto: 'Condensação' },
] };
const estado = modalidade => ({
  codigo: 'TEST42', modalidade, fase: 'pergunta', rodada: 1, totalRodadas: 2,
  revision: 2, questao, servidorAgora: 1000, prazo: 61000,
  equipes: [{ id: 'azul', nome: 'Azul' }, { id: 'verde', nome: 'Verde' }],
  equipeAluno: { id: 'azul', nome: 'Azul' },
  tabuleiroEstado: { totalCasas: 12, equipeDaVezId: 'azul', posicoesPorEquipe: { azul: 0, verde: 0 } },
});
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each(['herois', 'tabuleiro'])('%s bloqueia envio quando a sala está desconectada', modalidade => {
  render(<SalaAlunoView estado={estado(modalidade)} conexao="desconectado" onResponder={vi.fn()} />);
  expect(screen.getByRole('button', { name: /Evaporação/ })).toBeDisabled();
});

it('Heróis fornece requestId estável ao repetir o envio da mesma tentativa pendente', () => {
  const enviar = vi.fn(async () => null);
  render(<JogoHerois questao={questao} onResponder={enviar} />);
  fireEvent.click(screen.getByRole('button', { name: /Evaporação/ }));
  fireEvent.click(screen.getByRole('button', { name: /Evaporação/ }));
  expect(enviar.mock.calls[0][1]).toEqual(expect.any(String));
  expect(enviar.mock.calls[1][1]).toBe(enviar.mock.calls[0][1]);
});

it('Tabuleiro usa imagem estática para cartas quando movimento reduzido está ativo', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const dados = estado('tabuleiro');
  dados.tabuleiroEstado.ultimaCarta = { tipo: 'avance_1', titulo: 'Avance uma casa', equipeNome: 'Azul' };
  const { container } = render(<JogoTabuleiro estado={dados} />);
  expect(container.querySelector('img[src$=".gif"]')).toBeNull();
});

it.each(['herois', 'tabuleiro'])('%s mostra explicação pedagógica no telão após revelar', modalidade => {
  mocks.estado = { ...estado(modalidade), fase: 'feedback', revelado: true,
    feedback: { respostaCorreta: 'A', explicacao: 'O calor transforma água líquida em vapor.' } };
  render(<SalaDocenteView codigo="TEST42" projecao />);
  expect(screen.getByText('O calor transforma água líquida em vapor.')).toBeInTheDocument();
});
