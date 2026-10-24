'use client';
import {useState,useEffect} from 'react';
import {useAuth} from '@/lib/auth-context';
import {useRouter} from 'next/navigation';
import {db} from '@/lib/firebase';
import {doc,getDoc} from 'firebase/firestore';
import {format,eachDayOfInterval,parseISO} from 'date-fns';
import {Sidebar} from '@/components/calendario/Sidebar';
import {CalendarioView} from '@/components/calendario/CalendarioView';
import {ConfigGradeModal} from '@/components/calendario/ConfigGradeModal';
import {ImportPlanejamentoModal} from '@/components/calendario/ImportPlanejamentoModal';
import {FeriadosModal} from '@/components/calendario/FeriadosModal';
import {AutoDistribuirModal} from '@/components/calendario/AutoDistribuirModal';
import {TopicoModal} from '@/components/calendario/TopicoModal';
import {DetalhesAulaModal} from '@/components/calendario/DetalhesAulaModal';
import {useCalendarioPedagogico} from '@/hooks/calendario/useCalendarioPedagogico';
import {generateCalendarioPDF} from '@/lib/calendario/pdf-generator';
import {ScheduleGeneratorEngine as Engine} from '@/lib/engines/ScheduleGeneratorEngine';
import {planejarDistribuicao,remanejarSeguro,planejarFeriados,reconciliarGrade,limparAgendamentos,estadoConteudos,mesclarPlanejamento,identidade,conteudos} from '@/dominio/calendario/evolucao';

const historico=a=>[...conteudos(a),...(a.historicoConteudos||[])];
const hoje=()=>format(new Date(),'yyyy-MM-dd');
const caixa='rounded-2xl border border-[#dce0f0] bg-white p-4 space-y-3';
const botao='rounded-xl border border-[#dce0f0] px-4 py-2 text-sm font-bold text-[#101942] hover:bg-[#eef0f8] disabled:opacity-50';

function Previa({previa,onCancel,onApply,salvando}){
  const [erro,setErro]=useState('');
  return <div className="fixed inset-0 z-[80] bg-[#101942]/50 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="Revisar alterações" className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-auto space-y-4">
    <h2 className="font-bold text-lg text-[#101942]">{previa.titulo}</h2>
    <p className="text-sm">{previa.alteradas.length} aulas alteradas · {previa.preservadas} preservadas · {previa.pendentes?.length||0} conteúdos sem vaga.</p>
    {!!previa.pendentes?.length&&<div className="bg-amber-50 p-3 rounded-xl"><p className="font-bold">Ficarão pendentes para reposição:</p>{previa.pendentes.map((t,i)=><p key={i}>{t.topicoTitulo||t.titulo} ({t.duracaoRestante||t.duracaoAlocadaAulas||1} tempo(s))</p>)}</div>}
    <div className="space-y-2 text-sm">{previa.alteradas.map(a=><div key={a.id} className="border-b py-2"><p className="font-bold">{a.dataAgendada} · {a.horarioInicio} · {a.status}</p><p>Antes: {conteudos(previa.antes.find(x=>x.id===a.id)||{}).map(t=>t.topicoTitulo||t.titulo).join(' / ')||'Sem conteúdo'}</p><p>Depois: {conteudos(a).map(t=>t.topicoTitulo||t.titulo).join(' / ')||'Sem conteúdo'}{a.conteudoEncaminhado?' (registro histórico)':''}</p></div>)}</div>
    {erro&&<p role="alert" className="text-red-700">{erro}</p>}
    <div className="flex gap-2 justify-end"><button className={botao} disabled={salvando} onClick={onCancel}>Voltar</button><button className="btn-brand-primary px-4 py-2" disabled={salvando} onClick={async()=>{setErro('');try{await onApply();}catch(e){setErro(e.message);}}}>{salvando?'Salvando…':'Confirmar alterações'}</button></div>
  </section></div>;
}

