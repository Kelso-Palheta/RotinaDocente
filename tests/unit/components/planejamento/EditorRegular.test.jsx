import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),listarPlanos:async()=>({planos:[]})}));
import {PlanejarAula} from '@/components/aula-gamificada/PlanejarAula';
import {criarRascunho} from '@/components/planejamento/modelos';
afterEach(cleanup);
it('novo planejamento reinicia base editável sem mutar constante e descarte restaura a nova base',async()=>{
 const rascunho=criarRascunho('normal','anual',{id:'modelo',titulo:'Modelo anual',resumo:'Organizar unidades.'});
 render(<PlanejarAula rascunhoInicial={rascunho} modoCompleto/>);
 fireEvent.click(await screen.findByRole('button',{name:'Novo planejamento'}));
 expect(screen.getByLabelText('Título do plano').value).toBe('');
 fireEvent.change(screen.getByLabelText('Título do plano'),{target:{value:'Edição local'}});
 fireEvent.click(screen.getByRole('button',{name:'Descartar alterações locais'}));
 expect(screen.getByLabelText('Título do plano').value).toBe('');
 expect(screen.getByLabelText('Formato do planejamento').value).toBe('anual');
});
