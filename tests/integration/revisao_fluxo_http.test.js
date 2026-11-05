import {describe,it,expect} from 'vitest';
import {cenario,questaoSintetica,confirmar} from '../helpers/revisaoCenario';
import {criarHandlerRevisao} from '../../frontend/src/infraestrutura/revisao/httpServidor';
import {criarAcessoRevisao} from '../../frontend/src/infraestrutura/revisao/acessoServidor';
import {signSessionToken} from '../../frontend/src/lib/aluno/session';

describe('RV-INT-06 — fluxo completo HTTP com sessão e eventos',()=>{
 it('conecta conferência, sala, Portal, recibo SSE, prazo, feedback e ranking sem divulgar respostas antes da hora',async()=>{
  const c=await cenario();const loginKey='a'.repeat(64);
  await c.store.set(`alunoLogin/${loginKey}/vinculos/prof-1`,{professorUid:'prof-1',turmaId:'t1',alunoId:'a0'});
  const acesso=criarAcessoRevisao({obterAuth:()=>({verifyIdToken:async token=>{if(token!=='docente')throw Error('Inválido');return{uid:'prof-1',auth_time:1};},getUser:async()=>({disabled:false})})});
  const handler=criarHandlerRevisao({service:c.service,autenticar:acesso.autenticar,autorizarMidia:acesso.autorizarMidia,emitirCookieMidia:acesso.emitirCookieMidia,lerImagemAcervo:async()=>{throw Error('Este ensaio não usa imagens');}});
  const cookie=`aluno_session=${signSessionToken({loginKey})}`;
  async function req(partes,body,aluno=false,signal){
   const request=new Request('http://localhost:4190/api/revisao/'+partes,{method:body?'POST':'GET',headers:{origin:'http://localhost:4190',...(aluno?{cookie}:{authorization:'Bearer docente'}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal});
   return handler(request,{params:Promise.resolve({partes:partes.split('/')})});
  }
  expect((await req('catalogo')).status).toBe(200);
  for(let i=1;i<=2;i++){
   const id=questaoSintetica(i).id;const fonte=await(await req('questoes/'+id)).json();
   expect((await req(`questoes/${id}/aprovar`,{hashFonte:fonte.hashFonte,confirmacoes:confirmar,ajustes:{}})).status).toBe(200);
  }
  const criada=await req('salas',{selecao:{titulo:'Aulão HTTP sintético',turmaIds:['t1'],questaoIds:[questaoSintetica(1).id],duracaoSegundos:10}});
  expect(criada.status).toBe(200);const {sala}=await criada.json();const base=`salas/${sala.codigo}`;
  expect((await req(base+'/entrar',{},true)).status).toBe(200);
  async function comandar(acao){const {estado}=await(await req(base)).json();return req(base+'/comandos',{acao,revisao:estado.sala.revisao,rodadaId:estado.rodada.id});}
  expect((await comandar('mostrar_conteudo')).status).toBe(200);
  expect((await comandar('abrir_pergunta')).status).toBe(200);
  const aberto=await(await req(base,undefined,true)).json();expect(aberto.estado.feedback).toBeNull();expect(aberto.estado.participacao).toBeNull();
  expect(JSON.stringify(aberto)).not.toContain('gabarito');
  const abort=new AbortController();const stream=await req(base+'/eventos',undefined,true,abort.signal);expect(stream.status).toBe(200);
  const reader=stream.body.getReader();
  try{
   const respondida=await req(base+'/respostas',{rodadaId:aberto.estado.rodada.id,alternativa:'B'},true);
   expect(respondida.status).toBe(200);const recibo=await respondida.json();expect(recibo.envio.status).toBe('confirmado');expect(recibo.envio.pontos).toBeUndefined();
   const respostaSSE=(async()=>{let texto='';while(!texto.includes('"status":"confirmado"')){const {value,done}=await reader.read();if(done)throw Error('Stream terminou sem recibo');texto+=new TextDecoder().decode(value);}return texto;})();
   let timer;try{const texto=await Promise.race([respostaSSE,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Recibo SSE não chegou')),3000);})]);expect(texto).not.toContain('gabarito');}finally{clearTimeout(timer);}
  }finally{abort.abort();await reader.cancel();}
  expect((await comandar('mostrar_feedback')).status).toBe(409);
  c.tempo(110000);expect((await comandar('mostrar_feedback')).status).toBe(200);
  const feedback=await(await req(base,undefined,true)).json();expect(feedback.estado.feedback.gabarito).toBe('B');expect(Object.keys(feedback.estado.feedback.explicacoes)).toHaveLength(5);
  expect((await comandar('mostrar_ranking')).status).toBe(200);
  const ranking=await(await req(base,undefined,true)).json();expect(ranking.estado.ranking[0].pontos).toBe(1000);
  expect((await comandar('finalizar')).status).toBe(200);
 });
});
