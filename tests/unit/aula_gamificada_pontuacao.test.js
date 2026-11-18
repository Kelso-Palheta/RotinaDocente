import { describe, expect, it } from 'vitest';
import {
  PONTOS_POR_DESAFIO,
  pontuarResposta,
  pontuarMemoria,
  calcularRanking,
} from '@/dominio/aula-gamificada/pontuacao';

const questaoPares = {
  tipo: 'pares',
  pares: [
    { id: 'p1', esquerda: { id: 'e1', texto: 'A' }, direita: { id: 'd1', texto: '1' } },
    { id: 'p2', esquerda: { id: 'e2', texto: 'B' }, direita: { id: 'd2', texto: '2' } },
    { id: 'p3', esquerda: { id: 'e3', texto: 'C' }, direita: { id: 'd3', texto: '3' } },
    { id: 'p4', esquerda: { id: 'e4', texto: 'D' }, direita: { id: 'd4', texto: '4' } },
  ],
  respostaCorreta: [
    { esquerdaId: 'e1', direitaId: 'd1' },
    { esquerdaId: 'e2', direitaId: 'd2' },
    { esquerdaId: 'e3', direitaId: 'd3' },
    { esquerdaId: 'e4', direitaId: 'd4' },
  ],
};

describe('pontuação — quiz', () => {
  it('marca 1000 por acerto e 0 por erro, sem bônus de tempo', () => {
    const q = { tipo: 'multipla_escolha', alternativas: [{ id: 'A' }, { id: 'B' }], respostaCorreta: 'B' };

    expect(pontuarResposta(q, { alternativaId: 'B' })).toBe(PONTOS_POR_DESAFIO);
    expect(pontuarResposta(q, { alternativaId: 'A' })).toBe(0);
  });
});

describe('pontuação — proporcional', () => {
  it('associação e memória usam a proporção de pares corretos, arredondada', () => {
    expect(
      pontuarResposta(questaoPares, {
        pares: [
          { esquerdaId: 'e1', direitaId: 'd1' },
          { esquerdaId: 'e2', direitaId: 'd3' },
          { esquerdaId: 'e3', direitaId: 'd2' },
          { esquerdaId: 'e4', direitaId: 'd4' },
        ],
      }),
    ).toBe(500);

    expect(pontuarResposta(questaoPares, { pares: [{ esquerdaId: 'e1', direitaId: 'd1' }] })).toBe(250);
    expect(pontuarMemoria(questaoPares, ['p1', 'p2', 'p3'])).toBe(750);
    expect(pontuarMemoria(questaoPares, [])).toBe(0);
  });

  it('ordenação usa a proporção de posições corretas', () => {
    const q = {
      tipo: 'ordenacao',
      itens: ['i1', 'i2', 'i3', 'i4'].map((id) => ({ id, texto: id })),
      respostaCorreta: ['i1', 'i2', 'i3', 'i4'],
    };

    expect(pontuarResposta(q, { ordem: ['i2', 'i1', 'i3', 'i4'] })).toBe(500);
    expect(pontuarResposta(q, { ordem: ['i1', 'i2', 'i3', 'i4'] })).toBe(1000);
    expect(pontuarResposta(q, { ordem: ['i4', 'i3', 'i2', 'i1'] })).toBe(0);
  });
});

describe('ranking', () => {
  it('preserva empates com posições compartilhadas e salta a posição seguinte', () => {
    const ranking = calcularRanking([
      { id: 'a', nomeExibicao: 'Ana', pontos: 1000 },
      { id: 'b', nomeExibicao: 'Bia', pontos: 1000 },
      { id: 'c', nomeExibicao: 'Caio', pontos: 500 },
      { id: 'd', nomeExibicao: 'Duda', pontos: 0 },
    ]);

    expect(ranking.map((r) => [r.id, r.posicao, r.empate])).toEqual([
      ['a', 1, true],
      ['b', 1, true],
      ['c', 3, false],
      ['d', 4, false],
    ]);
  });

  it('equipes somam os pontos dos membros e preservam empate', () => {
    const equipes = [
      { id: 'azul', nome: 'Azul', participanteIds: ['a', 'b'] },
      { id: 'verde', nome: 'Verde', participanteIds: ['c', 'd'] },
    ];
    const ranking = calcularRanking(
      [
        { id: 'a', nomeExibicao: 'Ana', pontos: 1000, equipeId: 'azul' },
        { id: 'b', nomeExibicao: 'Bia', pontos: 0, equipeId: 'azul' },
        { id: 'c', nomeExibicao: 'Caio', pontos: 500, equipeId: 'verde' },
        { id: 'd', nomeExibicao: 'Duda', pontos: 500, equipeId: 'verde' },
      ],
      { modalidade: 'equipes', equipes },
    );

    expect(ranking).toEqual([
      { id: 'azul', nome: 'Azul', pontos: 1000, posicao: 1, empate: true },
      { id: 'verde', nome: 'Verde', pontos: 1000, posicao: 1, empate: true },
    ]);
  });
});
