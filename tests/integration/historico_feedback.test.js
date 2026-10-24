import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDocs:vi.fn(), list:vi.fn(), where:vi.fn((...args)=>args) }));
vi.mock('@/lib/firebase',()=>({ db:{} }));
vi.mock('@/lib/firebase-atividades',()=>({listAtividades:mocks.list}));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),query:(...parts)=>parts,where:mocks.where,getDocs:mocks.getDocs}));
import { carregarHistoricoFeedbackAluno } from '@/infraestrutura/atividades/historicoFeedback';
it('carrega histórico só do aluno/turma/professor selecionados e propaga falha de leitura',async()=>{
 mocks.list.mockResolvedValue([{id:'at',professorId:'p',turmaIds:['t'],bimestre:3,titulo:'Artes'}]);
 const entrega={activityId:'at',alunoId:'a',turmaId:'t',bimestre:3,status:'revisado',notaRevisada:0,feedback:'Feedback manual'};
 mocks.getDocs.mockResolvedValue({docs:[entrega,{...entrega,turmaId:'outra'},{...entrega,alunoId:'outro'}].map((e,i)=>({id:String(i),data:()=>e}))});
 const result=await carregarHistoricoFeedbackAluno('p','t','a');
 expect(mocks.list).toHaveBeenCalledWith('p','t');
 expect(mocks.where).toHaveBeenCalledWith('alunoId','==','a');
 expect(result).toHaveLength(1);expect(result[0]).toMatchObject({nota:0,feedback:'Feedback manual'});
 mocks.getDocs.mockRejectedValueOnce(new Error('Sem conexão'));
 await expect(carregarHistoricoFeedbackAluno('p','t','a')).rejects.toThrow('Sem conexão');
});
