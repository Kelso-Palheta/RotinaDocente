export const identidade = t => String(t?.topicoId ?? t?.id ?? t?.topicoOrdem ?? t?.ordem ?? '');
export const ordenar = xs => [...xs].sort((a,b) => `${a.dataAgendada} ${a.horarioInicio || ''}`.localeCompare(`${b.dataAgendada} ${b.horarioInicio || ''}`));
export const conteudos = a => a.topicosAssociados?.length ? a.topicosAssociados : a.topicoId ? [{topicoId:a.topicoId,topicoOrdem:a.topicoOrdem,topicoTitulo:a.topicoTitulo,duracaoAlocadaAulas:a.duracaoAlocadaAulas||1}] : [];
export const vinculoAtivo = a => a.status !== 'NAO_REALIZADA' && !a.conteudoEncaminhado;
const clone = xs => ordenar(xs).map(a=>({...a,topicosAssociados:conteudos(a).map(t=>({...t}))}));
const unidades = t => Math.max(1,Number(t.duracaoAlocadaAulas ?? t.duracaoEstimadaAulas)||1);
const capacidade = a => Math.max(1,Number(a.duracaoAlocadaAulas)||1);
const normalizar = (t,n) => ({...t,topicoId:identidade(t),topicoTitulo:t.topicoTitulo||t.titulo||'Conteúdo',duracaoAlocadaAulas:n});
const elegivel = (a,opts={}) => (!a.status||a.status==='AGENDADA') && !a.bloqueioAutomatico && a.dataAgendada >= (opts.dataInicio||'0000') && a.dataAgendada <= (opts.dataFim||'9999') && !(opts.feriados||[]).some(f=>f.data===a.dataAgendada);
const limpar = a => ({...a,topicosAssociados:[],topicoId:null,topicoTitulo:null,topicoOrdem:null});

