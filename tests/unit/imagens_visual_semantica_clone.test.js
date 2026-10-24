import {expect,it} from 'vitest';
import {aprovarImagem,imagemAprovada} from '../../frontend/src/dominio/adaptacoes/qualidadeVisual';
import {AtividadeAdaptadaRepository} from '../../frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository';
it('ordem de mapas no Firestore não invalida aprovação',()=>{
 const q=aprovarImagem({id:'q',enunciado:'Observe',apoioVisualDescricao:'Descrição',imagemUrl:'https://example.invalid/a.png',planoVisual:{larguraCm:10,descricao:'Cena'},visual:{metadados:{width:1536,height:1024,mime:'image/png'}}},'p');
 expect(imagemAprovada({...q,planoVisual:{descricao:'Cena',larguraCm:10},visual:{...q.visual,metadados:{mime:'image/png',height:1024,width:1536}}})).toBe(true);
});
it('clone preserva recurso mas recebe identidade própria de documento e questão',async()=>{
 const repo=new AtividadeAdaptadaRepository();let itens=[];repo._lerLocal=()=>itens;repo._gravarLocal=(_,v)=>{itens=v;};
 await repo.salvarAtividade('p',{id:'a',documentoVisualId:'doc-a',aluno:{nome:'A'},atividadeAdaptada:{questoes:[{id:'doc-a-q1',imagemUrl:'https://example.invalid/figura.png'}]}});
 const c=await repo.reaproveitarParaAluno('p','a',{nome:'B',id:'b'});expect(c.documentoVisualId).not.toBe('doc-a');expect(c.atividadeAdaptada.questoes[0].id).not.toBe('doc-a-q1');expect(c.atividadeAdaptada.questoes[0].imagemUrl).toContain('figura.png');
});
