/**
 * Testes Unitários de Regras de Negócio — Grade ENEM
 * Referência: specs/RULES.md (RN-05) e specs/TESTS_SPEC.md (UT-06, UT-07)
 */

import { describe, it, expect } from 'vitest';
import {
  PONTUACOES_VALIDAS_COMPETENCIA,
  validarPontuacaoCompetencia,
  calcularNotaTotalEnem,
} from '../../frontend/src/dominio/redacao/enemScoreValidator';

describe('UT-06 (RN-05): Validação de pontuações de competências ENEM', () => {
  it('deve validar que toda pontuação é múltiplo de 40 no intervalo [0, 200]', () => {
    expect(PONTUACOES_VALIDAS_COMPETENCIA).toEqual([0, 40, 80, 120, 160, 200]);

    // Casos válidos
    [0, 40, 80, 120, 160, 200].forEach((nota) => {
      expect(validarPontuacaoCompetencia(nota)).toBe(true);
    });

    // Casos inválidos
    [-1, -40, 30, 50, 75, 100, 150, 180, 210, 240, null, undefined, '80', NaN].forEach((invalido) => {
      expect(validarPontuacaoCompetencia(invalido)).toBe(false);
    });
  });
});

describe('UT-07 (RN-05): Cálculo de nota total como somatório estrito de C1..C5', () => {
  it('deve calcular a nota total como soma estrita de C1 a C5 (0 a 1000)', () => {
    const total1 = calcularNotaTotalEnem({ c1: 200, c2: 200, c3: 200, c4: 200, c5: 200 });
    expect(total1).toBe(1000);

    const total2 = calcularNotaTotalEnem({ c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 });
    expect(total2).toBe(0);

    const total3 = calcularNotaTotalEnem({ c1: 160, c2: 120, c3: 160, c4: 120, c5: 160 });
    expect(total3).toBe(720);
  });

  it('deve lançar erro se alguma competência tiver valor fora da grade oficial', () => {
    expect(() =>
      calcularNotaTotalEnem({ c1: 200, c2: 150, c3: 200, c4: 200, c5: 200 })
    ).toThrow(/competência/i);

    expect(() =>
      calcularNotaTotalEnem({ c1: 200, c2: 200, c3: 200, c4: 200 })
    ).toThrow(/competência/i);
  });
});
