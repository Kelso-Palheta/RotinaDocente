/** Evidência histórica: confirma comportamentos incorretos atuais com dados fictícios. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi} from 'vitest';
import {calcularMetricasTurma,calcularMetricasGlobais,obterAlunosEmRisco} from '@/utils/analytics/metricas';
import {AlunosRiscoTable} from '@/components/analytics/AlunosRiscoTable';
import {ComparativoTurmasChart} from '@/components/analytics/ComparativoTurmasChart';
const docs=vi.hoisted(()=>[]);
vi.mock('../../../frontend/node_modules/jspdf/dist/jspdf.node.min.js',async()=>{const real=await vi.importActual('../../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');return{jsPDF:function(...args){const d=new real.jsPDF(...args);const text=d.text.bind(d);d.text=vi.fn((...a)=>text(...a));d.save=vi.fn();docs.push(d);return d;}};});
import {generateAnalyticsPDF} from '@/lib/analytics/pdf-generator';
const turma=(nota,config={})=>({id:'t',nome:'Turma fictícia',alunos:[{id:'a',nome:'Aluno fictício'}],bimestres:{1:{config:{simuladoMaxLanca:10,simuladoMaxFinal:10,atividadesMaxFinal:0,...config},atividades:[],notas:{a:{simulado:nota}}}}});
it('aprovação configurada diverge da consolidação e do radar',()=>{
 const t=turma(6,{mediaAprovacao:7,mediaRecuperacao:5});
 expect(calcularMetricasTurma(t).taxaAprovacao).toBe(0);
 expect(calcularMetricasGlobais([t]).taxaAprovacao).toBe(100);
 expect(obterAlunosEmRisco([t])).toHaveLength(0);
});
it('taxaRisco exclui recuperação enquanto radar inclui os dois grupos',()=>{
 const a=turma(4.5),b=turma(2);b.id='t2';b.alunos[0].id='b';b.bimestres[1].notas={b:{simulado:2}};
 expect(calcularMetricasGlobais([a,b]).taxaRisco).toBe(50);
 expect(obterAlunosEmRisco([a,b])).toHaveLength(2);
});
it('sem avaliações a taxa aparece zero, sem estado próprio de ausência',()=>{
 const t=turma(null);expect(calcularMetricasTurma(t).mediaTurma).toBeNull();expect(calcularMetricasTurma(t).taxaAprovacao).toBe(0);
});
it('radar vazio afirma adequação sem receber quantidade de avaliados',()=>{
 const html=renderToStaticMarkup(<AlunosRiscoTable alunos={[]}/>);
 expect(html).toContain('Todos os estudantes avaliados estão com notas adequadas.');
});
it('comparativo sinaliza excelente em 7, diferente do limite 8 compartilhado',()=>{
 const html=renderToStaticMarkup(<ComparativoTurmasChart turmasMetricas={[]}/>);
 expect(html).toContain('≥ 7.0');
});
it('PDF ignora nota canônica e apresenta aluno com 6 como zero/recuperação',async()=>{
 const t=turma(6);expect(calcularMetricasTurma(t).mediaTurma).toBe(6);
 await generateAnalyticsPDF({turmas:[t],metricas:{totalAlunos:1,mediaGeral:6,taxaAprovacao:100},alunosEmRisco:[],turmaSelecionadaNome:'Todas as Turmas',bimestre:'1',professorNome:'Professor fictício'});
 const calls=docs.at(-1).text.mock.calls;
 expect(calls.some(([texto,x])=>texto==='0,00' && x===154)).toBe(true);
 expect(calls.some(([texto])=>texto==='Recuperação')).toBe(true);
});
