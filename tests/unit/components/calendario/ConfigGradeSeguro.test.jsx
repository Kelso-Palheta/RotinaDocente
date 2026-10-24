import React from 'react';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { ConfigGradeModal } from '../../../../frontend/src/components/calendario/ConfigGradeModal';
const mocks=vi.hoisted(()=>({carregar:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'prof'}})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/infraestrutura/horario/HorarioRepository',()=>({HorarioRepository:class {carregarGrade(...args){return mocks.carregar(...args);}}}));
const grade={dataInicioPeriodo:'2027-02-01',dataFimPeriodo:'2027-12-15',diasSemana:[{diaSemana:1,horarioInicio:'07:00',horarioFim:'08:00',quantidadeAulas:1}]};
const props={isOpen:true,onClose:vi.fn(),turmaSelecionada:{name:'101'},initialGrade:grade,anoLetivo:2027};
beforeEach(()=>vi.clearAllMocks());
describe('Configurar horários com revisão',()=>{
 it('exige prévia e confirmação; mantém dados após falha ao salvar',async()=>{
  const onPreview=vi.fn().mockResolvedValue({resumo:{criadas:3,removidas:0,preservadas:2,alteradas:0},conflitos:[]});
  const onSave=vi.fn().mockRejectedValue(new Error('Falha de gravação'));
  render(<ConfigGradeModal {...props} onPreview={onPreview} onSave={onSave}/>);
  fireEvent.click(screen.getByRole('button',{name:'Revisar alterações'}));
  await screen.findByText(/3 aulas criadas/);
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Confirmar atualização'}));
  await screen.findByRole('alert');
  expect(screen.getByRole('alert').textContent).toContain('Falha de gravação');
  expect(onSave.mock.calls[0][0].anoLetivo).toBe(2027);
  expect(props.onClose).not.toHaveBeenCalled();
 });
 it('bloqueia confirmação quando a prévia aponta conflito',async()=>{
  render(<ConfigGradeModal {...props} onPreview={async()=>({resumo:{},conflitos:['Aula realizada em conflito']})} onSave={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:'Revisar alterações'}));
  await screen.findByText('Aula realizada em conflito');
  expect(screen.getByRole('button',{name:'Confirmar atualização'}).disabled).toBe(true);
 });
 it('não aproxima nomes e permite escolher turma de origem, relendo a fonte',async()=>{
  mocks.carregar.mockResolvedValue({schedule:{seg_m1:{grade:'10',subject:'Arte'}},shift:'manha'});
  render(<ConfigGradeModal {...props} onSave={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:'Puxar do Meu Horário'}));
  await screen.findByText(/nome exato/);
  fireEvent.change(screen.getByLabelText('Turma de origem'),{target:{value:'10'}});
  await waitFor(()=>expect(mocks.carregar).toHaveBeenCalledTimes(2));
  expect(mocks.carregar).toHaveBeenLastCalledWith('prof',{somenteReal:true});
  await screen.findByText(/1 bloco/);
 });
 it('pede seleção de origem quando nomes normalizados são ambíguos',async()=>{
  mocks.carregar.mockResolvedValue({schedule:{seg_m1:{grade:'Turma Á',subject:'Arte'},ter_m1:{grade:'Turma A',subject:'Arte'}},shift:'manha'});
  render(<ConfigGradeModal {...props} turmaSelecionada={{name:'turma a'}} onSave={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:'Puxar do Meu Horário'}));
  await screen.findByText(/mais de uma turma/i);
  expect(screen.getByLabelText('Turma de origem')).toBeTruthy();
 });

});
