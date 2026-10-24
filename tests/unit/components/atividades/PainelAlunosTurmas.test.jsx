import {render,screen,cleanup} from '@testing-library/react';
import {it,vi,afterEach,expect} from 'vitest';
vi.mock('@/hooks/atividades/useEntregas',()=>({useEntregas:()=>({entregas:[],similaridades:[],corrigindo:null})}));
vi.mock('@/components/atividades/EntregaDrawer',()=>({EntregaDrawer:()=>null}));
vi.mock('@/components/atividades/UrlCopyPanel',()=>({UrlCopyPanel:()=>null}));
vi.mock('@/components/atividades/AtividadeForm',()=>({AtividadeForm:()=>null}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({collection:()=>({}),getDocs:async()=>({forEach:fn=>[{alunoId:'a',turmaId:'t1',nome:'Ana',token:'um'},{alunoId:'a',turmaId:'t2',nome:'Bia',token:'dois'}].forEach(data=>fn({data:()=>data}))})}));
import {AtividadePainel} from '@/components/atividades/AtividadePainel';
afterEach(cleanup);
it('alunos com ID igual em turmas diferentes permanecem como duas pessoas no painel',async()=>{
 render(<AtividadePainel atividade={{id:'at',titulo:'Atividade',turmaIds:['t1','t2'],bimestre:3,notaMaxima:2}} sincronizacaoAutomatica={false} turmas={[{id:'t1',nome:'301',alunos:[{id:'a',nome:'Ana'}]},{id:'t2',nome:'302',alunos:[{id:'a',nome:'Bia'}]}]} useAtividadesHook={{}}/>);
 expect(await screen.findByText('Ana')).toBeInTheDocument();expect(await screen.findByText('Bia')).toBeInTheDocument();
});
