import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@/components/aula-gamificada/api',()=>({obterPlano:vi.fn(),salvarPlano:vi.fn(),gerarRequestId:vi.fn(()=> 'derivar_1')}));
import * as api from '@/components/aula-gamificada/api';
import {DerivarPlanoConteudo} from '@/components/planejamento/DerivarPlanoConteudo';

const origem={id:'disc1',revision:3,tipo:'normal',abrangencia:'planejamento',escala:'anual',titulo:'Ciências no ano',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água, energia e ambiente',objetivo:'Comparar evidências',duracaoMinutos:null,turmaIds:['t1'],questaoIds:[],contexto:{apoios:'Leitura compartilhada'},etapas:[{id:'b1',tipo:'desenvolvimento',titulo:'Água',prazo:'1º bimestre',minutos:null,orientacao:'Investigar água.'},{id:'b2',tipo:'desenvolvimento',titulo:'Energia',prazo:'2º bimestre',minutos:null,orientacao:'Investigar energia.'}]};
afterEach(()=>{cleanup();vi.clearAllMocks();});

it('deriva plano de conteúdo regular a partir de um recorte, sem alterar o original',async()=>{
 const antes=structuredClone(origem),criado=vi.fn();
 api.obterPlano.mockResolvedValue({plano:origem});api.salvarPlano.mockImplementation(async({plano})=>({plano:{...plano,id:'novo1',revision:1}}));
 render(<DerivarPlanoConteudo planos={[origem]} origemInicialId="disc1" turmas={[{id:'t1'}]} onCriado={criado}/>);
 await screen.findByText('Ciências no ano');
 fireEvent.click(screen.getByRole('button',{name:'Desmarcar todas'}));
 fireEvent.click(screen.getByLabelText('Energia'));
 fireEvent.change(screen.getByLabelText('Duração do plano de conteúdo'),{target:{value:'semanal'}});
 fireEvent.click(screen.getByRole('button',{name:'Criar plano de conteúdo'}));
 await waitFor(()=>expect(criado).toHaveBeenCalled());
 const p=api.salvarPlano.mock.calls[0][0].plano;
 expect(p).toMatchObject({abrangencia:'conteudo',escala:'semanal',tipo:'normal',titulo:expect.stringContaining('semana')});
 expect(p.origem).toEqual({planoId:'disc1',revision:3,etapaIds:['b2'],finalidade:'conteudo'});
 expect(p.id).toBeUndefined();
 expect(origem).toEqual(antes);
});

it('deriva aula gamificada com duração explícita e questões vazias',async()=>{
 api.obterPlano.mockResolvedValue({plano:origem});api.salvarPlano.mockImplementation(async({plano})=>({plano:{...plano,id:'novo2',revision:1}}));
 render(<DerivarPlanoConteudo planos={[origem]} origemInicialId="disc1"/>);
 await screen.findByText('Ciências no ano');
 fireEvent.change(screen.getByLabelText('Tipo do novo plano'),{target:{value:'gamificado'}});
 fireEvent.change(screen.getByLabelText('Duração do plano de conteúdo'),{target:{value:'aula'}});
 fireEvent.change(screen.getByLabelText('Duração da aula (minutos)'),{target:{value:'40'}});
 fireEvent.click(screen.getByRole('button',{name:'Criar plano de conteúdo'}));
 await waitFor(()=>expect(api.salvarPlano).toHaveBeenCalled());
 const p=api.salvarPlano.mock.calls[0][0].plano;
 expect(p).toMatchObject({abrangencia:'conteudo',escala:'aula',tipo:'gamificado',modalidade:'quiz',duracaoMinutos:40});
 expect(p.etapas.reduce((n,e)=>n+e.minutos,0)).toBe(40);
 expect(p.questaoIds).toEqual([]);
});

it('lista somente planejamentos da disciplina como origem',async()=>{
 const outro={...origem,id:'conteudo1',abrangencia:'conteudo',escala:'semanal',titulo:'Plano semanal'};
 api.obterPlano.mockResolvedValue({plano:origem});
 render(<DerivarPlanoConteudo planos={[origem,outro]}/>);
 const select=screen.getByLabelText('Planejamento da disciplina de origem');
 expect([...select.options].map(o=>o.textContent)).toEqual(['Selecione um planejamento salvo','Ciências no ano · Anual']);
});
