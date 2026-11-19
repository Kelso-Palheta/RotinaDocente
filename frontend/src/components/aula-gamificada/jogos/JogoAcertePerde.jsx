'use client';

import React, { useRef, useState } from 'react';
import { gerarRequestId } from '../api';
import { JogoQuiz } from './JogoQuiz';

export function JogoAcertePerde({ questao, recibo, ocupado, bloqueado, onEnviar }) {
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const requestId = useRef(null);
  const confirmado = recibo?.status === 'confirmado' || enviado;
  const enviar = async () => {
    if (!texto.trim() || bloqueado || ocupado || enviando || confirmado) return;
    requestId.current ||= gerarRequestId('aberta');
    setEnviando(true); setErro(null);
    try { await onEnviar({ texto: texto.trim() }, requestId.current); setEnviado(true); }
    catch (e) { setErro(e.message || 'Não foi possível enviar. Seu texto foi preservado.'); }
    finally { setEnviando(false); }
  };
  if (questao?.tipo !== 'resposta_aberta') return <JogoQuiz questao={questao} recibo={recibo} ocupado={ocupado} bloqueado={bloqueado} onEnviar={onEnviar} />;
  return <div className="space-y-3">
    <label htmlFor="resposta-acerte" className="block font-black text-[#25104A]">Sua resposta</label>
    <textarea id="resposta-acerte" value={recibo?.resposta?.texto ?? texto} maxLength={2000} rows={5} disabled={bloqueado || ocupado || enviando || confirmado} onChange={e => { setTexto(e.target.value); requestId.current = null; }} className="w-full rounded-2xl border-2 border-[#B9A6EF] bg-white p-4 text-[#25104A] disabled:bg-[#F3EDFF]" />
    <p className="text-xs text-[#5B4B86]">Até 2000 caracteres. O professor corrigirá sua explicação após encerrar a questão.</p>
    {erro && <p role="alert" className="text-red-800 font-bold">{erro}</p>}
    {confirmado ? <p role="status" className="rounded-xl bg-cyan-50 p-4 text-cyan-950 font-bold">Resposta recebida. Aguarde a correção do professor.</p> : <button type="button" onClick={enviar} disabled={bloqueado || ocupado || enviando || !texto.trim()} className="min-h-12 w-full rounded-2xl bg-[#6315D9] p-3 text-white font-black disabled:opacity-40">{enviando ? 'Enviando...' : 'Enviar resposta'}</button>}
  </div>;
}

export function PalcoAcertePerde({ rodada, totalRodadas, desafioFinal, semCronometro }) {
  const especial = desafioFinal && rodada === totalRodadas;
  return <section aria-label="Acerte ou Perde" className="rounded-3xl border-4 border-[#FF2C9C] bg-gradient-to-br from-[#25104A] to-[#6315D9] p-5 sm:p-7 text-white shadow-xl">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black tracking-[.2em] text-[#00DDEB]">DESAFIO DE CONHECIMENTO</p><h2 className="font-black text-3xl sm:text-5xl mt-2">Acerte <span className="text-[#FFE500]">ou</span> Perde!</h2></div><span aria-hidden="true" className="text-5xl sm:text-7xl">🚨</span></div>
    <p className="mt-4 inline-block rounded-full bg-[#FFE500] px-4 py-2 text-sm font-black text-[#25104A]">{especial ? 'Desafio especial: 10000 pontos!' : '1000 pontos por acerto · erro não desconta'}</p>
    {semCronometro && <p className="mt-3 text-cyan-100 text-sm">Sem cronômetro. O professor encerra a questão.</p>}
  </section>;
}
