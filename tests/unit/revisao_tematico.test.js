import {it,expect} from 'vitest';
import {validarSelecaoTematica,transicaoTematica,publicarTematico} from '../../frontend/src/dominio/revisao/tematico';
const selecao={conteudoIds:['aula'],questaoIds:['q'],quantidadeQuestoes:1,duracaoSegundos:30,duracaoPorQuestao:{q:12}};
const cat={conteudos:[{id:'aula'}],questoes:[{questaoId:'q',conteudoIds:['aula']},{questaoId:'outro',conteudoIds:['externa']}]};
it('exige contexto explícito, quantidade exata e tempos inteiros somente para questões selecionadas',()=>{
 expect(()=>validarSelecaoTematica(selecao,cat)).not.toThrow();
 for(const patch of [{conteudoIds:[]},{conteudoIds:['fantasma']},{questaoIds:['outro']},{quantidadeQuestoes:2},{quantidadeQuestoes:1.1},{duracaoPorQuestao:{q:10.5}},{duracaoPorQuestao:{outro:15}}])expect(()=>validarSelecaoTematica({...selecao,...patch},cat)).toThrow();
});
it('introdução usa revisão, não pode abrir antes do último bloco e próxima questão dispensa nova introdução',()=>{
 const s={schemaVersion:2,fase:'conteudo',revisao:2,rodadas:[{id:'r'},{id:'r2'}],indice:0,indiceBloco:0,sequenciaAula:[{},{}]};const b={revisao:2,rodadaId:'r'};
 expect(()=>transicaoTematica(s,{...b,acao:'abrir_pergunta'},0)).toThrow();expect(transicaoTematica(s,{...b,acao:'avancar_conteudo'},0)).toBe('conteudo');
 expect(()=>transicaoTematica(s,{...b,revisao:1,acao:'avancar_conteudo'},0)).toThrow();expect(transicaoTematica({...s,fase:'ranking'},{...b,acao:'proxima_rodada'},0)).toBe('pergunta');
});
it('publicação da introdução omite questão, próximos blocos, imagens de outro bloco e arquivos privados',()=>{
 const s={schemaVersion:2,codigo:'COD12345',indiceBloco:0,sequenciaAula:[{conteudoId:'aula',blocoId:'b'},{conteudoId:'aula',blocoId:'c'}]};
 const base={fase:'conteudo',rodada:{questao:{id:'privada'},conteudo:['old']},feedback:{gabarito:'A'}};
 const p=publicarTematico(base,s,{conteudo:{id:'aula',titulo:'Aula',blocos:[{id:'b',tipo:'texto',titulo:'Atual',texto:'Contexto'},{id:'c',tipo:'texto',texto:'FUTURO'}],imagens:[{id:'n',arquivo:'SEGREDO'}]}});
 expect(p.rodada.questao).toBeNull();expect(p.feedback).toBeNull();expect(p.aula.bloco.texto).toBe('Contexto');expect(JSON.stringify(p)).not.toMatch(/FUTURO|SEGREDO|privada/);
});
