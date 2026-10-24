/** Sugestões não alteram a chamada: a confirmação do professor é obrigatória. */
export function sugerirChamada({turma={},data,calendario=null,horario=null}) {
  const existente=turma.frequencias?.[data];
  const aulas=(calendario?.aulas||[]).filter(a=>a.dataAgendada===data&&(!a.turmaId||String(a.turmaId)===String(turma.id)));
  const feriado=(calendario?.feriados||[]).find(f=>(typeof f==='string'?f:f.data)===data);
  const canceladas=aulas.some(a=>['CANCELADA','CANCELADO','NAO_REALIZADA'].includes(a.status));
  const aviso=feriado?'Data marcada como feriado.':canceladas?'Há aula cancelada ou não realizada nesta data.':'';
  if(existente)return {...existente,presencas:{...existente.presencas},origem:'registro',exigeJustificativa:Boolean(feriado||canceladas),aviso};
  const validas=aulas.filter(a=>!['CANCELADA','CANCELADO','NAO_REALIZADA'].includes(a.status));
  const dia=['dom','seg','ter','qua','qui','sex','sab'][new Date(`${data}T12:00:00`).getDay()];
  const nome=String(turma.nome||'').trim().toLowerCase();
  const tempos=Object.entries(horario?.schedule||{}).filter(([key,c])=>key.startsWith(`${dia}_`)&&c&&!c.isBreak&&String(c.grade||c.turma||c.className||'').trim().toLowerCase()===nome&&(c.subject||c.disciplina));
  const quantidade=validas.length?validas.reduce((s,a)=>s+(Number(a.quantidadeAulas)||1),0):tempos.length;
  return {quantidadeAulas:quantidade||1,presencas:{},origem:aulas.length?'calendario':tempos.length?'horario':'manual',exigeJustificativa:Boolean(feriado||canceladas),aviso};
}

export function ocorrenciasDoAluno(ocorrencias=[],alunoId,{familia=true}={}) {
 return ocorrencias.filter(o=>o&&(!familia||o.visivelFamilia===true)&&Array.isArray(o.alunoIds)&&(o.alunoIds.length===0||o.alunoIds.includes(alunoId)));
}

export function montarLinhaTempoAluno({aluno,turma={},historicoAtividades=[],familia=false}) {
 const id=aluno?.id||aluno?.uid;
 const eventos=[];
 for(const [bimestre,b] of Object.entries(turma.bimestres||{})){
  const nota=b.notas?.[id];if(!nota)continue;
  if(nota.simulado!==null&&nota.simulado!==undefined&&nota.simulado!=='')eventos.push({id:`simulado-${bimestre}`,tipo:'nota',data:nota.atualizadoEm||'',titulo:`Simulado • ${bimestre}º bimestre`,descricao:`Nota: ${nota.simulado}`,familia:true});
  for(const atv of b.atividades||[]){const valor=nota[atv.id] ?? nota.atividades?.[atv.id];if(valor!==null&&valor!==undefined&&valor!=='')eventos.push({id:`nota-${bimestre}-${atv.id}`,tipo:'nota',data:nota.atualizadoEm||'',titulo:atv.nome||atv.titulo||'Atividade',descricao:`${bimestre}º bimestre • Nota: ${valor}`,familia:true});}
 }
 for(const [data,r] of Object.entries(turma.frequencias||{}))if(r.presencas?.[id])eventos.push({id:`freq-${data}`,tipo:'frequencia',data,titulo:'Frequência',descricao:`${r.quantidadeAulas} aula(s) • ${{P:'Presente',F:'Falta',FJ:'Falta justificada'}[r.presencas[id]]||r.presencas[id]}`,familia:true});
 for(const [i,a] of historicoAtividades.entries())eventos.push({id:`feedback-${a.id||i}`,tipo:'feedback',data:a.corrigidoEm||a.atualizadoEm||a.entregueEm||'',titulo:a.titulo||'Devolutiva',descricao:a.feedback||'Feedback por questão disponível no relatório.',familia:true,questoes:a.questoes||[]});
 for(const o of ocorrenciasDoAluno(turma.ocorrencias||[],id,{familia}))eventos.push({id:`oc-${o.id}`,tipo:'ocorrencia',data:o.data||'',titulo:o.titulo,descricao:o.descricao,familia:o.visivelFamilia===true});
 return eventos.sort((a,b)=>String(b.data).localeCompare(String(a.data))||a.titulo.localeCompare(b.titulo,'pt-BR'));
}
