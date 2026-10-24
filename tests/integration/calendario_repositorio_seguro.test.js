import {it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({docs:new Map(),writes:[],failure:false}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({
 doc:(_db,...p)=>({path:p.join('/')}),collection:(_db,...p)=>({path:p.join('/')}),
 getDoc:async r=>({exists:()=>m.docs.has(r.path),data:()=>m.docs.get(r.path)}),
 getDocs:async r=>({docs:[...m.docs].filter(([p])=>p.startsWith(r.path+'/')).map(([p,data])=>({id:p.split('/').at(-1),ref:{path:p},data:()=>data}))}),
 runTransaction:async(_db,fn)=>{const ws=[];const out=await fn({get:async r=>({exists:()=>m.docs.has(r.path),data:()=>m.docs.get(r.path)}),set:(r,data)=>ws.push(['set',r.path,data]),delete:r=>ws.push(['delete',r.path])});if(m.failure)throw new Error('Falha de gravação');for(const [tipo,p,data]of ws){if(tipo==='set')m.docs.set(p,data);else m.docs.delete(p);}m.writes.push(...ws);return out;}
}));
import {CalendarioRepository} from '@/infraestrutura/calendario/CalendarioRepository';
beforeEach(()=>{m.docs.clear();m.writes=[];m.failure=false;});
it('carrega legado só para o ano compatível e grava snapshot por turma/ano atomicamente',async()=>{
 m.docs.set('professores/p/grades_horarias/t',{turmaId:'t',dataInicioPeriodo:'2026-02-01',dataFimPeriodo:'2026-12-01'});
 m.docs.set('professores/p/planejamentos/t',{topicos:[{id:'t1'}]});
 m.docs.set('professores/p/aulas_agendadas/a',{id:'a',turmaId:'t',dataAgendada:'2026-11-02',status:'CONCLUIDA'});
 m.docs.set('professores/p/aulas_agendadas/b',{id:'b',turmaId:'outra',dataAgendada:'2026-11-02'});
 const repo=new CalendarioRepository('p');const antigo=await repo.carregar('t',2026);expect(antigo.planejamento.topicos).toHaveLength(1);expect((await repo.carregar('t',2027)).planejamento).toBeNull();
 await repo.salvar(antigo,{grade:{...antigo.grade,anoLetivo:2026},aulas:antigo.aulas,planejamento:antigo.planejamento,feriados:[]});
 expect(m.docs.get('professores/p/grades_horarias/t')).not.toHaveProperty('anoLetivo');expect(m.docs.has('professores/p/grades_horarias/t__2026')).toBe(true);expect(m.docs.has('professores/p/aulas_agendadas/b')).toBe(true);
});
it('rejeita prévia obsoleta e falha mantém documentos originais',async()=>{
 const repo=new CalendarioRepository('p');const snapshot=await repo.carregar('t',2026);
 await repo.salvar(snapshot,{aulas:[],planejamento:{topicos:[]},feriados:[]});
 await expect(repo.salvar(snapshot,{aulas:[]})).rejects.toThrow(/mudou|atualiz/i);
 const atualizado=await repo.carregar('t',2026);m.failure=true;const before=JSON.stringify([...m.docs]);
 await expect(repo.salvar(atualizado,{grade:{anoLetivo:2026},aulas:[]})).rejects.toThrow('Falha de gravação');expect(JSON.stringify([...m.docs])).toBe(before);
});
