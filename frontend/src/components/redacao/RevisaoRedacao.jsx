'use client';
import { useState,useEffect,useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { revisarRedacao, publicarRedacao } from '@/lib/redacao/repositorio';
import { renderFeedbackText } from '@/lib/redacao/renderFeedback';

export default function RevisaoRedacao({redacao,onSaved,professorUid,onDirtyChange}) {
  const {user}=useAuth();
  const [notas,setNotas]=useState(()=>Object.fromEntries((redacao.scoreData || []).map(item=>[item.subject,item.A])));
  const [result,setResult]=useState(redacao.result || '');
  const [busy,setBusy]=useState(false);
  const [erro,setErro]=useState('');
  const [confirmar,setConfirmar]=useState(false);
  const [anulada,setAnulada]=useState(Boolean(redacao.anulada));
  const [motivo,setMotivo]=useState(redacao.motivoAnulacao || '');
  const uid=professorUid || user?.uid;
  const [rascunho,setRascunho]=useState(null);
  const [erroRascunho,setErroRascunho]=useState('');
  const salvoRef=useRef('');
  const prefixo=`rd:redacao:revisao:${uid}:${redacao.id}:`;
  const chave=`${prefixo}${redacao.revision || 0}`;
  const parcial=redacao.modo==='parcial';
  const comps=parcial ? Object.keys(notas) : ['C1','C2','C3','C4','C5'];
  const mudou=result!==(redacao.result || '') || anulada!==Boolean(redacao.anulada) || motivo!==(redacao.motivoAnulacao || '') || comps.some(subject=>notas[subject]!==redacao.scoreData?.find(s=>s.subject===subject)?.A);
  const payload=JSON.stringify({notas,result,anulada,motivo,baseRevision:redacao.revision || 0});
  useEffect(()=>{
    let ativo=true;
    Promise.resolve().then(()=>{
      if(!ativo)return;
      try{
        const atual=localStorage.getItem(chave);
        const outra=atual?null:Object.keys(localStorage).find(k=>k.startsWith(prefixo));
        const valor=atual || (outra&&localStorage.getItem(outra));
        if(valor)setRascunho({chave:atual?chave:outra,dados:JSON.parse(valor),compativel:Boolean(atual)});
      }catch{setErroRascunho('Não foi possível recuperar o rascunho privado deste dispositivo.');}
    });
    return()=>{ativo=false;};
  },[chave,prefixo]);
  useEffect(()=>{
    if(mudou && payload!==salvoRef.current){
      try{localStorage.setItem(chave,payload);}catch{Promise.resolve().then(()=>setErroRascunho('Não foi possível guardar o rascunho neste dispositivo. Mantenha esta página aberta até salvar.'));}
    }
    onDirtyChange?.(mudou);
    const sair=event=>{if(mudou){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',sair);return()=>window.removeEventListener('beforeunload',sair);
  },[mudou,payload,chave,onDirtyChange]);
  const editar=callback=>{setConfirmar(false);callback();};
  const recuperar=()=>{if(!rascunho?.compativel)return;const dados=rascunho.dados;setNotas(dados.notas);setResult(dados.result);setAnulada(dados.anulada);setMotivo(dados.motivo);setRascunho(null);setConfirmar(false);};
  const baixarRascunho=()=>{const blob=new Blob([JSON.stringify(rascunho?.dados,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='rascunho-revisao-redacao.json';a.click();URL.revokeObjectURL(url);};
  const executar=async publicar=> {
    if(publicar && (mudou || !confirmar)){setConfirmar(false);setErro('Salve a revisão atual e confira novamente antes de publicar.');return;}
    setErro('');setBusy(true);
    try {
      const salvo=publicar ? await publicarRedacao(uid,redacao.id,redacao.revision)
        : await revisarRedacao(uid,redacao.id,{result,modo:parcial?'parcial':'completa',anulada,motivoAnulacao:motivo,
          scoreData:comps.map(subject=>({subject,A:anulada?0:notas[subject],fullMark:200}))},redacao.revision);
      salvoRef.current=payload;try{localStorage.removeItem(chave);}catch{}setRascunho(null);setConfirmar(false);onSaved?.(salvo);
    } catch(e) {setErro(e.message || 'Não foi possível salvar. Tente novamente.');}
    finally {setBusy(false);}
  };

  return <section aria-label="Revisão docente" className="space-y-4 rounded-2xl border border-[#dce0f0] bg-white p-5">
    <h2 className="text-xl font-bold text-[#101942]">Revisar resultado</h2>
    <p className="text-sm text-slate-600">A análise automática é um apoio. Confira as notas e a devolutiva antes de disponibilizar ao aluno. Revisar não consome IA.</p>
    {rascunho && <div role="status" className="rounded-lg bg-amber-50 p-3 text-sm">{rascunho.compativel?<><p>Há alterações de revisão salvas neste dispositivo.</p><button className="mt-2 underline" onClick={recuperar}>Recuperar rascunho da revisão</button></>:<><p>Há um rascunho baseado em outra versão. Baixe para conferir e reaplicar manualmente; ele não será mesclado automaticamente.</p><button className="mt-2 underline" onClick={baixarRascunho}>Baixar rascunho anterior</button></>}</div>}
    {erroRascunho&&<p role="alert" className="text-amber-800">{erroRascunho}</p>}
    {mudou&&<p className="text-xs text-slate-600">Alterações de revisão ainda não salvas na nuvem. Rascunho privado separado por conta, redação e versão.</p>}
    {parcial && <p className="text-sm font-semibold">Avaliação parcial — sem nota total comparável à avaliação completa.</p>}
    <fieldset disabled={busy || redacao.status==='arquivado'} className="space-y-4">
      <legend className="sr-only">Notas e devolutiva</legend>
      <div className="flex flex-wrap gap-3">{comps.map(subject=><label key={subject} className="flex flex-col gap-1 text-sm">{subject}<select aria-label={`Nota ${subject}`} value={anulada?0:(notas[subject] ?? '')} disabled={anulada} onChange={e=>editar(()=>setNotas({...notas,[subject]:e.target.value===''?undefined:Number(e.target.value)}))} className="rounded-lg border border-slate-300 p-2"><option value="">Não avaliada</option>{[0,40,80,120,160,200].map(v=><option key={v} value={v}>{v}</option>)}</select></label>)}</div>
      {!parcial && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anulada} onChange={e=>editar(()=>setAnulada(e.target.checked))}/>Redação anulada</label>}
      {anulada && <label className="block text-sm">Motivo da anulação<textarea value={motivo} onChange={e=>editar(()=>setMotivo(e.target.value))} className="mt-1 w-full rounded-lg border p-2"/></label>}
      <label className="block text-sm font-semibold">Devolutiva da revisão<textarea value={result} onChange={e=>editar(()=>setResult(e.target.value))} rows={8} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal"/></label>
      <button type="button" onClick={()=>executar(false)} className="rounded-xl bg-[#101942] px-4 py-2 text-white">{busy?'Salvando…':'Salvar revisão'}</button>
    </fieldset>
    <details><summary className="cursor-pointer font-semibold">Prévia da devolutiva do aluno</summary><div className="mt-3">{renderFeedbackText(result)}</div></details>
    {redacao.status==='revisado' && !mudou && !confirmar && <button disabled={busy} onClick={()=>setConfirmar(true)} className="rounded-xl bg-[#f60c49] px-4 py-2 text-white">Disponibilizar ao aluno</button>}
    {confirmar && !mudou && <div role="group" aria-label="Confirmar publicação" className="rounded-lg bg-amber-50 p-4"><p>Publicar esta versão para {redacao.studentName}, turma {redacao.studentClass || redacao.turmaId}, {redacao.bimestre}º bimestre?</p><p className="mt-1 text-sm">O acesso exige a sessão do próprio aluno.</p><div className="mt-3 flex gap-3"><button disabled={busy} onClick={()=>executar(true)} className="rounded-lg bg-[#f60c49] px-3 py-2 text-white">Confirmar publicação</button><button disabled={busy} onClick={()=>setConfirmar(false)}>Cancelar</button></div></div>}
    {erro && <p role="alert" className="text-red-700">{erro}</p>}
  </section>;
}
