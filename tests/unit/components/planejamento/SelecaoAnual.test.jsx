import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({obter:vi.fn(),salvar:vi.fn()}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),obterPlano:(...a)=>mocks.obter(...a),salvarPlano:(...a)=>mocks.salvar(...a)}));
import {PlanejarAula} from '@/components/aula-gamificada/PlanejarAula';
import {criarRascunho} from '@/components/planejamento/modelos';
const anual={...criarRascunho('normal','anual'),id:'a1',revision:2,titulo:'Ciências anual',disciplina:'Ciências',anoEscolar:'8º ano',anoLetivo:2027,conteudo:'Água e energia',objetivo:'Investigar',etapas:[{id:'b1',titulo:'1º bimestre',tipo:'desenvolvimento',prazo:'1º bimestre',orientacao:'Observar',curriculo:{conteudos:'Água; Saneamento',objetivos:'Explicar o ciclo'}}]};
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('novo plano menor exige seleção anual e preenche conteúdo, contexto e vínculo',async()=>{
 mocks.obter.mockResolvedValue({plano:anual});mocks.salvar.mockImplementation(async({plano})=>({plano:{...plano,id:'semana',revision:1}}));
 render(<PlanejarAula modoCompleto mostrarLista={false} planosAnuais={[anual]} rascunhoInicial={{...criarRascunho('normal','semanal'),integracaoAnual:1}}/>);
 expect(screen.getByRole('button',{name:'Salvar planejamento'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Planejamento anual de base'),{target:{value:'a1'}});
 fireEvent.click(await screen.findByLabelText('Saneamento · 1º bimestre'));
 fireEvent.click(screen.getByRole('button',{name:'Usar conteúdos selecionados'}));
 expect(screen.getByLabelText('Disciplina').value).toBe('Ciências');expect(screen.getByLabelText('Conteúdo / tema').value).toBe('Saneamento');
 fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));
 await waitFor(()=>expect(mocks.salvar).toHaveBeenCalled());
 expect(mocks.salvar.mock.calls[0][0].plano).toMatchObject({integracaoAnual:1,vinculoAnual:{planoId:'a1',revision:2,conteudos:[{texto:'Saneamento'}]}});
});
it('anual da disciplina pode ser criado sem fonte e sem seletor de conteúdo anual',()=>{
 render(<PlanejarAula modoCompleto mostrarLista={false} planosAnuais={[]} rascunhoInicial={{...criarRascunho('normal','anual'),integracaoAnual:1}}/>);
 expect(screen.queryByLabelText('Planejamento anual de base')).toBeNull();expect(screen.getByRole('button',{name:'Salvar planejamento'})).not.toBeDisabled();
});
it('não carrega conteúdo de outra fonte ao trocar seleção durante resposta pendente',async()=>{
 let resolver;mocks.obter.mockImplementationOnce(()=>new Promise(r=>resolver=r)).mockResolvedValue({plano:{...anual,id:'a2',titulo:'Outra disciplina',disciplina:'História'}});
 render(<PlanejarAula modoCompleto mostrarLista={false} planosAnuais={[anual,{...anual,id:'a2',titulo:'Outro anual'}]} rascunhoInicial={{...criarRascunho('normal','aula'),integracaoAnual:1}}/>);
 fireEvent.change(screen.getByLabelText('Planejamento anual de base'),{target:{value:'a1'}});await waitFor(()=>expect(mocks.obter).toHaveBeenCalled());
 fireEvent.change(screen.getByLabelText('Planejamento anual de base'),{target:{value:'a2'}});
 await screen.findByLabelText('Água · 1º bimestre');resolver({plano:anual});
 fireEvent.click(screen.getByLabelText('Água · 1º bimestre'));fireEvent.click(screen.getByRole('button',{name:'Usar conteúdos selecionados'}));
 expect(screen.getByLabelText('Disciplina').value).toBe('História');
});
