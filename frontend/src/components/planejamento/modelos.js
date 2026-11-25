import biblioteca from './biblioteca.json';
export const BIBLIOTECA=biblioteca.referencias;
export const CATEGORIAS=biblioteca.categorias;
export const CRITERIOS=biblioteca.criterios;
export const ESCALAS=[['aula','Aula'],['semanal','Semanal'],['bimestral','Bimestral'],['semestral','Semestral'],['anual','Anual'],['sequencia','Sequência didática'],['projeto','Projeto']];
export const CAMPOS_CONTEXTO=[['publico','Público e características da turma'],['conhecimentosPrevios','Conhecimentos prévios'],['recursos','Recursos e alternativa sem tecnologia'],['apoios','Inclusão e apoios necessários'],['avaliacao','Avaliação e evidências de aprendizagem'],['habilidadesBNCC','Habilidades / BNCC informadas pelo professor'],['cargaHoraria','Carga horária prevista']];
const ciclos={semanal:['Dia 1','Dia 2','Dia 3','Dia 4','Dia 5'],bimestral:['Primeira etapa do bimestre','Segunda etapa do bimestre','Síntese do bimestre'],semestral:['1º bimestre do semestre','2º bimestre do semestre'],anual:['1º bimestre','2º bimestre','3º bimestre','4º bimestre'],sequencia:['Aula inicial','Aulas de desenvolvimento','Aula de síntese'],projeto:['Investigação inicial','Desenvolvimento e produção','Socialização e avaliação']};
export function criarRascunho(tipo='normal',escala='aula',referencia=null) {
 const gamificado=tipo==='gamificado',aula=escala==='aula';
 const duracao=referencia?.numero===3?30:50;
 let etapas=aula?[
  {id:'abertura',titulo:'Abertura e contexto',tipo:'introducao',minutos:5,orientacao:'Apresente o objetivo, escute a turma e registre conhecimentos prévios.'},
  {id:'desenvolvimento',titulo:gamificado?'Desafios do jogo':'Desenvolvimento do conteúdo',tipo:gamificado?'jogo':'desenvolvimento',minutos:duracao-15,orientacao:gamificado?'Conduza os desafios, dê feedback e relacione decisões ao conteúdo.':'Explique os conceitos com exemplos, proponha uma atividade e acompanhe as dúvidas.'},
  {id:'fechamento',titulo:'Síntese e avaliação',tipo:'fechamento',minutos:10,orientacao:'Retome o objetivo, recolha evidências de aprendizagem e planeje os próximos passos.'},
 ]:(ciclos[escala]||ciclos.sequencia).map((prazo,i)=>({id:'ciclo_'+(i+1),titulo:prazo,tipo:gamificado?'jogo':'desenvolvimento',minutos:null,prazo,orientacao:'Defina os conteúdos e objetivos deste período. Organize estratégias, exemplos, recursos, apoios e evidências de aprendizagem.'}));
 if(referencia)etapas[aula?1:0].orientacao+=` Modelo de referência: ${referencia.titulo}. ${referencia.resumo}`;
 let modalidade=gamificado?'quiz':null,experiencia='padrao';
 if(gamificado&&referencia?.variant==='resgate'){
  experiencia='resgate';etapas=[{id:'abertura',titulo:'Contextualizar a investigação',tipo:'introducao',minutos:5,orientacao:'Apresente o problema e as hipóteses da turma.'},...['Investigar a nascente','Conectar as evidências','Recuperar o rio'].map((titulo,i)=>({id:'missao_'+i,titulo,tipo:'jogo',minutos:i===2?15:10,orientacao:'Investigue as pistas, responda ao desafio e compare a decisão com o feedback.'})),{id:'fechamento',titulo:'Síntese das evidências',tipo:'fechamento',minutos:10,orientacao:'Retome as hipóteses e as decisões que foram revistas.'}];
 }
 if(gamificado&&referencia?.variant==='guardioes')modalidade='equipes';
 if(gamificado&&referencia?.variant==='jornada')experiencia='plataforma';
 return {tipo,escala,titulo:referencia?.titulo||'',disciplina:'',anoEscolar:'',conteudo:'',objetivo:'',anoLetivo:new Date().getFullYear(),contexto:{},duracaoMinutos:aula?duracao:null,modalidade,experiencia,turmaIds:[],questaoIds:[],etapas,...(referencia?{modeloId:referencia.id}:{})};
}
export function escalaDaReferencia(r) {return /semanal/i.test(r.titulo)?'semanal':/projeto/i.test(r.titulo)?'projeto':/sequência|unidade/i.test(r.titulo)?'sequencia':'aula';}
export function tipoDaReferencia(r) {return [2,3,4,5,6].includes(r.categoriaId)?'gamificado':'normal';}
