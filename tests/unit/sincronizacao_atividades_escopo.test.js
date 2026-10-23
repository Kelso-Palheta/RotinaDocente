import { describe, expect, it } from 'vitest';
import { aplicarSincronizacaoAtividades, normalizarEscopoSincronizacao } from '@/dominio/diario/sincronizacaoAtividades';
const fixture = () => ({
 turmas: ['t1','t2'].map(id=>({id,alunos:[{id:'a',nome:'Aluno'}],bimestres:{'1':{atividades:[],notas:{a:{simulado:4}}},'2':{atividades:[],notas:{a:{simulado:3}}}}})),
 atividades:[{id:'at1',titulo:'Atividade 1',turmaIds:['t1','t2'],bimestre:1,notaMaxima:2},{id:'at2',titulo:'Atividade 2',turmaIds:['t1'],bimestre:'2',notaMaxima:2},{id:'at3',titulo:'Atividade 3',turmaIds:['t1'],bimestre:1,notaMaxima:2}],
 entregas:[{activityId:'at1',turmaId:'t1',alunoId:'a',bimestre:'1',status:'corrigido',notaFinal:1},{activityId:'at1',turmaId:'t2',alunoId:'a',bimestre:1,status:'revisado',notaFinal:2,notaRevisada:0},{activityId:'at2',turmaId:'t1',alunoId:'a',bimestre:2,status:'corrigido',notaFinal:2},{activityId:'at3',turmaId:'t1',alunoId:'a',bimestre:1,status:'corrigido',notaFinal:1.5}]
});
describe('RN-64: Isolamento da sincronização',()=>{
 it('escopo turma/bimestre preserva demais turmas, bimestres e simulado',()=>{
  const data=fixture(),before=structuredClone(data);
  const result=aplicarSincronizacaoAtividades({...data,escopo:{turmaId:'t1',bimestre:1}});
  expect(result.sincronizadas).toBe(2);
  expect(result.turmas[0].bimestres['1'].notas.a).toEqual({simulado:4,at1:1,at3:1.5});
  expect(result.turmas[1]).toBe(data.turmas[1]);
  expect(result.turmas[0].bimestres['2']).toBe(data.turmas[0].bimestres['2']);
  expect(data).toEqual(before);
 });
 it('modo global grava cada entrega somente na turma do respectivo aluno, inclusive zero revisado',()=>{
  const result=aplicarSincronizacaoAtividades({...fixture(),escopo:{}});
  expect(result.sincronizadas).toBe(4);
  expect(result.turmas[0].bimestres['1'].notas.a.at1).toBe(1);
  expect(result.turmas[1].bimestres['1'].notas.a.at1).toBe(0);
  expect(result.turmas[1].bimestres['2'].notas.a).toEqual({simulado:3});
 });
 it('correção individual limita também atividade e aluno',()=>{
  const result=aplicarSincronizacaoAtividades({...fixture(),escopo:{turmaId:'t1',bimestre:'1',atividadeId:'at1',alunoId:'a'}});
  expect(result.sincronizadas).toBe(1);
  expect(result.turmas[0].bimestres['1'].notas.a).toEqual({simulado:4,at1:1});
 });
 it('ignora entregas não corrigidas, turmas/alunos inválidos e bimestres divergentes',()=>{
  const data=fixture();data.entregas=[
   {...data.entregas[0],status:'entregue'},
   {...data.entregas[0],turmaId:'fora'},
   {...data.entregas[0],alunoId:'fora'},
   {...data.entregas[0],bimestre:2},
   {...data.entregas[0],notaFinal:NaN},
  ];
  const result=aplicarSincronizacaoAtividades({...data,escopo:{}});
  expect(result.sincronizadas).toBe(0);expect(result.turmas).toBe(data.turmas);
 });
 it('prioriza vínculo explícito/ID da atividade sobre título repetido',()=>{
  const data=fixture();data.turmas[0].bimestres['1'].atividades=[{id:'outra',nome:'Atividade 1',max:2},{id:'at1',nome:'Título antigo',max:2}];
  const result=aplicarSincronizacaoAtividades({...data,escopo:{turmaId:'t1',bimestre:1,atividadeId:'at1'}});
  expect(result.turmas[0].bimestres['1'].notas.a.at1).toBe(1);
  expect(result.turmas[0].bimestres['1'].notas.a.outra).toBeUndefined();
 });
 it('aceita turma legada e recusa escopo inválido sem ampliar para global',()=>{
  expect(normalizarEscopoSincronizacao('t1')).toEqual({turmaId:'t1'});
  expect(()=>normalizarEscopoSincronizacao({bimestre:'invalido'})).toThrow(/bimestre/i);
  expect(()=>normalizarEscopoSincronizacao({turmaId:''})).toThrow(/turma/i);
 });
});
