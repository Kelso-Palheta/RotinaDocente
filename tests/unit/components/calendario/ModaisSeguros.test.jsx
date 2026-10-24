import React from 'react';
import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {AutoDistribuirModal} from '../../../../frontend/src/components/calendario/AutoDistribuirModal';
import {TopicoModal} from '../../../../frontend/src/components/calendario/TopicoModal';
const aulas=[{id:'a',dataAgendada:'2027-03-01',horarioInicio:'07:00',status:'AGENDADA',topicosAssociados:[],duracaoAlocadaAulas:1}];
const topicos=[{id:'t',ordem:1,titulo:'Pintura',duracaoEstimadaAulas:3}];
describe('Modais de planejamento seguros',()=>{
 it('mostra prévia e tempos sem vaga; só confirma explicitamente e mantém falha',async()=>{
  const onConfirmar=vi.fn().mockRejectedValue(new Error('Sem conexão'));const onClose=vi.fn();
  render(<AutoDistribuirModal isOpen aulas={aulas} topicos={topicos} dataInicioPadrao="2027-03-01" dataFim="2027-03-30" onConfirmar={onConfirmar} onClose={onClose}/>);
  expect(screen.getByRole('radio',{name:/Preencher aulas vazias/}).checked).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Revisar distribuição'}));
  expect(screen.getByText(/Pintura: 2 tempo/)).toBeTruthy();
  expect(screen.getByText(/2027-03-01 · 07:00/)).toBeTruthy();
  expect(onConfirmar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Confirmar distribuição'}));
  await screen.findByRole('alert');
  expect(onConfirmar).toHaveBeenCalledWith(expect.objectContaining({dataInicio:'2027-03-01',dataFim:'2027-03-30',modo:'apenas_vagas'}));
  expect(onClose).not.toHaveBeenCalled();
 });
 it('aguarda salvar conteúdo, conserva formulário em falha',async()=>{
  const onSalvar=vi.fn().mockRejectedValue(new Error('Erro ao salvar'));const onClose=vi.fn();
  render(<TopicoModal isOpen onSalvar={onSalvar} onClose={onClose}/>);
  fireEvent.change(screen.getByLabelText('Título do conteúdo'),{target:{value:'Gravura'}});
  fireEvent.click(screen.getByRole('button',{name:'Adicionar conteúdo'}));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Título do conteúdo').value).toBe('Gravura');
  expect(onClose).not.toHaveBeenCalled();
 });
 it('fecha apenas depois de salvar com sucesso',async()=>{
  let resolve;const onSalvar=vi.fn(()=>new Promise(r=>{resolve=r;}));const onClose=vi.fn();
  render(<TopicoModal isOpen topicoEmEdicao={{id:'t',titulo:'Arte'}} onSalvar={onSalvar} onClose={onClose}/>);
  fireEvent.click(screen.getByRole('button',{name:'Salvar alterações'}));
  expect(onClose).not.toHaveBeenCalled();
  resolve();await waitFor(()=>expect(onClose).toHaveBeenCalledOnce());
 });
 it('invalida a prévia quando as aulas de origem mudam',()=>{
  const base={isOpen:true,aulas,topicos,dataInicioPadrao:'2027-03-01',dataFim:'2027-03-30',onConfirmar:vi.fn(),onClose:vi.fn()};
  const {rerender}=render(<AutoDistribuirModal {...base}/>);
  fireEvent.click(screen.getByRole('button',{name:'Revisar distribuição'}));
  expect(screen.getByRole('button',{name:'Confirmar distribuição'})).toBeTruthy();
  rerender(<AutoDistribuirModal {...base} aulas={[...aulas,{id:'b',dataAgendada:'2027-03-02',status:'AGENDADA',topicosAssociados:[]}]}/>);
  expect(screen.queryByRole('button',{name:'Confirmar distribuição'})).toBeNull();
 });
 it('mantém conteúdo em edição quando a exclusão falha',async()=>{
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(true);const onClose=vi.fn();
  render(<TopicoModal isOpen topicoEmEdicao={{id:'t',titulo:'Arte'}} onSalvar={vi.fn()} onExcluir={vi.fn().mockRejectedValue(new Error('Erro ao excluir'))} onClose={onClose}/>);
  fireEvent.click(screen.getByRole('button',{name:'Excluir'}));
  await screen.findByRole('alert');
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Título do conteúdo').value).toBe('Arte');
  confirm.mockRestore();
 });

});
