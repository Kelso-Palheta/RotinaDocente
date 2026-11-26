import {falha,inteiroFaixa,listaObrigatoria,segmento,textoObrigatorio} from './comum';

export const ehPlanejamentoAnual = plano => plano?.escala === 'anual' && plano?.abrangencia !== 'conteudo';
const linhas = texto => String(texto || '').split(/[\n;]/).map(t => t.trim().replace(/^[•*-]\s+/, '')).filter(Boolean);
const chave = item => `${item.etapaId}:${item.indice}`;

/** Catálogo por revisão: vírgulas pertencem ao título, não separam conteúdos. */
export function conteudosDoAnual(plano) {
  if (!ehPlanejamentoAnual(plano)) throw falha(422, 'Escolha um planejamento anual da disciplina.');
  let itens = (plano.etapas || []).flatMap(etapa => linhas(etapa.curriculo?.conteudos).map((texto, indice) => ({etapaId:etapa.id,indice,texto,periodo:etapa.titulo})));
  if (!itens.length && plano.etapas?.length) itens = linhas(plano.conteudo).map((texto,indice) => ({etapaId:plano.etapas[0].id,indice,texto,periodo:'Conteúdos gerais do anual'}));
  return itens;
}
export function normalizarVinculoAnual(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw falha(422, 'Vínculo anual inválido.');
  const conteudos = listaObrigatoria(entrada.conteudos, 'Conteúdos do anual', {min:1,max:50}).map(item => ({
    etapaId:segmento(item?.etapaId,{campo:'Período do anual',max:60}),
    indice:inteiroFaixa(item?.indice,'Índice do conteúdo',{min:0,max:1000}),
    texto:textoObrigatorio(item?.texto,'conteúdo do anual',{max:3000}),
  }));
  if(new Set(conteudos.map(chave)).size!==conteudos.length) throw falha(422,'Não repita conteúdos do anual.');
  return {planoId:segmento(entrada.planoId,{campo:'Planejamento anual',max:80}),revision:inteiroFaixa(entrada.revision,'Versão do anual',{min:1,max:Number.MAX_SAFE_INTEGER}),conteudos};
}
export function validarConteudosAnuais(fonte,vinculo) {
  const catalogo=conteudosDoAnual(fonte);
  if(vinculo.conteudos.some(item=>!catalogo.some(c=>chave(c)===chave(item)&&c.texto===item.texto)))throw falha(422,'Um conteúdo não pertence à versão selecionada do planejamento anual.');
}
/** Aplica contexto sem identidade compartilhada ou alteração da raiz. */
export function aplicarPlanejamentoAnual(plano,fonte,selecionados) {
  if(!ehPlanejamentoAnual(fonte))throw falha(422,'Escolha um planejamento anual da disciplina.');
  const vinculo=normalizarVinculoAnual({planoId:fonte.id,revision:fonte.revision,conteudos:selecionados});
  validarConteudosAnuais(fonte,vinculo);
  const copia=structuredClone(plano),periodos=fonte.etapas.filter(e=>vinculo.conteudos.some(c=>c.etapaId===e.id));
  const conteudo=vinculo.conteudos.map(c=>c.texto).join('\n');
  const objetivo=[...new Set(periodos.map(e=>e.curriculo?.objetivos).filter(Boolean))].join('\n')||fonte.objetivo;
  if(copia.abrangencia==='planejamento')copia.etapas=periodos.map(e=>({...structuredClone(e),minutos:null,prazo:e.prazo||e.titulo,tipo:copia.tipo==='gamificado'?'jogo':'desenvolvimento',curriculo:{...e.curriculo,conteudos:vinculo.conteudos.filter(c=>c.etapaId===e.id).map(c=>c.texto).join('\n')}}));
  const contexto={...copia.contexto,...Object.fromEntries(Object.entries(fonte.contexto||{}).filter(([,v])=>v))};
  for(const campo of ['recursos','apoios','avaliacao','cargaHoraria','habilidadesBNCC']){const texto=[...new Set(periodos.map(e=>e.curriculo?.[campo]).filter(Boolean))].join('\n');if(texto)contexto[campo]=texto;}
  return {...copia,titulo:copia.titulo||`${fonte.titulo.slice(0,140)} · ${copia.escala||'aula'}`,integracaoAnual:1,vinculoAnual:vinculo,disciplina:fonte.disciplina,anoEscolar:fonte.anoEscolar,anoLetivo:fonte.anoLetivo,conteudo,objetivo,contexto:structuredClone(contexto)};
}
