import {db} from '@/lib/firebase';
import {doc,collection,getDoc,getDocs,runTransaction} from 'firebase/firestore';
const serializar = value => JSON.stringify(value ?? null);
const dados = snap => snap.exists()?snap.data():null;
const anoDaData = data => Number(String(data||'').slice(0,4));
const limpo = value => JSON.parse(JSON.stringify(value));

/** Snapshot e transação por professor/turma/ano, preservando os documentos legados. */
export class CalendarioRepository {
  constructor(professorId){if(!professorId)throw new Error('Entre na sua conta para acessar o calendário.');this.professorId=professorId;}
  ref(colecao,id){return doc(db,'professores',this.professorId,colecao,id);}
  async carregar(turmaId,anoLetivo){
    const ano=Number(anoLetivo);if(!turmaId||!Number.isInteger(ano)||ano<1900||ano>2200)throw new Error('Turma ou ano inválido.');
    const chave=`${encodeURIComponent(turmaId)}__${ano}`;
    const refs=[this.ref('grades_horarias',chave),this.ref('planejamentos',chave),this.ref('feriados_turmas',chave),this.ref('grades_horarias',turmaId),this.ref('planejamentos',turmaId),this.ref('feriados_turmas',turmaId),this.ref('calendario_versoes',chave)];
    const [snaps,lista]=await Promise.all([Promise.all(refs.map(getDoc)),getDocs(collection(db,'professores',this.professorId,'aulas_agendadas'))]);
    const [grade,plan,feriados,gradeLegada,planLegado,feriadosLegados,controle]=snaps.map(dados);
    const aulas=lista.docs.map(d=>({...d.data(),id:d.id})).filter(a=>String(a.turmaId)===String(turmaId)&&anoDaData(a.dataAgendada)===ano).sort((a,b)=>`${a.dataAgendada} ${a.horarioInicio||''}`.localeCompare(`${b.dataAgendada} ${b.horarioInicio||''}`));
    const compativel=Number(gradeLegada?.anoLetivo||anoDaData(gradeLegada?.dataInicioPeriodo))===ano;
    const leituras=refs.map((ref,i)=>({ref,antes:dados(snaps[i])}));
    aulas.forEach(a=>leituras.push({ref:this.ref('aulas_agendadas',a.id),antes:a}));
    return {turmaId,anoLetivo:ano,chave,grade:grade||(compativel?gradeLegada:null),planejamento:plan||(compativel?planLegado:null),feriados:(feriados||(compativel?feriadosLegados:null))?.feriados||[],aulas,revision:controle?.revision||0,_leituras:leituras};
  }
  async salvar(snapshot,mudancas){
    const {turmaId,anoLetivo,chave}=snapshot;const aulas=mudancas.aulas||snapshot.aulas;
    if(aulas.some(a=>String(a.turmaId)!==String(turmaId)||anoDaData(a.dataAgendada)!==anoLetivo))throw new Error('A operação contém aulas de outra turma ou ano.');
    const ids=new Set(aulas.map(a=>a.id));if(ids.size!==aulas.length)throw new Error('Aulas duplicadas na atualização.');
    const removidas=snapshot.aulas.filter(a=>!ids.has(a.id));
    if(removidas.some(a=>['CONCLUIDA','PARCIAL'].includes(a.status)))throw new Error('Aulas realizadas não podem ser removidas.');
    const alteradas=aulas.filter(a=>serializar(a)!==serializar(snapshot.aulas.find(x=>x.id===a.id)));
    const leituras=[...snapshot._leituras];
    for(const a of alteradas)if(!snapshot.aulas.some(x=>x.id===a.id))leituras.push({ref:this.ref('aulas_agendadas',a.id),antes:null});
    if(alteradas.length+removidas.length+4>480)throw new Error('Há muitas alterações neste período. Selecione um período menor para aplicar com segurança.');
    await runTransaction(db,async tx=>{
      // Todas as leituras antecedem gravações; qualquer divergência exige uma nova prévia.
      const atuais=await Promise.all(leituras.map(leitura=>tx.get(leitura.ref)));
      for(const [index,leitura] of leituras.entries()){
        const atual=dados(atuais[index]);
        const comparavel=leitura.ref.path.includes('/aulas_agendadas/')&&atual?{...atual,id:leitura.ref.path.split('/').at(-1)}:atual;
        if(serializar(comparavel)!==serializar(leitura.antes))throw new Error('O calendário mudou após o carregamento. Atualize a tela e revise novamente.');
      }
      alteradas.forEach(a=>tx.set(this.ref('aulas_agendadas',a.id),limpo(a)));
      removidas.forEach(a=>tx.delete(this.ref('aulas_agendadas',a.id)));
      if(mudancas.grade!==undefined)tx.set(this.ref('grades_horarias',chave),limpo({...mudancas.grade,turmaId,anoLetivo}));
      if(mudancas.planejamento!==undefined)tx.set(this.ref('planejamentos',chave),limpo({...mudancas.planejamento,turmaId,anoLetivo}));
      if(mudancas.feriados!==undefined)tx.set(this.ref('feriados_turmas',chave),{turmaId,anoLetivo,feriados:limpo(mudancas.feriados)});
      tx.set(this.ref('calendario_versoes',chave),{revision:snapshot.revision+1,turmaId,anoLetivo,atualizadoEm:new Date().toISOString()});
    });
    return this.carregar(turmaId,anoLetivo);
  }
}
