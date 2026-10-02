/**
 * Dominio: Horário Escolar
 * Conversor puro de Grade Horária para Aulas Semanais do Calendário Pedagógico
 * Referência: specs/RULES.md (RN-51) e specs/TESTS_SPEC.md (UT-25)
 */

/**
 * Converte a grade preenchida do Meu Horário em uma lista estruturada de aulas semanais.
 * 
 * @param {Record<string, any>} schedule - Mapeamento de chave "${dayId}_${slotId}" para dados da aula
 * @param {Array<{ id: string, label: string }>} days - Lista de dias da semana configurados
 * @param {Array<{ id: string, time: string, isBreak?: boolean }>} slots - Lista de horários/slots
 * @returns {Array<{ dayId: string, slotId: string, dayLabel: string, time: string, disciplina: string, turma: string, sala: string, cor: string | null }>}
 */
export function converterGradeParaAulasSemanais(schedule, days = [], slots = []) {
  if (!schedule || typeof schedule !== 'object') {
    return [];
  }

  const daysMap = new Map((days || []).map(d => [d.id, d.label || d.id]));
  const slotsMap = new Map((slots || []).map(s => [s.id, s]));

  const aulas = [];

  for (const [key, cell] of Object.entries(schedule)) {
    if (!cell || typeof cell !== 'object') {
      continue;
    }

    // Se a célula foi explicitamente marcada como intervalo/recreio, ignorar
    if (cell.isBreak) {
      continue;
    }

    const parts = key.split('_');
    if (parts.length < 2) {
      continue;
    }

    const dayId = parts[0];
    const slotId = parts.slice(1).join('_');

    const slotDef = slotsMap.get(slotId);
    // Se o slot na definição é intervalo/recreio, ignorar
    if (slotDef && slotDef.isBreak) {
      continue;
    }

    const disciplina = (cell.disciplina || cell.subject || '').trim();
    if (!disciplina) {
      continue;
    }

    const turma = (cell.turma || cell.className || '').trim();
    const sala = (cell.sala || cell.room || '').trim();
    const cor = cell.cor || cell.color || null;
    const dayLabel = daysMap.get(dayId) || dayId;
    const time = slotDef ? slotDef.time || '' : '';

    aulas.push({
      dayId,
      slotId,
      dayLabel,
      time,
      disciplina,
      turma,
      sala,
      cor
    });
  }

  return aulas;
}
