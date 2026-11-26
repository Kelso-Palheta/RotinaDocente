import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({user:{uid:'prof1'},auth:{currentUser:{uid:'prof1',getIdToken:async()=> 'token'}},push:vi.fn(),buscar:vi.fn(),listar:vi.fn(),salvar:vi.fn(),obter:vi.fn()}));
import {AppRouterContext} from '../../../../frontend/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js';
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('@/lib/firebase',()=>({auth:mocks.auth}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),buscarCatalogo:(...a)=>mocks.buscar(...a),listarPlanos:(...a)=>mocks.listar(...a),salvarPlano:(...a)=>mocks.salvar(...a),obterPlano:(...a)=>mocks.obter(...a)}));
import {ModuloPlanejamento} from '@/components/planejamento/ModuloPlanejamento';
import {BibliotecaPlanejamento} from '@/components/planejamento/BibliotecaPlanejamento';
afterEach(()=>{cleanup();vi.clearAllMocks();mocks.user={uid:'prof1'};});
it('salva planejamento semestral regular sem perguntas ou jogo',async()=>{
 const anual={id:'anual',revision:1,tipo:'normal',abrangencia:'planejamento',escala:'anual',titulo:'História no ano',disciplina:'História',anoEscolar:'1º ano',anoLetivo:2027,conteudo:'Formação cultural e patrimônio',objetivo:'Analisar processos culturais',etapas:[{id:'b1',titulo:'1º bimestre',prazo:'1º bimestre',tipo:'desenvolvimento',orientacao:'Investigar patrimônios',curriculo:{conteudos:'Formação cultural e patrimônio'}}]};
 mocks.obter.mockResolvedValue({plano:anual});mocks.buscar.mockResolvedValue({turmas:[],questoes:[],modalidades:[]});mocks.listar.mockResolvedValue({planos:[anual]});mocks.salvar.mockImplementation(async({plano})=>({plano:{...plano,id:'p1',revision:1}}));
 render(<AppRouterContext.Provider value={{push:mocks.push}}><ModuloPlanejamento/></AppRouterContext.Provider>);fireEvent.click(await screen.findByRole('button',{name:'Criar planejamento regular'}));
 fireEvent.change(screen.getByLabelText('Formato do planejamento'),{target:{value:'semestral'}});
 expect(screen.getByRole('button',{name:'Salvar planejamento'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Planejamento anual de base'),{target:{value:'anual'}});
 fireEvent.click(await screen.findByLabelText('Formação cultural e patrimônio · 1º bimestre'));
 fireEvent.click(screen.getByRole('button',{name:'Usar conteúdos selecionados'}));
 for(const [label,value]of [['Título do plano','Plano do semestre'],['Disciplina','História'],['Série / ano escolar','1º ano'],['Conteúdo / tema','Formação cultural e patrimônio'],['Objetivo de aprendizagem','Analisar processos culturais']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 expect(screen.queryByRole('button',{name:'Preparar partida deste plano'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));await screen.findByText('Planejamento salvo na nuvem.');
 expect(mocks.salvar).toHaveBeenCalledWith(expect.objectContaining({plano:expect.objectContaining({tipo:'normal',escala:'semestral',vinculoAnual:expect.objectContaining({planoId:'anual'}),modalidade:null,duracaoMinutos:null,questaoIds:[]})}));
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
