import {renderHook,waitFor} from '@testing-library/react';
import {useEntregas} from '@/hooks/atividades/useEntregas';
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({
 collection:()=>({}),query:()=>({}),where:()=>({}),onSnapshot:(_q,callback)=>{
  callback({docs:[{id:'e1',data:()=>({activityId:'at',turmaId:'t1',bimestre:'1',status:'entregue'})},{id:'e2',data:()=>({activityId:'at',turmaId:'t2',bimestre:1,status:'entregue'})},{id:'e3',data:()=>({activityId:'at',turmaId:'t1',bimestre:2,status:'entregue'})}]});return()=>{};
 },doc:()=>({}),setDoc:vi.fn(),getDoc:vi.fn(),serverTimestamp:()=>0,
}));
it('hook entrega somente documentos do recorte antes de correção e detecção de similaridade',async()=>{
 const {result}=renderHook(()=>useEntregas('at',undefined,{turmaId:'t1',bimestre:1}));
 await waitFor(()=>expect(result.current.entregas).toHaveLength(1));
 expect(result.current.entregas[0].id).toBe('e1');
});
