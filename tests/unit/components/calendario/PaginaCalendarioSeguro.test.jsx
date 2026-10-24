import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({aplicar:vi.fn(async()=>{}),carregar:vi.fn(),estado:{turmaId:'t',anoLetivo:2026,grade:{diasSemana:[]},planejamento:{topicos:[{id:'t1',titulo:'Conteúdo vinculado',ordem:1}]},feriados:[],aulas:[{id:'a',turmaId:'t',dataAgendada:'2026-11-02',horarioInicio:'07:00',horarioFim:'08:00',status:'AGENDADA',topicosAssociados:[{id:'t1',titulo:'Conteúdo vinculado'}]}]}}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p'},loading:false})}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock('@/hooks/calendario/useCalendarioPedagogico',()=>({useCalendarioPedagogico:()=>({estado:m.estado,error:null,loading:false,salvando:false,aplicar:m.aplicar,recarregar:vi.fn(),carregarEstado:m.carregar})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({doc:()=>({}),getDoc:async()=>({exists:()=>true,data:()=>({turmas:[{id:'t',nome:'301'}]})})}));
vi.mock('@/lib/calendario/pdf-generator',()=>({generateCalendarioPDF:vi.fn()}));
import CalendarioPage from '@/app/calendario/page';
afterEach(cleanup);
it('separa calendário, conteúdos e configurações com período explícito',async()=>{
 render(<CalendarioPage/>);
 await waitFor(()=>expect(screen.getByLabelText('Turma')).toHaveValue('t'));
 expect(screen.getByLabelText('Ano letivo')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Conteúdos',exact:true}));
 expect(await screen.findByText('Conteúdo vinculado')).toBeVisible();
 expect(screen.getByRole('button',{name:/Editar.*vinculado/})).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Configurações',exact:true}));
 expect(screen.getByRole('button',{name:/Meu Horário Escolar/})).toBeVisible();expect(m.aplicar).not.toHaveBeenCalled();
});
it('apagar uma data do filtro não derruba a página',async()=>{
 render(<CalendarioPage/>);await screen.findByRole('option',{name:'301'});
 fireEvent.change(screen.getByLabelText('Início do período'),{target:{value:''}});
 expect(screen.getByRole('button',{name:'Calendário',exact:true})).toBeVisible();
 expect(screen.getByLabelText('Início do período')).not.toHaveValue('');
});
it('fim do período reposiciona a visualização para dentro do recorte',async()=>{
 render(<CalendarioPage/>);await screen.findByRole('option',{name:'301'});
 fireEvent.change(screen.getByLabelText('Fim do período'),{target:{value:'2026-03-31'}});
 expect(screen.getByRole('heading',{name:/Março 2026/i})).toBeVisible();
});
