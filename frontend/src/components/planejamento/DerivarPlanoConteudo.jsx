'use client';
import React,{useEffect,useRef,useState} from 'react';
import {obterPlano,salvarPlano,gerarRequestId} from '@/components/aula-gamificada/api';
import {SelecionarConteudosAnuais} from './SelecionarConteudosAnuais';
import {criarPlanoDeConteudo} from '@/dominio/aula-gamificada/derivarPlano';
import {abrangenciaDoPlano,DURACOES,rotuloDuracao} from './modelos';
const botao='min-h-11 rounded-xl border-2 border-[#E2D9F7] bg-white px-4 py-2 font-bold disabled:opacity-40';
const campo='mt-1 w-full rounded-xl border-2 border-[#E2D9F7] p-3';
export function DerivarPlanoConteudo({exigirAnual=false,planos=[],origemInicialId='',turmas=[],obterToken,onCriado,onCancelar,onEstadoEdicao}) {
 const [id,setId]=useState(origemInicialId),[fonte,setFonte]=useState(null),[etapaIds,setEtapaIds]=useState([]);
 const [escala,setEscala]=useState('semanal'),[tipo,setTipo]=useState('normal'),[duracao,setDuracao]=useState(50),[manterTurmas,setManterTurmas]=useState(true);
 const [carregando,setCarregando]=useState(Boolean(origemInicialId)),[criando,setCriando]=useState(false),[incerto,setIncerto]=useState(false),[criado,setCriado]=useState(false),[tentativa,setTentativa]=useState(0),[erro,setErro]=useState(''),[conflito,setConflito]=useState(false);
 const [baseAnual,setBaseAnual]=useState(null);
 const vivo=useRef(true),pedido=useRef(null),trava=useRef(false);
 useEffect(()=>{vivo.current=true;return()=>{vivo.current=false;};},[]);
 useEffect(()=>{
  if(!id)return;const controller=new AbortController();
  obterPlano({id,obterToken,signal:controller.signal}).then(({plano})=>{if(controller.signal.aborted)return;if(abrangenciaDoPlano(plano)!=='planejamento')throw new Error('Escolha um planejamento da disciplina salvo.');setFonte(plano);setEtapaIds(plano.etapas.map(e=>e.id));setConflito(false);}).catch(e=>{if(!controller.signal.aborted)setErro(e.message||'Não foi possível abrir o planejamento.');}).finally(()=>{if(!controller.signal.aborted)setCarregando(false);});
  return()=>controller.abort();
 },[id,tentativa,obterToken]);
 useEffect(()=>{onEstadoEdicao?.(criando||incerto);},[onEstadoEdicao,criando,incerto]);
 const bloqueado=carregando||criando||incerto||criado;
 const candidatos=planos.filter(p=>abrangenciaDoPlano(p)==='planejamento');
 const removidas=fonte?.turmaIds?.filter(id=>!turmas.some(t=>String(t.id)===String(id)&&!t.arquivada))||[];
 let previa=null,erroConfig='';
 if(fonte?.id===id){try{previa=criarPlanoDeConteudo(fonte,{etapaIds,escalaDestino:escala,tipoDestino:tipo,duracaoMinutos:Number(duracao),integracaoAnual:exigirAnual});previa.turmaIds=manterTurmas?(fonte.turmaIds||[]).filter(id=>!removidas.includes(id)):[];}catch(e){erroConfig=e.message;}}
 if(baseAnual&&previa)previa={...previa,...baseAnual};
 const faltaAnual=exigirAnual&&previa&&!previa.vinculoAnual;
 const criar=async()=>{
  if(trava.current||criado||faltaAnual||(!previa&&!incerto))return;setErro('');setConflito(false);
  const plano=incerto&&pedido.current?pedido.current.plano:previa;
  const assinatura=JSON.stringify(plano);
  if(pedido.current?.assinatura!==assinatura)pedido.current={assinatura,requestId:gerarRequestId('derivar'),plano};
  trava.current=true;setCriando(true);
  try{const r=await salvarPlano({plano:pedido.current.plano,requestId:pedido.current.requestId,obterToken});if(!vivo.current)return;setIncerto(false);setCriado(true);onCriado?.(r.plano);}
  catch(e){if(vivo.current){setErro(e.message||'Não foi possível confirmar a criação.');setIncerto(!e.status||e.status>=500);setConflito(e.status===409);}}
  finally{trava.current=false;if(vivo.current)setCriando(false);}
 };
 const reler=()=>{if(criando||incerto)return;setErro('');setCarregando(true);setFonte(null);pedido.current=null;setTentativa(n=>n+1);};
 return <section aria-label="Derivar plano de conteúdo" className="space-y-5 text-[#25104A]">
  <header className="rounded-3xl bg-[#25104A] p-6 text-white"><span className="text-xs font-black uppercase tracking-widest text-[#FFE500]">PLANEJAMENTO DA DISCIPLINA → PLANO DE CONTEÚDO</span><h2 className="mt-3 text-3xl font-black">Derivar plano de conteúdo</h2><p className="mt-3">Escolha um recorte de um planejamento da disciplina. O original permanece salvo; o novo plano de conteúdo terá identidade própria e vínculo com a origem.</p></header>
  {erro&&<div role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-4"><p>{erro}</p>{incerto&&<p className="mt-2">O envio não foi confirmado. Repita o mesmo pedido antes de mudar as opções.</p>}{id&&!fonte&&!carregando&&!incerto&&<button type="button" className={`${botao} mt-3`} onClick={reler}>Tentar carregar o planejamento novamente</button>}{conflito&&!incerto&&<button type="button" className={`${botao} mt-3`} onClick={reler}>Reler versão atual do planejamento</button>}</div>}
  {!candidatos.length&&!fonte&&<div className="rounded-2xl border-2 border-[#E2D9F7] bg-white p-5"><p>Você ainda não tem planejamento da disciplina salvo nesta conta.</p>{onCancelar&&<button type="button" className={`${botao} mt-3`} onClick={onCancelar}>Voltar ao início</button>}</div>}
  <fieldset disabled={bloqueado} className="space-y-5 rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-7"><label className="block font-bold">Planejamento da disciplina de origem<select className={campo} value={id} onChange={e=>{setId(e.target.value);setFonte(null);setBaseAnual(null);setErro('');setCarregando(Boolean(e.target.value));setCriado(false);pedido.current=null;}}><option value="">Selecione um planejamento salvo</option>{candidatos.map(p=><option key={p.id} value={p.id}>{p.titulo} · {rotuloDuracao(p.escala||'aula','planejamento')}</option>)}</select></label>
  {carregando&&<p role="status">Carregando o planejamento privado...</p>}
  {fonte?.id===id&&<><div className="rounded-2xl bg-[#F3EDFF] p-4"><h3 className="text-xl font-black">{fonte.titulo}</h3><p className="mt-2 text-sm">{fonte.disciplina} · {fonte.anoEscolar} · versão {fonte.revision}</p><details className="mt-3"><summary className="cursor-pointer font-bold">Consultar conteúdos e objetivos do original</summary><p className="mt-3 whitespace-pre-wrap">{fonte.conteudo}</p><p className="mt-3 whitespace-pre-wrap">{fonte.objetivo}</p></details></div>
  <div><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-black">Qual recorte vira plano de conteúdo?</h3><div className="flex flex-wrap gap-2"><button type="button" className={botao} onClick={()=>setEtapaIds(fonte.etapas.map(e=>e.id))}>Selecionar todas</button><button type="button" className={botao} onClick={()=>setEtapaIds([])}>Desmarcar todas</button></div></div><p className="mt-2 text-sm">Escolha um ou mais períodos. O novo plano desenvolverá os conteúdos desse recorte na duração escolhida.</p><div className="mt-3 space-y-2">{fonte.etapas.map(e=><label key={e.id} className="flex gap-3 rounded-xl border-2 border-[#E2D9F7] p-4"><input type="checkbox" aria-label={e.titulo} checked={etapaIds.includes(e.id)} onChange={()=>setEtapaIds(ids=>ids.includes(e.id)?ids.filter(v=>v!==e.id):[...ids,e.id])}/><span><strong>{e.titulo}</strong><small className="ml-2">{e.prazo||(e.minutos!=null?`${e.minutos} min`:'')}</small><span className="mt-1 block text-sm text-[#5B4B86]">{e.orientacao}</span></span></label>)}</div></div>
  <div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Duração do plano de conteúdo<select className={campo} value={escala} onChange={e=>setEscala(e.target.value)}>{DURACOES.conteudo.map(([id,nome])=><option key={id} value={id}>{nome}</option>)}</select></label><label className="font-bold">Tipo do novo plano<select className={campo} value={tipo} onChange={e=>setTipo(e.target.value)}><option value="normal">Regular, sem exigir jogo</option><option value="gamificado">Gamificado, com etapa de jogo</option></select></label>{escala==='aula'&&<label className="font-bold">Duração da aula (minutos)<input type="number" min={10} max={240} className={campo} value={duracao} onChange={e=>setDuracao(e.target.value)}/></label>}</div>
  <label className="block"><input type="checkbox" checked={manterTurmas} onChange={e=>setManterTurmas(e.target.checked)}/> Reaproveitar as turmas ainda ativas</label>{removidas.length>0&&<p className="rounded-xl bg-amber-50 p-3 text-sm">{removidas.length} turma(s) arquivada(s) ou indisponível(is) não serão vinculadas ao novo plano. O original não será alterado.</p>}
  <p className="rounded-xl bg-[#F3EDFF] p-4 text-sm">Novo plano: <strong>{previa?.titulo||`${fonte.titulo} · ${rotuloDuracao(escala,'conteudo').toLowerCase()}`}</strong>. Conteúdos, objetivos, contexto e apoios serão preservados. O original permanece intacto.</p>
  </>}
  </fieldset>
  {faltaAnual&&<SelecionarConteudosAnuais plano={previa} planos={planos} obterToken={obterToken} disabled={bloqueado} onAplicar={p=>setBaseAnual({vinculoAnual:p.vinculoAnual,integracaoAnual:1,disciplina:p.disciplina,anoEscolar:p.anoEscolar,anoLetivo:p.anoLetivo,conteudo:p.conteudo,objetivo:p.objetivo,contexto:p.contexto})}/>}
  {baseAnual&&<p className="rounded-xl bg-[#ECFBFA] p-3">Conteúdos vinculados ao anual: {baseAnual.conteudo}</p>}
  {erroConfig&&<p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{erroConfig}</p>}
  <div className="flex flex-wrap gap-3"><button type="button" disabled={criando||criado||faltaAnual||(!incerto&&!previa)} className="min-h-12 rounded-xl bg-[#6315D9] px-5 py-3 font-black text-white disabled:opacity-40" onClick={criar}>{criando?'Criando plano...':incerto?'Tentar criar novamente':'Criar plano de conteúdo'}</button>{onCancelar&&<button type="button" disabled={criando||incerto} className={botao} onClick={onCancelar}>Cancelar derivação</button>}</div>
  <p className="text-sm text-[#5B4B86]">Esta ação salva um novo plano de conteúdo. Não cria ou publica jogo, questões ou notas automaticamente.</p>
 </section>;
}