export default function CalendarioPage(){
  const {user,loading:authLoading}=useAuth();const router=useRouter();
  const [turmas,setTurmas]=useState([]);const [turmaId,setTurmaId]=useState('');
  const [ano,setAno]=useState(new Date().getFullYear());const [area,setArea]=useState('Calendário');
  const [periodo,setPeriodo]=useState(null);const inicio=periodo?.inicio||`${ano}-01-01`;const fim=periodo?.fim||`${ano}-12-31`;
  const [dataAtual,setDataAtual]=useState(new Date());
  const dataExibida=format(dataAtual,'yyyy-MM-dd')<inicio?parseISO(inicio):format(dataAtual,'yyyy-MM-dd')>fim?parseISO(fim):dataAtual;
  const [modal,setModal]=useState(null);const [topico,setTopico]=useState(null);const [aulaDetalhe,setAulaDetalhe]=useState(null);
  const [mensagem,setMensagem]=useState('');const [erro,setErro]=useState('');const [previa,setPrevia]=useState(null);
  const [reposicao,setReposicao]=useState({data:hoje(),inicio:'07:30',fim:'08:20',tempos:1});
  const cal=useCalendarioPedagogico(ano,turmaId);
  const estado=cal.estado;const turma=turmas.find(t=>t.id===turmaId);const aulas=estado?.aulas||[];const planejamento=estado?.planejamento||{topicos:[]};const grade=estado?.grade;const feriados=estado?.feriados||[];
  const noPeriodo=a=>a.dataAgendada>=inicio&&a.dataAgendada<=fim;
  const aulasVisiveis=aulas.filter(noPeriodo);
  const conteudosEstado=estadoConteudos(planejamento.topicos||[],aulas);
  const pendentes=conteudosEstado.filter(t=>t.estado==='pendente');
  const dataInicioAcao=inicio>hoje()?inicio:hoje()<=fim?hoje():inicio;
  useEffect(()=>{
    if(authLoading)return;if(!user){router.push('/');return;}
    let ativo=true;
    getDoc(doc(db,'professores',user.uid,'turmas','data')).then(snap=>{if(!ativo)return;const lista=snap.exists()?snap.data().turmas||[]:[];setTurmas(lista);setTurmaId(prev=>lista.some(t=>t.id===prev)?prev:lista[0]?.id||'');}).catch(e=>{if(ativo)setErro(e.message);});
    return ()=>{ativo=false;};
  },[user,authLoading,router]);
  const trocarContexto=()=>{setModal(null);setAulaDetalhe(null);setPrevia(null);setErro('');setMensagem('');};
  const salvar=async mudancas=>{const novo=await cal.aplicar(mudancas);setMensagem('Alterações salvas.');return novo;};
  const revisar=async(titulo,result,mudancas={})=>{
    const novas=result.aulas||result;
    const alteradas=novas.filter(a=>JSON.stringify(a)!==JSON.stringify(aulas.find(x=>x.id===a.id)));
    await new Promise((resolve,reject)=>setPrevia({titulo,antes:aulas,alteradas,preservadas:novas.length-alteradas.length,pendentes:result.pendentes||[],aplicar:async()=>{await salvar({...mudancas,aulas:novas});setPrevia(null);resolve();},cancelar:()=>{setPrevia(null);reject(new Error('Alteração cancelada.'));}}));
  };
  const previaGrade=data=>{
    const g={...grade,...data,turmaId};const slots=Engine.gerarSlotsCalendario(g,g.dataInicioPeriodo,g.dataFimPeriodo);
    return reconciliarGrade(aulas,g,slots);
  };
  const salvarGrade=async data=>{
    const r=previaGrade(data);if(r.conflitos.length)throw new Error(r.conflitos.join('\n'));
    const aplicado=planejarFeriados(r.aulas,feriados);await salvar({grade:{...grade,...data},aulas:aplicado.aulas});setModal(null);
    if(aplicado.pendentes.length)setMensagem(`${aplicado.pendentes.length} conteúdos ficaram pendentes para reposição.`);
  };
  const salvarPlano=async(novos,{modo='mesclar'}={})=>{
    const ts=mesclarPlanejamento(planejamento.topicos||[],novos,modo==='substituir'?'substituir_pendentes':modo,aulas);
    await salvar({planejamento:{...planejamento,topicos:ts}});
  };
  const salvarTopico=async t=>{
    const antigo=(planejamento.topicos||[]).find(x=>x.id===t.id);const novo={...t,id:t.id||crypto.randomUUID(),ordem:t.ordem||planejamento.topicos.length+1};
    const ts=antigo?planejamento.topicos.map(x=>x.id===novo.id?novo:x):[...planejamento.topicos,novo];
    const atualizadas=aulas.map(a=>({...a,topicosAssociados:conteudos(a).map(x=>identidade(x)===novo.id?{...x,topicoTitulo:novo.titulo,titulo:novo.titulo,descricao:novo.descricao}:x)}));
    await salvar({planejamento:{...planejamento,topicos:ts},aulas:atualizadas});
  };
  const excluirTopico=async id=>{
    if(aulas.some(a=>historico(a).some(t=>identidade(t)===id)))throw new Error('Este conteúdo possui vínculo ou histórico. Desassocie as aulas futuras; conteúdos realizados devem ser preservados.');
    await salvar({planejamento:{...planejamento,topicos:planejamento.topicos.filter(t=>t.id!==id)}});
  };
  const adicionarConteudo=async(id,t)=>{
    const a=aulas.find(x=>x.id===id);if(!a||a.status!=='AGENDADA'||a.bloqueioAutomatico)throw new Error('Selecione uma aula agendada e sem bloqueio.');
    if(!pendentes.some(x=>x.id===t.id))throw new Error('O conteúdo já está agendado ou concluído.');
    const ocupada=conteudos(a).reduce((s,t)=>s+Number(t.duracaoAlocadaAulas||1),0);const n=Number(t.duracaoRestante||t.duracaoEstimadaAulas)||1;
    if(ocupada+n>Number(a.duracaoAlocadaAulas||1))throw new Error('Não há tempos suficientes nesta aula. Use distribuir para reservar a continuação.');
    await salvar({aulas:aulas.map(x=>x.id===id?{...x,topicosAssociados:[...conteudos(x),{...t,topicoId:t.id,topicoTitulo:t.titulo,duracaoAlocadaAulas:n}],topicoId:null,topicoTitulo:null}:x)});
  };
  const removerConteudo=async(id,tid)=>{
    const a=aulas.find(x=>x.id===id);if(['CONCLUIDA','PARCIAL'].includes(a?.status))throw new Error('O registro de aula realizada deve ser preservado.');
    await salvar({aulas:aulas.map(x=>x.id===id?{...x,topicosAssociados:conteudos(x).filter(t=>identidade(t)!==String(tid)),topicoId:null,topicoTitulo:null}:x)});
  };
  const statusAula=async(id,status,_a,opts={})=>{
    const a=aulas.find(x=>x.id===id);if(!a)throw new Error('Aula não encontrada.');
    if(a.conteudoEncaminhado && ['AGENDADA','CONCLUIDA'].includes(status))throw new Error('O conteúdo desta aula já foi encaminhado. Registre sua conclusão na aula de destino para preservar o histórico.');
    if(a.bloqueioAutomatico)throw new Error('Remova o feriado/recesso antes de reabrir esta aula.');
    if(['PARCIAL','NAO_REALIZADA'].includes(status)&&conteudos(a).length){const r=remanejarSeguro(aulas,id,status,{...opts,feriados,dataFim:fim});await revisar('Revisar destino do conteúdo',r);}
    else await salvar({aulas:aulas.map(x=>x.id===id?{...x,status,execucao:opts.execucao||{},conteudoEncaminhado:false}:x)});
  };
  const excluirAula=async id=>{
    const a=aulas.find(x=>x.id===id);if(!a||!noPeriodo(a)||['CONCLUIDA','PARCIAL'].includes(a.status)||a.dataAgendada<hoje())throw new Error('Só é possível excluir aulas futuras não realizadas dentro do período selecionado.');
    await salvar({aulas:aulas.filter(x=>x.id!==id)});
  };
  const excluirDia=async dia=>{
    const alvo=aulas.filter(a=>noPeriodo(a)&&a.dataAgendada>=dataInicioAcao&&parseISO(a.dataAgendada).getDay()===dia&&!['CONCLUIDA','PARCIAL'].includes(a.status));
    if(!alvo.length)throw new Error('Nenhuma aula futura elegível neste período.');
    if(alvo.some(a=>conteudos(a).length))throw new Error('Desassocie os conteúdos dessas aulas antes da exclusão em lote.');
    await salvar({aulas:aulas.filter(a=>!alvo.some(x=>x.id===a.id))});
  };
  const atualizarFeriados=async lista=>{const r=planejarFeriados(aulas,lista);await revisar('Revisar feriados e recessos',r,{feriados:lista});};
  const adicionarFeriado=async({data,dataFim,nome})=>{
    const datas=eachDayOfInterval({start:parseISO(data),end:parseISO(dataFim||data)}).map(d=>({data:format(d,'yyyy-MM-dd'),nome}));
    await atualizarFeriados([...feriados.filter(f=>!datas.some(d=>d.data===f.data)),...datas]);
  };
  const executar=async fn=>{setErro('');try{await fn();}catch(e){setErro(e.message);}};
  const copiar=async origem=>{const outro=await cal.carregarEstado(origem,ano);if(!outro.planejamento?.topicos?.length)throw new Error('A turma de origem não tem conteúdos neste ano.');await salvarPlano(outro.planejamento.topicos.map(t=>({...t,id:crypto.randomUUID()})));};
  const criarReposicao=async e=>{
    e.preventDefault();await executar(async()=>{
      const {data,inicio:hora,fim:horaFim,tempos}=reposicao;
      if(!data.startsWith(`${ano}-`)||hora>=horaFim||Number(tempos)<1||Number(tempos)>20)throw new Error('Informe data, horário e quantidade de tempos válidos.');
      if(feriados.some(f=>f.data===data))throw new Error('A data está bloqueada por feriado ou recesso.');
      if(aulas.some(a=>a.dataAgendada===data&&a.horarioInicio<horaFim&&a.horarioFim>hora))throw new Error('A reposição sobrepõe uma aula existente.');
      const nova={id:`reposicao_${turmaId}_${data}_${hora.replace(':','')}`,turmaId,anoLetivo:ano,dataAgendada:data,horarioInicio:hora,horarioFim:horaFim,duracaoAlocadaAulas:Number(tempos),status:'AGENDADA',reposicao:true,topicosAssociados:[]};
      await revisar('Confirmar aula de reposição',{aulas:[...aulas,nova],pendentes:[]},{grade:{...grade,anoLetivo:ano,reposicoes:[...(grade?.reposicoes||[]),nova]}});
    });
  };
  const contexto=`${turmaId}:${ano}`;
  return <div className="min-h-screen bg-[#f7f8fc] text-[#101942]">
    <header className="bg-white border-b border-[#dce0f0] p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><button className="text-sm font-bold" onClick={()=>router.push('/')}>← Hub</button><h1 className="text-xl font-extrabold">Calendário Pedagógico</h1></div><button className={botao} disabled={!aulasVisiveis.length||cal.salvando} onClick={()=>generateCalendarioPDF({turma,grade,aulas:aulasVisiveis,feriados,professorNome:user?.displayName||user?.email,anoLetivo:ano,dataInicio:inicio,dataFim:fim,planejamento})}>Baixar PDF do período</button></div>
      <fieldset disabled={cal.salvando||Boolean(previa)} className="flex flex-wrap gap-3 text-sm">
        <label>Turma<select aria-label="Turma" className="block border rounded-lg p-2" value={turmaId} onChange={e=>{trocarContexto();setTurmaId(e.target.value);}}>{!turmas.length&&<option value="">Nenhuma turma cadastrada</option>}{turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
        <label>Ano letivo<input aria-label="Ano letivo" className="block border rounded-lg p-2 w-28" type="number" min="1900" max="2200" value={ano} onChange={e=>{const n=Number(e.target.value);if(n<1900||n>2200)return;trocarContexto();setAno(n);setPeriodo(null);setDataAtual(new Date(n,0,1));}}/></label>
        <label>Período: início<input aria-label="Início do período" className="block border rounded-lg p-2" type="date" min={`${ano}-01-01`} max={fim} value={inicio} onChange={e=>{if(e.target.value && e.target.value.startsWith(`${ano}-`) && e.target.value<=fim){setPeriodo({inicio:e.target.value,fim});setDataAtual(parseISO(e.target.value));}}}/></label>
        <label>Fim<input aria-label="Fim do período" className="block border rounded-lg p-2" type="date" min={inicio} max={`${ano}-12-31`} value={fim} onChange={e=>{if(e.target.value && e.target.value.startsWith(`${ano}-`)&&e.target.value>=inicio)setPeriodo({inicio,fim:e.target.value});}}/></label>
        <button className={botao} onClick={()=>{setPeriodo(null);setDataAtual(new Date(ano,0,1));}}>Ano completo</button>
      </fieldset>
      <p className="text-xs text-[#6070a0]">Escolha as datas do bimestre ou período da sua escola. Alterações respeitam a turma e o ano selecionados.</p>
      <nav className="flex flex-wrap gap-2" aria-label="Áreas do calendário">{['Calendário','Conteúdos','Configurações'].map(nome=><button key={nome} aria-pressed={area===nome} className={`${botao} ${area===nome?'bg-[#101942] !text-white':''}`} onClick={()=>setArea(nome)}>{nome}</button>)}</nav>
    </header>
    <main className="max-w-[1600px] mx-auto p-3 sm:p-6 space-y-4">
      {(erro||cal.error)&&<div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3">{erro||cal.error}<button className={botao} onClick={()=>{setErro('');cal.recarregar();}}>Atualizar dados</button></div>}
      {mensagem&&<p role="status" className="bg-green-50 rounded-xl p-3">{mensagem}</p>}
      {cal.loading||authLoading?<p>Carregando calendário…</p>:!turma?<p>Cadastre uma turma no Diário Pedagógico para começar.</p>:!estado?<p>Não foi possível carregar os dados. Use Atualizar dados.</p>:<>
        {area==='Calendário'&&<>
          {!grade&&!aulas.length&&<section className={caixa}><h2 className="font-bold">Comece pelos horários da turma</h2><p>1. Confirme os horários · 2. Cadastre dias sem aula · 3. Revise os conteúdos · 4. Distribua com prévia.</p><button className={botao} onClick={()=>{setArea('Configurações');setModal('grade');}}>Puxar do Meu Horário Escolar ou cadastrar</button></section>}
          <div className="flex flex-wrap gap-2"><button className={botao} disabled={cal.salvando||!planejamento.topicos.length||!aulas.length} onClick={()=>setModal('distribuir')}>Distribuir conteúdos com prévia</button><button className={botao} onClick={()=>setArea('Conteúdos')}>Ver todos os conteúdos</button><button className={botao} onClick={()=>setModal('feriados')}>Dias sem aula</button></div>
          <CalendarioView aulas={aulasVisiveis} dataAtual={dataExibida} setDataAtual={setDataAtual} feriados={feriados} dataInicio={inicio} dataFim={fim} onDropTopico={(id,t)=>executar(()=>adicionarConteudo(id,t))} onOpenDetalhes={a=>setAulaDetalhe(a.id)}/>
          {pendentes.length>0&&<section className={caixa}><h2 className="font-bold">Conteúdos pendentes ({pendentes.length})</h2><p>Sem vaga? Ajuste a grade ou cadastre uma reposição em Configurações.</p>{pendentes.map(t=><p key={t.id}>{t.titulo}</p>)}<button className={botao} onClick={()=>setArea('Configurações')}>Planejar reposição</button></section>}
        </>}
        {area==='Conteúdos'&&<Sidebar turmas={turmas} turmaSelecionada={turma} planejamento={planejamento} aulas={aulas} onOpenNovoTopico={()=>{setTopico(null);setModal('topico');}} onOpenEditarTopico={t=>{setTopico(t);setModal('topico');}} onExcluirTopico={id=>executar(()=>excluirTopico(id))} onOpenImport={()=>setModal('importar')} onOpenAutoDistribuir={()=>setModal('distribuir')} onClearPlanejamento={()=>executar(async()=>{if(window.confirm('Remover os conteúdos sem vínculo? Conteúdos com histórico serão preservados.')){const ts=planejamento.topicos.filter(t=>aulas.some(a=>historico(a).some(x=>identidade(x)===t.id)));await salvar({planejamento:{...planejamento,topicos:ts}});}})} onCopiarPlanejamento={id=>executar(()=>copiar(id))}/>}
        {area==='Configurações'&&<>
          <section className={caixa}><h2 className="font-bold">Horários de {turma.nome} · {ano}</h2><p>Puxe os horários cadastrados e revise as alterações antes de aplicar. Aulas realizadas são preservadas.</p><button className={botao} disabled={cal.salvando} onClick={()=>setModal('grade')}>Puxar do Meu Horário Escolar / editar grade</button>{grade?.diasSemana?.map((d,i)=><p key={i}>{['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][d.diaSemana]} · {d.horarioInicio}–{d.horarioFim} · {d.quantidadeAulas} tempo(s)</p>)}</section>
          <section className={caixa}><h2 className="font-bold">Feriados e recessos</h2><p>Cadastre um dia ou um intervalo. A prévia mostra os conteúdos que serão deslocados.</p><button className={botao} disabled={cal.salvando} onClick={()=>setModal('feriados')}>Configurar dias sem aula ({feriados.length})</button></section>
          <section className={caixa}><h2 className="font-bold">Cadastrar reposição</h2><p>A reposição será incluída como horário extra autorizado nesta grade. Depois distribua os conteúdos pendentes.</p><form onSubmit={criarReposicao} className="flex flex-wrap gap-3"><label>Data<input required type="date" min={`${ano}-01-01`} max={`${ano}-12-31`} value={reposicao.data} onChange={e=>setReposicao({...reposicao,data:e.target.value})} className="block border rounded p-2"/></label><label>Início<input required type="time" value={reposicao.inicio} onChange={e=>setReposicao({...reposicao,inicio:e.target.value})} className="block border rounded p-2"/></label><label>Fim<input required type="time" value={reposicao.fim} onChange={e=>setReposicao({...reposicao,fim:e.target.value})} className="block border rounded p-2"/></label><label>Tempos<input required min="1" max="20" type="number" value={reposicao.tempos} onChange={e=>setReposicao({...reposicao,tempos:e.target.value})} className="block border rounded p-2 w-24"/></label><button className={botao} disabled={cal.salvando}>Revisar reposição</button></form></section>
          <details className={caixa}><summary className="font-bold cursor-pointer">Opções avançadas</summary><p>Limpa apenas conteúdos de aulas futuras agendadas dentro do período selecionado. Concluídas, parciais e passado permanecem.</p><button className={botao} disabled={cal.salvando} onClick={()=>executar(()=>revisar('Revisar limpeza de agendamentos',{aulas:limparAgendamentos(aulas,{dataInicio:dataInicioAcao,dataFim:fim}),pendentes:[]}))}>Revisar limpeza do período</button></details>
        </>}
      </>}
    </main>
    {estado&&<>
      {modal==='grade'&&<ConfigGradeModal key={contexto} isOpen onClose={()=>setModal(null)} anoLetivo={ano} turmaSelecionada={turma} initialGrade={grade} onPreview={async data=>previaGrade(data)} onSave={salvarGrade}/>}
      {modal==='importar'&&<ImportPlanejamentoModal key={contexto} isOpen onClose={()=>setModal(null)} turmaSelecionada={turma} anoLetivo={ano} onSalvar={salvarPlano}/>}
      {modal==='topico'&&<TopicoModal key={`${contexto}:${topico?.id||'novo'}`} isOpen onClose={()=>setModal(null)} topicoEmEdicao={topico} onSalvar={salvarTopico} onExcluir={excluirTopico}/>}
      {modal==='distribuir'&&<AutoDistribuirModal key={contexto} isOpen onClose={()=>setModal(null)} topicos={planejamento.topicos} aulas={aulas} feriados={feriados} dataInicioPadrao={dataInicioAcao} dataFim={fim} onConfirmar={async opts=>{const r=planejarDistribuicao(aulas,planejamento.topicos,{...opts,dataFim:opts.dataFim||fim,feriados});await salvar({aulas:r.aulas});if(r.pendentes.length)setMensagem(`${r.pendentes.length} conteúdos sem vaga permanecem pendentes para reposição.`);}}/>}
      {modal==='feriados'&&<FeriadosModal key={contexto} isOpen onClose={()=>setModal(null)} anoLetivo={ano} feriados={feriados} onAddFeriado={adicionarFeriado} onRemoveFeriado={data=>atualizarFeriados(feriados.filter(f=>f.data!==data))} onImportarFeriadosNacionais={async()=>{const unicos=new Map(feriados.map(f=>[f.data,f]));Engine.obterFeriadosNacionais(ano).forEach(f=>unicos.set(f.data,f));await atualizarFeriados([...unicos.values()]);}}/>}
      {aulaDetalhe&&aulas.find(a=>a.id===aulaDetalhe)&&<DetalhesAulaModal key={`${contexto}:${aulaDetalhe}`} isOpen onClose={()=>setAulaDetalhe(null)} aula={aulas.find(a=>a.id===aulaDetalhe)} topicosDisponiveis={pendentes} onUpdateStatus={statusAula} onRemoveTopico={removerConteudo} onAddTopico={adicionarConteudo} onExcluirAula={excluirAula} onExcluirDiaSemana={excluirDia}/>}
    </>}
    {previa&&<Previa previa={previa} salvando={cal.salvando} onApply={previa.aplicar} onCancel={previa.cancelar}/>}
  </div>;
}
