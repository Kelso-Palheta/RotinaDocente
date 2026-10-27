import {it,expect,vi} from 'vitest';
vi.mock('@/lib/aluno/session',()=>({getSessionFromRequest:()=>({loginKey:'lk',login:'ana1234',nome:'Ana'})}));
vi.mock('@/lib/firebase-admin',()=>({getAdminDb:()=>({
 doc:path=>({get:async()=>({exists:path.includes('/vinculos/')||path.startsWith('notasAluno/'),data:()=>path.includes('/vinculos/')?{professorUid:'p',turmaId:'t',alunoId:'a'}:{bimestres:{3:{total:8}}}})}),
 collection:path=>({where(){return this;},get:async()=>{if(path.includes('/correcoes'))throw new Error('Serviço indisponível');return {docs:[]};}}),
})}));
import {GET} from '@/app/api/aluno/boletim/route';
it('RN73 falha na consulta de redações fica explícita e preserva notas carregadas',async()=>{
 const response=await GET(new Request('http://localhost/api/aluno/boletim?professorUid=p&turmaId=t&alunoId=a'));
 expect(response.status).toBe(200);const data=await response.json();expect(data.falhas).toEqual({redacoes:true});expect(data.notas.bimestres[3].total).toBe(8);expect(data.redacoes).toEqual([]);
});
