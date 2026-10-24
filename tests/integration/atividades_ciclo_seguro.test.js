import {it,expect,vi,beforeEach} from 'vitest';
const m=vi.hoisted(()=>({docs:new Map(),writes:[],failTokens:false}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>{
 const doc=(_db,...parts)=>({path:parts.join('/')});
 const snap=ref=>({id:ref.path.split('/').at(-1),exists:()=>m.docs.has(ref.path),data:()=>m.docs.get(ref.path),ref});
 return {doc,collection:(_db,...parts)=>({path:parts.join('/')}),query:(ref,...filters)=>({...ref,filters}),where:(...parts)=>parts,serverTimestamp:()=>123,
 getDoc:async ref=>snap(ref),getDocs:async ref=>({docs:[...m.docs.entries()].filter(([path,data])=>path.startsWith(ref.path+'/')&&path.split('/').length===ref.path.split('/').length+1&&(ref.filters||[]).every(([k,op,v])=>op==='=='?data[k]===v:true)).map(([path])=>snap({path})),forEach(fn){this.docs.forEach(fn);}}),
 setDoc:async(ref,data)=>{m.writes.push({ref,data});m.docs.set(ref.path,{...m.docs.get(ref.path),...data});},deleteDoc:vi.fn(),
 writeBatch:()=>{const pending=[];return {set:(ref,data)=>pending.push({ref,data}),delete:vi.fn(),commit:async()=>{if(m.failTokens)throw new Error('Sem rede');for(const {ref,data}of pending){m.writes.push({ref,data});m.docs.set(ref.path,{...m.docs.get(ref.path),...data});}}};},
 runTransaction:async fn=>fn({get:async ref=>snap(ref),set:(ref,data)=>{m.writes.push({ref,data});m.docs.set(ref.path,{...m.docs.get(ref.path),...data});}})};
});
import {createAtividade,updateAtividade,deleteAtividade,createTokensForAtividade} from '@/lib/firebase-atividades';
import {decodeToken,chaveVinculoAtividade} from '@/utils/diario/tokenUtils';
beforeEach(()=>{m.docs.clear();m.writes=[];m.failTokens=false;});
const dados=()=>({id:'at',professorId:'p',status:'ativa',turmaIds:['t'],bimestre:3,notaMaxima:2,titulo:'Atividade',questoes:[{id:'q',enunciado:'Explique',tipo:'discursiva',notaMaxima:2}],alunosPorTurma:{t:[{id:'a',nome:'Ana',necessidades:['privado']}]}});
it('não grava cadastros de alunos no documento de atividade',async()=>{await createAtividade(dados());expect(m.docs.get('atividades/at')).not.toHaveProperty('alunosPorTurma');});
it('emite tokens imprevisíveis por turma e conserva segredo em repetição',async()=>{
 await createTokensForAtividade('at','t',[{id:'a',nome:'Ana'}]);await createTokensForAtividade('at','outra',[{id:'a',nome:'Bia'}]);
 const path=`atividades/at/tokens/${chaveVinculoAtividade('t','a')}`;const token=m.docs.get(path)?.token;
 expect(decodeToken(token)).toMatchObject({turmaId:'t',alunoId:'a',activityId:'at',segredo:expect.any(String)});expect(m.docs.get(`atividades/at/tokens/${chaveVinculoAtividade('outra','a')}`).token).not.toBe(token);
 await createTokensForAtividade('at','t',[{id:'a',nome:'Ana'}]);expect(m.docs.get(path).token).toBe(token);
});
it('arquiva sem apagar entregas, acessos e notas históricas',async()=>{
 m.docs.set('atividades/at',dados());m.docs.set('entregas/e',{activityId:'at',notaFinal:2});await deleteAtividade('at');
 expect(m.docs.get('atividades/at').status).toBe('arquivada');expect(m.docs.get('entregas/e').notaFinal).toBe(2);
});
it('com entrega recusa mudança de bimestre e preserva atividade',async()=>{
 m.docs.set('atividades/at',dados());m.docs.set('entregas/e',{activityId:'at',turmaId:'t',alunoId:'a'});
 await expect(updateAtividade('at',{...dados(),bimestre:4})).rejects.toThrow(/entregas|bimestre/i);expect(m.docs.get('atividades/at').bimestre).toBe(3);
});
it('edição de prazo mantém estrutura e não expõe cadastros',async()=>{
 m.docs.set('atividades/at',dados());m.docs.set('entregas/e',{activityId:'at',turmaId:'t',alunoId:'a'});
 await updateAtividade('at',{...dados(),dataEntrega:'2099-01-01'});expect(m.docs.get('atividades/at').dataEntrega).toBe('2099-01-01');
});
it('listagem de domínio conserva atividades arquivadas para relatórios históricos',async()=>{
 const {listAtividades}=await import('@/lib/firebase-atividades');m.docs.set('atividades/at',{...dados(),status:'arquivada'});
 expect(await listAtividades('p','t')).toEqual([expect.objectContaining({id:'at',status:'arquivada'})]);
});
it('falha de publicação não deixa documento ou links parcialmente gravados',async()=>{
 m.failTokens=true;await expect(createAtividade(dados())).rejects.toThrow('Sem rede');expect(m.docs.has('atividades/at')).toBe(false);expect(m.writes).toHaveLength(0);
 m.failTokens=false;await createAtividade(dados());expect(m.docs.get('atividades/at')).toMatchObject({id:'at'});expect(m.docs.has(`atividades/at/tokens/${chaveVinculoAtividade('t','a')}`)).toBe(true);
});
it('retomada do mesmo ID não duplica atividade nem troca acesso já emitido',async()=>{
 await createAtividade(dados());const path=`atividades/at/tokens/${chaveVinculoAtividade('t','a')}`,token=m.docs.get(path).token;
 await createAtividade(dados());expect([...m.docs.keys()].filter(p=>/^atividades\/[^/]+$/.test(p))).toEqual(['atividades/at']);expect(m.docs.get(path).token).toBe(token);
});
