import {render,screen,cleanup} from '@testing-library/react';
import {expect,it,vi,afterEach} from 'vitest';
const m=vi.hoisted(()=>({turmas:[{nome:'301',bimestres:{1:{notas:{a:{atividade:2,simulado:3}},atividades:[]}},alunos:[{nome:'Ana',id:'a'}],id:'t'}],persistir:vi.fn()}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({push:vi.fn(),replace:vi.fn()})}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p'},perfil:{modulos_permitidos:['diario-planejamento']},loading:false})}));
vi.mock('@/hooks/diario/usePersistenciaDiario',()=>({usePersistenciaDiario:()=>({turmas:m.turmas,historico:[],carregando:false,podeEditar:true,estado:'salvo',erro:'',persistir:m.persistir})}));
vi.mock('@/components/diario/Sidebar',()=>({Sidebar:()=>null}));
vi.mock('@/components/diario/TurmaView',()=>({TurmaView:()=> <p>Diário aberto</p>}));
vi.mock('@/components/diario/ProfileModal',()=>({ProfileModal:()=>null}));
import DiarioPage from '@/app/diario/page';
afterEach(()=>{cleanup();sessionStorage.clear();});
it('não alerta sessão diferente quando apenas a ordem das chaves foi alterada',()=>{
 sessionStorage.setItem('diario_userId','p');sessionStorage.setItem('diario_turmas',JSON.stringify([{id:'t',alunos:[{id:'a',nome:'Ana'}],bimestres:{1:{atividades:[],notas:{a:{simulado:3,atividade:2}}}},nome:'301'}]));
 render(<DiarioPage/>);expect(screen.queryByRole('button',{name:'Baixar rascunho anterior'})).not.toBeInTheDocument();expect(m.persistir).not.toHaveBeenCalled();
});