/** Aloca tempos, fragmentando continuações e retornando a sobra explicitamente. */
function alocar(aulas, indices, fila) {
  const pendentes=[];let pos=0;
  for(const t of fila){
    let restante=unidades(t);
    while(restante>0 && pos<indices.length){
      const a=aulas[indices[pos]];
      const livre=capacidade(a)-a.topicosAssociados.reduce((s,x)=>s+unidades(x),0);
      if(livre<=0){pos++;continue;}
      const n=Math.min(livre,restante);
      a.topicosAssociados.push({...normalizar(t,n),continuacao:restante<unidades(t)});
      restante-=n;
      if(n===livre)pos++;
    }
    if(restante>0)pendentes.push({...normalizar(t,restante),id:identidade(t),duracaoRestante:restante});
  }
  return pendentes;
}
export function estadoConteudos(topicos=[],aulas=[]) {
  return topicos.map(t=>{
    const id=identidade(t);const links=aulas.filter(a=>conteudos(a).some(x=>identidade(x)===id));
    const finalizadas=links.filter(a=>a.status==='CONCLUIDA');
    // Conteúdo legado sem detalhamento de tempos: uma conclusão representa sua conclusão integral.
    const completo=finalizadas.some(a=>conteudos(a).some(x=>identidade(x)===id&&x.duracaoAlocadaAulas==null)) || finalizadas.reduce((s,a)=>s+conteudos(a).filter(x=>identidade(x)===id).reduce((n,x)=>n+unidades(x),0),0)>=Math.max(1,Number(t.duracaoEstimadaAulas)||1);
    const alocados=links.filter(a=>vinculoAtivo(a)||a.status==='CONCLUIDA').reduce((s,a)=>s+conteudos(a).filter(x=>identidade(x)===id).reduce((n,x)=>n+unidades(x),0),0);
    const duracaoRestante=completo?0:Math.max(0,(Number(t.duracaoEstimadaAulas)||1)-alocados);
    return {...t,duracaoRestante,estado:completo?'concluido':duracaoRestante>0?'pendente':'agendado'};
  });
}
export function planejarDistribuicao(originais=[],topicos=[],opts={}) {
  const aulas=clone(originais);const indices=[];const preservados=new Map();
  const idsDoPlano=new Set(topicos.map(identidade));
  aulas.forEach((a,i)=>{
    const contemLegado=conteudos(a).some(t=>!idsDoPlano.has(identidade(t)));
    if(!contemLegado && elegivel(a,opts) && !(opts.modo==='apenas_vagas'&&conteudos(a).length)) {indices.push(i);aulas[i]=limpar(a);}
    else if(vinculoAtivo(a)||a.status==='CONCLUIDA') conteudos(a).forEach(t=>preservados.set(identidade(t),(preservados.get(identidade(t))||0)+unidades(t)));
  });
  const completos=new Set(estadoConteudos(topicos,originais).filter(t=>t.estado==='concluido').map(identidade));
  const fila=[...topicos].sort((a,b)=>(a.ordem||0)-(b.ordem||0)).flatMap(t=>{
    const id=identidade(t);if(completos.has(id))return [];
    const n=Math.max(1,Number(t.duracaoEstimadaAulas)||1)-(preservados.get(id)||0);
    return n>0?[normalizar(t,n)]:[];
  });
  const pendentes=alocar(aulas,indices,fila);
  const alteradas=aulas.filter(a=>JSON.stringify(a.topicosAssociados)!==JSON.stringify(conteudos(originais.find(x=>x.id===a.id)||{}))).length;
  return {aulas,pendentes,resumo:{alteradas,preservadas:aulas.length-alteradas,semVaga:pendentes.length}};
}
export function remanejarSeguro(originais=[],aulaId,status,opts={}) {
  const aulas=clone(originais);const origem=aulas.find(a=>a.id===aulaId);
  if(!origem)throw new Error('Aula não encontrada.');
  if(origem.conteudoEncaminhado){origem.status=status;origem.execucao={...(origem.execucao||{}),...(opts.execucao||{})};return {aulas,pendentes:origem.topicosPendentes||[]};}
  const fila=conteudos(origem).map(t=>normalizar(t,unidades(t)));
  origem.status=status;origem.conteudoEncaminhado=true;
  origem.execucao={...(origem.execucao||{}),...(opts.execucao||{})};
  if(opts.decisao==='pular')return {aulas,pendentes:fila};
  const indices=[];
  aulas.forEach((a,i)=>{
    if(`${a.dataAgendada} ${a.horarioInicio||''}` > `${origem.dataAgendada} ${origem.horarioInicio||''}` && elegivel(a,opts)){
      indices.push(i);fila.push(...conteudos(a).map(t=>normalizar(t,unidades(t))));aulas[i]=limpar(a);
    }
  });
  const pendentes=alocar(aulas,indices,fila);origem.topicosPendentes=pendentes;
  return {aulas,pendentes};
}
export function planejarFeriados(originais=[],feriados=[]) {
  let aulas=clone(originais);const mapa=new Map(feriados.map(f=>[f.data,f.nome]));const novos=[];
  aulas=aulas.map(a=>{
    if(a.bloqueioAutomatico&&!mapa.has(a.dataAgendada))return {...limpar(a),status:'AGENDADA',bloqueioAutomatico:false,motivoCancelamento:null,conteudoEncaminhado:false};
    if(mapa.has(a.dataAgendada)&&a.status==='NAO_REALIZADA'&&!a.bloqueioAutomatico)return a;
    if(mapa.has(a.dataAgendada)&&a.status==='CONCLUIDA')return a;
    if(mapa.has(a.dataAgendada)&&a.status==='PARCIAL')return a;
    if(mapa.has(a.dataAgendada)){
      if(!a.bloqueioAutomatico)novos.push(a.id);
      return {...a,status:'NAO_REALIZADA',bloqueioAutomatico:true,motivoCancelamento:mapa.get(a.dataAgendada),conteudoEncaminhado:true};
    }
    return a;
  });
  let pendentes=[];
  for(const id of [...novos].reverse()){
    aulas.find(a=>a.id===id).conteudoEncaminhado=false;
    const r=remanejarSeguro(aulas,id,'NAO_REALIZADA',{feriados});aulas=r.aulas;pendentes.push(...r.pendentes);
    const a=aulas.find(x=>x.id===id);a.historicoConteudos=conteudos(a);a.topicosAssociados=[];a.topicoId=null;a.topicoTitulo=null;
  }
  return {aulas,pendentes};
}
export function reconciliarGrade(originais=[],grade={},novos=[]) {
  const ano=Number(grade.anoLetivo || String(grade.dataInicioPeriodo||novos[0]?.dataAgendada||new Date().getFullYear()).slice(0,4));
  const desde=grade.aplicarDesde||grade.dataInicioPeriodo||`${ano}-01-01`;
  const alvo=a=>String(a.turmaId)===String(grade.turmaId)&&String(a.dataAgendada).startsWith(String(ano))&&a.dataAgendada>=desde&&a.dataAgendada<=(grade.dataFimPeriodo||`${ano}-12-31`);
  const preservadas=originais.filter(a=>!alvo(a)||['CONCLUIDA','PARCIAL'].includes(a.status));
  const candidatos=novos.map(a=>({...a,topicosAssociados:conteudos(a).map(t=>({...t}))})).filter(a=>a.dataAgendada>=desde&&!preservadas.some(p=>p.id===a.id || (p.dataAgendada===a.dataAgendada&&p.horarioInicio<a.horarioFim&&p.horarioFim>a.horarioInicio)));
  const antigos=originais.filter(a=>alvo(a)&&!['CONCLUIDA','PARCIAL'].includes(a.status));
  const usados=new Set();const conflitos=[];let alteradas=0;
  for(const old of antigos){
    let novo=candidatos.find(n=>n.id===old.id&&!usados.has(n.id));
    if(!novo&&conteudos(old).length){const destinos=candidatos.filter(n=>n.dataAgendada===old.dataAgendada&&!usados.has(n.id));if(destinos.length===1)novo=destinos[0];else conflitos.push(`Aula de ${old.dataAgendada} às ${old.horarioInicio}: desassocie ou reagende seu conteúdo antes de remover este horário.`);}
    if(novo){if(conteudos(old).reduce((s,t)=>s+unidades(t),0)>capacidade(novo))conflitos.push(`Aula de ${old.dataAgendada}: a nova capacidade é menor que os tempos de conteúdo vinculados.`);usados.add(novo.id);Object.assign(novo,{...old,...novo,topicosAssociados:conteudos(old),status:old.status,bloqueioAutomatico:old.bloqueioAutomatico||false,conteudoEncaminhado:old.conteudoEncaminhado||false,motivoCancelamento:old.motivoCancelamento||null,execucao:old.execucao||null});if(old.id!==novo.id)alteradas++;}
  }
  const aulas=ordenar([...preservadas,...candidatos]);
  const removidas=originais.filter(a=>alvo(a)&&!aulas.some(n=>n.id===a.id)).map(a=>a.id);
  return {aulas,removidas,conflitos,resumo:{criadas:candidatos.filter(a=>!originais.some(o=>o.id===a.id)).length,removidas:removidas.length,preservadas:preservadas.length+usados.size-alteradas,alteradas}};
}
export function limparAgendamentos(aulas=[],opts={}) {
  return aulas.map(a=>elegivel(a,opts)?limpar(a):a);
}
export function mesclarPlanejamento(antigos=[],novos=[],modo='mesclar',aulas=[]) {
  if(modo==='substituir_pendentes'){
    const usados=new Set(aulas.flatMap(a=>[...conteudos(a),...(a.historicoConteudos||[])].map(identidade)));
    return [...antigos.filter(t=>usados.has(identidade(t))),...novos].map((t,i)=>({...t,ordem:i+1}));
  }
  if(modo==='substituir'){
    const ids=new Set(novos.map(identidade));
    const vinculados=new Set(aulas.flatMap(a=>[...conteudos(a),...(a.historicoConteudos||[])].map(identidade)));
    if(antigos.some(t=>vinculados.has(identidade(t))&&!ids.has(identidade(t))))throw new Error('Há conteúdo vinculado ou histórico. Use adicionar ao plano ou desassocie antes de substituir.');
    return novos;
  }
  const mapa=new Map(antigos.map(t=>[identidade(t),t]));novos.forEach(t=>mapa.set(identidade(t),t));return [...mapa.values()].map((t,i)=>({...t,ordem:i+1}));
}
