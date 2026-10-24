import {renderHook,waitFor,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
const m=vi.hoisted(()=>({setDoc:vi.fn(async()=>{}),docs:[{id:'e1',alunoId:'a',activityId:'at',turmaId:'t',bimestre:3,status:'corrigido',notaOriginal:8,notaFinal:8},{id:'e2',alunoId:'b',activityId:'at',turmaId:'t',bimestre:3,status:'corrigido',notaOriginal:8,notaFinal:8}]}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),query:()=>({}),where:()=>({}),doc:()=>({}),serverTimestamp:()=>1,setDoc:m.setDoc,onSnapshot:(_q,fn)=>{fn({docs:m.docs.map(d=>({id:d.id,data:()=>d}))});return()=>{};}}));
vi.mock('@/utils/atividades/correcaoIA',()=>({corrigirAtividade:vi.fn(),detectarRespostasSimilares:vi.fn(entregas=>({clusters:[entregas],penalizados:new Set(['a','b'])}))}));
import {useEntregas} from '@/hooks/atividades/useEntregas';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('similaridade informa revisão sem alterar nota ou gravar penalidade',async()=>{
 const changed=vi.fn();const {result}=renderHook(()=>useEntregas('at',changed,{turmaId:'t',bimestre:3}));
 await waitFor(()=>expect(result.current.entregas).toHaveLength(2));expect(m.setDoc).not.toHaveBeenCalled();expect(changed).not.toHaveBeenCalled();expect(result.current.similaridades).toHaveLength(1);
});
