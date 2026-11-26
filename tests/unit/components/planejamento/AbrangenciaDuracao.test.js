import {describe,it,expect} from 'vitest';
import {normalizarPlano,abrangenciaDoPlano,abrangenciaDaEscala,ABRANGENCIA_DURACOES} from '@/dominio/aula-gamificada/planos';
import {ABRANGENCIAS,DURACOES,rotuloDuracao,criarRascunho} from '@/components/planejamento/modelos';

const base={titulo:'Plano',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Analisar evidências',tipo:'normal',duracaoMinutos:50,turmaIds:[],etapas:[{id:'d',titulo:'Desenvolvimento',tipo:'desenvolvimento',minutos:50,orientacao:'Observar.'}]};
const etapaPrazo=(id='p1')=>({id,titulo:'Período',tipo:'desenvolvimento',prazo:'Semanas 1 a 5',orientacao:'Conteúdos do período.'});

describe('Abrangência e duração são eixos separados',()=>{
 it('cada abrangência tem a sua própria lista de durações',()=>{
  expect(ABRANGENCIAS.map(([id])=>id)).toEqual(['planejamento','conteudo']);
  expect(DURACOES.planejamento.map(([id])=>id)).toEqual(['anual','semestral','bimestral']);
  expect(DURACOES.conteudo.map(([id])=>id)).toEqual(['aula','semanal','quinzenal','mensal','bimestral','sequencia','projeto']);
  expect(ABRANGENCIA_DURACOES.planejamento).toEqual(['anual','semestral','bimestral']);
  expect(ABRANGENCIA_DURACOES.conteudo).toEqual(['aula','semanal','quinzenal','mensal','bimestral','sequencia','projeto']);
  expect(rotuloDuracao('bimestral','planejamento')).toBe('Bimestral');
  expect(rotuloDuracao('bimestral','conteudo')).toBe('Bimestre');
 });
 it('planejamento da disciplina organiza vários conteúdos por períodos',()=>{
  const p=criarRascunho('normal','bimestral',null,'planejamento');
  expect(p.abrangencia).toBe('planejamento');
  expect(p.duracaoMinutos).toBeNull();
  expect(p.etapas.length).toBeGreaterThanOrEqual(3);
  expect(p.etapas.every(e=>e.prazo&&e.tipo==='desenvolvimento')).toBe(true);
 });
 it('plano de conteúdo cobre aula, semana, quinzena, mês, bimestre, sequência e projeto',()=>{
  for(const [escala] of DURACOES.conteudo){
   const p=criarRascunho('normal',escala,null,'conteudo');
   expect(p.abrangencia).toBe('conteudo');
   expect(p.escala).toBe(escala);
   if(escala==='aula')expect(p.duracaoMinutos).toBeGreaterThanOrEqual(10);
   else{expect(p.duracaoMinutos).toBeNull();expect(p.etapas.every(e=>e.prazo)).toBe(true);}
  }
 });
 it('bimestre tem significados diferentes nas duas abrangências',()=>{
  const disciplina=criarRascunho('normal','bimestral',null,'planejamento');
  const conteudo=criarRascunho('normal','bimestral',null,'conteudo');
  expect(disciplina.etapas.map(e=>e.titulo)).not.toEqual(conteudo.etapas.map(e=>e.titulo));
  expect(abrangenciaDoPlano(disciplina)).toBe('planejamento');
  expect(abrangenciaDoPlano(conteudo)).toBe('conteudo');
 });
 it('regular e gamificado são independentes das duas abrangências',()=>{
  for(const abrangencia of ['planejamento','conteudo']){
   const escala=abrangencia==='planejamento'?'anual':'semanal';
   const regular=criarRascunho('normal',escala,null,abrangencia);
   const gamificado=criarRascunho('gamificado',escala,null,abrangencia);
   expect(regular.abrangencia).toBe(abrangencia);
   expect(gamificado.abrangencia).toBe(abrangencia);
   expect(regular.modalidade).toBeNull();
   expect(gamificado.modalidade).toBe('quiz');
  }
 });
});

describe('Compatibilidade de planos existentes',()=>{
 it('lê o legado sem gravar abrangência automática',()=>{
  expect(abrangenciaDaEscala('anual')).toBe('planejamento');
  expect(abrangenciaDaEscala('bimestral','planejamento')).toBe('planejamento');
  expect(abrangenciaDaEscala('semanal')).toBe('conteudo');
  expect(abrangenciaDaEscala('aula')).toBe('conteudo');
  const antigo=normalizarPlano({...base,escala:'bimestral',duracaoMinutos:null,etapas:[etapaPrazo()]});
  expect(antigo.escala).toBe('bimestral');
  expect(antigo).not.toHaveProperty('abrangencia');
  expect(abrangenciaDoPlano(antigo)).toBe('planejamento');
 });
 it('aceita plano de conteúdo de bimestre e planejamento anual',()=>{
  const conteudo=normalizarPlano({...base,abrangencia:'conteudo',escala:'bimestral',duracaoMinutos:null,etapas:[etapaPrazo()]});
  expect(conteudo).toMatchObject({abrangencia:'conteudo',escala:'bimestral',duracaoMinutos:null});
  const disciplina=normalizarPlano({...base,abrangencia:'planejamento',escala:'anual',duracaoMinutos:null,etapas:[etapaPrazo('b1')]});
  expect(disciplina).toMatchObject({abrangencia:'planejamento',escala:'anual'});
 });
 it('recusa duração fora da abrangência e novas durações sem abrangência',()=>{
  expect(()=>normalizarPlano({...base,abrangencia:'planejamento',escala:'quinzenal',duracaoMinutos:null,etapas:[etapaPrazo()]})).toThrow(/duração|duração/i);
  expect(()=>normalizarPlano({...base,abrangencia:'conteudo',escala:'anual',duracaoMinutos:null,etapas:[etapaPrazo()]})).toThrow(/duração|duração/i);
  expect(()=>normalizarPlano({...base,escala:'quinzenal',duracaoMinutos:null,etapas:[etapaPrazo()]})).toThrow(/abrangência/i);
  expect(()=>normalizarPlano({...base,escala:'mensal',duracaoMinutos:null,etapas:[etapaPrazo()]})).toThrow(/abrangência/i);
 });
 it('recusa abrangência desconhecida',()=>{
  expect(()=>normalizarPlano({...base,abrangencia:'inventada',escala:'anual',duracaoMinutos:null,etapas:[etapaPrazo()]})).toThrow(/abrangência/i);
 });
});
