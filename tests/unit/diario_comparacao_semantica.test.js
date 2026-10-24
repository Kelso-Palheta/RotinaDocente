import {expect,it} from 'vitest';
import {dadosIguais,basesDiarioIguais} from '@/dominio/diario/comparacao';
it('ignora somente ordem de mapas, inclusive depois de serialização de cache',()=>{
 const a=[{id:'t',notas:{aluno:{simulado:3,atividade:2}},config:{max:5,peso:2}}];
 const b=[{config:{peso:2,max:5},notas:{aluno:{atividade:2,simulado:3}},id:'t'}];expect(dadosIguais(a,b)).toBe(true);expect(dadosIguais(JSON.parse(JSON.stringify(a)),b)).toBe(true);
});
it.each([[0,null],[{}, {nota:0}],[{nota:3},{nota:4}],[[1,2],[2,1]],[[{id:'a'},{id:'b'}],[{id:'b'},{id:'a'}]]])('preserva diferença significativa de %j para %j',(a,b)=>{expect(dadosIguais(a,b)).toBe(false);});
it('base exige revisão, existência e origem idênticas além do conteúdo',()=>{
 const base={revision:1,turmas:[],_existe:true,_origem:null};expect(basesDiarioIguais(base,{...base})).toBe(true);
 for(const alteracao of [{revision:2},{_existe:false},{_origem:'legado'},{turmas:[{id:'t'}]}])expect(basesDiarioIguais(base,{...base,...alteracao})).toBe(false);
});
