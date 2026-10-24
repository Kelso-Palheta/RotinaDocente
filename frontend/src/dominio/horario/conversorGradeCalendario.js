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

/** Correspondência exata: nunca une 10 e 101. */
export function normalizarNomeTurma(nome) {
  return String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

const horarioValido = valor => typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);

/** Conversor estrito da importação revisável; API antiga permanece compatível. */
export function extrairDiasSemanaPorTurmaEstrito(schedule, slots = [], nomeTurma = '', { origemExata = false } = {}) {
  const alvo = normalizarNomeTurma(nomeTurma);
  if (!alvo || !schedule || typeof schedule !== 'object') return [];
  const blocos = [];
  const mapaSlots = new Map(slots.map(slot => [slot.id, slot]));
  for (const [chave, cell] of Object.entries(schedule)) {
    if (!cell || cell.isBreak || normalizarNomeTurma(cell.grade || cell.turma || cell.className) !== alvo) continue;
    if (origemExata && String(cell.grade || cell.turma || cell.className || '').trim() !== String(nomeTurma).trim()) continue;
    if (!(cell.subject || cell.disciplina || '').trim()) continue;
    const [dayId, ...resto] = chave.split('_');
    const slot = mapaSlots.get(resto.join('_'));
    if (slot?.isBreak) continue;
    if (DAY_INDEX_MAP[dayId] === undefined || !slot || !horarioValido(slot.start) || !horarioValido(slot.end) || slot.start >= slot.end) {
      throw new Error(`Horário inválido no Meu Horário Escolar: ${chave}. Corrija a grade de origem.`);
    }
    blocos.push({diaSemana:DAY_INDEX_MAP[dayId],horarioInicio:slot.start,horarioFim:slot.end,quantidadeAulas:1,disciplina:normalizarNomeTurma(cell.subject || cell.disciplina)});
  }
  blocos.sort((a,b)=>a.diaSemana-b.diaSemana || a.horarioInicio.localeCompare(b.horarioInicio));
  const agrupados=[];
  for (const bloco of blocos) {
    const anterior=agrupados.at(-1);
    if (anterior?.diaSemana===bloco.diaSemana && anterior.horarioFim > bloco.horarioInicio) throw new Error('Há sobreposição de horários na turma de origem.');
    if (anterior?.diaSemana===bloco.diaSemana && anterior.horarioFim===bloco.horarioInicio && anterior.disciplina===bloco.disciplina) {
      anterior.horarioFim=bloco.horarioFim;
      anterior.quantidadeAulas++;
    } else agrupados.push({...bloco});
  }
  return agrupados.map(({disciplina: _disciplina,...bloco})=>bloco);
}

/** Valida antes da prévia e antes da gravação, sem alterar os dados. */
export function validarGradeCalendario(grade) {
  const dataValida = valor => typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor)) && new Date(`${valor}T12:00:00Z`).toISOString().slice(0,10)===valor;
  const {dataInicioPeriodo:inicio,dataFimPeriodo:fim,aplicarDesde,diasSemana,anoLetivo}=grade;
  if (!Number.isInteger(Number(anoLetivo)) || Number(anoLetivo)<1900 || Number(anoLetivo)>2200) throw new Error('Ano letivo inválido.');
  if (!dataValida(inicio) || !dataValida(fim) || inicio>fim || !inicio.startsWith(`${anoLetivo}-`) || !fim.startsWith(`${anoLetivo}-`)) throw new Error('Informe um período válido dentro do ano letivo.');
  if (!dataValida(aplicarDesde) || aplicarDesde<inicio || aplicarDesde>fim) throw new Error('A data de aplicação deve estar dentro do período letivo.');
  if (!Array.isArray(diasSemana) || !diasSemana.length) throw new Error('Adicione ao menos um horário.');
  const ordenados=[...diasSemana].sort((a,b)=>a.diaSemana-b.diaSemana || String(a.horarioInicio).localeCompare(String(b.horarioInicio)));
  ordenados.forEach((dia,index)=>{
    if (!Number.isInteger(dia.diaSemana) || dia.diaSemana<0 || dia.diaSemana>6 || !horarioValido(dia.horarioInicio) || !horarioValido(dia.horarioFim) || dia.horarioInicio>=dia.horarioFim || !Number.isInteger(dia.quantidadeAulas) || dia.quantidadeAulas<1 || dia.quantidadeAulas>20) throw new Error('Dia, horário ou quantidade de aulas inválidos.');
    const anterior=ordenados[index-1];
    if (anterior?.diaSemana===dia.diaSemana && anterior.horarioFim>dia.horarioInicio) throw new Error('Há sobreposição de horários.');
  });
  return grade;
}
