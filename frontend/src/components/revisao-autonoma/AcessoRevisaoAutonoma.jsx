import React from 'react';
import Link from 'next/link';
export function AcessoRevisaoAutonoma() {
  return <Link href="/aluno/revisar" className="mb-6 block rounded-3xl border-2 border-[#00DDEB] bg-[#25104A] px-5 py-5 text-white shadow-md"><span className="inline-block rounded-full bg-[#FFE500] px-3 py-1 text-xs font-black text-[#25104A]">JOGUE NO SEU RITMO · SEM SALA</span><strong className="block mt-3 text-2xl">🚀 Revisar sozinho</strong><span className="block mt-2 text-sm text-[#E7DBFD]">Explore fases, supere desafios por disciplina e acompanhe seu histórico. Computador ou celular.</span><span className="inline-block mt-3 rounded-xl bg-[#6315D9] px-4 py-2 font-bold">Começar aventura →</span></Link>;
}
