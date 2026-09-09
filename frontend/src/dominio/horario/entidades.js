/**
 * Entidades e Regras de Domínio — Módulo Horário Escolar
 * Camada: src/dominio/horario/
 * Sem dependências externas ou banco de dados (Clean Architecture).
 */

export const SHIFT_PRESETS = {
  manha: [
    { id: 'm1', label: '1º Horário', start: '07:15', end: '08:00', isBreak: false },
    { id: 'm2', label: '2º Horário', start: '08:00', end: '08:45', isBreak: false },
    { id: 'm3', label: '3º Horário', start: '08:45', end: '09:30', isBreak: false },
    { id: 'mi', label: 'Intervalo / Recreio', start: '09:30', end: '09:50', isBreak: true },
    { id: 'm4', label: '4º Horário', start: '09:50', end: '10:35', isBreak: false },
    { id: 'm5', label: '5º Horário', start: '10:35', end: '11:20', isBreak: false },
    { id: 'm6', label: '6º Horário', start: '11:20', end: '12:05', isBreak: false },
  ],
  tarde: [
    { id: 't1', label: '1º Horário', start: '13:00', end: '13:45', isBreak: false },
    { id: 't2', label: '2º Horário', start: '13:45', end: '14:30', isBreak: false },
    { id: 't3', label: '3º Horário', start: '14:30', end: '15:15', isBreak: false },
    { id: 'ti', label: 'Intervalo / Recreio', start: '15:15', end: '15:35', isBreak: true },
    { id: 't4', label: '4º Horário', start: '15:35', end: '16:20', isBreak: false },
    { id: 't5', label: '5º Horário', start: '16:20', end: '17:05', isBreak: false },
    { id: 't6', label: '6º Horário', start: '17:05', end: '17:50', isBreak: false },
  ],
  noite: [
    { id: 'n1', label: '1º Horário', start: '18:45', end: '19:30', isBreak: false },
    { id: 'n2', label: '2º Horário', start: '19:30', end: '20:15', isBreak: false },
    { id: 'ni', label: 'Intervalo', start: '20:15', end: '20:30', isBreak: true },
    { id: 'n3', label: '3º Horário', start: '20:30', end: '21:15', isBreak: false },
    { id: 'n4', label: '4º Horário', start: '21:15', end: '22:00', isBreak: false },
  ],
  integral: [
    { id: 'm1', label: '1º Horário (M)', start: '07:30', end: '08:20', isBreak: false },
    { id: 'm2', label: '2º Horário (M)', start: '08:20', end: '09:10', isBreak: false },
    { id: 'm3', label: '3º Horário (M)', start: '09:10', end: '10:00', isBreak: false },
    { id: 'mi', label: 'Recreio Manhã', start: '10:00', end: '10:20', isBreak: true },
    { id: 'm4', label: '4º Horário (M)', start: '10:20', end: '11:10', isBreak: false },
    { id: 'm5', label: '5º Horário (M)', start: '11:10', end: '12:00', isBreak: false },
    { id: 'alm', label: 'Almoço / Descanso', start: '12:00', end: '13:15', isBreak: true },
    { id: 't1', label: '6º Horário (T)', start: '13:15', end: '14:05', isBreak: false },
    { id: 't2', label: '7º Horário (T)', start: '14:05', end: '14:55', isBreak: false },
    { id: 'ti', label: 'Recreio Tarde', start: '14:55', end: '15:15', isBreak: true },
    { id: 't3', label: '8º Horário (T)', start: '15:15', end: '16:05', isBreak: false },
    { id: 't4', label: '9º Horário (T)', start: '16:05', end: '16:55', isBreak: false },
  ],
};

export const DAYS = [
  { id: 'seg', label: 'Segunda-feira', short: 'Seg', dayIndex: 1 },
  { id: 'ter', label: 'Terça-feira', short: 'Ter', dayIndex: 2 },
  { id: 'qua', label: 'Quarta-feira', short: 'Qua', dayIndex: 3 },
  { id: 'qui', label: 'Quinta-feira', short: 'Qui', dayIndex: 4 },
  { id: 'sex', label: 'Sexta-feira', short: 'Sex', dayIndex: 5 },
  { id: 'sab', label: 'Sábado', short: 'Sáb', dayIndex: 6 },
];

