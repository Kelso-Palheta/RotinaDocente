import {describe,it,expect} from 'vitest';
import {PlanejamentoService} from '@/aplicacao/aula-gamificada/PlanejamentoService';
import {criarPlanoDeConteudo} from '@/dominio/aula-gamificada/derivarPlano';
import {normalizarPlano,resumoPlano} from '@/dominio/aula-gamificada/planos';

const prof={tipo:'professor',uid:'p1'};
const base={titulo:'Plano',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Analisar evidências',turmaIds:[],questaoIds:[]};
const disciplina={...base,tipo:'normal',abrangencia:'planejamento',escala:'bimestral',duracaoMinutos:null,etapas:[{id:'p1',titulo:'1º período',tipo:'desenvolvimento',prazo:'Semanas 1 a 5',orientacao:'Conteúdos A e B.'},{id:'p2',titulo:'2º período',tipo:'desenvolvimento',prazo:'Semanas 6 a 10',orientacao:'Conteúdo C.'}]};
const conteudo={...base,tipo:'normal',abrangencia:'conteudo',escala:'quinzenal',duracaoMinutos:null,etapas:[{id:'q1',titulo:'Quinzena',tipo:'desenvolvimento',prazo:'Duas semanas',orientacao:'Tema único.'}]};

function fixture(inicial=[]){const docs=new Map(inicial);const copy=x=>x==null?null:structuredClone(x);const store={get:async p=>copy(docs.get(p)),transaction:async fn=>{let escreveu=false;const writes=new Map();const r=await fn({get:p=>{if(escreveu)throw Error('Leitura após escrita');return store.get(p);},set:(p,v)=>{escreveu=true;writes.set(p,copy(v));}});for(const [p,v]of writes)docs.set(p,v);return r;}};let id=0;return{docs,service:new PlanejamentoService({store,agora:()=>1000,gerarId:()=>`novo_${++id}`,lerTurmas:async()=>[]})};}

describe('Persistência das duas abrangências',()=>{
 it('salva planejamento da disciplina em períodos e resume a abrangência',async()=>{
  const{service}=fixture();const{plano}=await service.salvarPlano(prof,{plano:disciplina,requestId:'disc'});
  expect(plano).toMatchObject({abrangencia:'planejamento',escala:'bimestral',duracaoMinutos:null});
  expect((await service.listarPlanos(prof)).planos[0]).toMatchObject({abrangencia:'planejamento',escala:'bimestral'});
 });
 it('salva plano de conteúdo em quinzena e mês sem minutos fictícios',async()=>{
  const{service}=fixture();
  for(const escala of ['quinzenal','mensal']){
   const{plano}=await service.salvarPlano(prof,{plano:{...conteudo,escala},requestId:'c_'+escala});
   expect(plano).toMatchObject({abrangencia:'conteudo',escala,duracaoMinutos:null});
   expect(plano.etapas[0].minutos).toBeNull();
  }
 });
 it('mantém plano legado sem abrangência ao salvar',async()=>{
  const{service}=fixture();const legado={...base,tipo:'normal',escala:'aula',duracaoMinutos:50,modalidade:null,experiencia:'padrao',etapas:[{id:'d',titulo:'Desenvolvimento',tipo:'desenvolvimento',minutos:50,orientacao:'Observar.'}]};
  const{plano}=await service.salvarPlano(prof,{plano:legado,requestId:'legado'});
  expect(plano.escala).toBe('aula');
  expect('abrangencia'in plano).toBe(false);
  expect(resumoPlano(plano)).not.toHaveProperty('abrangencia');
 });
 it('recusa abrangência e duração incompatíveis antes de gravar',async()=>{
  const{service,docs}=fixture();
  await expect(service.salvarPlano(prof,{plano:{...disciplina,escala:'quinzenal'},requestId:'x'})).rejects.toMatchObject({status:422});
  await expect(service.salvarPlano(prof,{plano:{...conteudo,escala:'anual'},requestId:'y'})).rejects.toMatchObject({status:422});
  expect([...docs.keys()].some(k=>/\/planos\//.test(k))).toBe(false);
 });
});

describe('Derivação persistida com vínculo de origem',()=>{
 it('cria plano de conteúdo, preserva o original e preenche metadados da origem',async()=>{
  const{service,docs}=fixture();const{plano:fonte}=await service.salvarPlano(prof,{plano:disciplina,requestId:'fonte'});
  const derivado=criarPlanoDeConteudo(fonte,{etapaIds:['p1'],escalaDestino:'semanal',tipoDestino:'normal'});
  const{plano}=await service.salvarPlano(prof,{plano:derivado,requestId:'derivar'});
  expect(plano.id).not.toBe(fonte.id);
  expect(plano).toMatchObject({abrangencia:'conteudo',escala:'semanal',tipo:'normal'});
  expect(plano.origem).toEqual({planoId:fonte.id,revision:1,titulo:fonte.titulo,escala:'bimestral',abrangencia:'planejamento',etapaIds:['p1'],finalidade:'conteudo'});
  expect(docs.get(`aulaGamificadaDocentes/p1/planos/${fonte.id}`)).toEqual(fonte);
 });
 it('aceita versão gamificada derivada e mantém tipo independente da abrangência',async()=>{
  const{service}=fixture();const{plano:fonte}=await service.salvarPlano(prof,{plano:disciplina,requestId:'fonte'});
  const derivado=criarPlanoDeConteudo(fonte,{etapaIds:['p2'],escalaDestino:'aula',duracaoMinutos:50,tipoDestino:'gamificado'});
  const{plano}=await service.salvarPlano(prof,{plano:derivado,requestId:'derivar_game'});
  expect(plano).toMatchObject({tipo:'gamificado',abrangencia:'conteudo',escala:'aula',modalidade:'quiz',duracaoMinutos:50});
  expect(plano.etapas.some(e=>e.tipo==='jogo')).toBe(true);
 });
 it('recusa origem de conteúdo e conversão do derivado em planejamento',async()=>{
  const{service}=fixture();const{plano:conteudoSalvo}=await service.salvarPlano(prof,{plano:conteudo,requestId:'c'});
  const falsa=normalizarPlano({...conteudo,origem:{planoId:conteudoSalvo.id,revision:1,etapaIds:['q1'],finalidade:'conteudo'}});
  await expect(service.salvarPlano(prof,{plano:falsa,requestId:'origem_conteudo'})).rejects.toMatchObject({status:422});

  const{plano:fonte}=await service.salvarPlano(prof,{plano:disciplina,requestId:'fonte'});
  const derivado=criarPlanoDeConteudo(fonte,{etapaIds:['p1'],escalaDestino:'semanal'});
  const{plano:salvo}=await service.salvarPlano(prof,{plano:derivado,requestId:'derivar'});
  await expect(service.salvarPlano(prof,{plano:{...salvo,abrangencia:'planejamento',escala:'anual',duracaoMinutos:null,etapas:[{id:'p1',titulo:'Ano',tipo:'desenvolvimento',prazo:'Ano letivo',orientacao:'x'}]},expectedRevision:1,requestId:'converter'})).rejects.toMatchObject({status:422});
 });
 it('não aceita origem em planejamento da disciplina',()=>{
  expect(()=>normalizarPlano({...disciplina,origem:{planoId:'x',revision:1,etapaIds:['p1'],finalidade:'conteudo'}})).toThrow(/origem/i);
 });
});
