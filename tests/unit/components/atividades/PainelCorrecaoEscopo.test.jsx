import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {AtividadePainel} from '@/components/atividades/AtividadePainel';
import {useEntregas} from '@/hooks/atividades/useEntregas';
vi.mock('@/hooks/atividades/useEntregas',()=>({useEntregas:vi.fn()}));
vi.mock('@/components/atividades/EntregaDrawer',()=>({EntregaDrawer:()=>null}));
vi.mock('@/components/atividades/UrlCopyPanel',()=>({UrlCopyPanel:()=>null}));
vi.mock('@/components/atividades/AtividadeForm',()=>({AtividadeForm:()=>null}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),getDocs:async()=>({forEach:()=>{}})}));
vi.mock('@/lib/firebase-atividades',()=>({getAtividade:async()=>({id:'at',titulo:'Trabalho',bimestre:1,turmaIds:['t1','t2'],notaMaxima:2})}));
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('corrigir todas atua apenas nas entregas da turma/bimestre e sincroniza só o aluno corrigido',async()=>{
 vi.spyOn(window,'confirm').mockReturnValue(true);vi.spyOn(window,'alert').mockImplementation(()=>{});
 const corrigirEntrega=vi.fn(async()=>({notaFinal:1.5}));
 vi.mocked(useEntregas).mockReturnValue({entregas:[
  {id:'e1',activityId:'at',turmaId:'t1',alunoId:'a',bimestre:1,status:'entregue'},
  {id:'e2',activityId:'at',turmaId:'t2',alunoId:'b',bimestre:1,status:'entregue'},
  {id:'e3',activityId:'at',turmaId:'t1',alunoId:'a',bimestre:2,status:'entregue'}
 ],corrigindo:null,overrideNota:vi.fn(),corrigirEntrega});
 const sync=vi.fn(async()=>({publicacoes:[{turmaId:'t1',alunoId:'a',bimestre:'1',dadosBimestre:{notas:{a:{at:1.5}}}}]}));
 const publicar=vi.fn();const setNota=vi.fn();
 render(<AtividadePainel atividade={{id:'at',titulo:'Trabalho',bimestre:1,turmaIds:['t1','t2'],notaMaxima:2}}
  currentTurmaId="t1" turmas={[{id:'t1',nome:'101',alunos:[{id:'a',nome:'Aluno A'}]},{id:'t2',nome:'202',alunos:[{id:'b',nome:'Aluno B'}]}]}
  useAtividadesHook={{sincronizarTodasAsNotas:sync,publicarNotaAluno:publicar}} onSetNota={setNota} />);
 expect(useEntregas).toHaveBeenCalledWith('at',expect.any(Function),{turmaId:'t1',bimestre:1});
 fireEvent.click(screen.getByRole('button',{name:'Corrigir Todas (1)'}));
 await waitFor(()=>expect(sync).toHaveBeenCalledWith({turmaId:'t1',bimestre:'1',atividadeId:'at',alunoId:'a'}));
 expect(corrigirEntrega).toHaveBeenCalledTimes(1);expect(corrigirEntrega.mock.calls[0][0]).toBe('e1');
 expect(setNota).not.toHaveBeenCalledWith('t2',expect.anything(),expect.anything(),expect.anything(),expect.anything());
 expect(publicar).toHaveBeenCalledWith('t1','a',{'1':{notas:{a:{at:1.5}}}});
});
it('callback usa a coluna existente da atividade e recusa aluno fora da turma',()=>{
 vi.mocked(useEntregas).mockReturnValue({entregas:[],corrigindo:null,overrideNota:vi.fn(),corrigirEntrega:vi.fn()});
 const setNota=vi.fn();
 render(<AtividadePainel atividade={{id:'at',titulo:'Trabalho',bimestre:1,turmaIds:['t1'],notaMaxima:2}}
  currentTurmaId="t1" turmas={[{id:'t1',alunos:[{id:'a'}],bimestres:{'1':{atividades:[{id:'coluna-legada',nome:'Trabalho',max:2}],notas:{}}}}]}
  useAtividadesHook={{}} onSetNota={setNota} />);
 const callback=vi.mocked(useEntregas).mock.calls.at(-1)[1];
 callback({turmaId:'t1',bimestre:1,alunoId:'a',notaFinal:1});
 expect(setNota).toHaveBeenCalledWith('t1','1','a','coluna-legada',1);
 setNota.mockClear();
 callback({turmaId:'t1',bimestre:1,alunoId:'inexistente',notaFinal:1});
 expect(setNota).not.toHaveBeenCalled();
});
