import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({getDocs:vi.fn(),getDoc:vi.fn(),setDoc:vi.fn(),runTransaction:vi.fn(),transactionSet:vi.fn()}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({
 doc:(_db,...parts)=>({path:parts.join('/')}),collection:(_db,...parts)=>({path:parts.join('/')}),
 query:(ref,...constraints)=>({...ref,constraints}),where:(field,op,value)=>({field,op,value}),
 getDocs:mock.getDocs,getDoc:mock.getDoc,setDoc:mock.setDoc,runTransaction:mock.runTransaction,
 deleteDoc:vi.fn(),writeBatch:vi.fn(),serverTimestamp:()=>123,
}));
import {sincronizarTodasAsNotas} from '@/lib/firebase-atividades';
const atv={id:'at',professorId:'p',titulo:'Trabalho',turmaIds:['t1','t2'],bimestre:1,notaMaxima:2};
const makeTurmas=()=>['t1','t2'].map(id=>({id,alunos:[{id:'a'}],bimestres:{'1':{atividades:[],notas:{a:{simulado:id==='t2'?4.2:3}}},'2':{atividades:[],notas:{a:{simulado:1}}}}}));
const snapshot=data=>({exists:()=>true,data:()=>data});
beforeEach(()=>{
 vi.clearAllMocks();
 mock.getDoc.mockResolvedValue(snapshot({turmas:makeTurmas()}));
 mock.getDocs.mockImplementation(async q=>({docs:q.path==='atividades'
  ? [{id:atv.id,data:()=>atv}]
  : ['t1','t2'].map((turmaId,i)=>({id:'e'+i,data:()=>({activityId:'at',turmaId,alunoId:'a',bimestre:1,status:'corrigido',notaFinal:i+1})}))}));
 mock.runTransaction.mockImplementation(async(_db,fn)=>fn({get:async()=>snapshot({turmas:makeTurmas()}),set:mock.transactionSet}));
});
it('persiste somente turma/bimestre selecionados em transação sobre estado atual',async()=>{
 const result=await sincronizarTodasAsNotas('p',{turmaId:'t1',bimestre:1});
 expect(result.sincronizadas).toBe(1);expect(mock.runTransaction).toHaveBeenCalledTimes(1);
 const [ref,data]=mock.transactionSet.mock.calls[0];
 expect(ref.path).toBe('professores/p/turmas/data');
 expect(data.turmas[0].bimestres['1'].notas.a).toEqual({simulado:3,at:1});
 expect(data.turmas[1].bimestres['1'].notas.a).toEqual({simulado:4.2});
 expect(data.turmas[0].bimestres['2'].notas.a).toEqual({simulado:1});
 expect(mock.setDoc).not.toHaveBeenCalled();
});
it('mantém sincronização global sem copiar notas entre turmas de atividade compartilhada',async()=>{
 const result=await sincronizarTodasAsNotas('p');
 expect(result.sincronizadas).toBe(2);
 const data=mock.transactionSet.mock.calls[0][1];
 expect(data.turmas[0].bimestres['1'].notas.a.at).toBe(1);
 expect(data.turmas[1].bimestres['1'].notas.a.at).toBe(2);
});
it('recusa escopo inválido antes de qualquer consulta',async()=>{
 await expect(sincronizarTodasAsNotas('p',{turmaId:'',bimestre:1})).rejects.toThrow(/turma/i);
 expect(mock.getDocs).not.toHaveBeenCalled();expect(mock.transactionSet).not.toHaveBeenCalled();
});
it('não grava quando o bimestre filtrado não tem atividades',async()=>{
 const result=await sincronizarTodasAsNotas('p',{turmaId:'t1',bimestre:2});
 expect(result.sincronizadas).toBe(0);expect(mock.transactionSet).not.toHaveBeenCalled();
});
