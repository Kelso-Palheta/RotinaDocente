'use client';
import { useState } from 'react';
import { resolverLoginsAlunos,resolverLoginUnico,gerarLoginKey } from '@/utils/diario/loginAluno';
import { doc,getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { associarContextoRedacao } from '@/lib/redacao/repositorio';

export default function AssociarContextoRedacao({redacao,turmas,professorUid,onSaved}) {
  const [turmaId,setTurmaId]=useState(redacao.turmaId || '');const [alunoId,setAlunoId]=useState(redacao.alunoId || '');
  const [ano,setAno]=useState(redacao.anoLetivo || '');const [bimestre,setBimestre]=useState(String(redacao.bimestre || ''));
  const [backup,setBackup]=useState(false);const [confirmar,setConfirmar]=useState(false);const [busy,setBusy]=useState(false);const [erro,setErro]=useState('');
  const turma=turmas.find(t=>t.id===turmaId);const aluno=turma?.alunos?.find(a=>a.id===alunoId);
  const baixar=()=>{
    const blob=new Blob([JSON.stringify({professorUid,exportadoEm:new Date().toISOString(),redacao},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`backup-redacao-${redacao.id}.json`;a.click();URL.revokeObjectURL(url);setBackup(true);
  };
  const salvar=async()=>{
    setBusy(true);setErro('');
    try{
      if(!backup || !confirmar || !aluno || !turma)throw new Error('Baixe a cópia e confira a associação antes de confirmar.');
      const candidato=resolverLoginsAlunos(turma.alunos || []).find(r=>r.aluno.id===alunoId);
      if(!candidato?.login)throw new Error('Este aluno precisa de data de nascimento válida no Diário para gerar o acesso.');
      const resolvido=await resolverLoginUnico(aluno.nome,aluno.dataNascimento,async login=>{const snap=await getDoc(doc(db,'alunoLogin',await gerarLoginKey(login)));return snap.exists()?snap.data():null;},{homonimo:candidato.homonimo});
      if(resolvido.conflito || !resolvido.login)throw new Error('Conflito de login: confira a identidade e o acesso deste aluno no Diário antes de associar.');
      const login=resolvido.login;
      const r=await associarContextoRedacao(professorUid,redacao.id,{alunoId,turmaId,anoLetivo:Number(ano),bimestre:Number(bimestre),studentName:aluno.nome,studentClass:turma.nome,loginAluno:login,loginKey:await gerarLoginKey(login)},redacao.revision);
      onSaved?.(r);
    }catch(e){setErro(e.message);}finally{setBusy(false);}
  };
  return <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Conferir ou associar contexto desta redação</summary><p className="my-3 text-sm">A associação altera somente esta redação e exige nova revisão antes de publicar. Não move nem apaga registros; nenhum nome é associado automaticamente.</p>
    <fieldset disabled={busy} className="space-y-3"><legend className="sr-only">Associação de contexto</legend><button onClick={baixar} type="button" className="rounded-lg border p-2">1. Baixar cópia original</button>
      <div className="flex flex-wrap gap-3"><label>Turma de destino<select aria-label="Turma de destino" value={turmaId} onChange={e=>{setTurmaId(e.target.value);setAlunoId('');setConfirmar(false);const t=turmas.find(t=>t.id===e.target.value);if(t?.anoLetivo)setAno(t.anoLetivo);}} className="ml-2 rounded-lg border p-2"><option value="">Selecione</option>{turmas.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.anoLetivo || 'Ano não informado'}</option>)}</select></label><label>Aluno de destino<select aria-label="Aluno de destino" value={alunoId} onChange={e=>{setAlunoId(e.target.value);setConfirmar(false);}} className="ml-2 max-w-64 rounded-lg border p-2"><option value="">Selecione</option>{(turma?.alunos || []).map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select></label><label>Ano letivo confirmado<input aria-label="Ano letivo confirmado" type="number" min={2000} max={2200} value={ano} onChange={e=>{setAno(e.target.value);setConfirmar(false);}} className="ml-2 w-24 rounded-lg border p-2"/></label><label>Bimestre confirmado<select aria-label="Bimestre confirmado" value={bimestre} onChange={e=>{setBimestre(e.target.value);setConfirmar(false);}} className="ml-2 rounded-lg border p-2"><option value="">Selecione</option>{[1,2,3,4].map(b=><option key={b} value={b}>{b}º</option>)}</select></label></div>
      {aluno&&<p className="rounded-lg bg-blue-50 p-3 text-sm">Prévia: {redacao.studentName} ({redacao.studentClass || 'sem turma'}, {redacao.anoLetivo || 'sem ano'}) → {aluno.nome}, turma {turma.nome}, ano {ano || '?'}, {bimestre || '?'}º bimestre. ID preservado: {redacao.id}.</p>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirmar} disabled={!backup || !aluno || !ano || !bimestre} onChange={e=>setConfirmar(e.target.checked)}/>Conferi a prévia e guardei a cópia original.</label>
      <button disabled={!confirmar || !backup} onClick={salvar} type="button" className="rounded-lg bg-[#101942] px-3 py-2 text-white">{busy?'Salvando associação…':'Confirmar associação'}</button>
    </fieldset>{erro&&<p role="alert" className="mt-3 text-red-700">{erro}</p>}
  </details>;
}
