import {expect,it} from 'vitest';
import {aprovarImagem,imagemAprovada,substituirImagem,gerarDesenhoExato} from '../../frontend/src/dominio/adaptacoes/qualidadeVisual';
const q=()=>({id:'q',enunciado:'Observe',apoioVisualDescricao:'Descrição',imagemUrl:'https://example.invalid/a.png',planoVisual:{larguraCm:10},visual:{versao:2,metadados:{width:1536,height:1024,mime:'image/png'},original:{imagemUrl:'https://example.invalid/ref.png'}}});
it('trocar referência ou metadados invalida aprovação',()=>{
 const a=aprovarImagem(q(),'p');expect(imagemAprovada({...a,visual:{...a.visual,original:{imagemUrl:'https://example.invalid/outra.png'}}})).toBe(false);
 expect(imagemAprovada({...a,visual:{...a.visual,metadados:{...a.visual.metadados,width:1}}})).toBe(false);
});
it('histórico associa SVG ao plano que produziu aquela versão',()=>{
 const plano={tipo:'contagem',quantidade:3};const desenho=gerarDesenhoExato(plano);
 const antigo={...q(),planoVisual:{tipo:'contagem',quantidade:4},imagemUrl:desenho.imagemUrl,visual:{versao:2,metadados:desenho.metadados,planoImagem:plano}};
 const novo=substituirImagem(antigo,gerarDesenhoExato(antigo.planoVisual).imagemUrl,desenho.metadados);
 expect(novo.visual.historico[0].planoVisual.quantidade).toBe(3);
});
it('rótulos do gráfico não são truncados silenciosamente',()=>{
 const texto='Categoria escolar de referência';const d=gerarDesenhoExato({tipo:'grafico',dados:[{rotulo:texto,valor:2}]});expect(d.svg).toContain(texto);
});
