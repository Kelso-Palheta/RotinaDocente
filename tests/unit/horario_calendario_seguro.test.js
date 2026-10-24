import { describe, it, expect, vi } from 'vitest';
import { extrairDiasSemanaPorTurmaEstrito, validarGradeCalendario } from '../../frontend/src/dominio/horario/conversorGradeCalendario';
import { HorarioRepository } from '../../frontend/src/infraestrutura/horario/HorarioRepository';
const slots = [{id:'a',start:'07:00',end:'07:50'},{id:'b',start:'07:50',end:'08:40'},{id:'i',start:'08:40',end:'09:00',isBreak:true},{id:'c',start:'10:00',end:'10:50'}];
describe('Importação segura de horários',()=>{
 it('combina somente tempos contíguos de mesma disciplina, sem aproximar nomes',()=>{
  const schedule={seg_a:{grade:' 101 ',subject:'Arte'},seg_b:{grade:'101',subject:'Arte'},seg_i:{grade:'101',subject:'Arte'},seg_c:{grade:'101',subject:'Arte'},ter_a:{grade:'10',subject:'Arte'}};
  expect(extrairDiasSemanaPorTurmaEstrito(schedule,slots,'101')).toEqual([{diaSemana:1,horarioInicio:'07:00',horarioFim:'08:40',quantidadeAulas:2},{diaSemana:1,horarioInicio:'10:00',horarioFim:'10:50',quantidadeAulas:1}]);
  expect(extrairDiasSemanaPorTurmaEstrito(schedule,slots,'1')).toEqual([]);
 });
 it('seleção explícita desambigua nomes normalizados iguais',()=>{
  const schedule={seg_a:{grade:'Turma Á',subject:'Arte'},ter_a:{grade:'Turma A',subject:'Arte'}};
  expect(extrairDiasSemanaPorTurmaEstrito(schedule,slots,'Turma Á',{origemExata:true})).toHaveLength(1);
 });
 it('rejeita slot ausente ou horário inválido ao invés de inventar tempos',()=>{
  expect(()=>extrairDiasSemanaPorTurmaEstrito({seg_x:{grade:'101',subject:'Arte'}},slots,'101')).toThrow(/horário/i);
 });
 it('valida ano, data real, aplicação, intervalos e sobreposição',()=>{
  const grade={anoLetivo:2027,dataInicioPeriodo:'2027-02-01',dataFimPeriodo:'2027-12-15',aplicarDesde:'2027-03-01',diasSemana:[{diaSemana:1,horarioInicio:'07:00',horarioFim:'08:00',quantidadeAulas:1}]};
  expect(validarGradeCalendario(grade)).toEqual(grade);
  expect(()=>validarGradeCalendario({...grade,dataInicioPeriodo:'2027-02-30'})).toThrow();
  expect(()=>validarGradeCalendario({...grade,aplicarDesde:'2026-03-01'})).toThrow();
  expect(()=>validarGradeCalendario({...grade,diasSemana:[...grade.diasSemana,{diaSemana:1,horarioInicio:'07:30',horarioFim:'08:30',quantidadeAulas:1}]})).toThrow(/sobrepos/i);
 });
 it('modo real não usa demonstração e propaga falha de nuvem',async()=>{
  expect(await new HorarioRepository().carregarGrade(null,{somenteReal:true})).toBeNull();
  const get=vi.fn().mockRejectedValue(new Error('offline'));
  const repo=new HorarioRepository({firestoreDb:{collection:()=>({doc:()=>({get})})}});
  await expect(repo.carregarGrade('u',{somenteReal:true})).rejects.toThrow('offline');
 });
 it('modo real relê nuvem em cada solicitação',async()=>{
  const get=vi.fn().mockResolvedValueOnce({data:()=>({schedule:{a:1}})}).mockResolvedValueOnce({data:()=>({schedule:{b:2}})});
  const repo=new HorarioRepository({firestoreDb:{collection:()=>({doc:()=>({get})})}});
  expect((await repo.carregarGrade('u',{somenteReal:true})).schedule).toEqual({a:1});
  expect((await repo.carregarGrade('u',{somenteReal:true})).schedule).toEqual({b:2});
 });
});
