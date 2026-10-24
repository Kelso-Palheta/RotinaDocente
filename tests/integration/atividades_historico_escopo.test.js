import {it,vi,expect} from 'vitest';
const m=vi.hoisted(()=>({consultas:[]}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/lib/firebase-atividades',()=>({listAtividades:async()=>[{id:'at1',professorId:'p',turmaIds:['t'],bimestre:3},{id:'at2',professorId:'p',turmaIds:['t'],bimestre:3}]}));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),where:(...a)=>a,query:(_ref,...filtros)=>filtros,getDocs:async consulta=>{m.consultas.push(consulta);return{docs:[]};}}));
import {carregarHistoricoFeedbackAluno} from '@/infraestrutura/atividades/historicoFeedback';
it('relatório consulta entregas por atividade autorizada e aluno, sem busca ampla de outros professores',async()=>{
 await carregarHistoricoFeedbackAluno('p','t','a');expect(m.consultas).toHaveLength(2);
 expect(m.consultas[0]).toContainEqual(['activityId','==','at1']);expect(m.consultas[1]).toContainEqual(['activityId','==','at2']);expect(m.consultas.every(c=>c.some(f=>f[0]==='alunoId'&&f[2]==='a'))).toBe(true);
});
