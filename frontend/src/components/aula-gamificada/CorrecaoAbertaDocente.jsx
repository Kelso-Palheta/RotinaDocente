'use client';

import React, { useEffect, useState } from 'react';
import { obterCorrecoesAbertas } from './api';

export function CorrecaoAbertaDocente({ codigo, revision, obterToken, ocupado, onComando }) {
  const [correcoes, setCorrecoes] = useState([]);
  const [justificativas, setJustificativas] = useState({});
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    obterCorrecoesAbertas({ codigo, obterToken, signal: controller.signal }).then(d => {
      if (!controller.signal.aborted) { setCorrecoes(d.correcoes || []); setErro(null); }
    }).catch(e => { if (!controller.signal.aborted) setErro(e.message); });
    return () => controller.abort();
  }, [codigo, revision, obterToken, tentativa]);
  const corrigir = async (item, correta) => {
    try {
      await onComando('corrigir_aberta', { participanteId: item.participanteId, correta, justificativa: justificativas[item.participanteId]?.trim() });
      setErro(null);
    } catch (e) { setErro(e.message); }
  };
  return <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-4 text-[#25104A]" aria-label="Correção de respostas abertas">
    <h2 className="font-black text-xl">Corrigir respostas abertas</h2>
    <p className="text-sm">Somente este painel mostra os textos. O telão e os colegas não recebem as respostas individuais.</p>
    {erro && <p role="alert">{erro} <button type="button" onClick={() => setTentativa(t => t + 1)} className="underline font-bold">Recarregar respostas</button></p>}
    {!correcoes.length && !erro && <p>Nenhuma resposta recebida nesta rodada.</p>}
    {correcoes.map(item => <article key={item.participanteId} className="rounded-xl bg-white border p-4 space-y-3">
      <h3 className="font-black">{item.nome}</h3><p className="whitespace-pre-wrap break-words">{item.texto}</p>
      {item.correcaoManual && <p className="font-bold">{item.correcaoManual.correta ? 'Correta' : 'Incorreta'} · {item.correcaoManual.justificativa}</p>}
      <label className="block text-sm font-bold">Justificativa para {item.nome}<textarea rows={2} maxLength={2000} value={justificativas[item.participanteId] || ''} onChange={e => setJustificativas(p => ({...p,[item.participanteId]:e.target.value}))} className="block w-full rounded-lg border p-2 mt-1" /></label>
      <div className="flex gap-3"><button type="button" disabled={ocupado || !justificativas[item.participanteId]?.trim()} onClick={() => corrigir(item,true)} className="rounded-xl bg-emerald-700 text-white px-4 py-2 font-bold disabled:opacity-40">Marcar correta</button><button type="button" disabled={ocupado || !justificativas[item.participanteId]?.trim()} onClick={() => corrigir(item,false)} className="rounded-xl bg-red-800 text-white px-4 py-2 font-bold disabled:opacity-40">Marcar incorreta</button></div>
    </article>)}
  </section>;
}
