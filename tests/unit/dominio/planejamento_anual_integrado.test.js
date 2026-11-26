import {describe,it,expect} from 'vitest';
import {conteudosDoAnual,aplicarPlanejamentoAnual,normalizarVinculoAnual} from '@/dominio/aula-gamificada/planejamentoAnual';
import {criarRascunho} from '@/components/planejamento/modelos';
import {normalizarPlano} from '@/dominio/aula-gamificada/planos';
import {criarVersaoGamificada} from '@/dominio/aula-gamificada/reutilizarPlano';
const anual=()=>({...criarRascunho('normal','anual',null,'planejamento'),id:'anual',revision:2,titulo:'Ciências no ano',disciplina:'Ciências',anoEscolar:'8º ano',anoLetivo:2027,conteudo:'Água e energia',objetivo:'Investigar fenômenos',contexto:{apoios:'Texto ampliado'},etapas:[{id:'b1',titulo:'1º bimestre',tipo:'desenvolvimento',prazo:'1º bimestre',orientacao:'Investigar.',curriculo:{conteudos:'Água; Saneamento\nMudanças, sociedade e ambiente',objetivos:'Explicar fenômenos'}},{id:'b2',titulo:'2º bimestre',tipo:'desenvolvimento',prazo:'2º bimestre',orientacao:'Comparar.',curriculo:{conteudos:'Energia',objetivos:'Comparar fontes'}}]});
describe('Anual integrado',()=>{
 it('oferece conteúdos por período sem quebrar títulos que contêm vírgula',()=>{const itens=conteudosDoAnual(anual());expect(itens.map(i=>i.texto)).toEqual(['Água','Saneamento','Mudanças, sociedade e ambiente','Energia']);expect(itens[3]).toMatchObject({etapaId:'b2',indice:0});});
 it('mantém conteúdo geral como opção quando anual antigo não tem currículo distribuído',()=>{const p=anual();p.etapas.forEach(e=>delete e.curriculo);expect(conteudosDoAnual(p).map(i=>i.texto)).toEqual(['Água e energia']);});
 it.each(['semestral','bimestral','aula','semanal','quinzenal','mensal','sequencia','projeto'])('aplica a base anual ao formato %s',escala=>{
  const fonte=anual(),antes=structuredClone(fonte),ab=['semestral','bimestral'].includes(escala)?'planejamento':'conteudo';
  const p=normalizarPlano(aplicarPlanejamentoAnual(criarRascunho('normal',escala,null,ab),fonte,[conteudosDoAnual(fonte)[3]]));
  expect(p).toMatchObject({integracaoAnual:1,disciplina:'Ciências',anoEscolar:'8º ano',anoLetivo:2027,conteudo:'Energia',objetivo:'Comparar fontes',vinculoAnual:{planoId:'anual',revision:2}});
  expect(fonte).toEqual(antes);expect(p.contexto.apoios).toBe('Texto ampliado');
 });
 it('preserva vínculo quando o plano vira gamificado',()=>{const p={...aplicarPlanejamentoAnual(criarRascunho('normal','semanal'),anual(),[conteudosDoAnual(anual())[0]]),id:'semana',revision:1};const copia=criarVersaoGamificada(p,{etapaIds:p.etapas.map(e=>e.id)});expect(copia.vinculoAnual).toEqual(p.vinculoAnual);expect(copia.integracaoAnual).toBe(1);});
 it('rejeita fonte não anual, item adulterado, vazio ou repetido',()=>{const p=criarRascunho('normal','aula'),f=anual(),item=conteudosDoAnual(f)[0];for(const itens of [[],[item,item],[{...item,texto:'Não existe'}]])expect(()=>aplicarPlanejamentoAnual(p,f,itens)).toThrow();expect(()=>aplicarPlanejamentoAnual(p,{...f,escala:'bimestral'},[item])).toThrow(/anual/i);});
 it('normaliza identidade do vínculo e remove metadados não confiáveis',()=>{const v=normalizarVinculoAnual({planoId:'anual',revision:2,titulo:'forjado',conteudos:[{etapaId:'b2',indice:0,texto:'Energia',autor:'alheio'}]});expect(v).toEqual({planoId:'anual',revision:2,conteudos:[{etapaId:'b2',indice:0,texto:'Energia'}]});});
});
