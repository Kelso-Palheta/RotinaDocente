import { render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({router:{push:vi.fn(),replace:vi.fn()},limpar:vi.fn(),turma:{id:'t',nome:'301',alunos:[],bimestres:{1:{atividades:[],notas:{},config:{simuladoMaxLanca:10,simuladoMaxFinal:7,atividadesMaxFinal:3,mediaAprovacao:6,mediaRecuperacao:4}}}},persistir:vi.fn().mockResolvedValue([])}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>m.router}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p'},perfil:{modulos_permitidos:['diario-planejamento']},loading:false})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({doc:vi.fn(),getDoc:async()=>({exists:()=>false}),setDoc:vi.fn(),serverTimestamp:vi.fn()}));
vi.mock('@/lib/firebase-aluno',()=>({limparTodosVinculosOrfaos:m.limpar}));
vi.mock('@/hooks/diario/usePersistenciaDiario',()=>({usePersistenciaDiario:()=>({turmas:[m.turma],historico:[],carregando:false,podeEditar:true,estado:'salvo',erro:'',persistir:m.persistir,tentarNovamente:vi.fn(),restaurar:vi.fn(),recarregar:vi.fn(),desfazer:vi.fn(),aguardarSalvamento:vi.fn()})}));
vi.mock('@/components/diario/Sidebar',()=>({Sidebar:()=> <aside>Menu de turmas</aside>}));
vi.mock('@/components/diario/TurmaView',()=>({TurmaView:({turma})=><div>Critério preservado: {turma.bimestres[1].config.simuladoMaxFinal}</div>}));
vi.mock('@/components/diario/ProfileModal',()=>({ProfileModal:()=>null}));
import DiarioPage from '@/app/diario/page';
it('página não limpa acessos nem redefine critérios e mostra persistência/contexto',async()=>{
 render(<DiarioPage/>);
 await waitFor(()=>expect(screen.getByText('Critério preservado: 7')).toBeInTheDocument());
 expect(m.limpar).not.toHaveBeenCalled();expect(m.persistir).not.toHaveBeenCalled();
 expect(screen.getByText('Salvo na nuvem')).toBeInTheDocument();
 expect(screen.getByLabelText('Ano letivo')).toHaveValue('legado');
});
it('rascunho da sessão antiga é preservado para revisão somente na própria conta',async()=>{
 sessionStorage.setItem('diario_userId','p');sessionStorage.setItem('diario_turmas',JSON.stringify([{...m.turma,nome:'Rascunho antigo'}]));
 render(<DiarioPage/>);
 expect(await screen.findByRole('button',{name:'Baixar rascunho anterior'})).toBeInTheDocument();
 sessionStorage.clear();
});
