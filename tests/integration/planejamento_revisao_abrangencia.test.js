import {describe,it,expect} from 'vitest';
import {PlanejamentoService} from '@/aplicacao/aula-gamificada/PlanejamentoService';
import {criarRascunho} from '@/components/planejamento/modelos';
import {criarVersaoGamificada} from '@/dominio/aula-gamificada/reutilizarPlano';
import {criarPlanoDeConteudo} from '@/dominio/aula-gamificada/derivarPlano';
import {normalizarPlano} from '@/dominio/aula-gamificada/planos';
const ator={tipo:'professor',uid:'p1'};
function fixture(){const docs=new Map(),copy=x=>x==null?null:structuredClone(x);const store={get:async p=>copy(docs.get(p)),transaction:async fn=>{let escreveu=false;const writes=new Map();const r=await fn({get:async p=>{if(escreveu)throw Error('Leitura após escrita');return copy(docs.get(p));},set:(p,v)=>{escreveu=true;writes.set(p,copy(v));}});for(const [p,v]of writes)docs.set(p,v);return r;}};let i=0;return{docs,service:new PlanejamentoService({store,agora:()=>1000,gerarId:()=>`novo_${++i}`,lerTurmas:async()=>[]})};}
const fonte=()=>({...criarRascunho('normal','anual',null,'planejamento'),titulo:'Ciências no ano',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água e energia',objetivo:'Investigar fenômenos',etapas:[{id:'b1',titulo:'1º bimestre',tipo:'desenvolvimento',prazo:'1º bimestre',orientacao:'Investigar.',curriculo:{conteudos:'Ciclo da água',objetivos:'Explicar evaporação',avaliacao:'Registro do experimento'}}]});
describe('Revisão de persistência, origem e compatibilidade',()=>{
 it('salva, reabre e edita currículo por período sem apagar o restante',async()=>{
  const{service}=fixture();const{plano:p}=await service.salvarPlano(ator,{plano:fonte(),requestId:'origem'});
  const aberto=(await service.obterPlano(ator,p.id)).plano;aberto.etapas[0].curriculo.conteudos='Água potável';
  const{plano:editado}=await service.salvarPlano(ator,{plano:aberto,expectedRevision:1,requestId:'editar'});
  expect(editado.etapas[0].curriculo).toEqual({conteudos:'Água potável',objetivos:'Explicar evaporação',avaliacao:'Registro do experimento'});
  expect(editado.revision).toBe(2);
 });
 it('gamificação anual preserva abrangência e origem verificada, editável depois',async()=>{
  const{service}=fixture();const{plano:p}=await service.salvarPlano(ator,{plano:fonte(),requestId:'origem'});
  const{plano:jogo}=await service.salvarPlano(ator,{plano:criarVersaoGamificada(p,{etapaIds:['b1']}),requestId:'gamificar'});
  expect(jogo.abrangencia).toBe('planejamento');expect(jogo.origem.planoId).toBe(p.id);
  const{plano:editado}=await service.salvarPlano(ator,{plano:{...jogo,titulo:'Versão revisada'},expectedRevision:1,requestId:'editar'});
  expect(editado.origem).toEqual(jogo.origem);expect((await service.obterPlano(ator,p.id)).plano).toEqual(p);
 });
 it('origem privada: outra conta não deriva nem reabre plano alheio',async()=>{
  const{service}=fixture();const{plano:p}=await service.salvarPlano(ator,{plano:fonte(),requestId:'origem'});
  const outro={tipo:'professor',uid:'p2'},derivado=criarPlanoDeConteudo(p,{etapaIds:['b1']});
  await expect(service.salvarPlano(outro,{plano:derivado,requestId:'derivar'})).rejects.toMatchObject({status:404});
  await expect(service.obterPlano(outro,p.id)).rejects.toMatchObject({status:404});
 });
 it('recusa fonte alterada e mantém repetição idempotente depois de criada',async()=>{
  const{service}=fixture();const{plano:p}=await service.salvarPlano(ator,{plano:fonte(),requestId:'origem'});
  const derivado=criarPlanoDeConteudo(p,{etapaIds:['b1']});
  const primeiro=await service.salvarPlano(ator,{plano:derivado,requestId:'derivar'});
  await service.salvarPlano(ator,{plano:{...p,titulo:'Ano atualizado'},expectedRevision:1,requestId:'editar'});
  expect(await service.salvarPlano(ator,{plano:derivado,requestId:'derivar'})).toEqual(primeiro);
  await expect(service.salvarPlano(ator,{plano:derivado,requestId:'outro'})).rejects.toMatchObject({status:409});
 });
 it('rejeita adulteração de origem após salvar derivado',async()=>{
  const{service}=fixture();const{plano:p}=await service.salvarPlano(ator,{plano:fonte(),requestId:'origem'});
  const{plano:d}=await service.salvarPlano(ator,{plano:criarPlanoDeConteudo(p,{etapaIds:['b1']}),requestId:'derivar'});
  await expect(service.salvarPlano(ator,{plano:{...d,origem:{...d.origem,revision:9}},expectedRevision:1,requestId:'adulterar'})).rejects.toMatchObject({status:422});
 });
 it('limita campos por período e descarta campos externos ao contrato',()=>{
  for(const curriculo of [[], 'inválido', {conteudos:'x'.repeat(3001)}])expect(()=>normalizarPlano({...fonte(),etapas:[{...fonte().etapas[0],curriculo}]})).toThrow();
  expect(normalizarPlano({...fonte(),etapas:[{...fonte().etapas[0],curriculo:{conteudos:'Água',donoUid:'p2'}}]}).etapas[0].curriculo).toEqual({conteudos:'Água'});
 });
});

it('derivação é idempotente, exige revisão atual e não aceita origem forjada',async()=>{
 const{service}=fixture();const{plano:p}=await service.salvarPlano(ator,{plano:fonte(),requestId:'fonte'});
 const body={plano:criarPlanoDeConteudo(p,{etapaIds:['b1'],escalaDestino:'mensal'}),requestId:'derivar'};
 const salvo=await service.salvarPlano(ator,body);
 await service.salvarPlano(ator,{plano:{...p,titulo:'Original atualizado'},expectedRevision:1,requestId:'editar_fonte'});
 expect(await service.salvarPlano(ator,body)).toEqual(salvo);
 await expect(service.salvarPlano(ator,{...body,requestId:'desatualizado'})).rejects.toMatchObject({status:409});
 const origemForjada={...salvo.plano,origem:{...salvo.plano.origem,etapaIds:['alheia']}};
 await expect(service.salvarPlano(ator,{plano:origemForjada,expectedRevision:1,requestId:'forjar'})).rejects.toMatchObject({status:422});
});
it('limita e valida campos curriculares sem persistir metadados externos',()=>{
 const plano=fonte();plano.etapas[0].curriculo.autorUid='alheio';
 expect(normalizarPlano(plano).etapas[0].curriculo).not.toHaveProperty('autorUid');
 plano.etapas[0].curriculo.conteudos='a'.repeat(3001);
 expect(()=>normalizarPlano(plano)).toThrow();
 plano.etapas[0].curriculo=[];
 expect(()=>normalizarPlano(plano)).toThrow(/currículo/i);
});
