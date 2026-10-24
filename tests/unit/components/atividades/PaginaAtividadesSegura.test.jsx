import {render,screen,waitFor,cleanup} from '@testing-library/react';
const m=vi.hoisted(()=>({persistir:vi.fn(),restaurar:vi.fn(),turma:{id:'t',nome:'301',alunos:[],bimestres:{1:{atividades:[],notas:{}}}},sidebar:null}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({push:vi.fn(),replace:vi.fn()})}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p'},perfil:{modulos_permitidos:['gerador-atividades']},loading:false})}));
vi.mock('@/hooks/diario/usePersistenciaDiario',()=>({usePersistenciaDiario:()=>({turmas:[m.turma],carregando:false,podeEditar:true,estado:'salvo',erro:'',persistir:m.persistir,restaurar:m.restaurar,aguardarSalvamento:vi.fn(),recarregar:vi.fn(),tentarNovamente:vi.fn()})}));
vi.mock('@/hooks/atividades/useAtividades',()=>({useAtividades:()=>({})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({doc:vi.fn(),getDoc:async()=>({exists:()=>false}),setDoc:vi.fn(),serverTimestamp:vi.fn()}));
vi.mock('@/components/atividades/TodasAtividades',()=>({TodasAtividades:()=> <p>Lista geral segura</p>}));
vi.mock('@/components/atividades/AtividadesList',()=>({AtividadesList:()=>null}));
vi.mock('@/components/diario/Sidebar',()=>({Sidebar:p=>{m.sidebar=p;return <aside>Turmas</aside>;}}));
vi.mock('@/components/diario/ProfileModal',()=>({ProfileModal:()=>null}));
import Page from '@/app/atividades/page';
afterEach(cleanup);
it('reutiliza persistência isolada por conta, conecta restauração e exibe ano/estado',async()=>{
 render(<Page/>);await waitFor(()=>expect(screen.getByText('Salvo na nuvem')).toBeInTheDocument());expect(screen.getByLabelText('Ano letivo')).toHaveValue('legado');expect(m.persistir).not.toHaveBeenCalled();expect(m.sidebar.onImportTurmas).toEqual(expect.any(Function));
 expect(screen.getByRole('button',{name:'Todas as atividades'})).toBeInTheDocument();
});
