import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({obter:vi.fn(),salvar:vi.fn()}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),obterPlano:(...a)=>mocks.obter(...a),salvarPlano:(...a)=>mocks.salvar(...a)}));
import {PlanejarAula} from '@/components/aula-gamificada/PlanejarAula';
import {criarRascunho} from '@/components/planejamento/modelos';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('plano recém-confirmado pelo servidor abre salvo e editável sem reler a nuvem',async()=>{
 const plano={...criarRascunho('normal','anual'),id:'p1',revision:2,titulo:'Plano confirmado',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água e energia',objetivo:'Investigar evidências'};
 const estado=vi.fn();mocks.obter.mockImplementation(()=>new Promise(()=>{}));mocks.salvar.mockImplementation(async({plano})=>({plano:{...plano,revision:3}}));
 render(<PlanejarAula mostrarLista={false} modoCompleto rascunhoInicial={plano} planoConfirmado={plano} onEstadoEdicao={estado}/>);
 expect(mocks.obter).not.toHaveBeenCalled();expect(estado).toHaveBeenLastCalledWith(false);
 fireEvent.change(screen.getByLabelText('Título do plano'),{target:{value:'Plano revisado'}});expect(estado).toHaveBeenLastCalledWith(true);
 fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));await waitFor(()=>expect(mocks.salvar).toHaveBeenCalled());expect(mocks.salvar.mock.calls[0][0].expectedRevision).toBe(2);
});
