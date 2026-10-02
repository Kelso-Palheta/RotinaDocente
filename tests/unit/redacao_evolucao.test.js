/**
 * Teste Unitário — Evolução Longitudinal de Redação ENEM
 * Referência: specs/RULES.md (RN-52) e specs/TESTS_SPEC.md (UT-26)
 */

import { describe, test, expect } from 'vitest';
import { calcularEvolucaoCompetencias } from '../../frontend/src/dominio/redacao/diagnosticoEvolucao';

describe('UT-26 (RN-52): Diagnóstico Longitudinal de Competências ENEM', () => {
  test('deve calcular médias de C1 a C5 e identificar a competência prioritária (menor média)', () => {
    const historico = [
      {
        id: 'red-1',
        data: '2026-03-01',
        c1: 120,
        c2: 160,
        c3: 120,
        c4: 160,
        c5: 80, // Menor nesta redação
        total: 640
      },
      {
        id: 'red-2',
        data: '2026-03-15',
        c1: 160,
        c2: 160,
        c3: 120,
        c4: 160,
        c5: 120,
        total: 720
      }
    ];

    const resultado = calcularEvolucaoCompetencias(historico);

    expect(resultado.totalRedacoes).toBe(2);
    expect(resultado.medias).toEqual({
      c1: 140,
      c2: 160,
      c3: 120,
      c4: 160,
      c5: 100 // Menor média geral: 100
    });
    expect(resultado.competenciaAlvo).toBe('c5');
    expect(resultado.mediaGeralTotal).toBe(680);
  });

  test('deve suportar formato aninhado em "competencias" ou "scores"', () => {
    const historico = [
      {
        id: 'red-1',
        competencias: { c1: 160, c2: 120, c3: 160, c4: 160, c5: 160 },
        total: 760
      },
      {
        id: 'red-2',
        scores: { c1: 200, c2: 120, c3: 160, c4: 160, c5: 200 },
        total: 840
      }
    ];

    const resultado = calcularEvolucaoCompetencias(historico);

    expect(resultado.medias.c2).toBe(120);
    expect(resultado.competenciaAlvo).toBe('c2');
  });

  test('deve detectar tendência "ascendente", "descendente" e "estável"', () => {
    // Evolução ascendente (+120 pontos)
    const histAscendente = [
      { c1: 120, c2: 120, c3: 120, c4: 120, c5: 120, total: 600 },
      { c1: 160, c2: 120, c3: 160, c4: 160, c5: 120, total: 720 }
    ];
    expect(calcularEvolucaoCompetencias(histAscendente).tendencia).toBe('ascendente');

    // Evolução descendente (-120 pontos)
    const histDescendente = [
      { c1: 160, c2: 160, c3: 160, c4: 160, c5: 160, total: 800 },
      { c1: 120, c2: 120, c3: 160, c4: 160, c5: 120, total: 680 }
    ];
    expect(calcularEvolucaoCompetencias(histDescendente).tendencia).toBe('descendente');

    // Estável (variação insignificante)
    const histEstavel = [
      { c1: 160, c2: 160, c3: 160, c4: 160, c5: 160, total: 800 },
      { c1: 160, c2: 160, c3: 160, c4: 160, c5: 160, total: 800 }
    ];
    expect(calcularEvolucaoCompetencias(histEstavel).tendencia).toBe('estável');
  });

  test('deve tratar histórico com menos de 2 redações ou dados vazios com segurança', () => {
    const vazio = calcularEvolucaoCompetencias([]);
    expect(vazio.totalRedacoes).toBe(0);
    expect(vazio.competenciaAlvo).toBeNull();
    expect(vazio.tendencia).toBe('insuficiente');
    expect(vazio.mediaGeralTotal).toBe(0);

    const umaRedacao = calcularEvolucaoCompetencias([
      { c1: 160, c2: 160, c3: 160, c4: 160, c5: 160, total: 800 }
    ]);
    expect(umaRedacao.totalRedacoes).toBe(1);
    expect(umaRedacao.tendencia).toBe('insuficiente');
    expect(umaRedacao.competenciaAlvo).toBe('c1'); // Menor (empate, primeira)
  });
});
