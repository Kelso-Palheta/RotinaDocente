/**
 * Dominio: Horário Escolar
 * Conversor puro de Grade Horária para Aulas Semanais do Calendário Pedagógico
 * Referência: specs/RULES.md (RN-51) e specs/TESTS_SPEC.md (UT-25)
 */

export const DAY_INDEX_MAP = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6
};

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

    const turma = (cell.turma || cell.className || cell.grade || '').trim();
    const sala = (cell.sala || cell.room || '').trim();
    const cor = cell.cor || cell.color || null;
    const dayLabel = daysMap.get(dayId) || dayId;
    const time = slotDef ? (slotDef.time || `${slotDef.start || ''} - ${slotDef.end || ''}`) : '';

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

/**
 * Lista todas as turmas distintas encontradas no schedule do Meu Horário.
 * @param {Record<string, any>} schedule 
 * @returns {string[]}
 */
export function listarTurmasDaGrade(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    return [];
  }

  const set = new Set();
  for (const cell of Object.values(schedule)) {
    if (!cell || typeof cell !== 'object') continue;
    const t = (cell.grade || cell.turma || cell.className || '').trim();
    if (t) {
      set.add(t);
    }
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Extrai a rotina semanal de uma turma específica do Meu Horário no formato esperado pelo Calendário Pedagógico (diasSemana).
 * 
 * @param {Record<string, any>} schedule - Grade do Meu Horário
 * @param {Array<{ id: string, start?: string, end?: string, isBreak?: boolean }>} slots - Slots do turno
 * @param {string} nomeTurma - Nome da turma a extrair
 * @returns {Array<{ diaSemana: number, horarioInicio: string, horarioFim: string, quantidadeAulas: number }>}
 */
export function extrairDiasSemanaPorTurma(schedule, slots = [], nomeTurma = '') {
  if (!schedule || typeof schedule !== 'object' || !nomeTurma) {
    return [];
  }

  const alvo = nomeTurma.trim().toLowerCase();
  const slotsMap = new Map((slots || []).map(s => [s.id, s]));

  // Agrupa slots por dayId
  const porDia = new Map();

  for (const [key, cell] of Object.entries(schedule)) {
    if (!cell || typeof cell !== 'object' || cell.isBreak) continue;

    const turmaCell = (cell.grade || cell.turma || cell.className || '').trim().toLowerCase();
    if (!turmaCell) continue;

    // Compara se é a mesma turma (exato ou contido)
    if (turmaCell !== alvo && !alvo.includes(turmaCell) && !turmaCell.includes(alvo)) {
      continue;
    }

    const parts = key.split('_');
    if (parts.length < 2) continue;
    const dayId = parts[0];
    const slotId = parts.slice(1).join('_');

    const slotDef = slotsMap.get(slotId);
    if (slotDef && slotDef.isBreak) continue;

    if (!porDia.has(dayId)) {
      porDia.set(dayId, []);
    }
    porDia.get(dayId).push({
      slotId,
      start: slotDef?.start || '',
      end: slotDef?.end || ''
    });
  }

  const rotina = [];

  for (const [dayId, slotsDoDia] of porDia.entries()) {
    const diaSemana = DAY_INDEX_MAP[dayId];
    if (diaSemana === undefined) continue;

    // Ordena os slots do dia pelo horário de início
    slotsDoDia.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

    const horarioInicio = slotsDoDia[0]?.start || '07:30';
    const horarioFim = slotsDoDia[slotsDoDia.length - 1]?.end || '09:10';
    const quantidadeAulas = slotsDoDia.length;

    rotina.push({
      diaSemana,
      horarioInicio,
      horarioFim,
      quantidadeAulas
    });
  }

  // Ordena por dia da semana (0..6)
  rotina.sort((a, b) => a.diaSemana - b.diaSemana);

  return rotina;
}
