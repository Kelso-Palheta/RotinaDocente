import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({docs:new Map(),writes:[],session:null}));
const snapshot=path=>({id:path.split('/').at(-1),exists:m.docs.has(path),data:()=>m.docs.get(path)});
vi.mock('@/lib/firebase-admin',()=>({getAdminDb:()=>({doc:path=>({path,get:async()=>snapshot(path)}),runTransaction:async fn=>fn({get:async ref=>snapshot(ref.path),set:(ref,data)=>{m.writes.push({path:ref.path,data});m.docs.set(ref.path,data);}})})}));
vi.mock('@/lib/aluno/session',()=>({getSessionFromRequest:()=>m.session}));
vi.mock('firebase-admin/firestore',()=>({FieldValue:{serverTimestamp:()=>123}}));
import {GET} from '@/app/api/aluno/atividade/[id]/route';
import {POST} from '@/app/api/aluno/entregar/route';
import {encodeToken} from '@/utils/diario/tokenUtils';
const legacy=()=>encodeToken('a','at');
const novo=()=>btoa(`a:at:t:${'f'.repeat(64)}`);
const key=()=>btoa(JSON.stringify(['t','a'])).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const get=token=>GET(new Request(`http://localhost/api/aluno/atividade/at?token=${encodeURIComponent(token)}`),{params:Promise.resolve({id:'at'})});
const post=(data={})=>POST(new Request('http://localhost/api/aluno/entregar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({activityId:'at',alunoId:'a',turmaId:'t',bimestre:3,respostas:{q:{tipo:'discursiva',resposta:'Uma resposta válida'}},...data})}));
beforeEach(()=>{
 m.docs.clear();m.writes=[];m.session=null;
 m.docs.set('atividades/at',{professorId:'p',titulo:'Título',turmaIds:['t'],bimestre:3,status:'ativa',dataEntrega:'2099-01-01',notaMaxima:2,questoes:[{id:'q',tipo:'discursiva',enunciado:'Explique',notaMaxima:2,rubrica:'Privada'}],alunosPorTurma:{t:[{id:'a',nome:'Ana',necessidades:['privado']}]},materiais:[{texto:'Privado'}]});
 m.docs.set('professores/p/turmas/data',{turmas:[{id:'t',alunos:[{id:'a',nome:'Ana'}]}]});
});
function emitir(token=novo()) {m.docs.set(`atividades/at/tokens/${key()}`,{token,nome:'Ana',alunoId:'a',turmaId:'t'});return token;}
it('recusa identificador fabricado sem acesso emitido',async()=>{expect((await get(legacy())).status).toBe(403);});
it('recusa entrega sem credencial e não grava',async()=>{expect((await post()).status).toBe(401);expect(m.writes).toEqual([]);});
it('legado emitido exige sessão com vínculo vigente do mesmo aluno',async()=>{
 m.docs.set('atividades/at/tokens/a',{token:legacy(),alunoId:'a',turmaId:'t'});
 expect((await get(legacy())).status).toBe(401);
 m.session={loginKey:'lk'};m.docs.set('alunoLogin/lk/vinculos/p',{professorUid:'p',turmaId:'t',alunoId:'outro'});
 expect((await get(legacy())).status).toBe(403);
 m.docs.set('alunoLogin/lk/vinculos/p',{professorUid:'p',turmaId:'t',alunoId:'a'});
 expect((await get(legacy())).status).toBe(200);
});
it('novo token emitido permite leitura sem cadastro da turma, rubrica ou material privado',async()=>{
 const res=await get(emitir());expect(res.status).toBe(200);const data=await res.json();
 expect(data.atividade).toMatchObject({titulo:'Título',questoes:[{id:'q',enunciado:'Explique'}]});
 expect(data.atividade).not.toHaveProperty('alunosPorTurma');expect(data.atividade).not.toHaveProperty('materiais');expect(data.atividade.questoes[0]).not.toHaveProperty('rubrica');
});
it('token revogado, aluno removido ou atividade exclusiva de outro aluno não permitem acesso',async()=>{
 const token=emitir();m.docs.get(`atividades/at/tokens/${key()}`).revogado=true;expect((await get(token)).status).toBe(403);
 delete m.docs.get(`atividades/at/tokens/${key()}`).revogado;m.docs.get('atividades/at').alunoExclusivoId='outro';expect((await get(token)).status).toBe(403);
 delete m.docs.get('atividades/at').alunoExclusivoId;m.docs.get('professores/p/turmas/data').turmas[0].alunos=[];expect((await get(token)).status).toBe(403);
});
it('recusa contexto adulterado e aceita contexto derivado do token',async()=>{
 const token=emitir();expect((await post({token,turmaId:'outra'})).status).toBe(403);expect((await post({token,bimestre:4})).status).toBe(403);expect(m.writes).toHaveLength(0);
 expect((await post({token})).status).toBe(200);expect(m.writes[0].data).toMatchObject({alunoId:'a',turmaId:'t',bimestre:3,status:'entregue'});
});
it('preserva correção anterior e recusa segunda entrega, inclusive registro legado',async()=>{
 const token=emitir();const corrigida={activityId:'at',alunoId:'a',turmaId:'t',notaFinal:2,status:'corrigido',feedback:'Preservar'};
 m.docs.set('entregas/at_a',corrigida);expect((await post({token})).status).toBe(409);expect(m.writes).toEqual([]);expect(m.docs.get('entregas/at_a')).toEqual(corrigida);
});
it('recusa respostas desconhecidas, vazias e prazo inválido antes de gravar',async()=>{
 const token=emitir();expect((await post({token,respostas:{outra:{resposta:'Algo'}}})).status).toBe(400);
 expect((await post({token,respostas:{q:{resposta:''}}})).status).toBe(400);
 m.docs.get('atividades/at').dataEntrega='invalido';expect((await post({token})).status).toBe(400);expect(m.writes).toEqual([]);
});
it('arquivar mantém leitura da devolutiva existente e bloqueia novas entregas',async()=>{
 const token=emitir();m.docs.get('atividades/at').status='arquivada';m.docs.set('entregas/at_a',{activityId:'at',turmaId:'t',alunoId:'a',status:'corrigido',notaFinal:2,feedback:'Devolutiva preservada'});
 const r=await get(token);expect(r.status).toBe(200);expect((await r.json()).entrega.feedback).toBe('Devolutiva preservada');expect((await post({token})).status).toBe(403);
});
it('lê vínculo legado quando documento canônico ainda não existe, sem migrar ou gravar',async()=>{
 const token=emitir();const diario=m.docs.get('professores/p/turmas/data');m.docs.delete('professores/p/turmas/data');m.docs.set('users/p/turmas/data',diario);
 expect((await get(token)).status).toBe(200);expect(m.writes).toHaveLength(0);
});
