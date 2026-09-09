/**
 * Parser Inteligente de Grade Horária a partir de texto extraído de PDF
 * Camada: src/aplicacao/horario/
 */

import { SHIFT_PRESETS, buildSlotKey } from '../../dominio/horario/entidades';

const DIA_MAP = {
  segunda: 'seg',
  seg: 'seg',
  '2a': 'seg',
  terca: 'ter',
  terça: 'ter',
  ter: 'ter',
  '3a': 'ter',
  quarta: 'qua',
  qua: 'qua',
  '4a': 'qua',
  quinta: 'qui',
  qui: 'qui',
  '5a': 'qui',
  sexta: 'sex',
  sex: 'sex',
  '6a': 'sex',
  sabado: 'sab',
  sábado: 'sab',
  sab: 'sab',
};

const CORES_DISCIPLINAS = [
  '#f60c49', '#101942', '#2563eb', '#059669',
  '#d97706', '#7c3aed', '#0891b2', '#ea580c',
  '#475569', '#16a34a',
];

/**
 * Converte texto extraído de PDF em uma grade estruturada para o professor
 * @param {string} text - Texto bruto extraído das páginas do PDF
 * @param {string} shift - Turno atual ('manha', 'tarde', 'noite', 'integral')
 * @param {string} filterTeacher - Nome opcional do professor para filtrar no documento
 */
export function parseScheduleFromPdfText(text, shift = 'manha', filterTeacher = '') {
  if (!text || typeof text !== 'string') {
    throw new Error('Nenhum texto válido encontrado no arquivo PDF.');
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const availableSlots = (SHIFT_PRESETS[shift] || SHIFT_PRESETS.manha).filter((s) => !s.isBreak);
  const schedule = {};
  let totalDetectado = 0;
  const colorMap = {};

  const getColor = (subj) => {
    if (!colorMap[subj]) {
      const idx = Object.keys(colorMap).length % CORES_DISCIPLINAS.length;
      colorMap[subj] = CORES_DISCIPLINAS[idx];
    }
    return colorMap[subj];
  };

  // 1. Estratégia por Linhas com Dia + Horário + Disciplina + Turma
  // Ex: "Segunda | 1º Horário | Matemática | 1º A | Sala 10" ou delimitado por tabs/espaços
  lines.forEach((line) => {
    // Se houver filtro de professor e a linha contiver outros professores sem o do usuário, ignore
    if (filterTeacher && filterTeacher.trim().length > 2) {
      const lineLower = line.toLowerCase();
      const profLower = filterTeacher.trim().toLowerCase();
      // Se a linha tem indicação explícita de professor mas não é o nosso, pula
      if (lineLower.includes('prof') && !lineLower.includes(profLower)) {
        return;
      }
    }

    // Procura dia
    let detectedDay = null;
    const lowerLine = line.toLowerCase();
    for (const [key, val] of Object.entries(DIA_MAP)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lowerLine)) {
        detectedDay = val;
        break;
      }
    }

    if (!detectedDay) return;

    // Procura número da aula / horário (1 a 10)
    let slotNum = null;
    const slotMatch = line.match(/(\d{1,2})[º°ªo\s]*(?:hor[aá]rio|aula|periodo|tempo)?/i);
    if (slotMatch) {
      slotNum = parseInt(slotMatch[1], 10);
    }

    // Se encontrou horário
    let targetSlot = null;
    if (slotNum && slotNum >= 1 && slotNum <= availableSlots.length) {
      targetSlot = availableSlots[slotNum - 1];
    } else {
      // Tenta por match de hora (ex: 07:15, 08:00)
      for (const slot of availableSlots) {
        if (line.includes(slot.start) || line.includes(slot.start.replace(':', 'h'))) {
          targetSlot = slot;
          break;
        }
      }
    }

    if (!targetSlot) return;

    // Extrai turma (ex: 1º Ano A, 3º EM, 9º B, Turma 101)
    const turmaMatch = line.match(/(\d[º°ª]?\s*(?:ano|série|em|ef|turma)?\s*[a-z0-9\-_]+)/i);
    const grade = turmaMatch ? turmaMatch[1].trim() : '';

    // Extrai sala (ex: Sala 10, Lab 01)
    const salaMatch = line.match(/(?:sala|lab|laboratório|quadra|espaço)\s*[:.]?\s*([a-z0-9\-_]+)/i);
    const room = salaMatch ? salaMatch[0].trim() : '';

    // Extrai disciplina: remove palavras-chave de dia, horário, turma e sala da linha
    let cleanSubject = line
      .replace(new RegExp(`\\b(${Object.keys(DIA_MAP).join('|')})\\b`, 'gi'), '')
      .replace(/(\d{1,2})[º°ªo\s]*(?:hor[aá]rio|aula|periodo|tempo)?/gi, '')
      .replace(/\b\d{2}[:h]\d{2}\b/gi, '')
      .replace(/(?:sala|lab|laboratório|quadra)\s*[:.]?\s*[a-z0-9\-_]+/gi, '')
      .replace(/\|/g, ' ')
      .replace(/[-–]/g, ' ')
      .trim();

    if (grade) {
      cleanSubject = cleanSubject.replace(new RegExp(grade, 'gi'), '').trim();
    }

    // Sanitiza nome da disciplina
    const subjectWords = cleanSubject.split(/\s+/).filter((w) => w.length > 2 && !w.toLowerCase().includes('prof'));
    const subject = subjectWords.slice(0, 3).join(' ') || 'Aula Agendada';

    const slotKey = buildSlotKey(detectedDay, targetSlot.id);
    schedule[slotKey] = {
      subject,
      grade: grade || 'Turma A',
      room: room || '',
      color: getColor(subject),
      notes: 'Importado de PDF',
    };
    totalDetectado += 1;
  });

  return {
    schedule,
    totalDetectado,
  };
}
