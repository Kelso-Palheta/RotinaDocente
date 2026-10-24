import {it,expect,vi,beforeEach} from 'vitest';
const m=vi.hoisted(()=>({session:{loginKey:'lk',nome:'Ana',vinculos:[{professorUid:'p',turmaId:'t',alunoId:'a'}]},vinculo:{professorUid:'p',turmaId:'t',alunoId:'a'},leituras:[]}));
vi.mock('@/lib/aluno/session',()=>({getSessionFromRequest:()=>m.session}));
vi.mock('@/lib/firebase-admin',()=>({getAdminDb:()=>({doc:path=>({get:async()=>{m.leituras.push(path);return {exists:path==='alunoLogin/lk/vinculos/p'||path.includes('/tokens/'),data:()=>path.includes('/tokens/')?{token:'segredo',alunoId:'a',turmaId:'t'}:m.vinculo};}}),collection:path=>({where(){return this;},get:async()=>({docs:path==='atividades'?[{id:'at',data:()=>({professorId:'p',turmaIds:['t'],titulo:'Livro',bimestre:3,status:'ativa',alunosPorTurma:{t:[{id:'outro',necessidades:['privado']}]},questoes:[{id:'q',rubrica:'Privada',gabarito:'A'}]})}]:[]})})})}));
import {GET} from '@/app/api/aluno/boletim/route';
beforeEach(()=>{m.vinculo={professorUid:'p',turmaId:'t',alunoId:'a'};m.leituras=[];});
const req=aluno=>new Request(`http://localhost/api/aluno/boletim?professorUid=p&turmaId=t&alunoId=${aluno}`);
it('não entrega boletim/tokens de colega da mesma turma',async()=>{const r=await GET(req('outro'));expect(r.status).toBe(403);expect(m.leituras).not.toContain('notasAluno/p_t_outro');});
it('usa projeção pública mínima também na listagem do Portal',async()=>{const r=await GET(req('a'));expect(r.status).toBe(200);const d=await r.json();expect(d.atividades[0]).not.toHaveProperty('alunosPorTurma');expect(d.atividades[0].questoes[0]).not.toHaveProperty('rubrica');expect(d.tokens.at).toBe('segredo');});
