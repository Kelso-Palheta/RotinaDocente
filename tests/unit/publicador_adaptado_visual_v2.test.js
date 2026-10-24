import {expect,it} from 'vitest';
import {converterAdaptadaParaAtividadeOnline as converter} from '../../frontend/src/dominio/adaptacoes/publicadorAtividadeOnline';
import {aprovarImagem} from '../../frontend/src/dominio/adaptacoes/qualidadeVisual';
const args={turmaId:'t',alunoId:'a',professorId:'p'};
it('publicação v2 impede imagem pendente',()=>{
 expect(()=>converter({...args,adaptacao:{versaoVisual:2,atividadeAdaptada:{questoes:[{enunciado:'Observe',apoioVisualDescricao:'Cena'}]}}})).toThrow(/revisão|imagem/i);
});
it('publicação preserva imagem aprovada e dicas, e soma 10 exatamente',()=>{
 const qs=Array.from({length:3},(_,i)=>aprovarImagem({id:`q${i}`,numero:i+1,enunciado:'Observe',tipo:'discursiva_curta',apoioVisualDescricao:'Cena',dicaScaffolding:'Dica',imagemUrl:`https://example.invalid/${i}.png`,planoVisual:{larguraCm:10},visual:{versao:2,metadados:{width:1536,height:1024}}},'p'));
 const a=converter({...args,adaptacao:{versaoVisual:2,atividadeAdaptada:{questoes:qs}}});
 expect(a.questoes.reduce((s,q)=>s+Math.round(q.notaMaxima*100),0)).toBe(1000);expect(a.questoes[0].scaffolding).toBe('Dica');expect(a.questoes[0].imagens[0].url).toBe(qs[0].imagemUrl);
});
