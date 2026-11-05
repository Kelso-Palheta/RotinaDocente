'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { IntegracaoPreparacao } from './IntegracaoPreparacao';
import { useSalaRevisao } from './useSalaRevisao';
import { PainelProfessor } from './PainelProfessor';
import { TelaProjecao } from './TelaProjecao';

function SalaDocente({ codigo, uid, obterToken, projecao }) {
  const [tentativa, setTentativa] = useState(0);
  return <SalaDocenteConectada key={tentativa} codigo={codigo} uid={uid} obterToken={obterToken} projecao={projecao} onReconectar={() => setTentativa(n => n + 1)} />;
}
function SalaDocenteConectada({ codigo, uid, obterToken, projecao, onReconectar }) {
  const { estado, ocupado, erro, acao } = useSalaRevisao({ codigo, contexto: uid, papel: projecao ? 'projecao' : 'professor', obterToken });
  return <main className="min-h-screen bg-[#25104A] text-white">
    <nav className="flex flex-wrap items-center gap-3 border-b border-[#8b5cf6]/50 px-4 py-3 text-sm">
      <Link href="/revisao" className="rounded-lg border border-[#a78bfa] px-3 py-2">← Minhas salas</Link>
      {!projecao && <Link href={`/revisao/projecao/${encodeURIComponent(codigo)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#7c3aed] px-3 py-2 font-bold">Abrir projeção ↗</Link>}
      {!projecao && <Link href="/aluno/revisao" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#a78bfa] px-3 py-2">Acesso dos alunos ↗</Link>}
      {!projecao && estado?.fase === 'espera' && <Link href={`/revisao?editar=${encodeURIComponent(codigo)}`} className="rounded-lg border border-[#B9A6EF] bg-[#F3EDFF] hover:bg-[#E7DBFD] px-3 py-2 text-[#25104A] font-bold transition">Editar sala ✎</Link>}
      <span>Código: <strong className="font-mono text-yellow-200">{codigo}</strong></span>
      {erro && <button type="button" onClick={onReconectar} className="rounded-lg border border-amber-400 px-3 py-2">Reconectar sala</button>}
    </nav>
    {!estado ? <div className="p-8 space-y-3"><p role={erro ? 'alert' : 'status'}>{erro || 'Conectando à sala…'}</p><p className="text-sm text-[#ddd6fe]">Mantenha esta aba aberta durante o aulão.</p></div>
      : projecao ? <><div aria-live="polite" className="px-4">{erro && <p role="alert">{erro}</p>}</div><TelaProjecao estado={estado} /></>
        : <PainelProfessor estado={estado} ocupado={ocupado} erro={erro} onAcao={acao} />}
  </main>;
}

export function IntegracaoDocente({ codigo, projecao = false }) {
  const { user, loading } = useAuth();
  const uid = user?.uid;
  const obterToken = useCallback(async () => {
    const atual = auth?.currentUser;
    if (!uid || !atual || atual.uid !== uid) throw new Error('Sua conta mudou. Faça login novamente para continuar.');
    return atual.getIdToken();
  }, [uid]);
  if (loading) return <main className="min-h-screen bg-[#FFFDF7] p-8 text-[#25104A]"><p role="status">Verificando seu acesso…</p></main>;
  if (!user || user.isDjango || !auth?.currentUser || auth.currentUser.uid !== uid) return <main className="min-h-screen bg-[#FFFDF7] p-8 text-[#25104A] space-y-4"><h1 className="text-2xl font-bold">Revisão ao Vivo</h1><p>Faça login de professor com sua conta Firebase para continuar.</p><Link href="/" className="inline-block rounded-xl bg-[#5411B8] px-4 py-2 text-white">Voltar para entrar</Link></main>;
  return codigo ? <SalaDocente key={`${uid}:${codigo}:${projecao}`} codigo={codigo} uid={uid} obterToken={obterToken} projecao={projecao} /> : <IntegracaoPreparacao key={uid} obterToken={obterToken} />;
}
