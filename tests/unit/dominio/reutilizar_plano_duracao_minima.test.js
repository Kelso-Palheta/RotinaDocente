import {describe,it,expect} from 'vitest';
import {criarVersaoGamificada} from '@/dominio/aula-gamificada/reutilizarPlano';
import {normalizarPlano} from '@/dominio/aula-gamificada/planos';
const fonte={id:'anual',revision:1,tipo:'normal',escala:'anual',titulo:'Plano anual',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Comparar dados',turmaIds:[],questaoIds:[],duracaoMinutos:null,etapas:[{id:'e1',titulo:'Primeiro período',tipo:'desenvolvimento',prazo:'1º bimestre',minutos:null,orientacao:'Investigar água.'},{id:'e2',titulo:'Segundo período',tipo:'desenvolvimento',prazo:'2º bimestre',minutos:null,orientacao:'Comparar evidências.'}]};
describe('Adaptação para duração mínima de aula',()=>{
 it.each([['e1'],['e1','e2']])('redistribui todas as etapas para dez minutos: %j',(...etapaIds)=>{
  const p=criarVersaoGamificada(fonte,{etapaIds,escalaDestino:'aula',duracaoMinutos:10});
  expect(p.etapas.every(e=>Number.isInteger(e.minutos)&&e.minutos>=1)).toBe(true);
  expect(p.etapas.reduce((n,e)=>n+e.minutos,0)).toBe(10);
  expect(normalizarPlano(p)).toMatchObject({duracaoMinutos:10,tipo:'gamificado'});
 });
});
