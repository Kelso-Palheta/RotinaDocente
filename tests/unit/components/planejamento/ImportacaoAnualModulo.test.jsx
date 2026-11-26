import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {AppRouterContext} from '../../../../frontend/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js';
const mocks=vi.hoisted(()=>({salvar:vi.fn(),plano:null}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p1'},loading:false})}));
vi.mock('@/lib/firebase',()=>({auth:{currentUser:{uid:'p1',getIdToken:async()=> 'token'}}}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),buscarCatalogo:async()=>({turmas:[],questoes:[],modalidades:[]}),listarPlanos:async()=>({planos:[]}),salvarPlano:(...a)=>mocks.salvar(...a)}));
vi.mock('@/components/planejamento/ImportarPlanoAnual',()=>({ImportarPlanoAnual:({onCriado})=><button onClick={()=>onCriado(mocks.plano)}>Usar rascunho de teste</button>}));
import {ModuloPlanejamento} from '@/components/planejamento/ModuloPlanejamento';
import {criarRascunho} from '@/components/planejamento/modelos';
afterEach(()=>{cleanup();vi.clearAllMocks();});
function montar(){mocks.plano={...criarRascunho('normal','anual'),integracaoAnual:1,titulo:'Anual importado',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água e energia',objetivo:'Investigar fenômenos'};mocks.salvar.mockImplementation(async({plano})=>({plano:{...plano,id:'novo',revision:1}}));render(<AppRouterContext.Provider value={{push:vi.fn()}}><ModuloPlanejamento/></AppRouterContext.Provider>);}
it('rascunho importado exige salvar explicitamente e impede sair antes de decidir',async()=>{
 montar();fireEvent.click(await screen.findByRole('button',{name:'Importar currículo com IA'}));fireEvent.click(screen.getByRole('button',{name:'Usar rascunho de teste'}));
 expect(screen.getByLabelText('Título do plano').value).toBe('Anual importado');expect(mocks.salvar).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Meus planejamentos'}));expect(await screen.findByRole('status')).toHaveTextContent('Salve ou descarte');
 fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));await screen.findByText('Planejamento salvo na nuvem.');expect(mocks.salvar).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('button',{name:'Meus planejamentos'}));await screen.findByRole('button',{name:'Abrir planejamento: Anual importado'});
});
it('descarte explícito de rascunho importado retorna ao início sem salvar',async()=>{
 montar();fireEvent.click(await screen.findByRole('button',{name:'Importar currículo com IA'}));fireEvent.click(screen.getByRole('button',{name:'Usar rascunho de teste'}));
 fireEvent.click(screen.getByRole('button',{name:'Descartar alterações locais'}));await screen.findByRole('heading',{name:'Comece pelo planejamento anual'});expect(mocks.salvar).not.toHaveBeenCalled();
});
