import { describe, expect, it } from 'vitest';
import { calcDesempenhoAnual, calcSemestre } from '@/utils/diario/calculos';
import { consolidarFichaAluno360 } from '@/dominio/diario/fichaAluno';

export function turmaComNotas(valores, recuperacao = {}) {
 return {id:'t',nome:'301',alunos:[{id:'a',nome:'Ana Exemplo'}],recuperacao,bimestres:Object.fromEntries(valores.map((valor,i)=>[String(i+1),{atividades:[],config:{simuladoMaxLanca:10,simuladoMaxFinal:10,atividadesMaxFinal:0},notas:{a:{simulado:valor}}}]))};
}
describe('RN-67: situações independentes por etapa',()=>{
 it.each([
  [[5,5,null,null],'good','none','warn',25],
  [[null,null,5,5],'none','good','warn',25],
  [[5,5,5,5],'good','good','good',50],
  [[4,4,6,6],'bad','good','good',50],
  [[0,0,null,null],'bad','none','warn',0],
  [[10,null,null,null],'warn','none','warn',20],
  [[10,10,null,null],'good','none','warn',50],
  [[null,null,null,null],'none','none','none',null],
  [[5.01,4.99,5,5],'bad','good','bad',49.99],
 ])('%j → S1 %s / S2 %s / ano %s',(notas,s1,s2,anual,total)=>{
  const d=calcDesempenhoAnual(turmaComNotas(notas),'a');
  expect(d.S1.status).toBe(s1);expect(d.S2.status).toBe(s2);
  expect(d.statusFinal).toBe(anual);expect(d.totalAnual).toBe(total);
 });
 it('mantém pesos 2/3 e recuperação substituindo a menor nota',()=>{
  const d=calcDesempenhoAnual(turmaComNotas([4,5,null,null],{a:{rec1:5}}),'a');
  expect(d.S1).toMatchObject({total:25,status:'good',substituted:'first'});
  expect(calcSemestre(5,5,null).total).toBe(25);
 });
 it('Ficha 360 separa semestre aprovado de ano em andamento',()=>{
  const turma=turmaComNotas([5,5,null,null]);
  const ficha=consolidarFichaAluno360({aluno:turma.alunos[0],turma});
  expect(ficha.academico.situacao).toBe('Em andamento');
  expect(ficha.academico.S1).toMatchObject({total:25,status:'good'});
 });
});
