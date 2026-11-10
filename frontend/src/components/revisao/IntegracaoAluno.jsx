'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSalaRevisao } from './useSalaRevisao';
import { PainelAluno } from './PainelAluno';

function SalaAluno({ codigo, contexto, onSair }) {
  const [tentativa, setTentativa] = useState(0);
  return <SalaAlunoConectada key={tentativa} codigo={codigo} contexto={contexto} onSair={onSair} onReconectar={() => setTentativa(n => n + 1)} />;
}
function SalaAlunoConectada({ codigo, contexto, onSair, onReconectar }) {
  const { estado, envio, ocupado, erro, responder, tentarNovamente } = useSalaRevisao({ codigo, contexto, papel: 'aluno' });
  return <main className="min-h-screen bg-[#FFFDF7] text-[#25104A]">
    <nav className="arte-barra-roxa flex flex-wrap items-center gap-3 px-4 py-3 text-sm"><button type="button" className="rounded-lg border border-[#a78bfa] px-3 py-2" onClick={onSair}>← Trocar sala</button><span>Sala <strong className="font-mono text-yellow-200">{codigo}</strong></span><Link href="/aluno/notas" className="underline">Voltar ao boletim</Link>{erro && <button type="button" className="rounded-lg border border-amber-400 px-3 py-2" onClick={onReconectar}>Reconectar</button>}</nav>
    {!estado ? <p className="p-8" role={erro ? 'alert' : 'status'}>{erro || 'Entrando na sala e recuperando sua participação…'}</p>
      : <PainelAluno estado={estado} envio={envio} ocupado={ocupado} erro={erro} onResponder={responder} onTentarNovamente={tentarNovamente} />}
  </main>;
}

export function IntegracaoAluno() {
  const [sessao, setSessao] = useState(null);
  const [erro, setErro] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [sala, setSala] = useState('');
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    let ativa = true;
    let geracao = 0;
    async function verificar() {
      const numero = ++geracao;
      try {
        const res = await fetch('/api/aluno/sessao', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
        if (res.status === 401) {
          if (ativa && geracao === numero) { setSessao(null); setSala(''); setErro('Faça login no Portal do Aluno para participar.'); }
          return;
        }
        if (!res.ok) throw new Error('Não foi possível validar sua sessão. Tente novamente pelo Portal.');
        const dados = await res.json();
        if (!ativa || geracao !== numero) return;
        if (!dados.authenticated || !dados.aluno?.loginKey) throw new Error('Faça login no Portal do Aluno para participar.');
        setSessao(dados.aluno); setErro(null);
      } catch (e) { if (ativa && geracao === numero) { setSessao(null); setSala(''); setErro(e.message); } }
      finally { if (ativa && geracao === numero) setCarregando(false); }
    }
    verificar();
    window.addEventListener('focus', verificar);
    window.addEventListener('storage', verificar);
    return () => { ativa = false; ++geracao; controller.abort(); window.removeEventListener('focus', verificar); window.removeEventListener('storage', verificar); };
  }, []);

  if (carregando) return <main className="min-h-screen bg-[#25104A] p-8 text-white"><p role="status">Verificando sua sessão do Portal…</p></main>;
  if (sessao && sala) return <SalaAluno key={`${sessao.loginKey}:${sala}`} codigo={sala} contexto={sessao.loginKey} onSair={() => setSala('')} />;
  return <main className="arte-pagina min-h-screen text-white p-4 flex items-center justify-center"><section className="arte-banner-festival arte-cartaz w-full max-w-lg p-6 md:p-8 space-y-5">
    <span className="text-xs uppercase font-bold tracking-widest text-yellow-200">Arte · ENEM · Aulão interativo</span><h1 className="text-3xl font-black">Revisão ao Vivo</h1>
    {erro && <p role="alert" className="rounded-xl border border-amber-400 p-3 text-amber-100">{erro}</p>}
    {sessao ? <><p>Olá, {sessao.nome || 'estudante'}! Digite o código mostrado pelo professor. Sua turma precisa estar convidada para a sala.</p><form className="space-y-4" onSubmit={e => { e.preventDefault(); if (/^[A-Z0-9]{4,12}$/.test(codigo)) setSala(codigo); }}><label className="block font-bold">Código da sala<input className="mt-2 w-full rounded-xl border border-[#a78bfa] bg-[#25104A] p-4 uppercase font-mono text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-300" value={codigo} maxLength={12} autoComplete="off" autoCapitalize="characters" onChange={e => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} required pattern="[A-Z0-9]{4,12}" placeholder="ARTE42" /></label><button type="submit" disabled={!/^[A-Z0-9]{4,12}$/.test(codigo)} className="w-full rounded-xl bg-yellow-300 p-3 font-black text-[#2e1065] disabled:opacity-40">Entrar na revisão</button></form><p className="text-sm text-[#ddd6fe]">Cada resposta só vale após a confirmação do servidor. A revisão não altera suas notas.</p><Link href="/aluno/notas" className="inline-block underline">Voltar ao boletim</Link></>
      : <Link href="/aluno" className="inline-block rounded-xl bg-yellow-300 px-5 py-3 font-bold text-[#2e1065]">Fazer login no Portal</Link>}
  </section></main>;
}
