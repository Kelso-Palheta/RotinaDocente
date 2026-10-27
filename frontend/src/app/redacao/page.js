'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePersistenciaDiario } from '@/hooks/diario/usePersistenciaDiario';
import { getClientAIHeaders } from '@/utils/aiHeaders';
import { resolverLoginsAlunos, gerarLoginKey, resolverLoginUnico } from '@/utils/diario/loginAluno';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { salvarRedacao } from '@/lib/redacao/repositorio';
import RevisaoRedacao from '@/components/redacao/RevisaoRedacao';
import { renderFeedbackText } from '@/lib/redacao/renderFeedback';
import { RUBRICA_REDACAO } from '@/dominio/redacao/rubrica';
import { generatePDF } from '@/lib/redacao/pdf-generator';

const COMPETENCIAS = ['c1', 'c2', 'c3', 'c4', 'c5'];
const field = 'w-full border border-slate-300 rounded-xl p-3 bg-white text-[#101942]';
const box = 'rounded-2xl border border-slate-200 bg-white p-5 space-y-4';
const vazio = () => ({ turmaId:'', alunoId:'', nome:'', turmaNome:'', anoLetivo:'', bimestre:1, tema:'', texto:'', motivador:'', depth:'analyzed', competencias:[...COMPETENCIAS], fonte:null });
const chaveRascunho = uid => `redacao_rascunho_v2_${uid}`;
const chaveContexto = (uid,form) => `${chaveRascunho(uid)}:contexto:${form.turmaId ? `${encodeURIComponent(form.turmaId)}:${encodeURIComponent(form.alunoId || 'sem-aluno')}` : 'avulsa'}`;
const readImage = file => new Promise((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(new Error('Não foi possível abrir a imagem.')); reader.readAsDataURL(file); });

