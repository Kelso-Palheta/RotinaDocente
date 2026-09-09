/**
 * Casos de Uso e Serviços de Aplicação — Módulo Horário Escolar
 * Camada: src/aplicacao/horario/
 */

import { SHIFT_PRESETS, parseSlotKey } from '../../dominio/horario/entidades';

/**
 * Exporta o estado da grade para string JSON formatada (RN-25)
 */
export function exportarGradeJson(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('Estado inválido para exportação.');
  }

  const payload = {
    app: 'meu-horario-escolar',
    version: 1,
    exportedAt: new Date().toISOString(),
    state: {
      teacherName: state.teacherName || 'Professor',
      schoolName: state.schoolName || '',
      shift: state.shift || 'manha',
      showSaturday: Boolean(state.showSaturday),
      theme: state.theme || 'light',
      customSlots: state.customSlots || null,
      schedule: state.schedule || {},
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Importa e sanitiza uma grade a partir de uma string JSON (RN-25)
 */
export function importarGradeJson(jsonString, turnoAtual = 'manha') {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('JSON inválido: conteúdo vazio ou não é texto.');
  }

  let data;
  try {
    data = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(`JSON inválido: falha no parsing (${err.message}).`);
  }

  // Suporta tanto formato empacotado ({ state: ... }) quanto direto ({ schedule: ... })
  const state = data.state || data;

  if (!state || typeof state !== 'object' || (!state.schedule && !state.teacherName && !state.shift)) {
    throw new Error('Estrutura incompatível: arquivo JSON não contém uma grade escolar válida.');
  }

  const shift = state.shift || turnoAtual || 'manha';
  const availableSlots = (SHIFT_PRESETS[shift] || SHIFT_PRESETS.manha)
    .filter((s) => !s.isBreak)
    .map((s) => s.id);

  // Sanitiza a grade descartando slots inválidos ou inexistentes no turno
  const rawSchedule = state.schedule || {};
  const sanitizedSchedule = {};

  Object.entries(rawSchedule).forEach(([key, aula]) => {
    if (!aula || typeof aula !== 'object') return;
    const { dayId, slotId } = parseSlotKey(key);
    if (!dayId || !slotId) return;

    // Se o slot pertence aos horários letivos do turno
    if (availableSlots.includes(slotId)) {
      sanitizedSchedule[key] = {
        subject: String(aula.subject || '').trim(),
        grade: String(aula.grade || '').trim(),
        room: String(aula.room || '').trim(),
        color: aula.color || '#f60c49',
        notes: String(aula.notes || '').trim(),
      };
    }
  });

  return {
    teacherName: state.teacherName || 'Professor',
    schoolName: state.schoolName || '',
    shift,
    showSaturday: Boolean(state.showSaturday),
    theme: state.theme || 'light',
    customSlots: state.customSlots || null,
    schedule: sanitizedSchedule,
  };
}

/**
 * Calcula estatísticas resumidas da grade semanal
 */
export function calcularEstatisticasGrade(schedule = {}) {
  let totalAulas = 0;
  const porDisciplina = {};
  const porTurma = {};

  Object.values(schedule).forEach((aula) => {
    if (!aula || !aula.subject) return;
    totalAulas += 1;

    const disc = aula.subject.trim();
    porDisciplina[disc] = (porDisciplina[disc] || 0) + 1;

    if (aula.grade && aula.grade.trim()) {
      const turma = aula.grade.trim();
      porTurma[turma] = (porTurma[turma] || 0) + 1;
    }
  });

  return {
    totalAulas,
    disciplinasUnicas: Object.keys(porDisciplina).length,
    turmasUnicas: Object.keys(porTurma).length,
    porDisciplina,
    porTurma,
  };
}
