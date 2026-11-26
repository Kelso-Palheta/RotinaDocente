import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {normalizarPlano,validarVinculoPlano} from '@/dominio/aula-gamificada/planos';
import {criarVersaoGamificada} from '@/dominio/aula-gamificada/reutilizarPlano';
import {criarPlanoDeConteudo} from '@/dominio/aula-gamificada/derivarPlano';
import {criarRascunho} from '@/components/planejamento/modelos';
import {PlanoParaImpressao} from '@/components/planejamento/PlanoParaImpressao';
import {PlanejarAula} from '@/components/aula-gamificada/PlanejarAula';
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),listarPlanos:async()=>({planos:[]})}));
afterEach(cleanup);
const base=()=>({...criarRascunho('normal','anual',null,'planejamento'),id:'p1',revision:1,titulo:'Ciências no ano',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água e energia',objetivo:'Compreender fenômenos',etapas:[
{id:'b1',titulo:'1º bimestre',tipo:'desenvolvimento',prazo:'1º bimestre',orientacao:'Investigar o ambiente.',curriculo:{conteudos:'Ciclo da água',objetivos:'Explicar evaporação',cargaHoraria:'12 aulas',metodologias:'Experimento',recursos:'Recipientes',apoios:'Texto ampliado',avaliacao:'Registro de hipóteses',habilidadesBNCC:'Informar após consulta'}},
{id:'b2',titulo:'2º bimestre',tipo:'desenvolvimento',prazo:'2º bimestre',orientacao:'Investigar energia.',curriculo:{conteudos:'Fontes de energia',objetivos:'Comparar fontes'}}]});
describe('Revisão independente da separação do planejamento',()=>{
 it('preserva currículo por período e o imprime',()=>{
  const p=normalizarPlano(base());
  expect(p.etapas[0].curriculo).toEqual(base().etapas[0].curriculo);
  render(<PlanoParaImpressao plano={p}/>);
  for(const texto of ['Ciclo da água','Explicar evaporação','12 aulas','Experimento','Registro de hipóteses'])expect(screen.getByText(texto)).toBeTruthy();
 });
 it('recorte utiliza apenas conteúdos e objetivos dos períodos selecionados',()=>{
  const original=base(),antes=structuredClone(original);
  const p=criarPlanoDeConteudo(original,{etapaIds:['b2'],escalaDestino:'semanal'});
  expect(p.conteudo).toBe('Fontes de energia');expect(p.objetivo).toBe('Comparar fontes');
  expect(p.etapas[0].curriculo.conteudos).toBe('Fontes de energia');
  expect(original).toEqual(antes);
 });
 it('gamifica planejamento explícito sem perder sua abrangência',()=>{
  const p=criarVersaoGamificada(base(),{etapaIds:['b1'],escalaDestino:'anual'});
  expect(p.abrangencia).toBe('planejamento');expect(p.tipo).toBe('gamificado');
  expect(()=>normalizarPlano(p)).not.toThrow();
 });
 it.each(['quinzenal','mensal'])('gamifica conteúdo %s mantendo a duração',escala=>{
  const fonte={...base(),abrangencia:'conteudo',escala};
  const p=criarVersaoGamificada(fonte,{etapaIds:['b1'],escalaDestino:escala});
  expect(p).toMatchObject({abrangencia:'conteudo',escala});
 });
 it('planos antigos de duração longa continuam preparando partida',()=>{
  const fonte=base();delete fonte.abrangencia;
  const p={...criarVersaoGamificada(fonte,{etapaIds:['b1'],escalaDestino:'anual'}),id:'j1',revision:1};
  expect(p).not.toHaveProperty('abrangencia');
  expect(()=>validarVinculoPlano(p,{planoRevision:1,modalidade:'quiz',experiencia:'padrao',questaoIds:[]})).not.toThrow();
 });
 it('editor permite conteúdos e objetivos diferentes em cada período',()=>{
  render(<PlanejarAula modoCompleto mostrarLista={false} rascunhoInicial={base()}/>);
  expect(screen.getByLabelText('Conteúdos do período 1').value).toBe('Ciclo da água');
  fireEvent.change(screen.getByLabelText('Conteúdos do período 2'),{target:{value:'Energia solar'}});
  expect(screen.getByLabelText('Conteúdos do período 1').value).toBe('Ciclo da água');
  expect(screen.getByLabelText('Conteúdos do período 2').value).toBe('Energia solar');
 });
 it('editor mantém desenvolvimento selecionável na aula gamificada derivada',()=>{
  const p=criarPlanoDeConteudo(base(),{etapaIds:['b1','b2'],escalaDestino:'aula',tipoDestino:'gamificado'});
  render(<PlanejarAula modoCompleto mostrarLista={false} rascunhoInicial={p}/>);
  expect(screen.getAllByRole('combobox').filter(e=>e.value==='desenvolvimento').length).toBeGreaterThan(0);
 });
});