export default function RedacaoPage() {
  const { user, perfil, loading } = useAuth();
  const router = useRouter();
  const diario = usePersistenciaDiario(user?.uid);
  const [form,setForm] = useState(vazio);
  const [etapa,setEtapa] = useState('input');
  const [registro,setRegistro] = useState(null);
  const [recuperavel,setRecuperavel] = useState(null);
  const [rascunhos,setRascunhos] = useState([]);
  const [conta,setConta] = useState(null);
  const [dirty,setDirty] = useState(false);
  const [erro,setErro] = useState('');
  const [aviso,setAviso] = useState('');
  const [busy,setBusy] = useState('');
  const [imagem,setImagem] = useState('');
  const [zoom,setZoom] = useState(false);
  const [manual,setManual] = useState(false);
  const [notas,setNotas] = useState({});
  const [comentario,setComentario] = useState('');
  const [salvo,setSalvo] = useState(false);
  const [revisaoDirty,setRevisaoDirty]=useState(false);
  const uidRef = useRef(user?.uid);
  const operacao = useRef(0);
  const emAndamento = useRef(false);
  uidRef.current = user?.uid;

  useEffect(() => {
    operacao.current++;
    setRevisaoDirty(false);setForm(vazio()); setRegistro(null); setEtapa('input'); setDirty(false); setSalvo(false); setImagem(''); setBusy(''); setManual(false); setNotas({}); setComentario(''); setErro('');setAviso('');
    setConta(user?.uid || null);
    try { const lista=Object.keys(localStorage).filter(k=>k.startsWith(`${chaveRascunho(user?.uid)}:contexto:`)).flatMap(k=>{try{const d=JSON.parse(localStorage.getItem(k));return d?.userId===user?.uid && typeof d.form?.texto==='string'?[d]:[];}catch{return [];}});setRascunhos(lista);const d=JSON.parse(localStorage.getItem(chaveRascunho(user?.uid)) || 'null'); setRecuperavel(d?.userId===user?.uid && d?.form && typeof d.form.texto==='string' ? d : lista[0] || null); }
    catch { setRecuperavel(null);setRascunhos([]); }
  }, [user?.uid]);

  useEffect(() => {
    if (!dirty || !user?.uid || conta!==user.uid || (!form.texto && !registro && !comentario)) return;
    try { const data=JSON.stringify({userId:user.uid,form,registro,etapa,manual,notas,comentario,updatedAt:new Date().toISOString()});localStorage.setItem(chaveRascunho(user.uid),data);localStorage.setItem(chaveContexto(user.uid,form),data); }
    catch { setAviso('O rascunho continua nesta tela, mas não coube no armazenamento local. Copie o texto antes de sair.'); }
  }, [dirty,form,registro,etapa,manual,notas,comentario,user?.uid,conta]);
  useEffect(() => {
    const sair=e=>{ if(dirty || revisaoDirty || busy){e.preventDefault();e.returnValue='';} };
    window.addEventListener('beforeunload',sair);
    return ()=>window.removeEventListener('beforeunload',sair);
  }, [dirty,revisaoDirty,busy]);
  useEffect(() => { if (!loading && !user) router.replace('/'); }, [loading,user,router]);

  const turmas=(diario.turmas || []).filter(t=>!t.arquivada);
  const turma=turmas.find(t=>t.id===form.turmaId);
  const aluno=turma?.alunos?.find(a=>a.id===form.alunoId);
  const mudar=patch=>{
    const mudouContexto=('turmaId' in patch && patch.turmaId!==form.turmaId) || ('alunoId' in patch && patch.alunoId!==form.alunoId);
    if(mudouContexto && (form.texto || registro || comentario)){
      if(!window.confirm('Trocar aluno ou turma? O rascunho atual ficará guardado neste dispositivo e o novo texto começará vazio.'))return;
      try{const d={userId:user.uid,form,registro,etapa,manual,notas,comentario,updatedAt:new Date().toISOString()};localStorage.setItem(chaveContexto(user.uid,form),JSON.stringify(d));setRascunhos(prev=>[...prev.filter(r=>chaveContexto(user.uid,r.form)!==chaveContexto(user.uid,form)),d]);}catch{setErro('Não foi possível guardar o rascunho. Copie o texto antes de trocar.');return;}
      patch={...patch,texto:'',fonte:null};setImagem('');setManual(false);setNotas({});setComentario('');setEtapa('input');
    }
    operacao.current++; setForm(f=>({...f,...patch})); setDirty(true); setErro(''); setRegistro(null);setSalvo(false); };
  const recuperar=()=>{ if(busy)return;operacao.current++;setImagem('');setZoom(false);const d=recuperavel;setForm({...vazio(),...d.form});setRegistro(d.registro || null);setEtapa(d.registro?'result':'input');setManual(Boolean(d.manual));setNotas(d.notas || {});setComentario(d.comentario || '');setDirty(true);setRecuperavel(null);setSalvo(false); };
  const novo=()=>{ if((dirty || revisaoDirty) && !window.confirm('Iniciar outra redação? O rascunho atual ficará guardado neste dispositivo.')) return;operacao.current++;setForm(vazio());setRegistro(null);setEtapa('input');setDirty(false);setSalvo(false);setRevisaoDirty(false);setManual(false);setNotas({});setComentario('');setImagem('');setErro('');setRecuperavel(null);localStorage.removeItem(chaveRascunho(user.uid)); };

  const importar=async(e,motivador=false)=>{
    const file=e.target.files?.[0]; e.target.value='';if(!file)return;
    const ext=file.name.split('.').pop().toLowerCase();
    const image=file.type.startsWith('image/') || ['heic','heif'].includes(ext);
    const max=image?7*1024*1024:15*1024*1024;
    if(file.size>max){setErro(`Arquivo excede ${image?7:15} MB.`);return;}
    if(!image && !['pdf','docx','txt'].includes(ext)){setErro('Envie imagem, PDF, DOCX ou TXT.');return;}
    const token=++operacao.current,uid=user.uid;
    const atual=()=>token===operacao.current && uidRef.current===uid;
    setBusy(motivador?'Lendo motivadores…':'Lendo arquivo…');setErro('');if(!motivador)setImagem('');
    try {
      let text='',preview='';
      if(ext==='pdf'){
        const {extractTextFromPDFWithVision}=await import('@/utils/atividades/visionExtractor');
        text=await extractTextFromPDFWithVision(file,{onProgress:p=>{if(atual())setBusy(`Lendo PDF: página ${p.page || p.pagina || ''}…`);}});
      } else if(ext==='docx') { const {extractTextFromDocx}=await import('@/utils/atividades/docxExtractor');text=await extractTextFromDocx(file); }
      else if(ext==='txt') text=await file.text();
      else {
        let blob=file;
        if(['heic','heif'].includes(ext)){ const convert=(await import('heic2any')).default;const result=await convert({blob:file,toType:'image/jpeg',quality:.9});blob=Array.isArray(result)?result[0]:result; }
        const url=await readImage(blob);
        preview=url;
        const {extractTextFromImageVision,getMediaTypeFromDataUrl}=await import('@/utils/atividades/visionExtractor');
        text=await extractTextFromImageVision(url.split(',')[1],{mediaType:getMediaTypeFromDataUrl(url),...(motivador?{finalidade:'documento'}:{})});
      }
      if(!atual())return;
      if(!text?.trim())throw new Error('Nenhum texto legível. Tente uma foto mais nítida ou outro arquivo.');
      setForm(f=>({...f,...(motivador?{motivador:text}:{texto:text,fonte:{nome:file.name,tipo:file.type}})}));
      setDirty(true);setRegistro(null);setSalvo(false);if(!motivador){setImagem(preview);setEtapa('review');}
    }catch(error){if(atual())setErro(error.message);}
    finally {if(atual())setBusy('');}
  };

  const salvar=async(data=registro)=>{
    if(!data || emAndamento.current)return;
    emAndamento.current=true;const uid=user.uid;
    setBusy('Salvando redação…');setErro('');
    try {
      const saved=await salvarRedacao(uid,data.id,data);
      if(uidRef.current!==uid)return;
      setRegistro(saved || {...data,revision:1});setSalvo(true);setDirty(false);try{localStorage.removeItem(chaveRascunho(uid));localStorage.removeItem(chaveContexto(uid,form));}catch{setAviso('Salvo na nuvem. Não foi possível limpar a cópia local; descarte-a quando o armazenamento estiver disponível.');}setRecuperavel(null);
    }catch(error){if(uidRef.current===uid){setErro(`Resultado preservado. Não foi possível salvar: ${error.message}`);setDirty(true);}}
    finally{emAndamento.current=false;if(uidRef.current===uid)setBusy('');}
  };

  const corrigir=async(usarIA=true)=>{
    if(emAndamento.current || busy)return;
    if(!form.texto.trim() || !form.nome.trim() || !form.competencias.length){setErro('Informe aluno, texto e ao menos uma competência.');return;}
    const token=++operacao.current,uid=user.uid;
    const atual=()=>token===operacao.current && uidRef.current===uid;
    emAndamento.current=true;setBusy(usarIA?'Corrigindo com IA…':'Preparando correção manual…');setErro('');
    try {
      // A associação usa apenas a seleção explícita; nome digitado nunca seleciona outro aluno.
      let loginAluno=null,loginKey=null;
      if(aluno?.dataNascimento){
        const resolvido=resolverLoginsAlunos(turma.alunos).find(r=>r.aluno.id===aluno.id);
        const r=await resolverLoginUnico(aluno.nome,aluno.dataNascimento,async login=>{
          const snap=await getDoc(doc(db,'alunoLogin',await gerarLoginKey(login)));
          return snap.exists()?{nome:snap.data().nome}:null;
        },{homonimo:!!resolvido?.homonimo});
        if(r.conflito)throw new Error('Login em conflito. Confira o cadastro do aluno antes de continuar.');
        loginAluno=r.login;loginKey=await gerarLoginKey(loginAluno);
      }
      let result,scores;
      if(usarIA){
        const headers=getClientAIHeaders();
        if(!headers['x-user-ai-key'])throw new Error('Conecte sua chave de IA no Hub para corrigir com IA. A correção manual continua disponível.');
        const response=await fetch('/api/corrigir',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({text:form.texto.trim(),studentName:form.nome,studentClass:form.turmaNome,essayTheme:form.tema,depth:form.depth,competencies:form.competencias,motivatorText:form.motivador})});
        const data=await response.json();if(!response.ok)throw new Error(data.message || data.error || 'Falha na correção.');
        result=data.result;scores=data.scores;
        if(!result || !scores?.items?.length)throw new Error('A IA não retornou avaliação válida. O texto foi preservado.');
      }else{
        if(!comentario.trim())throw new Error('Escreva a devolutiva da correção manual.');
        if(form.competencias.some(c=>notas[c]==='' || notas[c]===undefined))throw new Error('Selecione uma nota para cada competência avaliada.');
        const items=form.competencias.map(c=>({subject:c.toUpperCase(),A:Number(notas[c]),fullMark:200}));
        scores={items,total:items.length===5?items.reduce((s,c)=>s+c.A,0):null,modo:items.length===5?'completa':'parcial',anulada:false};result=comentario.trim();
      }
      if(!atual())return;
      const data={id:crypto.randomUUID(),schemaVersion:2,rubricaVersao:RUBRICA_REDACAO.versao,rubricaFonte:RUBRICA_REDACAO.fonte,rubricaHomologada:RUBRICA_REDACAO.homologacaoOficial,userId:uid,studentName:form.nome.trim(),studentClass:form.turmaNome || 'Avulsa',turmaNome:form.turmaNome || 'Avulsa',turmaId:turma?.id || null,alunoId:aluno?.id || null,anoLetivo:turma?.anoLetivo || form.anoLetivo || null,bimestre:Number(form.bimestre),essayTheme:form.tema.trim() || 'Tema livre',originalText:form.texto,motivatorText:form.motivador,fonte:form.fonte,loginAluno,loginKey,result,scoreData:scores.items,totalScore:scores.total,modo:scores.modo || (scores.total===null?'parcial':'completa'),nomeProfessor:perfil?.nome || user?.displayName || 'Professor',assessmentMode:scores.modo || (scores.total===null?'parcial':'completa'),competencias:form.competencias,anulada:!!scores.anulada,motivoAnulacao:scores.motivoAnulacao || '',metodoCorrecao:usarIA?'ia':'manual',status:'corrigido',createdAt:new Date().toISOString(),revision:0};
      setRegistro(data);setEtapa('result');setDirty(true);setSalvo(false);
      // O resultado fica visível e no rascunho antes da gravação. Erro repete apenas salvar.
      emAndamento.current=false;await salvar(data);
    }catch(error){if(atual()){setErro(error.message);setEtapa('review');}}
    finally{emAndamento.current=false;if(atual())setBusy('');}
  };

  if(loading || (user && conta!==user.uid))return <p className="p-8">Carregando Redação…</p>;
  if(!user)return null;
  if(!perfil?.modulos_permitidos?.includes('redacao-corretor'))return <p className="p-8">Seu plano não inclui Redação Corrigida. <Link href="/">Voltar ao Hub</Link></p>;
  const contexto=form.nome ? `${form.turmaNome || 'Avulsa'} · ${form.nome} · ${form.bimestre}º bimestre`:'Selecione turma e aluno ou crie uma redação avulsa.';
  const label=(texto,children)=><label className="block space-y-1"><span className="text-sm font-semibold">{texto}</span>{children}</label>;
  return <main onClickCapture={e=>{const link=e.target.closest('a');if(!link)return;if(busy){e.preventDefault();e.stopPropagation();setErro('Aguarde o processamento terminar antes de sair.');}else if((dirty || revisaoDirty) && !window.confirm('Sair desta redação? O texto ficará no rascunho deste dispositivo; a imagem precisará ser reenviada.')){e.preventDefault();e.stopPropagation();}}} className="min-h-screen bg-slate-50 text-[#101942] p-4 sm:p-8">
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/" className="text-sm underline">Voltar ao Hub</Link><h1 className="text-2xl font-bold">Redação Corrigida</h1></div><nav className="flex flex-wrap gap-3"><Link className="btn-brand-navy rounded-xl px-4 py-2" href="/redacao/desempenho">Histórico e evolução</Link><Link href="/redacao/criterios" className="underline py-2">Critérios ENEM</Link><button className="btn-brand-ghost rounded-xl px-4 py-2" disabled={!!busy} onClick={novo}>Nova redação</button></nav></header>
      <p className="text-sm">Enviar → Revisar texto → Corrigir → Revisar resultado → Disponibilizar. Salvamento e publicação são etapas separadas.</p>
      <p className="rounded-xl bg-[#fff2f6] border border-[#f60c49]/20 p-3 font-semibold">{contexto}</p>
      {recuperavel && <section className={box}><p>Há um rascunho desta conta neste dispositivo. Fonte original deve ser reenviada para comparação visual.</p><button className="btn-brand-primary rounded-xl px-4 py-2" disabled={!!busy} onClick={recuperar}>Recuperar rascunho</button><button className="ml-3 underline" disabled={!!busy} onClick={()=>{setRecuperavel(null);localStorage.removeItem(chaveRascunho(user.uid));}}>Descartar rascunho</button></section>}
      {rascunhos.length>0 && <details className={box}><summary>Rascunhos por aluno ({rascunhos.length})</summary>{rascunhos.map(d=><button key={chaveContexto(user.uid,d.form)} disabled={!!busy} className="block underline text-left py-2" onClick={()=>setRecuperavel(d)}>{d.form.nome || 'Aluno não selecionado'} · {d.form.turmaNome || 'Avulsa'} · {d.form.bimestre}º bimestre — recuperar</button>)}</details>}
      {erro && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4">{erro}</p>}
      {aviso && <p role="status" className="rounded-xl bg-amber-50 p-4">{aviso}</p>}
      {busy && <p role="status" aria-live="polite" className="p-4 bg-blue-50 rounded-xl">{busy}</p>}
      {etapa!=='result' && <fieldset disabled={!!busy} className="space-y-5">
        <section className={box}><h2 className="font-bold">1. Identificar redação</h2>
          {diario.erro && <p role="alert">Turmas indisponíveis: {diario.erro} <button type="button" onClick={()=>diario.tentarNovamente?.().catch(e=>setErro(e.message))} className="underline">Tentar novamente</button></p>}
          <div className="grid sm:grid-cols-3 gap-3">
            {label('Turma',<select className={field} value={form.turmaId} disabled={diario.carregando} onChange={e=>{const t=turmas.find(t=>t.id===e.target.value);mudar({turmaId:t?.id || '',alunoId:'',nome:'',turmaNome:t?.nome || '',anoLetivo:t?.anoLetivo || ''});}}><option value="">Redação avulsa</option>{turmas.map(t=><option key={t.id} value={t.id}>{t.nome} · {t.anoLetivo || 'Ano não informado'}</option>)}</select>)}
            {turma?label('Aluno',<select className={field} value={form.alunoId} onChange={e=>{const a=turma.alunos.find(a=>a.id===e.target.value);mudar({alunoId:a?.id || '',nome:a?.nome || ''});}}><option value="">Selecionar aluno</option>{turma.alunos.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select>):label('Nome do aluno',<input className={field} value={form.nome} onChange={e=>mudar({nome:e.target.value})} maxLength={100}/>)}
            {label('Bimestre',<select className={field} value={form.bimestre} onChange={e=>mudar({bimestre:Number(e.target.value)})}>{[1,2,3,4].map(b=><option key={b} value={b}>{b}º bimestre</option>)}</select>)}
            {label('Ano letivo',<input className={field} value={form.anoLetivo} onChange={e=>mudar({anoLetivo:e.target.value})} maxLength={4} inputMode="numeric"/>)}
            {label('Tema',<input className={field} value={form.tema} onChange={e=>mudar({tema:e.target.value})} maxLength={500}/>)}
          </div><p className="text-sm text-slate-600">Redação avulsa não publica para aluno por associação automática de nome. Escolha o aluno cadastrado para disponibilizar no Portal.</p>
        </section>
        <section className={box}><h2 className="font-bold">2. Enviar e revisar texto</h2>
          <label className="block font-semibold">Enviar redação<input className={`${field} mt-2`} type="file" accept="image/*,.heic,.heif,.pdf,.docx,.txt" onChange={e=>importar(e)}/></label><p className="text-sm text-slate-600">Imagem até 7 MB; PDF, DOCX e TXT até 15 MB. Até 10 páginas escaneadas. Fotografe sem sombras e com a folha inteira. Confira a transcrição sem corrigir os erros do aluno.</p>
          {form.fonte && <p>Fonte: {form.fonte.nome}</p>}
          {imagem && <button onClick={()=>setZoom(true)} type="button" className="block text-left"><img src={imagem} alt="Fonte original da redação; ampliar para conferir" className="max-h-72 max-w-full object-contain border rounded-xl"/><span className="underline">Ampliar original</span></button>}
          {label('Texto original / transcrição',<textarea className={field} rows={12} value={form.texto} spellCheck={false} lang="pt-BR" maxLength={25000} onChange={e=>mudar({texto:e.target.value})}/>)}
          <p className="text-sm">{form.texto.length}/25.000 caracteres. A IA pode errar na transcrição e na avaliação; revise antes de disponibilizar.</p>
          <details><summary className="cursor-pointer font-semibold">Textos motivadores (opcional)</summary><label className="block mt-3">Enviar motivador<input type="file" className={field} accept="image/*,.heic,.pdf,.docx,.txt" onChange={e=>importar(e,true)}/></label>{label('Texto motivador',<textarea className={field} rows={5} value={form.motivador} onChange={e=>mudar({motivador:e.target.value})} maxLength={25000}/>)}</details>
          <button className="btn-brand-navy rounded-xl px-4 py-2" type="button" onClick={()=>setEtapa('review')}>Conferi o texto</button>
        </section>
        {etapa==='review' && <section className={box}><h2 className="font-bold">3. Configurar avaliação</h2><p>Critérios pedagógicos internos v2, sujeitos à revisão docente. Completa: cinco competências e total /1000. Seleção parcial: apenas competências escolhidas, sem nota total comparável.</p>
          <div className="flex flex-wrap gap-4">{COMPETENCIAS.map(c=><label key={c}><input type="checkbox" checked={form.competencias.includes(c)} onChange={e=>mudar({competencias:e.target.checked?[...form.competencias,c].sort():form.competencias.filter(x=>x!==c)})}/> {c.toUpperCase()}</label>)}</div>
          {label('Profundidade do feedback',<select className={field} value={form.depth} onChange={e=>mudar({depth:e.target.value})}><option value="basic">Básico — justificativa e dicas</option><option value="analyzed">Analítico — exemplos e checklist</option><option value="deep">Profundo — análise e reescrita</option></select>)}
          <p className="text-sm">IA conectada: {getClientAIHeaders()['x-user-ai-provider'] || 'nenhuma'} · {getClientAIHeaders()['x-user-ai-model'] || 'modelo padrão'}. <Link className="underline" href="/">Conectar IA no Hub</Link></p>
          <div className="flex flex-wrap gap-3"><button type="button" className="btn-brand-primary rounded-xl px-4 py-3" onClick={()=>corrigir(true)}>Corrigir com IA</button><button type="button" className="btn-brand-navy rounded-xl px-4 py-3" onClick={()=>setManual(true)}>Corrigir manualmente</button></div>
          {manual && <div className="space-y-3"><h3 className="font-semibold">Correção manual — não usa chave de IA</h3><div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{form.competencias.map(c=>label(`Nota ${c.toUpperCase()}`,<select key={c} className={field} value={notas[c]??''} onChange={e=>{setNotas(n=>({...n,[c]:e.target.value}));setDirty(true);}}><option value="">Selecionar</option>{[0,40,80,120,160,200].map(n=><option key={n} value={n}>{n}</option>)}</select>))}</div>{label('Devolutiva e justificativas por competência',<textarea rows={7} className={field} value={comentario} onChange={e=>{setComentario(e.target.value);setDirty(true);}}/>)}<button type="button" className="btn-brand-primary rounded-xl px-4 py-3" onClick={()=>corrigir(false)}>Salvar correção manual</button></div>}
        </section>}
        {etapa!=='review' && <p className="text-sm">Após conferir o texto, escolha Corrigir com IA ou Corrigir manualmente.</p>}
      </fieldset>}
      {etapa==='result' && registro && <div className="space-y-5"><section className={box}><h2 className="font-bold">4. Revisar resultado</h2><p role="status">{salvo?'Salvo no histórico. Revise antes da publicação.':'Resultado preservado neste dispositivo; salvamento pendente.'}</p>{!salvo && <button disabled={!!busy} className="btn-brand-primary rounded-xl px-4 py-3" onClick={()=>salvar()}>Tentar salvar novamente</button>}<p className="font-bold text-xl">{registro.totalScore===null?'Avaliação parcial — sem total':`${registro.totalScore} / 1000`}</p><div className="flex flex-wrap gap-4">{registro.scoreData.map(c=><span key={c.subject}>{c.subject}: {c.A}/200</span>)}</div>{renderFeedbackText(registro.result)}<button className="btn-brand-ghost rounded-xl px-4 py-2" onClick={()=>generatePDF(registro.result,registro.studentName,registro.studentClass,registro.essayTheme,registro.scoreData,registro)}>Exportar relatório PDF</button></section>{salvo && <RevisaoRedacao key={`${registro.id}:${registro.revision}`} redacao={registro} professorUid={user.uid} onDirtyChange={setRevisaoDirty} onSaved={r=>{setRegistro(r);setDirty(false);}}/>}</div>}
      {dirty && <p className="text-xs text-slate-500">Rascunho privado desta conta salvo neste dispositivo. A imagem original não é armazenada no rascunho; reenvie se recarregar.</p>}
    </div>
    {zoom && <div role="dialog" aria-modal="true" aria-label="Original ampliado" className="fixed inset-0 z-50 bg-white p-4 overflow-auto"><button className="btn-brand-navy rounded-xl p-3 mb-3" onClick={()=>setZoom(false)}>Fechar original</button><img src={imagem} alt="Redação original ampliada" className="max-w-none w-auto"/></div>}
  </main>;
}
