import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({user:{uid:'prof1'},auth:{currentUser:{uid:'prof1',getIdToken:async()=> 'token'}},push:vi.fn(),buscar:vi.fn(),listar:vi.fn(),salvar:vi.fn()}));
import {AppRouterContext} from '../../../../frontend/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js';
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('@/lib/firebase',()=>({auth:mocks.auth}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),buscarCatalogo:(...a)=>mocks.buscar(...a),listarPlanos:(...a)=>mocks.listar(...a),salvarPlano:(...a)=>mocks.salvar(...a)}));
import {ModuloPlanejamento} from '@/components/planejamento/ModuloPlanejamento';
afterEach(()=>{cleanup();vi.clearAllMocks();});
const montar=()=>{mocks.buscar.mockResolvedValue({turmas:[],questoes:[],modalidades:[]});mocks.listar.mockResolvedValue({planos:[]});return render(<AppRouterContext.Provider value={{push:mocks.push}}><ModuloPlanejamento/></AppRouterContext.Provider>);};

it('apresenta as duas abrangências como escolhas distintas',async()=>{
 montar();
 expect(await screen.findByRole('heading',{name:'Planejamento da disciplina'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Plano de conteúdo'})).toBeTruthy();
 expect(screen.getAllByText(/vários conteúdos/i).length).toBeGreaterThan(0);
 expect(screen.getByText(/assunto específico|assuntos específicos/i)).toBeTruthy();
});

it('plano de conteúdo abre com as durações de conteúdo',async()=>{
 montar();
 fireEvent.click(await screen.findByRole('button',{name:'Criar plano de conteúdo regular'}));
 const formato=screen.getByLabelText('Formato do planejamento');
 expect([...formato.options].map(o=>o.value)).toEqual(['aula','semanal','quinzenal','mensal','bimestral','sequencia','projeto']);
 expect(formato.value).toBe('aula');
 expect(screen.getByRole('radio',{name:'Plano de conteúdo'}).checked).toBe(true);
});

it('planejamento da disciplina abre com as durações de período',async()=>{
 montar();
 fireEvent.click(await screen.findByRole('button',{name:'Criar planejamento regular'}));
 const formato=screen.getByLabelText('Formato do planejamento');
 expect([...formato.options].map(o=>o.value)).toEqual(['anual','semestral','bimestral']);
 expect(formato.value).toBe('bimestral');
 expect(screen.getByRole('radio',{name:'Planejamento da disciplina'}).checked).toBe(true);
 expect(screen.queryByRole('button',{name:'Preparar partida deste plano'})).toBeNull();
});

it('jogo avulso continua disponível sem plano',async()=>{
 montar();
 fireEvent.click(await screen.findByRole('button',{name:'Criar jogo avulso ↗'}));
 expect(mocks.push).toHaveBeenCalledWith('/aula-gamificada/salas');
});
