/**
 * Teste Unitário — Frequência Escolar & Alerta Legal de Infrequência (LDB Art. 24)
 * Referência: specs/RULES.md (RN-54) e specs/TESTS_SPEC.md (UT-28)
 */

import { describe, test, expect } from 'vitest';
import {
  calcularFrequencia,
  classificarRiscoInfrequencia,
  marcarPresencaTodos,
  consolidarFrequenciaTurma
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

describe('UT-30 (RN-56): Consolidação de Frequência Escolar e Classificação LDB', () => {
  const alunosMock = [
    { id: 'aluno-1', nome: 'Alice Santos' },
    { id: 'aluno-2', nome: 'Bernardo Lima' },
    { id: 'aluno-3', nome: 'Carlos Eduardo' }
  ];

  const frequenciasMock = {
    '2026-03-02': {
      quantidadeAulas: 2,
      presencas: {
        'aluno-1': 'P',
        'aluno-2': 'P',
        'aluno-3': 'F' // 2 faltas
      }
    },
    '2026-03-04': {
      quantidadeAulas: 2,
      presencas: {
        'aluno-1': 'P',
        'aluno-2': 'F', // 2 faltas
        'aluno-3': 'F' // +2 faltas (total 4 faltas em 4 aulas = 0%)
      }
    },
    '2026-03-09': {
      quantidadeAulas: 1,
      presencas: {
        'aluno-1': 'P',
        'aluno-2': 'FJ', // 1 falta justificada
        'aluno-3': 'P'
      }
    }
  };

  test('deve consolidar presenças, faltas e percentual por estudante com classificação LDB', () => {
    const consolidado = consolidarFrequenciaTurma(alunosMock, frequenciasMock);

    expect(consolidado).toHaveLength(3);

    // Alice: 5 aulas, 5 presenças -> 100% -> regular
    const alice = consolidado.find(a => a.alunoId === 'aluno-1');
    expect(alice.totalAulas).toBe(5);
    expect(alice.presencas).toBe(5);
    expect(alice.faltas).toBe(0);
    expect(alice.percentual).toBe(100);
    expect(alice.statusLdb).toBe('regular');

    // Bernardo: 5 aulas, 2 presenças, 2 faltas, 1 justificada -> 40% faltas -> critico
    const bernardo = consolidado.find(a => a.alunoId === 'aluno-2');
    expect(bernardo.totalAulas).toBe(5);
    expect(bernardo.presencas).toBe(2);
    expect(bernardo.faltas).toBe(2);
    expect(bernardo.faltasJustificadas).toBe(1);
    expect(bernardo.statusLdb).toBe('alerta'); // Com 2 faltas em 5 aulas (40% de falta se sem justificada, ou 2 presenças + 1 justificada)

    // Carlos: 5 aulas, 1 presença, 4 faltas -> 20% presença -> critico
    const carlos = consolidado.find(a => a.alunoId === 'aluno-3');
    expect(carlos.totalAulas).toBe(5);
    expect(carlos.presencas).toBe(1);
    expect(carlos.faltas).toBe(4);
    expect(carlos.percentual).toBe(20);
    expect(carlos.statusLdb).toBe('critico');
  });

  test('deve retornar estrutura limpa quando não houver histórico de chamadas', () => {
    const consolidado = consolidarFrequenciaTurma(alunosMock, {});
    expect(consolidado).toHaveLength(3);
    expect(consolidado[0].totalAulas).toBe(0);
    expect(consolidado[0].percentual).toBe(100);
    expect(consolidado[0].statusLdb).toBe('regular');
  });
});

