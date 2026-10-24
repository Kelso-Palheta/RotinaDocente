import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {AtividadePainel} from '@/components/atividades/AtividadePainel';
const m=vi.hoisted(()=>({manual:vi.fn(async()=>{}),atividade:{id:'at',titulo:'Trabalho',bimestre:3,turmaIds:['t'],notaMaxima:2}}));
vi.mock('@/hooks/atividades/useEntregas',()=>({useEntregas:()=>({entregas:[{id:'e',activityId:'at',turmaId:'t',alunoId:'a',bimestre:3,status:'corrigido',notaFinal:1}],similaridades:[[{alunoId:'a'},{alunoId:'b'}]],corrigindo:null,corrigirManualmente:m.manual,corrigirEntrega:vi.fn()})}));
vi.mock('@/components/atividades/EntregaDrawer',()=>({EntregaDrawer:({onManual})=><button onClick={()=>onManual({nota:1,feedback:'Feedback'})}>Salvar manual</button>}));
vi.mock('@/components/atividades/UrlCopyPanel',()=>({UrlCopyPanel:()=>null}));
vi.mock('@/components/atividades/AtividadeForm',()=>({AtividadeForm:()=>null}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),getDocs:async()=>({forEach:()=>{}})}));
vi.mock('@/lib/firebase-atividades',()=>({getAtividade:async()=>m.atividade}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const props=()=>({atividade:m.atividade,user:{uid:'p'},currentTurmaId:'t',turmas:[{id:'t',nome:'301',alunos:[{id:'a',nome:'Ana'}]}],sincronizacaoAutomatica:false,useAtividadesHook:{sincronizarTodasAsNotas:vi.fn(async()=>({sincronizadas:1,erros:0})),publicarNotaAluno:vi.fn()}});
it('corrigir no fluxo explícito salva autoria/feedback sem sincronizar ou publicar por conta própria',async()=>{
 const p=props();render(<AtividadePainel {...p}/>);fireEvent.click(await screen.findByRole('button',{name:'Corrigir manualmente'}));fireEvent.click(screen.getByRole('button',{name:'Salvar manual'}));
 await waitFor(()=>expect(m.manual).toHaveBeenCalledWith('e',m.atividade,{nota:1,feedback:'Feedback'},'p'));
 expect(p.useAtividadesHook.sincronizarTodasAsNotas).not.toHaveBeenCalled();expect(p.useAtividadesHook.publicarNotaAluno).not.toHaveBeenCalled();expect(await screen.findByText(/Correção salva/)).toBeInTheDocument();
 expect(screen.getByText(/similaridade.*revisão humana/i)).toBeInTheDocument();
});
it('mostra prévia e só sincroniza atividade/turma/bimestre após confirmação explícita',async()=>{
 const p=props();render(<AtividadePainel {...p}/>);fireEvent.click(screen.getByRole('button',{name:'Conferir e sincronizar notas'}));expect(p.useAtividadesHook.sincronizarTodasAsNotas).not.toHaveBeenCalled();
 expect(screen.getByRole('dialog',{name:'Conferir sincronização'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Confirmar sincronização'}));
 await waitFor(()=>expect(p.useAtividadesHook.sincronizarTodasAsNotas).toHaveBeenCalledWith({turmaId:'t',bimestre:3,atividadeId:'at'}));expect(p.useAtividadesHook.publicarNotaAluno).not.toHaveBeenCalled();
});
