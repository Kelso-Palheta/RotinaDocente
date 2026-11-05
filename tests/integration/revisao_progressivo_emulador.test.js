import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { FirestoreRevisaoStore } from '../../frontend/src/infraestrutura/revisao/FirestoreStore';
import { RevisaoService } from '../../frontend/src/aplicacao/revisao/RevisaoService';
import { cenario, salaPronta, acao } from '../helpers/revisaoCenario';
const host = process.env.FIRESTORE_EMULATOR_HOST;
const local = Boolean(host && /^(127\.0\.0\.1|localhost):\d+$/.test(host));

describe.skipIf(!local)('ensaio progressivo: respostas únicas e duas instâncias Firestore',()=>{
 it.each([25,50,100])('%i estudantes: confirma e persiste uma resposta por aluno',async n=>{
  const {Firestore}=await import('../../frontend/node_modules/firebase-admin/lib/firestore/index.js');
  const projectId=`demo-revisao-unicos-${n}`;
  const dbA=new Firestore({projectId}),dbB=new Firestore({projectId});
  const a=new FirestoreRevisaoStore(dbA),b=new FirestoreRevisaoStore(dbB);
  let codigo;
  try{
   const c=await cenario(n,a);c.opcoes.gerarCodigo=()=> 'UNIQ2345';c.service=new RevisaoService(c.opcoes);
   const segunda=new RevisaoService({...c.opcoes,store:b});codigo=await salaPronta(c);
   await Promise.all(Array.from({length:n},(_,i)=>(i%2?c.service:segunda).entrar(c.aluno(i),codigo)));
   await acao(c,codigo,'mostrar_conteudo');await acao(c,codigo,'abrir_pergunta');
   const rodadaId=(await segunda.estado(c.docente,codigo)).estado.rodada.id;
   const duracoes=[],inicio=performance.now();
   const recibos=await Promise.all(Array.from({length:n},async(_,i)=>{
    const t=performance.now();const recibo=await(i%2?c.service:segunda).responder(c.aluno(i),codigo,{rodadaId,alternativa:'B'});
    duracoes.push(performance.now()-t);return recibo;
   }));
   const totalMs=performance.now()-inicio;
   recibos.forEach(r=>expect(r.envio.status).toBe('confirmado'));
   const respostas=await b.list(`revisaoSalas/${codigo}/respostas`),participantes=await b.list(`revisaoSalas/${codigo}/participantes`);
   expect(respostas).toHaveLength(n);expect(new Set(respostas.map(r=>r.id)).size).toBe(n);expect(participantes.reduce((s,p)=>s+p.pontos,0)).toBe(n*1000);
   const p95Ms=[...duracoes].sort((a,b)=>a-b)[Math.ceil(n*.95)-1];
   process.stdout.write('METRICAS_REVISAO_UNICOS '+JSON.stringify({projeto:projectId,participantes:n,instancias:2,envios:n,recibos:respostas.length,totalMs:Math.round(totalMs),p95Ms:Math.round(p95Ms),maxMs:Math.round(Math.max(...duracoes)),metaP95Ms:2000,metaCumprida:p95Ms<=2000,producaoHomologada:false})+'\n');
  }finally{
   if(codigo)await dbA.recursiveDelete(dbA.doc(`revisaoSalas/${codigo}`));
   await Promise.all([dbA.recursiveDelete(dbA.doc('professores/prof-1')),dbA.recursiveDelete(dbA.doc('revisaoDocentes/prof-1')),...Array.from({length:n},(_,i)=>dbA.recursiveDelete(dbA.doc(`alunoLogin/login${i}`)))]);
   await Promise.all([dbA.terminate(),dbB.terminate()]);
  }
 },120000);
});
