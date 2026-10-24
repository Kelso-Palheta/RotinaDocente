import {act,renderHook,waitFor,cleanup} from '@testing-library/react';
import {useEntregas} from '@/hooks/atividades/useEntregas';
import {corrigirAtividade,detectarRespostasSimilares} from '@/utils/atividades/correcaoIA';
const mock=vi.hoisted(()=>({setDoc:vi.fn(async()=>{}),docs:[]}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/utils/atividades/correcaoIA',()=>({corrigirAtividade:vi.fn(async()=>({notaFinal:1,notaIA:1,feedback:'Feedback novo IA',criterios:[],modelo:'gemini'})),detectarRespostasSimilares:vi.fn(()=>({clusters:[],penalizados:new Set()}))}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),query:()=>({}),where:()=>({}),onSnapshot:(_q,callback)=>{callback({docs:mock.docs.map(d=>({id:d.id,data:()=>d}))});return()=>{};},doc:(_db,...parts)=>({path:parts.join('/')}),setDoc:mock.setDoc,serverTimestamp:()=>123}));
beforeEach(()=>{vi.clearAllMocks();mock.docs=[{id:'e',activityId:'at',alunoId:'a',turmaId:'t',bimestre:3,status:'entregue'}];});
afterEach(cleanup);
it('salva manual sem chamar IA, persiste feedback e notifica apenas aluno do escopo',async()=>{
 const changed=vi.fn();const {result}=renderHook(()=>useEntregas('at',changed,{turmaId:'t',bimestre:3}));
 await waitFor(()=>expect(result.current.entregas).toHaveLength(1));
 await act(async()=>{await result.current.corrigirManualmente('e',{notaMaxima:2},{nota:'0',feedback:'Reveja o conteúdo.'},'prof');});
 expect(corrigirAtividade).not.toHaveBeenCalled();
 expect(mock.setDoc.mock.calls[0][1]).toMatchObject({notaRevisada:0,tipoCorrecao:'manual',status:'revisado',feedback:'Reveja o conteúdo.'});
 expect(changed).toHaveBeenCalledWith({alunoId:'a',turmaId:'t',bimestre:3,notaFinal:0});
});
it('nova correção IA confirmada remove precedência de revisão anterior e preserva auditoria',async()=>{
 mock.docs[0]={...mock.docs[0],status:'revisado',tipoCorrecao:'manual',notaRevisada:0,feedback:'Manual anterior'};
 const {result}=renderHook(()=>useEntregas('at',undefined,{turmaId:'t',bimestre:3}));
 await waitFor(()=>expect(result.current.entregas).toHaveLength(1));
 await act(async()=>{await result.current.corrigirEntrega('e',{notaMaxima:2,enunciado:'Enunciado',gabarito:'Referência'});});
 expect(mock.setDoc.mock.calls[0][1]).toMatchObject({tipoCorrecao:'ia',notaRevisada:null,feedback:'Feedback novo IA',correcaoAnterior:{nota:0}});
});
it('manual zero não entra em penalização automática',async()=>{
 mock.docs=['a','b','c'].map(id=>({id,activityId:'at',alunoId:id,turmaId:'t',bimestre:3,status:'revisado',tipoCorrecao:'manual',notaRevisada:0,notaFinal:0}));
 const {result}=renderHook(()=>useEntregas('at',undefined,{turmaId:'t',bimestre:3}));
 await waitFor(()=>expect(result.current.entregas).toHaveLength(3));
 expect(detectarRespostasSimilares).not.toHaveBeenCalled();
});
it('falha ao refazer com IA preserva correção manual publicada',async()=>{
 mock.docs[0]={...mock.docs[0],status:'revisado',tipoCorrecao:'manual',notaRevisada:0,feedback:'Manual anterior'};
 vi.mocked(corrigirAtividade).mockRejectedValueOnce(new Error('IA indisponível'));
 const {result}=renderHook(()=>useEntregas('at',undefined,{turmaId:'t',bimestre:3}));
 await waitFor(()=>expect(result.current.entregas).toHaveLength(1));
 await act(async()=>{await expect(result.current.corrigirEntrega('e',{notaMaxima:2})).rejects.toThrow('IA indisponível');});
 expect(mock.setDoc).not.toHaveBeenCalled();
});
