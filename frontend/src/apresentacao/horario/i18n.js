/**
 * Dicionários e Funções de Internacionalização (i18n) — Módulo Horário Escolar (RN-26)
 * Camada: src/apresentacao/horario/
 * Suporte nativo: Português (pt-BR) e Espanhol América Latina (es-Latam).
 */

export const i18nHorario = {
  'pt-BR': {
    appTitle: 'Meu Horário Escolar',
    teacher: 'Professor(a)',
    school: 'Escola',
    shift: 'Turno',
    shiftManha: 'Manhã',
    shiftTarde: 'Tarde',
    shiftNoite: 'Noite',
    shiftIntegral: 'Integral',
    saturday: 'Sábado',
    showSaturday: 'Mostrar Sábado',
    hideSaturday: 'Ocultar Sábado',
    theme: 'Tema',
    exportJson: 'Exportar JSON',
    importJson: 'Importar JSON',
    exportPdf: 'Exportar PDF',
    print: 'Imprimir',
    quickEdit: 'Editar Aula',
    subject: 'Disciplina',
    grade: 'Turma',
    room: 'Sala',
    color: 'Cor',
    notes: 'Observações',
    save: 'Salvar',
    cancel: 'Cancelar',
    remove: 'Remover',
    summary: 'Resumo Semanal',
    totalClasses: 'Total de Aulas',
    uniqueSubjects: 'Disciplinas Diferentes',
    uniqueGrades: 'Turmas Diferentes',
    breakTime: 'Intervalo / Recreio',
    lunchTime: 'Almoço / Descanso',
    language: 'Idioma',
    savedSuccess: 'Grade salva com sucesso!',
    importedSuccess: 'Grade importada com sucesso!',
    confirmClear: 'Deseja limpar toda a grade?',
    scheduleTab: 'Grade Semanal',
    viewSchedule: 'Visualizar Horário',
  },
  'es-Latam': {
    appTitle: 'Mi Horario Escolar',
    teacher: 'Profesor(a)',
    school: 'Escuela',
    shift: 'Turno',
    shiftManha: 'Mañana',
    shiftTarde: 'Tarde',
    shiftNoite: 'Noche',
    shiftIntegral: 'Jornada Completa',
    saturday: 'Sábado',
    showSaturday: 'Mostrar Sábado',
    hideSaturday: 'Ocultar Sábado',
    theme: 'Tema',
    exportJson: 'Exportar JSON',
    importJson: 'Importar JSON',
    exportPdf: 'Exportar PDF',
    print: 'Imprimir',
    quickEdit: 'Editar Clase',
    subject: 'Asignatura',
    grade: 'Curso / Grupo',
    room: 'Aula / Salón',
    color: 'Color',
    notes: 'Observaciones',
    save: 'Guardar',
    cancel: 'Cancelar',
    remove: 'Eliminar',
    summary: 'Resumen Semanal',
    totalClasses: 'Total de Clases',
    uniqueSubjects: 'Asignaturas Diferentes',
    uniqueGrades: 'Grupos Diferentes',
    breakTime: 'Receso / Intervalo',
    lunchTime: 'Almuerzo / Descanso',
    language: 'Idioma',
    savedSuccess: '¡Horario guardado con éxito!',
    importedSuccess: '¡Horario importado con éxito!',
    confirmClear: '¿Desea limpiar todo el horario?',
    scheduleTab: 'Horario Semanal',
    viewSchedule: 'Ver Horario',
  },
};

/**
 * Traduz uma chave para o idioma solicitado com fallback automático para pt-BR
 */
export function tHorario(key, lang = 'pt-BR') {
  const currentDict = i18nHorario[lang] || i18nHorario['pt-BR'];
  if (currentDict && currentDict[key] !== undefined) {
    return currentDict[key];
  }
  const fallbackDict = i18nHorario['pt-BR'];
  return fallbackDict[key] !== undefined ? fallbackDict[key] : key;
}
