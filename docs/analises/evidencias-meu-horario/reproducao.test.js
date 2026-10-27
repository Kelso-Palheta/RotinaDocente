/** Evidência histórica: passa ao confirmar defeitos atuais. Dados sintéticos. */
import {it,expect,vi,afterEach} from 'vitest';
import {HorarioRepository} from '@/infraestrutura/horario/HorarioRepository';
import {exportarGradeJson,importarGradeJson,calcularEstatisticasGrade} from '@/aplicacao/horario/gradeService';
import {validarAlocacaoAula,parseSlotKey} from '@/dominio/horario/entidades';
import {parseScheduleFromPdfText} from '@/aplicacao/horario/pdfScheduleParser';
import {generateSchedule} from '@/aplicacao/horario/autoScheduleGenerator';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const storage=()=>{const data={};vi.stubGlobal('localStorage',{setItem:(k,v)=>{data[k]=v;},getItem:k=>data[k] || null});return data;};
it('conta B sem documento recebe cache da conta A',async()=>{
 storage();const cloud={};const db={collection:()=>({doc:id=>({set:async data=>{cloud[id]=data;},get:async()=>({data:()=>cloud[id]})})})};
 const repo=new HorarioRepository({firestoreDb:db});
 await repo.salvarGrade('conta-a',{schedule:{seg_m1:{subject:'Disciplina privada A',grade:'101'}}});
 const b=await repo.carregarGrade('conta-b');expect(b.schedule.seg_m1.subject).toBe('Disciplina privada A');
});
it('falha de armazenamento local e nuvem ainda resolve salvarGrade como sucesso',async()=>{
 vi.spyOn(console,'warn').mockImplementation(()=>{});
 vi.stubGlobal('localStorage',{setItem:()=>{throw new Error('Sem espaço');},getItem:()=>null});
 const db={collection:()=>({doc:()=>({set:async()=>{throw new Error('Offline');}})})};
 await expect(new HorarioRepository({firestoreDb:db}).salvarGrade('conta-a',{schedule:{}})).resolves.toMatchObject({schedule:{}});
});
it('backup de horário personalizado perde a aula ao restaurar',()=>{
 const state={shift:'manha',customSlots:{manha:[{id:'s_123',label:'Aula',start:'08:00',end:'08:45',isBreak:false}]},schedule:{seg_s_123:{subject:'Artes',grade:'101'}}};
 const restored=importarGradeJson(exportarGradeJson(state));expect(restored.customSlots.manha[0].id).toBe('s_123');expect(restored.schedule).toEqual({});
});
it('importação aceita dia e turno inexistentes',()=>{
 const restored=importarGradeJson(JSON.stringify({shift:'inexistente',schedule:{domingoerrado_m1:{subject:'Artes'}}}));
 expect(restored.shift).toBe('inexistente');expect(restored.schedule.domingoerrado_m1).toBeDefined();
});
it('validação de alocação aceita dia e slot desconhecidos',()=>{
 expect(validarAlocacaoAula({dayId:'inexistente',slotId:'inexistente',subject:'Artes'})).toBe(true);
});
it('parser PDF retorna contagem incompatível com a tela e captura horário como turma',()=>{
 const r=parseScheduleFromPdfText('Segunda | 1º Horário | Matemática | 3º Ano B | Sala 10','manha');
 expect(r.totalDetectado).toBe(1);expect(r.totalAulas).toBeUndefined();expect(r.schedule.seg_m1.grade).not.toBe('3º Ano B');
});
it('gerador produz chave incompatível com a grade canônica',()=>{
 const r=generateSchedule({requests:[{subject:'Artes',grade:'101',count:1}],availableSlots:[{dayId:'seg',slotId:'m1'}]});
 expect(r['seg-m1']).toBeDefined();expect(r.seg_m1).toBeUndefined();expect(parseSlotKey(Object.keys(r)[0]).dayId).toBe('');
});
it('estatística conta horários ocultos de outros turnos',()=>{
 expect(calcularEstatisticasGrade({seg_m1:{subject:'Artes'},seg_n1:{subject:'Física'}}).totalAulas).toBe(2);
});
