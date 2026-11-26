'use client';
import React,{useEffect,useRef,useState} from 'react';
import {useAIConfig} from '@/hooks/useAIConfig';
import {ModalConectarIA} from '@/components/ai/ModalConectarIA';
import {gerarPlanoAnualIA} from '@/components/aula-gamificada/api';
import {LIMITE_TEXTO_ANUAL,validarEntradaImportacaoAnual} from '@/dominio/aula-gamificada/importacaoAnual';
const campo='mt-1 w-full rounded-xl border-2 border-[#E2D9F7] bg-white p-3';
const botao='min-h-11 rounded-xl border-2 border-[#E2D9F7] bg-white px-4 py-2 font-bold disabled:opacity-40';
export function ImportarPlanoAnual({uid,...props}) {
 return <ImportacaoAnual key={uid||'docente'} {...props}/>;
}
function ImportacaoAnual({obterToken,onCriado,onEstadoEdicao}) {
 const {temChave,config}=useAIConfig();
 const [disciplina,setDisciplina]=useState(''),[anoEscolar,setAnoEscolar]=useState(''),[anoLetivo,setAnoLetivo]=useState(new Date().getFullYear()),[tipo,setTipo]=useState('normal');
 const [arquivo,setArquivo]=useState(null),[texto,setTexto]=useState(''),[conferido,setConferido]=useState(false),[revisado,setRevisado]=useState(false);
 const [extraindo,setExtraindo]=useState(false),[gerando,setGerando]=useState(false),[resultado,setResultado]=useState(null),[erro,setErro]=useState(''),[modalIA,setModalIA]=useState(false);
 const vivo=useRef(true),trava=useRef(false),versao=useRef(0),controller=useRef(null),inputArquivo=useRef(null);
 const ocupado=extraindo||gerando,excede=texto.length>LIMITE_TEXTO_ANUAL;
 useEffect(()=>{vivo.current=true;return()=>{vivo.current=false;controller.current?.abort();};},[]);
 useEffect(()=>{onEstadoEdicao?.(Boolean(disciplina||anoEscolar||texto||arquivo||resultado||ocupado));},[onEstadoEdicao,disciplina,anoEscolar,texto,arquivo,resultado,ocupado]);
 const ler=async()=>{
  if(trava.current||!arquivo)return;trava.current=true;setExtraindo(true);setErro('');setConferido(false);const atual=++versao.current;
  try{const {extractTextFromDocument}=await import('@/utils/atividades/documentExtractor');const r=await extractTextFromDocument(arquivo);if(!vivo.current||atual!==versao.current)return;if(!r.texto?.trim())throw new Error('O arquivo não trouxe texto legível. Confira o material ou cole o currículo.');setTexto(r.texto);}
  catch(e){if(vivo.current&&atual===versao.current)setErro(e.message||'Não foi possível ler o arquivo.');}
  finally{trava.current=false;if(vivo.current&&atual===versao.current)setExtraindo(false);}
 };
 const gerar=async()=>{
  if(trava.current||!conferido)return;if(!temChave){setModalIA(true);return;}
  let entrada;try{entrada=validarEntradaImportacaoAnual({disciplina,anoEscolar,anoLetivo:Number(anoLetivo),tipo,texto,nomeMaterial:arquivo?.name?.slice(0,160)||''});}catch(e){setErro(e.message);return;}
  trava.current=true;setGerando(true);setErro('');setRevisado(false);const atual=++versao.current;const c=new AbortController();controller.current=c;
  try{const r=await gerarPlanoAnualIA({entrada,obterToken,signal:c.signal});if(!vivo.current||atual!==versao.current||c.signal.aborted)return;if(!r.rascunho?.etapas?.length)throw new Error('A IA não retornou um planejamento completo. Tente novamente.');setResultado(r);}
  catch(e){if(vivo.current&&atual===versao.current&&!c.signal.aborted)setErro(e.message||'Não foi possível organizar o anual. Tente novamente.');}
  finally{trava.current=false;if(vivo.current&&atual===versao.current)setGerando(false);}
 };
 const limpar=()=>{if(trava.current)return;versao.current++;setDisciplina('');setAnoEscolar('');setArquivo(null);setTexto('');setResultado(null);setConferido(false);setRevisado(false);setErro('');if(inputArquivo.current)inputArquivo.current.value='';};
 return <section aria-label="Importar planejamento anual" className="space-y-5 text-[#25104A]">
  <header className="rounded-3xl bg-[#25104A] p-6 text-white"><span className="text-xs font-black uppercase tracking-widest text-[#FFE500]">MATERIAL → BIMESTRES → REVISÃO DOCENTE</span><h2 className="mt-3 text-3xl font-black">Importar currículo anual</h2><p className="mt-3">Use o currículo completo da disciplina. A IA organiza os conteúdos existentes em quatro bimestres; você confere, adapta e salva pelo editor.</p></header>
  {erro&&<p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-900">{erro}</p>}
  <fieldset disabled={ocupado||Boolean(resultado)} className="space-y-5 rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-7"><legend className="px-2 text-xl font-black">1. Material e contexto</legend>
   <div className="grid gap-4 sm:grid-cols-2"><label className="min-w-0 font-bold">Disciplina<input className={campo} maxLength={100} value={disciplina} onChange={e=>setDisciplina(e.target.value)}/></label><label className="min-w-0 font-bold">Série / ano escolar<input className={campo} maxLength={80} value={anoEscolar} onChange={e=>setAnoEscolar(e.target.value)}/></label><label className="font-bold">Ano letivo<input type="number" min={2000} max={2100} className={campo} value={anoLetivo} onChange={e=>setAnoLetivo(e.target.value)}/></label><label className="font-bold">Tipo de planejamento<select className={campo} value={tipo} onChange={e=>setTipo(e.target.value)}><option value="normal">Regular</option><option value="gamificado">Gamificado</option></select></label></div>
   <div className="rounded-2xl border-2 border-dashed border-[#C8B3EF] bg-[#F7F3FF] p-4"><label className="block font-bold">Arquivo do currículo<input ref={inputArquivo} type="file" accept=".pdf,.docx,.txt,.md" className={`${campo} min-w-0 max-w-full text-sm`} onChange={e=>{setArquivo(e.target.files?.[0]||null);setErro('');setConferido(false);}}/></label><p className="mt-3 text-sm">PDF, DOCX, TXT ou MD, até 15 MB. PDFs escaneados usam visão com sua chave de IA, até dez páginas escaneadas. O arquivo original não é armazenado.</p><button type="button" className={`${botao} mt-3`} disabled={!arquivo} onClick={ler}>{extraindo?'Lendo arquivo...':'Ler arquivo e revisar texto'}</button></div>
   <label className="block font-bold">Texto do currículo<textarea className={campo} rows={10} value={texto} onChange={e=>{setTexto(e.target.value);setConferido(false);setErro('');}} placeholder="Cole o currículo anual aqui ou leia um arquivo acima."/></label><p className={`text-sm ${excede?'font-bold text-red-800':'text-[#5B4B86]'}`}>{texto.length.toLocaleString('pt-BR')} / {LIMITE_TEXTO_ANUAL.toLocaleString('pt-BR')} caracteres.{excede?' O texto foi mantido integralmente. Selecione um recorte antes de gerar.':''}</p>
   <label className="flex items-start gap-3 font-bold"><input type="checkbox" checked={conferido} onChange={e=>setConferido(e.target.checked)}/><span>Conferi o texto do currículo</span></label>
  </fieldset>
  {!resultado&&<div className="flex flex-wrap items-center gap-3"><button type="button" className="min-h-12 rounded-xl bg-[#6315D9] px-5 py-3 font-black text-white disabled:opacity-40" disabled={ocupado||!conferido||excede||texto.trim().length<30} onClick={gerar}>{gerando?'Organizando os bimestres...':'Organizar anual com IA'}</button><button type="button" className={botao} disabled={ocupado} onClick={()=>setModalIA(true)}>{temChave?`IA conectada${config?.provider?` · ${config.provider}`:''}`:'Conectar IA'}</button></div>}
  {ocupado&&<p role="status">{extraindo?'Lendo o material. O texto aparecerá para sua conferência.':'A IA está organizando os quatro bimestres. O resultado ainda será revisado e não será salvo automaticamente.'}</p>}
  {resultado&&<section className="space-y-4 rounded-3xl border-2 border-[#00CAD5] bg-[#ECFBFA] p-5 sm:p-7"><h3 className="text-2xl font-black">Revise a distribuição por bimestre</h3>{(resultado.avisos||[]).map((a,i)=><p key={i} className="text-sm">{a}</p>)}<div className="grid gap-4 md:grid-cols-2">{resultado.rascunho.etapas.map(e=><article key={e.id} className="min-w-0 rounded-2xl border-2 border-[#E2D9F7] bg-white p-5"><h4 className="text-xl font-black">{e.titulo}</h4><ul className="mt-3 list-inside list-disc space-y-2 break-words">{(e.curriculo?.conteudos||'').split('\n').filter(Boolean).map((t,i)=><li key={i}>{t}</li>)}</ul><p className="mt-4 whitespace-pre-wrap text-sm text-[#5B4B86]">{e.curriculo?.objetivos}</p></article>)}</div><label className="flex items-start gap-3 font-bold"><input type="checkbox" checked={revisado} onChange={e=>setRevisado(e.target.checked)}/><span>Conferi a distribuição e quero revisar no editor</span></label><div className="flex flex-wrap gap-3"><button type="button" className="min-h-12 rounded-xl bg-[#6315D9] px-5 py-3 font-black text-white disabled:opacity-40" disabled={!revisado} onClick={()=>onCriado?.(resultado.rascunho)}>Usar rascunho no editor</button><button type="button" className={botao} onClick={()=>{setResultado(null);setRevisado(false);setConferido(false);}}>Editar material e gerar novamente</button></div><p className="text-sm">O editor permite ajustar os conteúdos de cada período. Só “Salvar planejamento” cria o anual na sua biblioteca.</p></section>}
  <button type="button" className={botao} disabled={ocupado} onClick={limpar}>Descartar importação</button>
  <ModalConectarIA isOpen={modalIA} onClose={()=>setModalIA(false)}/>
 </section>;
}
