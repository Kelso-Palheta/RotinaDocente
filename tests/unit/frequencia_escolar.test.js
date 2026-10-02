/**
 * Teste Unitário — Frequência Escolar & Alerta Legal de Infrequência (LDB Art. 24)
 * Referência: specs/RULES.md (RN-54) e specs/TESTS_SPEC.md (UT-28)
 */

import { describe, test, expect } from 'vitest';
import {
  calcularFrequencia,
  classificarRiscoInfrequencia,
  marcarPresencaTodos
} from '../../frontend/src/dominio/diario/frequenciaEscolar';

describe('UT-28 (RN-54): Frequência Escolar e Classificação Legal de Infrequência', () => {
  test('deve calcular percentual de frequência arredondado com precisão', () => {
    // 80 presenças em 100 aulas = 80%
    expect(calcularFrequencia(80, 100)).toBe(80);

    // 19 presenças em 23 aulas = 82.61%
    expect(calcularFrequencia(19, 23)).toBe(82.61);

    // Casos de borda
    expect(calcularFrequencia(0, 50)).toBe(0);
    expect(calcularFrequencia(50, 50)).toBe(100);
    expect(calcularFrequencia(0, 0)).toBe(100); // Início de semestre sem aulas computadas
  });

  test('deve classificar o risco de infrequência conforme o Art. 24 da LDB', () => {
    // Faltas < 20% (Presença > 80%) -> regular
    expect(classificarRiscoInfrequencia(100)).toBe('regular');
    expect(classificarRiscoInfrequencia(85)).toBe('regular');
    expect(classificarRiscoInfrequencia(80.5)).toBe('regular');

    // 20% <= Faltas < 25% (75% <= Presença <= 80%) -> alerta (risco iminente)
    expect(classificarRiscoInfrequencia(80)).toBe('alerta');
    expect(classificarRiscoInfrequencia(76)).toBe('alerta');
    expect(classificarRiscoInfrequencia(75.1)).toBe('alerta');

    // Faltas >= 25% (Presença <= 75%) -> critico (reprovação legal)
    expect(classificarRiscoInfrequencia(75)).toBe('critico');
    expect(classificarRiscoInfrequencia(70)).toBe('critico');
    expect(classificarRiscoInfrequencia(50)).toBe('critico');
    expect(classificarRiscoInfrequencia(0)).toBe('critico');
  });

  test('deve gerar marcação de presença em lote para chamada rápida', () => {
    const alunos = [
      { id: 'aluno-1', nome: 'Ana Clara' },
      { id: 'aluno-2', nome: 'Bruno Silva' },
      { id: 'aluno-3', nome: 'Carla Souza' }
    ];

    const mapaPresentes = marcarPresencaTodos(alunos, 'presente');
    expect(mapaPresentes).toEqual({
      'aluno-1': 'presente',
      'aluno-2': 'presente',
      'aluno-3': 'presente'
    });

    const mapaFaltas = marcarPresencaTodos(alunos, 'ausente');
    expect(mapaFaltas).toEqual({
      'aluno-1': 'ausente',
      'aluno-2': 'ausente',
      'aluno-3': 'ausente'
    });
  });

  test('deve lidar com listas vazias ou inválidas na marcação em lote', () => {
    expect(marcarPresencaTodos([], 'presente')).toEqual({});
    expect(marcarPresencaTodos(null, 'presente')).toEqual({});
    expect(marcarPresencaTodos(undefined, 'presente')).toEqual({});
  });
});
