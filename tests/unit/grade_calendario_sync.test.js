/**
 * Teste Unitário — Sincronização Meu Horário ↔ Calendário Pedagógico
 * Referência: specs/RULES.md (RN-51) e specs/TESTS_SPEC.md (UT-25)
 */

import { describe, test, expect } from 'vitest';
import { converterGradeParaAulasSemanais } from '../../frontend/src/dominio/horario/conversorGradeCalendario';

describe('UT-25 (RN-51): Sincronização Meu Horário ↔ Calendário Pedagógico', () => {
  const daysMock = [
    { id: 'seg', label: 'Segunda-feira' },
    { id: 'ter', label: 'Terça-feira' },
    { id: 'qua', label: 'Quarta-feira' }
  ];

  const slotsMock = [
    { id: 'm1', time: '07:30 - 08:20', isBreak: false },
    { id: 'm2', time: '08:20 - 09:10', isBreak: false },
    { id: 'mi', time: '09:10 - 09:30', isBreak: true }, // Intervalo/Recreio
    { id: 'm3', time: '09:30 - 10:20', isBreak: false }
  ];

  test('deve converter células preenchidas da grade em aulas semanais normalizadas', () => {
    const schedule = {
      seg_m1: { subject: 'Matemática', className: '3º Ano A', room: 'Sala 10', color: '#f60c49' },
      seg_m2: { subject: 'Física', className: '3º Ano B', room: 'Lab 1', color: '#101942' },
      ter_m1: { disciplina: 'História', turma: '2º Ano A', sala: 'Sala 05' } // Suporte a campos alternativos em português
    };

    const aulas = converterGradeParaAulasSemanais(schedule, daysMock, slotsMock);

    expect(aulas).toHaveLength(3);
    expect(aulas).toEqual([
      {
        dayId: 'seg',
        slotId: 'm1',
        dayLabel: 'Segunda-feira',
        time: '07:30 - 08:20',
        disciplina: 'Matemática',
        turma: '3º Ano A',
        sala: 'Sala 10',
        cor: '#f60c49'
      },
      {
        dayId: 'seg',
        slotId: 'm2',
        dayLabel: 'Segunda-feira',
        time: '08:20 - 09:10',
        disciplina: 'Física',
        turma: '3º Ano B',
        sala: 'Lab 1',
        cor: '#101942'
      },
      {
        dayId: 'ter',
        slotId: 'm1',
        dayLabel: 'Terça-feira',
        time: '07:30 - 08:20',
        disciplina: 'História',
        turma: '2º Ano A',
        sala: 'Sala 05',
        cor: null
      }
    ]);
  });

  test('deve ignorar rigorosamente slots marcados como intervalo/recreio (isBreak: true)', () => {
    const schedule = {
      seg_m1: { subject: 'Química', className: '1º Ano' },
      seg_mi: { subject: 'Recreio', isBreak: true }, // Marcado na célula
      ter_mi: { subject: 'Intervalo' } // Slot mi é isBreak na definição slotsMock
    };

    const aulas = converterGradeParaAulasSemanais(schedule, daysMock, slotsMock);

    expect(aulas).toHaveLength(1);
    expect(aulas[0].slotId).toBe('m1');
    expect(aulas[0].disciplina).toBe('Química');
  });

  test('deve ignorar células vazias, sem disciplina ou nulas', () => {
    const schedule = {
      seg_m1: null,
      seg_m2: {},
      seg_m3: { subject: '   ' },
      ter_m1: { subject: 'Biologia', className: '2º Ano B' }
    };

    const aulas = converterGradeParaAulasSemanais(schedule, daysMock, slotsMock);

    expect(aulas).toHaveLength(1);
    expect(aulas[0].disciplina).toBe('Biologia');
    expect(aulas[0].turma).toBe('2º Ano B');
  });

  test('deve retornar array vazio para grade nula, indefinida ou vazia', () => {
    expect(converterGradeParaAulasSemanais(null, daysMock, slotsMock)).toEqual([]);
    expect(converterGradeParaAulasSemanais(undefined, daysMock, slotsMock)).toEqual([]);
    expect(converterGradeParaAulasSemanais({}, daysMock, slotsMock)).toEqual([]);
  });
});
