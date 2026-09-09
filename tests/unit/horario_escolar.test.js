/**
 * Testes Unitários de Regras de Negócio — Horário Escolar
 * Referência: specs/RULES.md (RN-23, RN-24, RN-25, RN-26) e specs/TESTS_SPEC.md (UT-08 a UT-12)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  DAYS,
  SHIFT_PRESETS,
  buildSlotKey,
  parseSlotKey,
  validarAlocacaoAula,
  validarSlotIntervalo,
} from '../../frontend/src/dominio/horario/entidades';
import {
  exportarGradeJson,
  importarGradeJson,
} from '../../frontend/src/aplicacao/horario/gradeService';
import { HorarioRepository } from '../../frontend/src/infraestrutura/horario/HorarioRepository';
import { i18nHorario, tHorario } from '../../frontend/src/apresentacao/horario/i18n';

describe('UT-08 (RN-23): Bloqueio de alocação de aula em intervalos (isBreak: true)', () => {
  test('deve identificar slots de intervalo corretamente no turno da manhã', () => {
    expect(validarSlotIntervalo('mi', 'manha')).toBe(true);
    expect(validarSlotIntervalo('m1', 'manha')).toBe(false);
  });

  test('deve lançar erro ao tentar alocar aula em slot de recreio/intervalo', () => {
    expect(() => {
      validarAlocacaoAula({
        dayId: 'seg',
        slotId: 'mi',
        turno: 'manha',
        subject: 'Matemática',
      });
    }).toThrow(/intervalo/i);
  });

  test('deve permitir alocação em slots letivos normais', () => {
    expect(() => {
      validarAlocacaoAula({
        dayId: 'seg',
        slotId: 'm1',
        turno: 'manha',
        subject: 'Matemática',
      });
    }).not.toThrow();
  });
});

describe('UT-09 (RN-23): Composição de chaves canônicas e integridade de turnos', () => {
  test('deve compor a chave canônica no formato ${dayId}_${slotId}', () => {
    expect(buildSlotKey('seg', 'm1')).toBe('seg_m1');
    expect(buildSlotKey('ter', 't3')).toBe('ter_t3');
    expect(buildSlotKey('sex', 'n2')).toBe('sex_n2');
  });

  test('deve fazer parsing correto da chave canônica', () => {
    const parsed = parseSlotKey('qua_m4');
    expect(parsed).toEqual({ dayId: 'qua', slotId: 'm4' });
  });

  test('deve validar estrutura de turnos pré-configurados (manha, tarde, noite, integral)', () => {
    expect(SHIFT_PRESETS).toHaveProperty('manha');
    expect(SHIFT_PRESETS).toHaveProperty('tarde');
    expect(SHIFT_PRESETS).toHaveProperty('noite');
    expect(SHIFT_PRESETS).toHaveProperty('integral');

    // Manhã deve ter 7 slots incluindo recreio (mi)
    expect(SHIFT_PRESETS.manha.length).toBe(7);
    const recreioManha = SHIFT_PRESETS.manha.find((s) => s.id === 'mi');
    expect(recreioManha?.isBreak).toBe(true);

    // Integral deve ter intervalos e almoço
    const almoco = SHIFT_PRESETS.integral.find((s) => s.id === 'alm');
    expect(almoco?.isBreak).toBe(true);
  });

  test('deve conter os 6 dias da semana letivos suportados', () => {
    const dayIds = DAYS.map((d) => d.id);
    expect(dayIds).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sab']);
  });
});

describe('UT-10 (RN-24): Persistência Híbrida Firestore com Fallback LocalStorage', () => {
  let mockLocalStorage = {};

  beforeEach(() => {
    mockLocalStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    });
  });

  test('deve persistir e carregar via localStorage com a chave correta quando anônimo', async () => {
    const repo = new HorarioRepository({ firestoreDb: null });
    const payload = {
      teacherName: 'Prof. Ana',
      shift: 'manha',
      schedule: {
        seg_m1: { subject: 'História', grade: '1A', room: '101', color: '#4f46e5' },
      },
    };

    await repo.salvarGrade(null, payload);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'meu_horario_escolar_data_v1',
      expect.any(String)
    );

    const carregado = await repo.carregarGrade(null);
    expect(carregado.teacherName).toBe('Prof. Ana');
    expect(carregado.schedule.seg_m1.subject).toBe('História');
  });

  test('deve usar fallback para localStorage se a chamada do Firestore falhar', async () => {
    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          set: vi.fn().mockRejectedValue(new Error('Firestore connection failed')),
          get: vi.fn().mockRejectedValue(new Error('Firestore offline')),
        })),
      })),
    };

    const repo = new HorarioRepository({ firestoreDb: mockDb });
    const payload = {
      teacherName: 'Prof. Carlos',
      shift: 'tarde',
      schedule: {},
    };

    // Salvar não deve explodir erro incontrolado, deve salvar em fallback no localStorage
    await repo.salvarGrade('user-123', payload);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'meu_horario_escolar_data_v1',
      expect.any(String)
    );

    const carregado = await repo.carregarGrade('user-123');
    expect(carregado.teacherName).toBe('Prof. Carlos');
  });
});

describe('UT-11 (RN-25): Exportação e Importação de JSON com validação de integridade', () => {
  test('deve exportar payload com versionamento, timestamp e dados completos', () => {
    const state = {
      teacherName: 'Prof. Roberto',
      schoolName: 'Escola Modelo',
      shift: 'manha',
      showSaturday: false,
      schedule: {
        seg_m1: { subject: 'Física', grade: '3A', room: 'Lab', color: '#8b5cf6', notes: '' },
      },
    };

    const jsonString = exportarGradeJson(state);
    const parsed = JSON.parse(jsonString);

    expect(parsed.version).toBe(1);
    expect(parsed.app).toBe('meu-horario-escolar');
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.state.teacherName).toBe('Prof. Roberto');
  });

  test('deve rejeitar JSON malformado na importação', () => {
    expect(() => {
      importarGradeJson('conteúdo inválido não json');
    }).toThrow(/JSON inválido/i);
  });

  test('deve rejeitar JSON sem campos mínimos essenciais', () => {
    expect(() => {
      importarGradeJson(JSON.stringify({ algo: 123 }));
    }).toThrow(/estrutura incompatível/i);
  });

  test('deve sanitizar e aceitar JSON válido', () => {
    const jsonValido = JSON.stringify({
      version: 1,
      app: 'meu-horario-escolar',
      state: {
        teacherName: 'Prof. Julia',
        schoolName: 'Colégio Alpha',
        shift: 'manha',
        showSaturday: true,
        schedule: {
          seg_m1: { subject: 'Biologia', grade: '2B', room: 'Sala 1', color: '#10b981' },
          seg_slot_inexistente: { subject: 'Fake' },
        },
      },
    });

    const resultado = importarGradeJson(jsonValido, 'manha');
    expect(resultado.teacherName).toBe('Prof. Julia');
    expect(resultado.schedule.seg_m1).toBeDefined();
    // Slot inexistente no turno deve ter sido sanitizado/ignorado
    expect(resultado.schedule.seg_slot_inexistente).toBeUndefined();
  });
});

describe('UT-12 (RN-26): Internacionalização pt-BR e es-Latam com paridade total', () => {
  test('deve conter exatamente as mesmas chaves de tradução entre pt-BR e es-Latam', () => {
    const keysPt = Object.keys(i18nHorario['pt-BR']).sort();
    const keysEs = Object.keys(i18nHorario['es-Latam']).sort();

    expect(keysPt).toEqual(keysEs);
    expect(keysPt.length).toBeGreaterThan(15);
  });

  test('deve traduzir textos corretamente em pt-BR e es-Latam', () => {
    expect(tHorario('appTitle', 'pt-BR')).toBe('Meu Horário Escolar');
    expect(tHorario('appTitle', 'es-Latam')).toBe('Mi Horario Escolar');

    expect(tHorario('shiftManha', 'pt-BR')).toBe('Manhã');
    expect(tHorario('shiftManha', 'es-Latam')).toBe('Mañana');
  });

  test('deve realizar fallback para pt-BR quando idioma não for suportado', () => {
    expect(tHorario('appTitle', 'fr-FR')).toBe('Meu Horário Escolar');
  });
});

describe('UT-13 (RN-25): Parser de grade a partir de texto de PDF', () => {
  test('deve extrair aulas e mapear para slots corretos da semana', async () => {
    const { parseScheduleFromPdfText } = await import('../../frontend/src/aplicacao/horario/pdfScheduleParser');
    const textoPdfExemplo = `
      Escola Estadual Modelo - Quadro de Aulas 2026
      Segunda-feira 1º Horário Matemática 1º Ano A Sala 101
      Terça-feira 2º Horário Física 2º Ano B Lab 02
      Quarta-feira 3º Horário Química 3º EM Sala 204
    `;

    const resultado = parseScheduleFromPdfText(textoPdfExemplo, 'manha');
    expect(resultado.totalDetectado).toBeGreaterThanOrEqual(3);
    expect(resultado.schedule.seg_m1).toBeDefined();
    expect(resultado.schedule.seg_m1.subject).toContain('Matemática');
    expect(resultado.schedule.ter_m2).toBeDefined();
    expect(resultado.schedule.ter_m2.subject).toContain('Física');
    expect(resultado.schedule.qua_m3).toBeDefined();
  });
});

