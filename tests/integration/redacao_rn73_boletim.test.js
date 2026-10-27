import {it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({docs:[{id:'nova',schemaVersion:2,status:'publicado',alunoId:'a',turmaId:'t',loginKey:'lk',result:'Nova',publicadoEm:'2026-10-27',privateNote:'secret'},{id:'draft',schemaVersion:2,status:'corrigido',alunoId:'a',turmaId:'t',loginKey:'lk'},{id:'colega',schemaVersion:2,status:'publicado',alunoId:'b',turmaId:'t',loginKey:'outro'}]}));
vi.mock('@/lib/aluno/session',()=>({getSessionFromRequest:()=>({loginKey:'lk',login:'ana1234',nome:'Ana'})}));
vi.mock('@/lib/firebase-admin',()=>({getAdminDb:()=>({doc:path=>({get:async()=>({id:path.split('/').pop(),exists:path.includes('/vinculos/')||path.endsWith('/correcoes/lk'),data:()=>path.includes('/vinculos/')?{professorUid:'p',turmaId:'t',alunoId:'a'}:{loginKey:'lk',result:'Legado'}})}),collection:path=>({where(){return this;},get:async()=>({docs:path.includes('/correcoes')?m.docs.map(data=>({id:data.id,data:()=>data})):[]})})})}));
import {GET} from '@/app/api/aluno/boletim/route';
it('RN73 boletim combina IDs novos e legado, excluindo colegas/rascunhos e campos privados',async()=>{
 const response=await GET(new Request('http://localhost/api/aluno/boletim?professorUid=p&turmaId=t&alunoId=a'));expect(response.status).toBe(200);const data=await response.json();expect(data.redacoes.map(r=>r.id)).toEqual(['nova','lk']);expect(data.redacao.id).toBe('nova');expect(data.redacoes[0]).not.toHaveProperty('privateNote');expect(data.redacoes[0].publicadoEm).toBe('2026-10-27');
});
