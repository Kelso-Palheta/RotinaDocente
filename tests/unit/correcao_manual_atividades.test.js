import {expect,it} from 'vitest';
import {prepararCorrecaoManual,montarHistoricoFeedback} from '@/dominio/atividades/correcaoManual';
const atividade={id:'at',professorId:'p',turmaIds:['t'],bimestre:3,titulo:'Trabalho',notaMaxima:2,questoes:[{id:'q1',tipo:'objetiva',notaMaxima:1,enunciado:'Questão objetiva'},{id:'q2',tipo:'discursiva',notaMaxima:1,enunciado:'Explique.'}]};
const entrega={id:'e',activityId:'at',professorId:'p',turmaId:'t',alunoId:'a',bimestre:3,status:'corrigido',notaFinal:2,feedback:'Feedback antigo',resultados:{q1:{notaObtida:1,feedback:'Antigo'}}};
const dados={feedback:'Revise a justificativa.',resultados:{q1:{nota:'0',feedback:'Alternativa incorreta.'},q2:{nota:'0,5',feedback:'Faltou um exemplo.'}}};
it('soma questões, preserva zero/vírgula e registra feedback e auditoria manual',()=>{
 const result=prepararCorrecaoManual(atividade,entrega,dados,'prof');
 expect(result).toMatchObject({tipoCorrecao:'manual',status:'revisado',notaFinal:0.5,notaRevisada:0.5,revisadaPorId:'prof',feedback:'Revise a justificativa.'});
 expect(result.resultados.q1).toMatchObject({notaObtida:0,notaMaxima:1,feedback:'Alternativa incorreta.',correto:false});
 expect(result.correcaoAnterior.nota).toBe(2);expect(entrega.notaFinal).toBe(2);
});
it.each(['',null,undefined,true,NaN,Infinity,-1,3])('recusa nota inválida/fora da escala %s',nota=>{
 expect(()=>prepararCorrecaoManual({...atividade,questoes:[]},entrega,{nota,feedback:'Comentário'},'prof')).toThrow(/nota/i);
});
it('exige feedback de cada questão e aceita nota manual zero em atividade legada',()=>{
 expect(()=>prepararCorrecaoManual(atividade,entrega,{...dados,resultados:{...dados.resultados,q1:{nota:0,feedback:''}}},'prof')).toThrow(/feedback/i);
 expect(prepararCorrecaoManual({...atividade,questoes:[]},entrega,{nota:'0',feedback:'Reveja o conteúdo.'},'prof').notaRevisada).toBe(0);
});
it('histórico contém somente feedback do aluno/turma/professor e nenhuma informação clínica',()=>{
 const manual={...entrega,...prepararCorrecaoManual(atividade,entrega,dados,'prof'),necessidades:['dado clínico']};
 const result=montarHistoricoFeedback({atividades:[atividade,{...atividade,id:'outra',professorId:'outro'}],entregas:[manual,{...manual,alunoId:'b'},{...manual,turmaId:'outra'},{...manual,activityId:'outra'}],alunoId:'a',turmaId:'t',professorId:'p'});
 expect(result).toHaveLength(1);expect(result[0]).toMatchObject({titulo:'Trabalho',nota:0.5,tipoCorrecao:'manual',feedback:'Revise a justificativa.'});
 expect(result[0].questoes[1].feedback).toBe('Faltou um exemplo.');expect(JSON.stringify(result)).not.toContain('dado clínico');
});
it('recusa soma acima do máximo e feedback ausente na atividade legada',()=>{
 expect(()=>prepararCorrecaoManual({...atividade,notaMaxima:0.25},entrega,dados,'prof')).toThrow(/soma/i);
 expect(()=>prepararCorrecaoManual({...atividade,questoes:[]},entrega,{nota:0,feedback:''},'prof')).toThrow(/feedback/i);
});
