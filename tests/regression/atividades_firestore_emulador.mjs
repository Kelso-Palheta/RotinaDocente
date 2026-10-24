/** Execução isolada: FIRESTORE_EMULATOR_HOST=127.0.0.1:... node --test este-arquivo. */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
const host=process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('Este teste só pode executar contra emulador local explícito.');
const project='demo-rotina-atividades';
const base=`http://${host}/v1/projects/${project}/databases/(default)/documents`;
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const token=uid=>`${b64({alg:'none',typ:'JWT'})}.${b64({iss:`https://securetoken.google.com/${project}`,aud:project,sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,firebase:{sign_in_provider:'custom'}})}.`;
const value=x=>typeof x==='string'?{stringValue:x}:typeof x==='number'?{integerValue:String(x)}:typeof x==='boolean'?{booleanValue:x}:Array.isArray(x)?{arrayValue:{values:x.map(value)}}:{mapValue:{fields:fields(x)}};
const fields=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]));
const write=(path,data)=>({update:{name:`projects/${project}/databases/(default)/documents/${path}`,fields:fields(data)}});
const request=async(path,uid,method='GET',body)=>fetch(`${base}${path}`,{method,headers:{Authorization:`Bearer ${uid==='owner'?'owner':token(uid)}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
const commit=(uid,writes)=>request(':commit',uid,'POST',{writes});
before(async()=>{
 const r=await commit('owner',[write('atividades/at',{professorId:'p',turmaIds:['t'],bimestre:3}),write('atividades/at/tokens/a',{token:'segredo',alunoId:'a',turmaId:'t'}),write('entregas/e',{activityId:'at',alunoId:'a',turmaId:'t',notaFinal:2})]);assert.equal(r.status,200,await r.text());
});
test('professor dono lê atividade e token; outro professor recebe recusa',async()=>{
 for(const path of ['/atividades/at','/atividades/at/tokens/a']){assert.equal((await request(path,'p')).status,200);assert.equal((await request(path,'outro')).status,403);}
});
test('consulta por professor autorizado funciona; consulta ampla não expõe outras contas',async()=>{
 const query={structuredQuery:{from:[{collectionId:'atividades'}],where:{fieldFilter:{field:{fieldPath:'professorId'},op:'EQUAL',value:{stringValue:'p'}}}}};
 assert.equal((await request(':runQuery','p','POST',query)).status,200);assert.equal((await request(':runQuery','outro','POST',query)).status,403);
});
test('entregas legadas são consultadas pela atividade e corrigidas somente pelo dono',async()=>{
 const query={structuredQuery:{from:[{collectionId:'entregas'}],where:{fieldFilter:{field:{fieldPath:'activityId'},op:'EQUAL',value:{stringValue:'at'}}}}};
 assert.equal((await request(':runQuery','p','POST',query)).status,200);assert.equal((await request(':runQuery','outro','POST',query)).status,403);
 assert.equal((await commit('outro',[write('entregas/e',{activityId:'at',alunoId:'a',turmaId:'t',notaFinal:0})])).status,403);
 assert.equal((await commit('p',[write('entregas/e',{activityId:'at',alunoId:'a',turmaId:'t',notaFinal:1})])).status,200);
});
test('atividade e vários acessos podem ser publicados no mesmo lote',async()=>{
 const writes=[write('atividades/nova',{professorId:'p',turmaIds:['t'],bimestre:3}),...Array.from({length:25},(_,i)=>write(`atividades/nova/tokens/a${i}`,{token:`segredo${i}`,alunoId:`a${i}`,turmaId:'t'}))];
 const r=await commit('p',writes);assert.equal(r.status,200,await r.text());
});
test('não permite transferir autoria nem emitir acesso em atividade de outra conta',async()=>{
 assert.equal((await commit('outro',[write('atividades/at/tokens/intruso',{token:'x',alunoId:'a',turmaId:'t'})])).status,403);
 assert.equal((await commit('p',[write('atividades/at',{professorId:'outro',turmaIds:['t']})])).status,403);
});
