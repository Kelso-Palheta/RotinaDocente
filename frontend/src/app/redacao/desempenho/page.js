'use client';

import { useState,useEffect,useRef,useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection,getDocs } from 'firebase/firestore';
import { DiarioRepository } from '@/infraestrutura/diario/DiarioRepository';
import { filtrarRedacoes,resumoRedacoes,normalizarNotasHistorico,dataRedacao } from '@/dominio/redacao/historico';
import { calcularEvolucaoCompetencias } from '@/dominio/redacao/diagnosticoEvolucao';
import { arquivarRedacao } from '@/lib/redacao/repositorio';
import { generatePDF } from '@/lib/redacao/pdf-generator';
import { renderFeedbackText } from '@/lib/redacao/renderFeedback';
import RevisaoRedacao from '@/components/redacao/RevisaoRedacao';
import AssociarContextoRedacao from '@/components/redacao/AssociarContextoRedacao';

const estados={corrigido:'Aguardando revisão',revisado:'Revisado',publicado:'Publicado',arquivado:'Arquivado',rascunho:'Rascunho'};
const dataLegivel=r=>{const d=dataRedacao(r);return d.getTime()>0?d.toLocaleDateString('pt-BR'):'Data não informada';};

export default function DesempenhoPage() {
  const {user,loading:authLoading}=useAuth();const router=useRouter();const uid=user?.uid;
  const [dados,setDados]=useState({uid:null,corrections:[],turmas:[],loading:true,error:''});
  const [filtros,setFiltros]=useState({turmaId:'all',anoLetivo:'all',bimestre:'all',alunoId:'all',search:'',incluirArquivadas:false});
  const [viewing,setViewing]=useState(null);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const seq=useRef(0);
  const carregar=useCallback(async()=>{
    if(!uid)return;const version=++seq.current;
    setDados(prev=>({...prev,uid,loading:true,error:'',...(prev.uid===uid?{}:{corrections:[],turmas:[]})}));
    try {
      const [snap,diario]=await Promise.all([getDocs(collection(db,'professores',uid,'correcoes')),new DiarioRepository(uid).carregar()]);
      const corrections=snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>dataRedacao(b)-dataRedacao(a));
      if(seq.current===version)setDados({uid,corrections,turmas:diario.turmas,loading:false,error:''});
    }catch(e){if(seq.current===version)setDados(prev=>({...prev,loading:false,error:'Não foi possível carregar o histórico. Seus registros foram preservados.'}));}
  },[uid]);
  useEffect(()=>{let ativo=true;const sequencia=seq;Promise.resolve().then(()=>{if(ativo){setViewing(null);setNotice('');carregar();}});return()=>{ativo=false;sequencia.current++;};},[carregar]);
  const ativo=dados.uid===user?.uid;const corrections=ativo?dados.corrections:[];const turmas=ativo?dados.turmas:[];
  const lista=filtrarRedacoes(corrections,filtros);const resumo=resumoRedacoes(lista);
  const alunos=turmas.filter(t=>filtros.turmaId==='all'||t.id===filtros.turmaId).flatMap(t=>(t.alunos || []).map(a=>({...a,turmaNome:t.nome})));
  const anos=[...new Set(corrections.map(r=>r.anoLetivo || 'legado'))].sort().reverse();
  const alterar=(key,value)=>{setViewing(null);setFiltros(prev=>({...prev,[key]:value,...(key==='turmaId'?{alunoId:'all'}:{})}));};
  const salvarLocal=r=>{setDados(prev=>prev.uid!==uid?prev:({...prev,corrections:prev.corrections.map(c=>c.id===r.id?r:c)}));setViewing({...r,_owner:uid});setNotice('Alteração salva.');};
  const arquivar=async r=>{
    if(!window.confirm(`${r.status==='arquivado'?'Restaurar':'Arquivar'} a redação de ${r.studentName}? Notas, atividades e vínculos serão preservados.`))return;
    setBusy(true);setNotice('');try{salvarLocal(await arquivarRedacao(user.uid,r.id,r.status!=='arquivado',r.revision));}catch(e){setNotice(e.message);}finally{setBusy(false);}
  };
  const baixarBackup=()=>{
    const blob=new Blob([JSON.stringify({schemaVersion:1,professorUid:user.uid,exportadoEm:new Date().toISOString(),redacoes:lista},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='backup-redacoes.json';a.click();URL.revokeObjectURL(url);
  };
  const evolucao=calcularEvolucaoCompetencias([...lista].reverse());
  if(authLoading)return <main className="p-6">Carregando sua conta…</main>;
  if(!user)return <main className="p-6"><p>Entre na sua conta para consultar suas correções.</p><button onClick={()=>router.push('/login')}>Entrar</button></main>;
  return <main className="min-h-screen bg-[#f8f9fc] p-4 text-[#101942] sm:p-8"><div className="mx-auto max-w-6xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><button onClick={()=>router.push('/redacao')} className="text-sm underline">Voltar para correção</button><h1 className="mt-2 text-2xl font-bold">Histórico e evolução</h1><p className="text-sm text-slate-600">Revise, disponibilize e acompanhe suas redações por contexto.</p></div><button onClick={()=>router.push('/redacao')} className="rounded-xl bg-[#f60c49] px-4 py-3 font-semibold text-white">Nova correção</button></header>
    <section aria-label="Filtros do histórico" className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
      <label className="text-sm">Turma<select aria-label="Turma" value={filtros.turmaId} onChange={e=>alterar('turmaId',e.target.value)} className="ml-2 rounded-lg border p-2"><option value="all">Todas</option>{turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
      <label className="text-sm">Ano letivo<select aria-label="Ano letivo" value={filtros.anoLetivo} onChange={e=>alterar('anoLetivo',e.target.value)} className="ml-2 rounded-lg border p-2"><option value="all">Todos</option>{anos.map(ano=><option key={ano} value={ano}>{ano==='legado'?'Legado — ano não informado':ano}</option>)}</select></label>
      <label className="text-sm">Bimestre<select aria-label="Bimestre" value={filtros.bimestre} onChange={e=>alterar('bimestre',e.target.value)} className="ml-2 rounded-lg border p-2"><option value="all">Todos</option>{[1,2,3,4].map(b=><option key={b} value={b}>{b}º bimestre</option>)}</select></label>
      <label className="text-sm">Aluno<select aria-label="Aluno" value={filtros.alunoId} onChange={e=>alterar('alunoId',e.target.value)} className="ml-2 max-w-64 rounded-lg border p-2"><option value="all">Todos</option>{alunos.map(a=><option key={`${a.turmaNome}-${a.id}`} value={a.id}>{a.nome} — {a.turmaNome}</option>)}</select></label>
      <label className="text-sm">Buscar<input aria-label="Buscar aluno ou tema" placeholder="Aluno ou tema" value={filtros.search} onChange={e=>alterar('search',e.target.value)} className="ml-2 rounded-lg border p-2"/></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filtros.incluirArquivadas} onChange={e=>alterar('incluirArquivadas',e.target.checked)}/>Incluir arquivadas</label>
    </section>
    {dados.error && <div role="alert" className="rounded-xl bg-red-50 p-4"><p>{dados.error}</p><button onClick={carregar} className="mt-2 underline">Tentar novamente</button></div>}
    {(dados.loading || !ativo)?<p role="status">Carregando histórico…</p>:<>
      <section aria-label="Resumo do recorte" className="flex flex-wrap gap-4 rounded-xl bg-white p-4"><strong>{resumo.total} redações neste recorte</strong><span>{resumo.revisar} para revisar</span><span>{resumo.publicadas} publicadas</span><span>Média completa: {resumo.media ?? 'Sem avaliações completas'}</span></section>
      {notice && <p role="status" className="rounded-lg bg-blue-50 p-3">{notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Registros sem identidade confirmada aparecem como legado; nomes nunca criam associação automática.</p><button onClick={baixarBackup} disabled={!lista.length} className="rounded-lg border bg-white p-2 text-sm">Baixar backup do recorte</button></div>
      {!lista.length && !dados.error && <p className="rounded-xl border bg-white p-6">Nenhuma redação neste recorte. Ajuste os filtros ou inicie uma nova correção.</p>}
      <div className="grid gap-3">{lista.map(r=>{const notas=normalizarNotasHistorico(r);return <article key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"><div><h2 className="font-semibold">{r.studentName || 'Sem identificação'}</h2><p className="text-sm">{r.essayTheme || 'Tema não informado'}</p><p className="mt-1 text-xs text-slate-600">{r.studentClass || 'Turma não informada'} · {r.anoLetivo || 'Ano não informado'} · {r.bimestre || '?'}º bimestre · {dataLegivel(r)}</p><p className="mt-1 text-sm">{estados[r.status] || 'Legado — conferir contexto'} · {notas?`${notas.total}/1000`:r.modo==='parcial'?'Avaliação parcial':'Notas pendentes ou inválidas'}</p>{(!r.alunoId||!r.turmaId) && <p className="text-xs text-amber-800">Legado: identidade/contexto não confirmado.</p>}</div><div className="flex gap-3"><button onClick={()=>setViewing({...r,_owner:uid})} className="rounded-lg border px-3 py-2">Ver e revisar</button><button disabled={busy} onClick={()=>arquivar(r)} className="rounded-lg border px-3 py-2">{r.status==='arquivado'?'Restaurar':'Arquivar'}</button></div></article>;})}</div>
      {viewing && viewing._owner===uid && <section className="space-y-4 rounded-2xl border bg-white p-4" aria-label="Redação selecionada"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold">{viewing.studentName} — {viewing.essayTheme || 'Redação'}</h2><button onClick={()=>setViewing(null)} className="underline">Fechar revisão</button></div><p className="text-sm">Texto original</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm">{viewing.essayText || viewing.originalText || 'Texto original indisponível neste registro legado.'}</pre><AssociarContextoRedacao key={`contexto-${viewing.id}-${viewing.revision || 0}`} professorUid={user.uid} redacao={viewing} turmas={turmas} onSaved={salvarLocal}/><RevisaoRedacao key={`${viewing.id}-${viewing.revision || 0}`} professorUid={user.uid} redacao={viewing} onSaved={salvarLocal}/><button onClick={()=>generatePDF(viewing.result || '',viewing.studentName,viewing.studentClass,viewing.essayTheme,viewing.scoreData,{...viewing,createdAt:dataRedacao(viewing)})} className="rounded-lg border p-2">Exportar relatório PDF</button><details><summary>Histórico de versões ({viewing.historico?.length || 0})</summary>{(viewing.historico || []).map((h,i)=><div className="mt-2 border-t p-2 text-sm" key={i}><p>{h.acao} · {h.autor} · {h.data}</p><details><summary>Ver versão anterior</summary><div>{renderFeedbackText(h.anterior?.result || 'Sem devolutiva anterior.')}</div></details></div>)}</details></section>}
      <section className="rounded-xl border bg-white p-4"><h2 className="font-bold">Evolução por aluno</h2>{filtros.alunoId==='all'?<p className="mt-2 text-sm">Selecione um aluno para comparar redações. A média acima considera o recorte inteiro.</p>:<><p className="mt-2 text-sm">{evolucao.totalRedacoes} avaliações completas válidas · Tendência: {evolucao.tendencia}. Avaliações parciais não entram nesta comparação.</p><div className="mt-3 flex flex-wrap gap-4">{Object.entries(evolucao.medias).map(([c,media])=><span key={c}>{c.toUpperCase()}: {evolucao.totalRedacoes?media:'—'}</span>)}</div>{evolucao.competenciaAlvo&&<p className="mt-2 text-sm">Prioridade de reescrita: {evolucao.competenciaAlvo.toUpperCase()} — confira as justificativas das redações.</p>}</>}</section>
    </>}
  </div></main>;
}