export const SAMPLE_SCHEDULE = {
  seg_m1: { subject: 'Matemática', grade: '1º Ano A', room: 'Sala 102', color: '#f60c49', notes: 'Revisão diagnóstica' },
  seg_m2: { subject: 'Matemática', grade: '1º Ano A', room: 'Sala 102', color: '#f60c49', notes: '' },
  seg_m4: { subject: 'Física', grade: '2º Ano B', room: 'Lab Ciências', color: '#2563eb', notes: 'Experimento óptico' },
  seg_m5: { subject: 'Física', grade: '2º Ano B', room: 'Lab Ciências', color: '#2563eb', notes: '' },
  ter_m2: { subject: 'Matemática', grade: '3º Ano EM', room: 'Sala 204', color: '#f60c49', notes: 'Simulado preparatório' },
  ter_m3: { subject: 'Matemática', grade: '3º Ano EM', room: 'Sala 204', color: '#f60c49', notes: '' },
  ter_m5: { subject: 'Eletiva Robótica', grade: 'Mista', room: 'Lab Informática', color: '#059669', notes: 'Kit Arduino' },
  ter_m6: { subject: 'Eletiva Robótica', grade: 'Mista', room: 'Lab Informática', color: '#059669', notes: '' },
  qua_m1: { subject: 'Matemática', grade: '1º Ano B', room: 'Sala 103', color: '#f60c49', notes: '' },
  qua_m2: { subject: 'Matemática', grade: '1º Ano B', room: 'Sala 103', color: '#f60c49', notes: '' },
  qua_m4: { subject: 'Matemática', grade: '3º Ano EM', room: 'Sala 204', color: '#f60c49', notes: '' },
  qui_m1: { subject: 'Física', grade: '2º Ano A', room: 'Sala 201', color: '#2563eb', notes: '' },
  qui_m2: { subject: 'Física', grade: '2º Ano A', room: 'Sala 201', color: '#2563eb', notes: '' },
  qui_m4: { subject: 'Matemática', grade: '1º Ano A', room: 'Sala 102', color: '#f60c49', notes: '' },
  sex_m2: { subject: 'Matemática', grade: '1º Ano B', room: 'Sala 103', color: '#f60c49', notes: '' },
  sex_m3: { subject: 'Física', grade: '2º Ano B', room: 'Sala 202', color: '#2563eb', notes: '' },
};

/**
 * Constrói a chave canônica do slot (ex: 'seg_m1')
 */
export function buildSlotKey(dayId, slotId) {
  return `${dayId}_${slotId}`;
}

/**
 * Extrai dayId e slotId da chave canônica
 */
export function parseSlotKey(slotKey) {
  if (!slotKey || typeof slotKey !== 'string' || !slotKey.includes('_')) {
    return { dayId: '', slotId: '' };
  }
  const [dayId, ...rest] = slotKey.split('_');
  return { dayId, slotId: rest.join('_') };
}

/**
 * Verifica se um determinado slot é intervalo no turno especificado
 */
export function validarSlotIntervalo(slotId, turno = 'manha') {
  const slots = SHIFT_PRESETS[turno] || SHIFT_PRESETS.manha;
  const slot = slots.find((s) => s.id === slotId);
  return Boolean(slot && slot.isBreak);
}

/**
 * Valida se uma aula pode ser alocada no slot fornecido (RN-23)
 */
export function validarAlocacaoAula({ dayId, slotId, turno = 'manha', subject }) {
  if (!dayId || !slotId) {
    throw new Error('Dia e horário são obrigatórios.');
  }

  if (validarSlotIntervalo(slotId, turno)) {
    throw new Error('Não é permitido alocar aulas em horários de recreio ou intervalo.');
  }

  if (!subject || typeof subject !== 'string' || subject.trim() === '') {
    throw new Error('O nome da disciplina é obrigatório para alocação.');
  }

  return true;
}
