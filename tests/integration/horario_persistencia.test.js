/**
 * Testes de Integração — Persistência e Ciclo de Vida do Horário Escolar
 * Referência: specs/TESTS_SPEC.md (IT-03)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { HorarioRepository } from '../../frontend/src/infraestrutura/horario/HorarioRepository';
import {
  exportarGradeJson,
  importarGradeJson,
  calcularEstatisticasGrade,
} from '../../frontend/src/aplicacao/horario/gradeService';

describe('IT-03: Ciclo completo de sincronização, exportação e restore de Grade Horária', () => {
  let inMemoryFirestore = {};
  let inMemoryLocalStorage = {};

  const mockDb = {
    collection: vi.fn((colName) => ({
      doc: vi.fn((docId) => ({
        set: vi.fn(async (data) => {
          inMemoryFirestore[`${colName}/${docId}`] = JSON.parse(JSON.stringify(data));
        }),
        get: vi.fn(async () => {
          const doc = inMemoryFirestore[`${colName}/${docId}`];
          return {
            exists: !!doc,
            data: () => doc,
          };
        }),
      })),
    })),
  };

  beforeEach(() => {
    inMemoryFirestore = {};
    inMemoryLocalStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => inMemoryLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        inMemoryLocalStorage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete inMemoryLocalStorage[key];
      }),
      clear: vi.fn(() => {
        inMemoryLocalStorage = {};
      }),
    });
  });

  test('deve salvar no Firestore, cachear localmente e restaurar dados intactos', async () => {
    const repo = new HorarioRepository({ firestoreDb: mockDb });
    const userId = 'prof_kelso_123';

    const estadoOriginal = {
      teacherName: 'Prof. Kelso',
      schoolName: 'Escola Tecnológica',
      shift: 'manha',
      showSaturday: false,
      theme: 'dark',
      schedule: {
        seg_m1: { subject: 'Programação', grade: '3º EM Tech', room: 'Lab 01', color: '#4f46e5', notes: 'Aula inicial' },
        seg_m2: { subject: 'Programação', grade: '3º EM Tech', room: 'Lab 01', color: '#4f46e5', notes: '' },
        ter_m4: { subject: 'Robótica', grade: '2º EM', room: 'Espaço Maker', color: '#10b981', notes: 'Sensores' },
      },
    };

    // 1. Salvar grade via repositório
    await repo.salvarGrade(userId, estadoOriginal);

    // Deve ter gravado no Firestore e no LocalStorage
    expect(inMemoryFirestore['horario_escolar/prof_kelso_123']).toBeDefined();
    expect(inMemoryLocalStorage['meu_horario_escolar_data_v1']).toBeDefined();

    // 2. Carregar novamente
    const carregado = await repo.carregarGrade(userId);
    expect(carregado.teacherName).toBe('Prof. Kelso');
    expect(carregado.schedule.seg_m1.subject).toBe('Programação');
    expect(carregado.schedule.ter_m4.room).toBe('Espaço Maker');

    // 3. Exportar para backup JSON
    const jsonBackup = exportarGradeJson(carregado);
    expect(typeof jsonBackup).toBe('string');

    // 4. Simular restauração em outro ambiente/instância limpa
    const restaurado = importarGradeJson(jsonBackup, 'manha');
    expect(restaurado.teacherName).toBe('Prof. Kelso');
    expect(restaurado.schedule.seg_m1.subject).toBe('Programação');

    // 5. Validar cálculo analítico das métricas
    const stats = calcularEstatisticasGrade(restaurado.schedule);
    expect(stats.totalAulas).toBe(3);
    expect(stats.disciplinasUnicas).toBe(2);
    expect(stats.turmasUnicas).toBe(2);
    expect(stats.porDisciplina['Programação']).toBe(2);
    expect(stats.porDisciplina['Robótica']).toBe(1);
  });
});
