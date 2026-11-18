import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';

describe('Aula Gamificada — compatibilidade com projeção aninhada do servidor', () => {
  afterEach(() => {
    cleanup();
  });

  it('normaliza projeção { sala, rodada, eu, participantes, distribuicao, ranking } sem perda de dados', () => {
    const bruto = {
      sala: {
        codigo: 'SRV42',
        titulo: 'Aula de Biologia',
        modalidade: 'equipes',
        fase: 'feedback',
        revision: 4,
        rodada: 1,
        totalRodadas: 3,
        tempoSegundos: 60,
        equipes: [
          { id: 'eq-a', nome: 'Equipe Darwin' },
          { id: 'eq-b', nome: 'Equipe Mendel' },
        ],
      },
      servidorAgora: 1700000000000,
      prazo: 1700000060000,
      aberta: false,
      rodada: {
        numero: 1,
        total: 3,
        id: '1',
        revelado: true,
        questao: {
          id: 'q1',
          tipo: 'multipla_escolha',
          enunciado: 'Quem propôs a seleção natural?',
          alternativas: [
            { id: 'A', texto: 'Charles Darwin' },
            { id: 'B', texto: 'Gregor Mendel' },
          ],
        },
        gabarito: 'A',
        explicacao: 'Darwin publicou A Origem das Espécies em 1859.',
      },
      eu: {
        id: 'al-1',
        nomeExibicao: 'Ana',
        pontos: 1000,
        equipeId: 'eq-a',
        recibo: {
          status: 'confirmado',
          rodadaId: '1',
          pontos: 1000,
          resposta: { alternativaId: 'A' },
        },
      },
      participantes: [
        { id: 'al-1', nomeExibicao: 'Ana', pontos: 1000, equipeId: 'eq-a' },
      ],
      distribuicao: [{ alternativaId: 'A', total: 1 }],
      ranking: [
        { id: 'eq-a', nome: 'Equipe Darwin', pontos: 1000, posicao: 1, empate: false },
      ],
    };

    const normalizado = normalizarEstadoSala(bruto);
    expect(normalizado.codigo).toBe('SRV42');
    expect(normalizado.fase).toBe('feedback');
    expect(normalizado.revelado).toBe(true);
    expect(normalizado.rodada).toBe(1);
    expect(normalizado.equipeAluno?.nome).toBe('Equipe Darwin');
    expect(normalizado.recibo?.pontuacao).toBe(1000);
    expect(normalizado.feedback?.respostaCorreta).toBe('A');
    expect(normalizado.participacao.distribuicao.A).toBe(1);
    expect(normalizado.rankingEquipes[0].nome).toBe('Equipe Darwin');

    render(<SalaAlunoView estado={bruto} conexao="conectado" />);
    expect(screen.getByText(/Darwin publicou A Origem das Espécies/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1000 pts/i)).toBeInTheDocument();
  });

  it('mapeia cartasReveladas e cartasEncontradas do recibo de Memória sobre questao.cartas', () => {
    const brutoMemoria = {
      sala: {
        codigo: 'MEM42',
        titulo: 'Memória de Química',
        modalidade: 'memoria',
        fase: 'pergunta',
        revision: 2,
        rodada: 1,
        totalRodadas: 1,
        tempoSegundos: 90,
      },
      servidorAgora: Date.now(),
      prazo: Date.now() + 90000,
      rodada: {
        numero: 1,
        total: 1,
        questao: {
          id: 'qm1',
          tipo: 'pares',
          enunciado: 'Encontre os pares de elementos.',
          cartas: [
            { id: 'c1', texto: 'Ouro' },
            { id: 'c2', texto: 'Au' },
            { id: 'c3', texto: 'Ferro' },
            { id: 'c4', texto: 'Fe' },
          ],
        },
      },
      eu: {
        id: 'al-1',
        nomeExibicao: 'Ana',
        recibo: {
          status: 'confirmado',
          virarId: 'c3',
          cartasReveladas: ['c3'],
          cartasEncontradas: ['c1', 'c2'],
          completo: false,
        },
      },
    };

    render(<SalaAlunoView estado={brutoMemoria} conexao="conectado" />);
    expect(screen.getByText('Ouro')).toBeInTheDocument();
    expect(screen.getByText('Au')).toBeInTheDocument();
    expect(screen.getByText('Ferro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Carta 4: virada para baixo/i })).toBeInTheDocument();
  });
});
