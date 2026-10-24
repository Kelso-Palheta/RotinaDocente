import {expect,it} from 'vitest';
import {criarDocumentoVisual,mesclarQuestaoVisual,restaurarVersaoVisual} from '../../frontend/src/dominio/adaptacoes/documentoVisual';
import {gerarDesenhoExato,aprovarImagem,imagemAprovada,substituirImagem} from '../../frontend/src/dominio/adaptacoes/qualidadeVisual';
it('questões de documentos diferentes não colidem no banco; atualização preserva outras questões',()=>{
 const base={atividadeAdaptada:{questoes:[{numero:1,enunciado:'A'},{numero:2,enunciado:'B'}]}};
 const a=criarDocumentoVisual(base,'doc-a'),b=criarDocumentoVisual(base,'doc-b');expect(a.atividadeAdaptada.questoes[0].id).not.toBe(b.atividadeAdaptada.questoes[0].id);
 const bEditado=mesclarQuestaoVisual(a,a.atividadeAdaptada.questoes[1].id,{...a.atividadeAdaptada.questoes[1],enunciado:'B editado'});
 expect(mesclarQuestaoVisual(bEditado,a.atividadeAdaptada.questoes[0].id,{...a.atividadeAdaptada.questoes[0],enunciado:'A editado'}).atividadeAdaptada.questoes[1].enunciado).toBe('B editado');
});
it('restaurar desenho recupera o plano correto e permite nova aprovação',()=>{
 const p3={tipo:'contagem',quantidade:3},p4={tipo:'contagem',quantidade:4};const a=gerarDesenhoExato(p3),b=gerarDesenhoExato(p4);
 const original={id:'q',enunciado:'Conte',apoioVisualDescricao:'Círculos',imagemUrl:a.imagemUrl,planoVisual:p4,visual:{versao:2,metadados:a.metadados,planoImagem:p3}};
 const nova={...substituirImagem(original,b.imagemUrl,b.metadados),visual:{...substituirImagem(original,b.imagemUrl,b.metadados).visual,planoImagem:p4}};
 const restaurada=restaurarVersaoVisual(nova,nova.visual.historico[0]);expect(imagemAprovada(aprovarImagem(restaurada,'p'))).toBe(true);
});
