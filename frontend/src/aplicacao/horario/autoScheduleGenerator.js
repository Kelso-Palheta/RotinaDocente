// Algoritmo de Geração Automática de Horário para um único professor
export function generateSchedule({ requests, availableSlots, maxClassesPerDay = 6 }) {
  // requests: array de { id, subject, grade, room, count, color }
  // availableSlots: array de { dayId, slotId } (já filtrado removendo as indisponibilidades do professor)
  
  const schedule = {}; // chave: "dayId-slotId", valor: { subject, grade, room, color, id }
  let remainingRequests = [];
  
  requests.forEach(req => {
    for (let i = 0; i < req.count; i++) {
      remainingRequests.push({ ...req });
    }
  });
  
  // Agrupar slots por dia
  const slotsByDay = {};
  availableSlots.forEach(slot => {
    if (!slotsByDay[slot.dayId]) slotsByDay[slot.dayId] = [];
    slotsByDay[slot.dayId].push(slot);
  });
  
  const days = Object.keys(slotsByDay);
  
  // Para evitar janelas, queremos agrupar as aulas do professor de forma contínua em cada dia.
  
  // Função auxiliar para contar aulas de uma turma em um dia
  const countGradeInDay = (dayId, grade) => {
    let count = 0;
    slotsByDay[dayId].forEach(slot => {
      const key = `${dayId}-${slot.slotId}`;
      if (schedule[key] && schedule[key].grade === grade) count++;
    });
    return count;
  };
  
  // 1. Ordenar as requisições (as maiores primeiro, para alocar os "blocos" maiores)
  remainingRequests.sort((a, b) => b.count - a.count);
  
  for (const req of remainingRequests) {
    let placed = false;
    
    const dayScores = days.map(dayId => {
      const slots = slotsByDay[dayId];
      let freeSlots = slots.filter(s => !schedule[`${dayId}-${s.slotId}`]);
      let gradeCount = countGradeInDay(dayId, req.grade);
      
      // Se não tem slot livre, score = -1
      // Se já tem 2 aulas dessa turma no dia, score = -1 (evita mais de 2 geminadas)
      if (freeSlots.length === 0 || gradeCount >= 2) return { dayId, score: -1, freeSlots: [] };
      
      // Favorecer dias onde já tem aula (para não fazer o prof ir na escola dar só 1 aula)
      let profClassesToday = slots.length - freeSlots.length;
      let score = profClassesToday * 10;
      
      // Se o professor ainda não tem nenhuma aula, a penalidade é pequena (novo dia de trabalho)
      if (profClassesToday === 0) score = 5; 
      
      // Favorecer geminar: se já tem 1 aula dessa turma hoje, super score
      if (gradeCount === 1) score += 20; 
      
      return { dayId, score, freeSlots };
    }).filter(d => d.score >= 0).sort((a, b) => b.score - a.score);
    
    for (const bestDay of dayScores) {
      const dayId = bestDay.dayId;
      const freeSlots = bestDay.freeSlots;
      
      // Tentativa de achar adjacente
      let chosenSlot = freeSlots[0];
      for (const slot of freeSlots) {
        const index = slotsByDay[dayId].indexOf(slot);
        if (index > 0 && schedule[`${dayId}-${slotsByDay[dayId][index-1].slotId}`]) {
          chosenSlot = slot; break;
        }
        if (index < slotsByDay[dayId].length - 1 && schedule[`${dayId}-${slotsByDay[dayId][index+1].slotId}`]) {
          chosenSlot = slot; break;
        }
      }
      
      const key = `${dayId}-${chosenSlot.slotId}`;
      schedule[key] = {
        subject: req.subject,
        grade: req.grade,
        room: req.room || '',
        color: req.color || '#f60c49',
        id: req.id || Date.now().toString()
      };
      placed = true;
      break;
    }
    
    if (!placed) {
      console.warn(`Não foi possível alocar uma aula de ${req.subject} para ${req.grade}`);
    }
  }
  
  return schedule;
}
