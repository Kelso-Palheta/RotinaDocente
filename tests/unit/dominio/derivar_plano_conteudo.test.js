import {describe,it,expect} from 'vitest';
import {criarPlanoDeConteudo} from '@/dominio/aula-gamificada/derivarPlano';
import {normalizarPlano} from '@/dominio/aula-gamificada/planos';

const fonte={id:'planejamento1',revision:3,tipo:'normal',abrangencia:'planejamento',escala:'anual',titulo:'Ciências no ano',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água; energia; ambiente',objetivo:'Analisar evidências',anoLetivo:2027,contexto:{apoios:'Texto ampliado',recursos:'Papel'},turmaIds:['t1'],duracaoMinutos:null,questaoIds:[],etapas:[{id:'b1',titulo:'1º bimestre',tipo:'desenvolvimento',minutos:null,prazo:'1º bimestre',orientacao:'Água e saneamento.'},{id:'b2',titulo:'2º bimestre',tipo:'desenvolvimento',minutos:null,prazo:'2º bimestre',orientacao:'Energia.'},{id:'b3',titulo:'3º bimestre',tipo:'desenvolvimento',minutos:null,prazo:'3º bimestre',orientacao:'Ambiente.'}]};

describe('Derivar plano de conteúdo de um recorte',()=>{
 it('preserva contexto, turmas e textos e grava origem de conteúdo',()=>{
  const antes=structuredClone(fonte);
  const p=criarPlanoDeConteudo(fonte,{etapaIds:['b2'],escalaDestino:'semanal',tipoDestino:'normal'});
  expect(fonte).toEqual(antes);
  expect(p).toMatchObject({abrangencia:'conteudo',escala:'semanal',tipo:'normal',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água; energia; ambiente',objetivo:'Analisar evidências',anoLetivo:2027,contexto:{apoios:'Texto ampliado'},turmaIds:['t1'],modalidade:null,questaoIds:[],duracaoMinutos:null});
  expect(p.etapas).toHaveLength(1);
  expect(p.etapas[0]).toMatchObject({id:'b2',prazo:'2º bimestre',orientacao:'Energia.'});
  expect(p.origem).toEqual({planoId:'planejamento1',revision:3,etapaIds:['b2'],finalidade:'conteudo'});
  expect(p).not.toHaveProperty('id');
  expect(p).not.toHaveProperty('revision');
 });
 it('deriva aula com minutos inteiros e soma exata',()=>{
  const p=criarPlanoDeConteudo(fonte,{etapaIds:['b1','b2','b3'],escalaDestino:'aula',duracaoMinutos:50});
  expect(p.escala).toBe('aula');
  expect(p.duracaoMinutos).toBe(50);
  expect(p.etapas.length).toBeGreaterThanOrEqual(3);
  expect(p.etapas.every(e=>Number.isInteger(e.minutos)&&e.minutos>=1)).toBe(true);
  expect(p.etapas.reduce((n,e)=>n+e.minutos,0)).toBe(50);
  expect(normalizarPlano(p).duracaoMinutos).toBe(50);
 });
 it('deriva versão gamificada com etapa de jogo sem criar questões',()=>{
  const p=criarPlanoDeConteudo(fonte,{etapaIds:['b1'],escalaDestino:'quinzenal',tipoDestino:'gamificado'});
  expect(p.tipo).toBe('gamificado');
  expect(p.modalidade).toBe('quiz');
  expect(p.experiencia).toBe('padrao');
  expect(p.etapas.some(e=>e.tipo==='jogo')).toBe(true);
  expect(p.questaoIds).toEqual([]);
  expect(p.abrangencia).toBe('conteudo');
 });
 it('recusa fonte que não é planejamento da disciplina',()=>{
  expect(()=>criarPlanoDeConteudo({...fonte,abrangencia:'conteudo',escala:'bimestral'},{etapaIds:['b1']})).toThrow(/planejamento da disciplina/i);
  const jogo={...fonte,tipo:'gamificado',modalidade:'quiz',abrangencia:'conteudo',escala:'aula',duracaoMinutos:50,etapas:[
   {id:'a',titulo:'Abertura',tipo:'introducao',minutos:10,orientacao:'Retomar.'},
   {id:'b',titulo:'Jogo',tipo:'jogo',minutos:30,orientacao:'Jogar.'},
   {id:'c',titulo:'Síntese',tipo:'fechamento',minutos:10,orientacao:'Fechar.'}]};
  expect(()=>criarPlanoDeConteudo(jogo,{etapaIds:['b']})).toThrow(/planejamento da disciplina/i);
 });
 it('recusa recorte vazio, repetido, alheio e duração fora do plano de conteúdo',()=>{
  for(const etapaIds of [[],['b1','b1'],['ausente']])expect(()=>criarPlanoDeConteudo(fonte,{etapaIds})).toThrow();
  expect(()=>criarPlanoDeConteudo(fonte,{etapaIds:['b1'],escalaDestino:'anual'})).toThrow(/duração/i);
 });
 it('recusa aula com mais de dez etapas e tipo inventado',()=>{
  const grande={...fonte,etapas:Array.from({length:11},(_,i)=>({...fonte.etapas[0],id:'e'+i}))};
  expect(()=>criarPlanoDeConteudo(grande,{etapaIds:grande.etapas.map(e=>e.id),escalaDestino:'aula'})).toThrow();
  expect(()=>criarPlanoDeConteudo(fonte,{etapaIds:['b1'],tipoDestino:'inventado'})).toThrow(/tipo/i);
 });
});
