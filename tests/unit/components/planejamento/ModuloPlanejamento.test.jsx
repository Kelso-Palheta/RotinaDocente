import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({user:{uid:'prof1'},auth:{currentUser:{uid:'prof1',getIdToken:async()=> 'token'}},push:vi.fn(),buscar:vi.fn(),listar:vi.fn(),salvar:vi.fn()}));
import {AppRouterContext} from '../../../../frontend/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js';
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('@/lib/firebase',()=>({auth:mocks.auth}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),buscarCatalogo:(...a)=>mocks.buscar(...a),listarPlanos:(...a)=>mocks.listar(...a),salvarPlano:(...a)=>mocks.salvar(...a)}));
import {ModuloPlanejamento} from '@/components/planejamento/ModuloPlanejamento';
import {BibliotecaPlanejamento} from '@/components/planejamento/BibliotecaPlanejamento';
afterEach(()=>{cleanup();vi.clearAllMocks();mocks.user={uid:'prof1'};});
it('salva planejamento semestral regular sem perguntas ou jogo',async()=>{
 mocks.buscar.mockResolvedValue({turmas:[],questoes:[],modalidades:[]});mocks.listar.mockResolvedValue({planos:[]});mocks.salvar.mockImplementation(async({plano})=>({plano:{...plano,id:'p1',revision:1}}));
 render(<AppRouterContext.Provider value={{push:mocks.push}}><ModuloPlanejamento/></AppRouterContext.Provider>);fireEvent.click(await screen.findByRole('button',{name:'Criar planejamento regular'}));
 fireEvent.change(screen.getByLabelText('Formato do planejamento'),{target:{value:'semestral'}});
 for(const [label,value]of [['Título do plano','Plano do semestre'],['Disciplina','História'],['Série / ano escolar','1º ano'],['Conteúdo / tema','Formação cultural e patrimônio'],['Objetivo de aprendizagem','Analisar processos culturais']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 expect(screen.queryByRole('button',{name:'Preparar partida deste plano'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));await screen.findByText('Planejamento salvo na nuvem.');
 expect(mocks.salvar).toHaveBeenCalledWith(expect.objectContaining({plano:expect.objectContaining({tipo:'normal',escala:'semestral',modalidade:null,duracaoMinutos:null,questaoIds:[]})}));
});
it('acesso sem conta docente não carrega os planos',()=>{mocks.user=null;render(<AppRouterContext.Provider value={{push:mocks.push}}><ModuloPlanejamento/></AppRouterContext.Provider>);expect(screen.getByText(/Entre com sua conta de professor/)).toBeTruthy();expect(mocks.buscar).not.toHaveBeenCalled();});
it('biblioteca filtra referências e cria modelo semanal com tipo explícito',()=>{
 const escolher=vi.fn();render(<BibliotecaPlanejamento onEscolher={escolher}/>);
 expect(screen.getByLabelText('Categoria').options).toHaveLength(11);
 fireEvent.change(screen.getByLabelText('Buscar modelo'),{target:{value:'Plano semanal'}});
 fireEvent.click(screen.getByRole('button',{name:'Usar modelo: Plano semanal'}));
 expect(escolher).toHaveBeenCalledWith(expect.objectContaining({numero:5}),'normal','semanal');
});
it('jogo avulso abre sem referência a planejamento',async()=>{
 mocks.buscar.mockResolvedValue({turmas:[],questoes:[],modalidades:[]});mocks.listar.mockResolvedValue({planos:[]});render(<AppRouterContext.Provider value={{push:mocks.push}}><ModuloPlanejamento/></AppRouterContext.Provider>);
 fireEvent.click(screen.getByRole('button',{name:'Criar jogo avulso ↗'}));expect(mocks.push).toHaveBeenCalledWith('/aula-gamificada/salas');
});
