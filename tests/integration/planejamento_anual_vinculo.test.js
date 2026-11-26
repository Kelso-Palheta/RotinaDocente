import {it,expect} from 'vitest';
import {PlanejamentoService} from '@/aplicacao/aula-gamificada/PlanejamentoService';
import {criarRascunho} from '@/components/planejamento/modelos';
const ator={tipo:'professor',uid:'p1'};
const anual={...criarRascunho('normal','anual',null,'planejamento'),integracaoAnual:1,titulo:'Ciências no ano',disciplina:'Ciências',anoEscolar:'8º ano',anoLetivo:2027,conteudo:'Água',objetivo:'Investigar',etapas:[{id:'b1',titulo:'1º bimestre',tipo:'desenvolvimento',prazo:'1º bimestre',orientacao:'Investigar',curriculo:{conteudos:'Água',objetivos:'Investigar'}}]};
function fixture(){const docs=new Map(),copy=x=>x==null?null:structuredClone(x);const store={get:async p=>copy(docs.get(p)),transaction:async fn=>{let escreveu=false;const writes=new Map();const r=await fn({get:async p=>{if(escreveu)throw Error('Leitura após escrita');return copy(docs.get(p));},set:(p,v)=>{escreveu=true;writes.set(p,copy(v));}});for(const [p,v]of writes)docs.set(p,v);return r;}};let i=0;return{docs,service:new PlanejamentoService({store,agora:()=>1000,gerarId:()=>`p_${++i}`,lerTurmas:async()=>[]})};}
const menor=f=>({...criarRascunho('normal','aula'),integracaoAnual:1,titulo:'Aula de Ciências',disciplina:f.disciplina,anoEscolar:f.anoEscolar,anoLetivo:f.anoLetivo,conteudo:'Água',objetivo:'Investigar',vinculoAnual:{planoId:f.id,revision:f.revision,conteudos:[{etapaId:'b1',indice:0,texto:'Água'}],titulo:'Forjado'}});
it('salva anual raiz e exige fonte nos novos planos menores',async()=>{const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});const p=menor(f);delete p.vinculoAnual;await expect(service.salvarPlano(ator,{plano:p,requestId:'sem_raiz'})).rejects.toMatchObject({status:422});expect(f.integracaoAnual).toBe(1);});
it('grava metadados confiáveis e mantém vínculo imutável nas edições',async()=>{const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});const{plano:p}=await service.salvarPlano(ator,{plano:menor(f),requestId:'aula'});expect(p.vinculoAnual.titulo).toBe(f.titulo);const{plano:editado}=await service.salvarPlano(ator,{plano:{...p,vinculoAnual:undefined,titulo:'Aula revisada'},expectedRevision:1,requestId:'editar'});expect(editado.vinculoAnual).toEqual(p.vinculoAnual);expect((await service.obterPlano(ator,f.id)).plano).toEqual(f);});
it('nega fonte alheia, texto falso, disciplina/ano divergente e revisão antiga',async()=>{const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});const p=menor(f);await expect(service.salvarPlano({tipo:'professor',uid:'p2'},{plano:p,requestId:'alheio'})).rejects.toMatchObject({status:404});for(const [i,alteracao] of [{disciplina:'História'},{anoEscolar:'9º ano'},{anoLetivo:2026},{vinculoAnual:{...p.vinculoAnual,conteudos:[{etapaId:'b1',indice:0,texto:'Inventado'}]}}].entries())await expect(service.salvarPlano(ator,{plano:{...p,...alteracao},requestId:'invalido_'+i})).rejects.toMatchObject({status:422});await service.salvarPlano(ator,{plano:{...f,titulo:'Atualizado'},expectedRevision:1,requestId:'atualizar'});await expect(service.salvarPlano(ator,{plano:p,requestId:'antigo'})).rejects.toMatchObject({status:409});});
it('repetição preserva cópia mesmo quando anual foi atualizado depois',async()=>{const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});const body={plano:menor(f),requestId:'aula'};const resposta=await service.salvarPlano(ator,body);await service.salvarPlano(ator,{plano:{...f,titulo:'Atualizado'},expectedRevision:1,requestId:'atualizar'});expect(await service.salvarPlano(ator,body)).toEqual(resposta);});
it('contrato anterior continua salvando plano independente sem migração',async()=>{const{service}=fixture();const p=menor({id:'nao_existe',revision:1,...anual});delete p.integracaoAnual;delete p.vinculoAnual;expect((await service.salvarPlano(ator,{plano:p,requestId:'legado'})).plano).not.toHaveProperty('vinculoAnual');});
it('recusa revisão antiga, item forjado e fonte que não é anual',async()=>{
 const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});
 for(const vinculoAnual of [{...menor(f).vinculoAnual,revision:9},{...menor(f).vinculoAnual,conteudos:[{etapaId:'b1',indice:0,texto:'Falso'}]}])await expect(service.salvarPlano(ator,{plano:{...menor(f),vinculoAnual},requestId:'falso_'+vinculoAnual.revision+'_'+vinculoAnual.conteudos[0].texto})).rejects.toMatchObject({status:vinculoAnual.revision===9?409:422});
 const antigo={...anual,escala:'bimestral'};delete antigo.integracaoAnual;const{plano:b}=await service.salvarPlano(ator,{plano:antigo,requestId:'bimestre_antigo'});
 await expect(service.salvarPlano(ator,{plano:menor(b),requestId:'nao_anual'})).rejects.toMatchObject({status:422});
});
it('repetição e edição preservam vínculo mesmo após atualizar o anual',async()=>{
 const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});const body={plano:menor(f),requestId:'filho'};
 const r=await service.salvarPlano(ator,body);
 await service.salvarPlano(ator,{plano:{...f,titulo:'Anual revisado'},expectedRevision:1,requestId:'atualizar'});
 expect(await service.salvarPlano(ator,body)).toEqual(r);
 const editado={...r.plano,titulo:'Plano menor editado'};delete editado.integracaoAnual;delete editado.vinculoAnual;
 const{plano:p}=await service.salvarPlano(ator,{plano:editado,expectedRevision:1,requestId:'editar'});
 expect(p.integracaoAnual).toBe(1);expect(p.vinculoAnual).toEqual(r.plano.vinculoAnual);
 await expect(service.salvarPlano(ator,{plano:{...p,vinculoAnual:{...p.vinculoAnual,revision:2}},expectedRevision:2,requestId:'trocar'})).rejects.toMatchObject({status:422});
});
it('cópia gamificada mantém snapshot anual da origem intermediária',async()=>{
 const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});const{plano:p}=await service.salvarPlano(ator,{plano:menor(f),requestId:'filho'});
 await service.salvarPlano(ator,{plano:{...f,titulo:'Anual revisado'},expectedRevision:1,requestId:'atualizar'});
 const {criarVersaoGamificada}=await import('@/dominio/aula-gamificada/reutilizarPlano');
 const{plano:jogo}=await service.salvarPlano(ator,{plano:criarVersaoGamificada(p,{etapaIds:p.etapas.map(e=>e.id)}),requestId:'gamificar'});
 expect(jogo.vinculoAnual).toEqual(p.vinculoAnual);expect(jogo.origem.planoId).toBe(p.id);
});
it('não permite transformar raiz anual salva em filha dela mesma',async()=>{
 const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});
 await expect(service.salvarPlano(ator,{plano:{...menor(f),id:f.id},expectedRevision:1,requestId:'ciclo'})).rejects.toMatchObject({status:422});
 expect((await service.obterPlano(ator,f.id)).plano).toEqual(f);
});
it('raiz anual integrada não pode ser convertida em formato menor no mesmo registro',async()=>{
 const{service}=fixture();const{plano:f}=await service.salvarPlano(ator,{plano:anual,requestId:'raiz'});const{plano:outra}=await service.salvarPlano(ator,{plano:anual,requestId:'outra_raiz'});
 await expect(service.salvarPlano(ator,{plano:{...menor(outra),id:f.id},expectedRevision:1,requestId:'converter_raiz'})).rejects.toMatchObject({status:422});
});
