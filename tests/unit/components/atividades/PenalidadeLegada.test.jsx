import {renderHook,waitFor,act,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
const m=vi.hoisted(()=>({setDoc:vi.fn(async()=>{})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),query:()=>({}),where:()=>({}),doc:()=>({}),serverTimestamp:()=>1,setDoc:m.setDoc,onSnapshot:(_q,fn)=>{fn({docs:[{id:'e',data:()=>({activityId:'at',alunoId:'a',turmaId:'t',bimestre:3,status:'corrigido',penalidadePlagio:true,notaFinal:1,notaOriginal:2})}]});return()=>{};}}));
vi.mock('@/utils/atividades/correcaoIA',()=>({corrigirAtividade:async()=>({notaFinal:2,resultados:{q:{notaObtida:2}},modelo:'gemini'}),detectarRespostasSimilares:()=>({clusters:[],penalizados:new Set()})}));
import {useEntregas} from '@/hooks/atividades/useEntregas';
afterEach(cleanup);
it('nova correção IA não mantém aviso antigo de penalização automática',async()=>{
 const {result}=renderHook(()=>useEntregas('at',undefined,{turmaId:'t',bimestre:3}));await waitFor(()=>expect(result.current.entregas).toHaveLength(1));
 await act(async()=>{await result.current.corrigirEntrega('e',{questoes:[{id:'q',tipo:'discursiva',notaMaxima:2}]});});
 expect(m.setDoc.mock.calls[0][1]).toMatchObject({notaFinal:2,penalidadePlagio:false});
});
