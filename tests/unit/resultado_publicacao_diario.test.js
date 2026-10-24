import { expect, it } from 'vitest';
import { guardarResultadoPublicacao, lerResultadoPublicacao } from '@/infraestrutura/diario/ResultadoPublicacaoRepository';
it('resumo permanece após reabrir e é isolado por conta e ano',()=>{
 const dados=new Map();const storage={setItem:(k,v)=>dados.set(k,v),getItem:k=>dados.get(k)||null};
 const resultado={periodo:'1',resultados:[{turmaId:'t',alunoId:'a',status:'error',error:'Rede'}]};
 guardarResultadoPublicacao(storage,'p','2026',resultado);
 expect(lerResultadoPublicacao(storage,'p','2026')).toEqual(resultado);
 expect(lerResultadoPublicacao(storage,'outro','2026')).toBeNull();
 expect(lerResultadoPublicacao(storage,'p','2027')).toBeNull();
});
it('cache inválido não impede abrir o Diário',()=>{
 expect(lerResultadoPublicacao({getItem:()=>'{errado'},'p','2026')).toBeNull();
});
