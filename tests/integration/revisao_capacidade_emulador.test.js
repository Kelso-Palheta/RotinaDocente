import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { FirestoreRevisaoStore } from '../../frontend/src/infraestrutura/revisao/FirestoreStore';
import { RevisaoService } from '../../frontend/src/aplicacao/revisao/RevisaoService';
import { cenario, salaPronta, acao } from '../helpers/revisaoCenario';
const host = process.env.FIRESTORE_EMULATOR_HOST;
const local = Boolean(host && /^(127\.0\.0\.1|localhost):\d+$/.test(host));
const p95 = xs => [...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*.95)-1];
describe.skipIf(!local)('RevisaoService: cem alunos em duas instâncias e Firestore local', () => {
 let dbA,dbB,a,b,c,codigo;
 const projectId='demo-revisao-capacidade';
 beforeAll(async()=>{
  const {Firestore}=await import('../../frontend/node_modules/firebase-admin/lib/firestore/index.js');
  dbA=new Firestore({projectId});dbB=new Firestore({projectId});a=new FirestoreRevisaoStore(dbA);b=new FirestoreRevisaoStore(dbB);
  c=await cenario(100,a);c.opcoes.gerarCodigo=()=> 'CPAC2345';c.service=new RevisaoService(c.opcoes);codigo=await salaPronta(c);
 },30000);
 afterAll(async()=>{
  if(!dbA)return;
  if(codigo)await dbA.recursiveDelete(dbA.doc(`revisaoSalas/${codigo}`));
  await Promise.all([dbA.recursiveDelete(dbA.doc('professores/prof-1')),dbA.recursiveDelete(dbA.doc('revisaoDocentes/prof-1')),...Array.from({length:100},(_,i)=>dbA.recursiveDelete(dbA.doc(`alunoLogin/login${i}`)))]);
  await Promise.all([dbA.terminate(),dbB.terminate()]);
 },30000);
 it('preserva recibos, pontuação, CAS, retomada, revogação e prazo sob 200 envios',async()=>{
  const segunda=new RevisaoService({...c.opcoes,store:b});
  await Promise.all(Array.from({length:100},(_,i)=>(i%2?c.service:segunda).entrar(c.aluno(i),codigo)));
  await acao(c,codigo,'mostrar_conteudo');
  const anterior=(await c.service.estado(c.docente,codigo)).estado;
  const comando={acao:'abrir_pergunta',revisao:anterior.sala.revisao,rodadaId:anterior.rodada.id};
  const cas=await Promise.allSettled([c.service.comandar(c.docente,codigo,comando),segunda.comandar(c.docente,codigo,comando)]);
  expect(cas.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect(cas.find(x=>x.status==='rejected').reason.status).toBe(409);
  const publicado=await a.get(`revisaoSalas/${codigo}/publicacao/estado`),sala=await a.get(`revisaoSalas/${codigo}`),rodadaId=publicado.rodada.id;
  const duracoes=[],inicio=performance.now();
  const envios=await Promise.all(Array.from({length:200},async(_,indice)=>{
   const i=indice%100,service=indice<100?c.service:segunda,t=performance.now();
   const recibo=await service.responder(c.aluno(i),codigo,{rodadaId,alternativa:i%2?'A':'B'});
   duracoes.push(performance.now()-t);return{i,recibo};
  }));
  const totalMs=performance.now()-inicio;
  for(let i=0;i<100;i++){
   const repetidos=envios.filter(e=>e.i===i).map(e=>e.recibo);expect(repetidos[0]).toEqual(repetidos[1]);expect(repetidos[0].envio.status).toBe('confirmado');
  }
  const participantes=await b.list(`revisaoSalas/${codigo}/participantes`),respostas=await b.list(`revisaoSalas/${codigo}/respostas`);
  expect(participantes).toHaveLength(100);expect(respostas).toHaveLength(100);expect(participantes.reduce((s,p)=>s+p.pontos,0)).toBe(50000);
  participantes.forEach(p=>expect(p.pontos).toBe(Number(p.id.slice(4))%2?0:1000));
  expect(await a.get(`revisaoSalas/${codigo}/publicacao/estado`)).toEqual(publicado);expect(await a.get(`revisaoSalas/${codigo}`)).toEqual(sala);
  const reiniciada=new RevisaoService({...c.opcoes,store:b}),retomada=await reiniciada.estado(c.aluno(0),codigo);
  expect(retomada.envio).toEqual(envios.find(e=>e.i===0).recibo.envio);expect(retomada.estado.feedback).toBeNull();expect(retomada.estado.participacao).toBeNull();expect(JSON.stringify(retomada.estado)).not.toContain('Comentário sintético');
  await expect(reiniciada.responder(c.aluno(0),codigo,{rodadaId,alternativa:'E'})).rejects.toMatchObject({status:409});
  await b.set('alunoLogin/login1/vinculos/prof-1',{professorUid:'prof-1',turmaId:'t1',alunoId:'a1',revogado:true});
  await expect(reiniciada.estado(c.aluno(1),codigo)).rejects.toMatchObject({status:403});await expect(reiniciada.responder(c.aluno(1),codigo,{rodadaId,alternativa:'A'})).rejects.toMatchObject({status:403});
  await acao(c,codigo,'encerrar_pergunta');await acao(c,codigo,'mostrar_feedback');await acao(c,codigo,'mostrar_ranking');
  const ranking=(await segunda.estado(c.docente,codigo)).estado.ranking;expect(ranking).toHaveLength(100);expect(ranking.filter(p=>p.pontos===1000).every(p=>p.posicao===1)).toBe(true);
  await acao(c,codigo,'proxima_rodada');await acao(c,codigo,'abrir_pergunta');const rodada2=(await segunda.estado(c.docente,codigo)).estado.rodada;c.tempo(rodada2.encerraEmMs);
  await expect(segunda.responder(c.aluno(0),codigo,{rodadaId:rodada2.id,alternativa:'B'})).rejects.toMatchObject({status:409});expect(await b.list(`revisaoSalas/${codigo}/respostas`)).toHaveLength(100);
  process.stdout.write('METRICAS_REVISAO_EMULADOR '+JSON.stringify({ambiente:'localhost Firestore emulator',projeto:projectId,instancias:2,participantes:100,envios:200,recibos:respostas.length,totalMs:Math.round(totalMs),p95Ms:Math.round(p95(duracoes)),maxMs:Math.round(Math.max(...duracoes)),pontos:50000,relogioPrazo:'sintetico-controlado',producaoHomologada:false})+'\n');
 },120000);
});
