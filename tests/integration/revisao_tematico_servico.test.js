import {it,expect} from 'vitest';
import {cenario,acao,questaoSintetica,confirmar} from '../helpers/revisaoCenario';
import {RevisaoService} from '../../frontend/src/aplicacao/revisao/RevisaoService';
async function preparar(){
 const c=await cenario();let hash='b'.repeat(64);const conteudo={id:'aula',titulo:'Aula sintética',status:'rascunho',objetivos:[{id:'o',descricao:'Conceito'}],fontes:[{titulo:'Fonte',url:'https://www.metmuseum.org/'}],imagens:[],blocos:[{id:'b1',tipo:'texto',titulo:'Contexto',texto:'Ensinar sem responder'},{id:'b2',tipo:'texto',titulo:'Síntese',texto:'Preparação final'}]};
 c.opcoes.acervoTematico={listarCatalogoTematico:async()=>({trilhas:[],conteudos:[{id:'aula',titulo:conteudo.titulo,hashFonte:hash}],questoes:[1,2].map(n=>({questaoId:questaoSintetica(n).id,conteudoIds:['aula']}))}),lerConteudoTematico:async()=>({conteudo:structuredClone(conteudo),hashFonte:hash})};
 c.service=new RevisaoService(c.opcoes);for(let n=1;n<=2;n++)await c.service.aprovar(c.docente,questaoSintetica(n).id,{hashFonte:'a'.repeat(64),confirmacoes:confirmar,ajustes:{}});
 c.selecao={titulo:'Aula temática',turmaIds:['t1'],conteudoIds:['aula'],quantidadeQuestoes:2,questaoIds:[1,2].map(n=>questaoSintetica(n).id),duracaoSegundos:30,duracaoPorQuestao:{[questaoSintetica(2).id]:12}};
 c.mudarHash=()=>{hash='c'.repeat(64);};return c;
}
const conf={conteudo:true,imagens:true,cobertura:true};
it('exige conferência temática por conta/hash e bloqueia payload sem tema ou questão externa',async()=>{
 const c=await preparar();await expect(c.service.criar(c.docente,c.selecao)).rejects.toMatchObject({status:422});
 await expect(c.service.aprovarConteudo(c.docente,'aula',{hashFonte:'b'.repeat(64),confirmacoes:{...conf,cobertura:'true'}})).rejects.toMatchObject({status:422});
 await c.service.aprovarConteudo(c.docente,'aula',{hashFonte:'b'.repeat(64),confirmacoes:conf});
 const cat=await c.service.catalogo(c.docente);expect(cat.conteudos[0].apta).toBe(true);expect(cat.questoes[0].conteudoIds).toEqual(['aula']);
 await expect(c.service.criar(c.docente,{...c.selecao,conteudoIds:[]})).rejects.toMatchObject({status:422});
 await expect(c.service.criar(c.docente,{...c.selecao,questaoIds:['fora','outra']})).rejects.toMatchObject({status:422});
 c.mudarHash();await expect(c.service.criar(c.docente,c.selecao)).rejects.toMatchObject({status:422});
});
it('introdução inteira sincroniza antes do desafio e prazos individuais congelam por rodada sem bônus',async()=>{
 const c=await preparar();await c.service.aprovarConteudo(c.docente,'aula',{hashFonte:'b'.repeat(64),confirmacoes:conf});const {sala}=await c.service.criar(c.docente,c.selecao);const code=sala.codigo;
 await c.service.entrar(c.aluno(0),code);await acao(c,code,'mostrar_conteudo');
 let p=await c.service.estado(c.aluno(0),code);expect(p.estado.schemaVersion).toBe(2);expect(p.estado.rodada.questao).toBeNull();expect(p.estado.aula.bloco.id).toBe('b1');
 await expect(acao(c,code,'abrir_pergunta')).rejects.toMatchObject({status:409});await acao(c,code,'avancar_conteudo');await acao(c,code,'voltar_conteudo');await acao(c,code,'avancar_conteudo');
 await acao(c,code,'abrir_pergunta');p=await c.service.estado(c.aluno(0),code);expect(p.estado.rodada.encerraEmMs).toBe(130000);expect(p.estado.aula).toBeUndefined();
 await c.service.responder(c.aluno(0),code,{rodadaId:p.estado.rodada.id,alternativa:'B'});await acao(c,code,'encerrar_pergunta');await acao(c,code,'mostrar_feedback');await acao(c,code,'mostrar_ranking');
 await acao(c,code,'proxima_rodada');p=await c.service.estado(c.aluno(0),code);expect(p.estado.fase).toBe('pergunta');expect(p.estado.rodada.encerraEmMs).toBe(112000);expect(p.estado.aula).toBeUndefined();
 c.tempo(112000);await expect(c.service.responder(c.aluno(0),code,{rodadaId:p.estado.rodada.id,alternativa:'B'})).rejects.toMatchObject({status:409});
 const alunos=await c.store.list(`revisaoSalas/${code}/participantes`);expect(alunos[0].pontos).toBe(1000);
});
