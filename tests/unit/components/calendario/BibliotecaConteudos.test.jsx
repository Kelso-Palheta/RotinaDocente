import React from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { Sidebar } from '../../../../frontend/src/components/calendario/Sidebar';
vi.mock('../../../../frontend/node_modules/next/navigation',()=>({useRouter:()=>({push:vi.fn()})}));
const topicos=[{id:'1',ordem:1,titulo:'Introdução'},{id:'2',ordem:2,titulo:'Pintura'},{id:'3',ordem:3,titulo:'Escultura'}];
const aulas=[{id:'a',status:'CONCLUIDA',topicosAssociados:[{id:'1'},{id:'2'}]},{id:'b',status:'CONCLUIDA',topicosAssociados:[{id:'1'}]},{id:'c',status:'AGENDADA',topicosAssociados:[{id:'3'}]}];
describe('Biblioteca de conteúdos',()=>{
 it('conta conteúdos únicos, mantém agendados e concluídos acessíveis para editar',()=>{
  const editar=vi.fn();
  render(<Sidebar planejamento={{topicos}} aulas={aulas} turmaSelecionada={{id:'t'}} onOpenEditarTopico={editar}/>);
  expect(screen.getByText('2 de 3 conteúdos concluídos (67%)')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab',{name:'Agendados (1)'}));
  expect(screen.getByText('Escultura')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Editar Escultura'}));
  expect(editar).toHaveBeenCalledWith(expect.objectContaining({id:'3'}));
  fireEvent.click(screen.getByRole('tab',{name:'Concluídos (2)'}));
  expect(screen.getByText('Introdução')).toBeTruthy();
  expect(screen.getByText('Pintura')).toBeTruthy();
 });
 it('busca em todos os conteúdos e usa identificação de conteúdo',()=>{
  render(<Sidebar planejamento={{topicos}} aulas={aulas} turmaSelecionada={{id:'t'}}/>);
  fireEvent.change(screen.getByRole('searchbox',{name:'Buscar conteúdo'}),{target:{value:'pintura'}});
  expect(screen.getByText('Pintura')).toBeTruthy();
  expect(screen.queryByText('Escultura')).toBeNull();
  expect(screen.getByText('Conteúdo 2')).toBeTruthy();
 });
});
