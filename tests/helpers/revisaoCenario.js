import {RevisaoMemoria} from './revisaoMemoria';
import {RevisaoService} from '../../frontend/src/aplicacao/revisao/RevisaoService';
export const docente={tipo:'professor',uid:'prof-1'};
export const confirmar={transcricao:true,gabarito:true,imagens:true,explicacoes:true};
export function questaoSintetica(n=1){return{schemaVersion:1,id:`enem-2024-regular-sintetica-${n}`,ano:2024,tema:'Arte sintética '+n,aplicacoes:['regular'],habilidades:[],enunciado:'Pergunta sintética '+n,alternativas:'ABCDE'.split('').map(id=>({id,texto:'Opção '+id})),gabarito:'B',explicacoes:Object.fromEntries('ABCDE'.split('').map(id=>[id,'Comentário sintético específico da opção '+id+' para os testes.'])),imagens:[],conteudoRevisao:[{tipo:'texto',texto:'Conteúdo preparatório sintético para os testes de integração.'}],fontes:[{provaUrl:'https://download.inep.gov.br/prova.pdf',gabaritoUrl:'https://download.inep.gov.br/gabarito.pdf'}],status:'rascunho',revisao:{transcricao:false,gabarito:false,imagens:false,explicacoes:false}};}
export function acervoSintetico(){const q=[questaoSintetica(1),questaoSintetica(2)];return{listarAcervo:async()=>q.map(x=>({id:x.id,ano:x.ano,tema:x.tema,aplicacoes:x.aplicacoes,hashFonte:'a'.repeat(64)})),lerQuestaoAcervo:async id=>{const questao=q.find(x=>x.id===id);if(!questao)throw Object.assign(Error('Ausente'),{status:404});return{questao:structuredClone(questao),hashFonte:'a'.repeat(64)};},validarImagensAcervo:async()=>true};}
export async function cenario(n=2,store=new RevisaoMemoria()){
 let agora=100000;let seq=0;const opcoes={store,acervo:acervoSintetico(),agora:()=>agora,gerarCodigo:()=> 'ABCD2345',gerarId:()=> 'r'+(++seq),idParticipante:(t,a)=>t+'-'+a};const service=new RevisaoService(opcoes);
 await store.set('professores/prof-1/turmas/data',{turmas:[{id:'t1',nome:'Turma sintética',alunos:Array.from({length:n},(_,i)=>({id:'a'+i,nome:'Estudante '+i}))}]});
 for(let i=0;i<n;i++)await store.set(`alunoLogin/login${i}/vinculos/prof-1`,{professorUid:'prof-1',turmaId:'t1',alunoId:'a'+i});
 return{service,store,opcoes,tempo:v=>{agora=v;},aluno:i=>({tipo:'aluno',loginKey:'login'+i}),docente,confirmar};
}
export async function salaPronta(c){for(let i=1;i<=2;i++)await c.service.aprovar(docente,questaoSintetica(i).id,{hashFonte:'a'.repeat(64),confirmacoes:confirmar,ajustes:{}});const {sala}=await c.service.criar(docente,{titulo:'Ensaio sintético',turmaIds:['t1'],questaoIds:[questaoSintetica(1).id,questaoSintetica(2).id],duracaoSegundos:10});return sala.codigo;}
export async function acao(c,codigo,acao){const {estado}=await c.service.estado(docente,codigo);return c.service.comandar(docente,codigo,{acao,revisao:estado.sala.revisao,rodadaId:estado.rodada.id});}
