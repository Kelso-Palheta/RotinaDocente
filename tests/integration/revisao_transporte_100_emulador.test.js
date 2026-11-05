import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { FirestoreRevisaoStore } from '../../frontend/src/infraestrutura/revisao/FirestoreStore';
import { RevisaoService } from '../../frontend/src/aplicacao/revisao/RevisaoService';
import { criarHandlerRevisao } from '../../frontend/src/infraestrutura/revisao/httpServidor';
import { criarAcessoRevisao } from '../../frontend/src/infraestrutura/revisao/acessoServidor';
import { signSessionToken } from '../../frontend/src/lib/aluno/session';
import { cenario, salaPronta, acao } from '../helpers/revisaoCenario';
const local = /^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '');
const p95 = valores => [...valores].sort((a,b)=>a-b)[Math.ceil(valores.length*.95)-1];

describe.skipIf(!local)('cem streams SSE e cem POSTs pelo BFF com Firestore local',()=>{
 it('autentica cookies, confirma pelo POST e SSE sem vazar gabarito e cancela assinaturas',async()=>{
  const {Firestore}=await import('../../frontend/node_modules/firebase-admin/lib/firestore/index.js');
  const projectId='demo-revisao-sse-100';
  const dbA=new Firestore({projectId}),dbB=new Firestore({projectId});
  const storeA=new FirestoreRevisaoStore(dbA),storeB=new FirestoreRevisaoStore(dbB);
  const streams=[],controladores=[];let codigo,timeout;
  const loginKey=i=>(i+1).toString(16).padStart(64,'0');
  try{
   const c=await cenario(100,storeA);c.opcoes.gerarCodigo=()=> 'SSEE2345';c.service=new RevisaoService(c.opcoes);
   const serviceB=new RevisaoService({...c.opcoes,store:storeB});codigo=await salaPronta(c);
   await Promise.all(Array.from({length:100},(_,i)=>storeA.set(`alunoLogin/${loginKey(i)}/vinculos/prof-1`,{professorUid:'prof-1',turmaId:'t1',alunoId:'a'+i})));
   const handlers=[c.service,serviceB].map(service=>{
    const acesso=criarAcessoRevisao({obterAuth:()=>({verifyIdToken:async token=>{if(token!=='docente-sintetico')throw Error('Inválido');return{uid:'prof-1',auth_time:1};},getUser:async()=>({disabled:false})})});
    return criarHandlerRevisao({service,autenticar:acesso.autenticar,autorizarMidia:acesso.autorizarMidia,emitirCookieMidia:acesso.emitirCookieMidia,lerImagemAcervo:async()=>{throw Error('Sem imagens neste ensaio');}});
   });
   const cookies=Array.from({length:100},(_,i)=>`aluno_session=${signSessionToken({loginKey:loginKey(i)})}`);
   function req(i,parte,body,signal){
    const partes=`salas/${codigo}/${parte}`,metodo=body===undefined?'GET':'POST';
    return handlers[i%2](new Request(`http://localhost:4190/api/revisao/${partes}`,{method:metodo,headers:{origin:'http://localhost:4190',cookie:cookies[i],...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal}),{params:Promise.resolve({partes:partes.split('/')})});
   }
   await Promise.all(Array.from({length:100},async(_,i)=>expect((await req(i,'entrar',{})).status).toBe(200)));
   await acao(c,codigo,'mostrar_conteudo');await acao(c,codigo,'abrir_pergunta');
   const rodadaId=(await c.service.estado(c.docente,codigo)).estado.rodada.id;
   const inicioAbertura=performance.now();
   async function proximoEstado(stream){
    while(true){
     const separador=stream.pendente.indexOf('\n\n');
     if(separador>=0){
      const evento=stream.pendente.slice(0,separador);stream.pendente=stream.pendente.slice(separador+2);
      const linha=evento.split('\n').find(l=>l.startsWith('data: '));
      if(!linha)continue;const payload=JSON.parse(linha.slice(6));
      if(evento.startsWith('event: erro'))throw Error('Erro SSE: '+JSON.stringify(payload));
      expect(evento).not.toContain('gabarito');expect(evento).not.toContain('Comentário sintético');
      expect(payload.estado?.feedback).toBeNull();return payload;
     }
     const {done,value}=await stream.reader.read();if(done)throw Error('Stream terminou antes da confirmação');
     stream.pendente+=stream.decoder.decode(value,{stream:true});
    }
   }
   const executar=async()=>{
    await Promise.all(Array.from({length:100},async(_,i)=>{
     const abort=new AbortController();controladores.push(abort);
     const response=await req(i,'eventos',undefined,abort.signal);
     expect(response.status).toBe(200);expect(response.headers.get('content-type')).toContain('text/event-stream');expect(response.headers.get('cache-control')).toBe('private, no-store');
     const stream={i,reader:response.body.getReader(),decoder:new TextDecoder(),pendente:''};streams.push(stream);
     const inicial=await proximoEstado(stream);expect(inicial.envio.status).toBe('nao_enviado');expect(inicial.estado.participacao).toBeNull();
    }));
    const aberturaMs=performance.now()-inicioAbertura;
    const enviadosEm=[],postMs=[],sseMs=[],recibosSSE=new Map();
    const confirmacoes=Promise.all(streams.map(async stream=>{
     while(true){const payload=await proximoEstado(stream);if(payload.envio?.status==='confirmado'){
      expect(enviadosEm[stream.i]).toBeTypeOf('number');expect(payload.envio.alternativa).toBe('B');expect(payload.envio.pontos).toBeUndefined();
      sseMs.push(performance.now()-enviadosEm[stream.i]);recibosSSE.set(stream.i,payload.envio.reciboId);return;
     }}
    }));
    // Observar a promessa imediatamente evita rejeição não tratada se um stream falhar cedo.
    confirmacoes.catch(()=>{});
    const inicioRespostas=performance.now();
    const recibos=await Promise.all(Array.from({length:100},async(_,i)=>{
     enviadosEm[i]=performance.now();const response=await req(i,'respostas',{rodadaId,alternativa:'B'});const payload=await response.json();
     expect(response.status).toBe(200);expect(payload.envio.status).toBe('confirmado');expect(payload.envio.pontos).toBeUndefined();postMs.push(performance.now()-enviadosEm[i]);return payload.envio;
    }));
    await confirmacoes;
    for(let i=0;i<100;i++)expect(recibosSSE.get(i)).toBe(recibos[i].reciboId);
    const respostas=await storeB.list(`revisaoSalas/${codigo}/respostas`),participantes=await storeB.list(`revisaoSalas/${codigo}/participantes`);
    expect(respostas).toHaveLength(100);expect(new Set(respostas.map(r=>r.id)).size).toBe(100);expect(participantes.reduce((s,p)=>s+p.pontos,0)).toBe(100000);
    process.stdout.write('METRICAS_REVISAO_TRANSPORTE '+JSON.stringify({projeto:projectId,instancias:2,streams:streams.length,posts:100,recibos:respostas.length,confirmacoesSSE:recibosSSE.size,aberturaStreamsMs:Math.round(aberturaMs),totalRespostasMs:Math.round(performance.now()-inicioRespostas),postP95Ms:Math.round(p95(postMs)),postMaxMs:Math.round(Math.max(...postMs)),sseP95Ms:Math.round(p95(sseMs)),sseMaxMs:Math.round(Math.max(...sseMs)),metaCumprida:p95(postMs)<=2000&&p95(sseMs)<=2000,tcp:false,producaoHomologada:false})+'\n');
   };
   await Promise.race([executar(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Ensaio SSE excedeu 45s')),45000);})]);
  }finally{
   clearTimeout(timeout);controladores.forEach(c=>c.abort());await Promise.allSettled(streams.map(s=>s.reader.cancel()));
   if(codigo)await dbA.recursiveDelete(dbA.doc(`revisaoSalas/${codigo}`));
   await Promise.all([dbA.recursiveDelete(dbA.doc('professores/prof-1')),dbA.recursiveDelete(dbA.doc('revisaoDocentes/prof-1')),...Array.from({length:100},(_,i)=>dbA.recursiveDelete(dbA.doc(`alunoLogin/login${i}`))),...Array.from({length:100},(_,i)=>dbA.recursiveDelete(dbA.doc(`alunoLogin/${loginKey(i)}`)))]);
   await Promise.all([dbA.terminate(),dbB.terminate()]);
  }
 },60000);
});
