import { describe, it, expect } from 'vitest';
import { normalizarPlano, resumoPlano, validarVinculoPlano } from '@/dominio/aula-gamificada/planos';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

const base={titulo:'Plano regular',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Analisar evidências',tipo:'normal',escala:'aula',duracaoMinutos:50,turmaIds:[],etapas:[{id:'desenvolvimento',titulo:'Comparar dados',tipo:'desenvolvimento',minutos:50,orientacao:'Orientar a observação.'}]};
const legado={...base,tipo:undefined,escala:undefined,modalidade:'quiz',questaoIds:['q1','q2'],etapas:[{id:'a',titulo:'Início',tipo:'introducao',minutos:5},{id:'m',titulo:'Missão',tipo:'jogo',minutos:35},{id:'f',titulo:'Síntese',tipo:'fechamento',minutos:10}]};
function fixture(){
 const docs=new Map([['professores/p1/turmas/data',{turmas:[]}]]);
 const copy=x=>x==null?null:structuredClone(x);
 const store={get:async p=>copy(docs.get(p)),list:async p=>[...docs].filter(([k])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')).map(([,v])=>copy(v)),transaction:async fn=>{let escreveu=false;const writes=new Map();const r=await fn({get:p=>{if(escreveu)throw Error('Leitura após escrita');return store.get(p);},set:(p,v)=>{escreveu=true;writes.set(p,copy(v));}});for(const [p,v]of writes)docs.set(p,v);return r;}};
 let n=0;return {store,docs,service:new AulaGamificadaService({store,agora:()=>1000,gerarId:()=>`plano_${++n}`,gerarCodigo:()=> 'REG123'})};
}
const prof={tipo:'professor',uid:'p1'};
describe('Planejamento regular independente de jogo',()=>{
 it('salva aula regular sem modalidade, questões ou etapa de jogo',async()=>{
  const {service,store}=fixture();const {plano}=await service.salvarPlano(prof,{plano:base,requestId:'regular'});
  expect(plano).toMatchObject({tipo:'normal',escala:'aula',modalidade:null,experiencia:'padrao',questaoIds:[]});
  expect((await new AulaGamificadaService({store}).obterPlano(prof,plano.id)).plano).toEqual(plano);
  expect((await service.listarPlanos(prof)).planos[0]).toMatchObject({tipo:'normal',escala:'aula'});
 });
 it.each(['semanal','bimestral','semestral','anual','sequencia','projeto'])('organiza %s por prazos sem minutos fictícios',escala=>{
  const plano=normalizarPlano({...base,escala,duracaoMinutos:null,etapas:[{id:'ciclo',titulo:'Primeiro ciclo',tipo:'desenvolvimento',prazo:'Primeiro período',orientacao:'Investigar.'}]});
  expect(plano.duracaoMinutos).toBeNull();expect(plano.etapas[0]).toMatchObject({minutos:null,prazo:'Primeiro período'});
 });
 it('preserva dados pedagógicos limitados sem autoria arbitrária',()=>{
  const plano=normalizarPlano({...base,anoLetivo:2027,modeloId:'mat-15-p001',contexto:{conhecimentosPrevios:'Hipóteses da turma',recursos:'Papel e projetor',apoios:'Texto ampliado',avaliacao:'Registro de observações',habilidadesBNCC:'A confirmar pelo professor',publico:'Turma heterogênea',cargaHoraria:'Duas aulas',uid:'forjado'}});
  expect(plano).toMatchObject({anoLetivo:2027,modeloId:'mat-15-p001',contexto:{recursos:'Papel e projetor'}});expect(plano.contexto).not.toHaveProperty('uid');
  expect(()=>normalizarPlano({...base,contexto:{recursos:'x'.repeat(1501)}})).toThrow();
  expect(()=>normalizarPlano({...base,anoLetivo:1999})).toThrow();
 });
 it('regular descarta referências de jogo e nunca pode ser vinculado a sala',()=>{
  const plano={...normalizarPlano({...base,modalidade:'quiz',experiencia:'resgate',questaoIds:['q_alheia']}),id:'p1',revision:1};
  expect(plano.modalidade).toBeNull();expect(plano.questaoIds).toEqual([]);
  expect(()=>validarVinculoPlano(plano,{planoRevision:1,modalidade:null,questaoIds:[]})).toThrow(/regular/i);
 });
 it('mantém legado gamificado, soma de minutos e distribuição das questões',()=>{
  const plano=normalizarPlano(legado);expect(plano.modalidade).toBe('quiz');expect(plano.etapas[1].questaoIds).toEqual(['q1','q2']);
  expect(plano).not.toHaveProperty('tipo');expect(resumoPlano({...plano,id:'p1',revision:1}).modalidade).toBe('quiz');
  expect(()=>normalizarPlano({...legado,duracaoMinutos:60})).toThrow();
 });
 it('permite gamificado de prazo longo mas exige etapa de jogo',()=>{
  const plano=normalizarPlano({...legado,tipo:'gamificado',escala:'semestral',duracaoMinutos:null,etapas:[{id:'missao',titulo:'Missão semestral',tipo:'jogo',prazo:'1º semestre'}]});
  expect(plano.etapas[0].questaoIds).toEqual(['q1','q2']);
  expect(()=>normalizarPlano({...plano,etapas:[{...plano.etapas[0],tipo:'desenvolvimento'}]})).toThrow();
 });
 it('rejeita tipo, escala, prazos e contexto malformados',()=>{
  for(const extra of [{tipo:'inventado'},{escala:'inventada'},{contexto:[]},{escala:'anual',etapas:[{id:'a',titulo:'Ciclo',tipo:'desenvolvimento'}]}])expect(()=>normalizarPlano({...base,...extra})).toThrow();
 });
});

it('planejamento regular longo aceita unidades/objetivos extensos sem ampliar contrato do gerador',()=>{
 const entrada={...base,escala:'anual',conteudo:'Unidade e conteúdo. '.repeat(100),objetivo:'Objetivo de aprendizagem. '.repeat(100),etapas:[{id:'c',titulo:'Ciclo',tipo:'desenvolvimento',prazo:'Ano letivo'}]};
 expect(normalizarPlano(entrada).conteudo.length).toBeGreaterThan(160);
 expect(()=>normalizarPlano({...entrada,conteudo:'x'.repeat(3001)})).toThrow();
 expect(()=>normalizarPlano({...legado,conteudo:'x'.repeat(161)})).toThrow();
});

it('criação de jogo avulso continua livre e sala recusa plano regular',async()=>{
 const {service,docs}=fixture();docs.set('professores/p1/turmas/data',{turmas:[{id:'t1',nome:'Turma',alunos:[{id:'a1',nome:'Aluno sintético'}]}]});
 const q={id:'q1',revision:1,status:'revisada',tipo:'multipla_escolha',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',dificuldade:'facil',enunciado:'Qual ação preserva a água?',explicacao:'Preservar a mata protege a nascente.',alternativas:[{id:'A',texto:'Preservar a mata'},{id:'B',texto:'Descartar lixo'}],respostaCorreta:'A'};docs.set('aulaGamificadaDocentes/p1/questoes/q1',q);
 const {plano}=await service.salvarPlano(prof,{plano:base,requestId:'normal'});
 const config={titulo:'Revisão avulsa',modalidade:'quiz',turmaIds:['t1'],questaoIds:['q1'],tempoSegundos:120};
 await expect(service.criarSala(prof,{...config,planoId:plano.id,planoRevision:1,requestId:'vinculada'})).rejects.toMatchObject({status:422});
 const {sala}=await service.criarSala(prof,{...config,requestId:'avulsa'});expect(sala.modalidade).toBe('quiz');expect(sala).not.toHaveProperty('plano');
});
