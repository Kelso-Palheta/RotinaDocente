import React from 'react';
import Link from 'next/link';

/** Entrada independente: não altera a ordem nem os direitos dos nove módulos. */
export function AcessoRevisao({ aluno = false }) {
  return <Link href={aluno ? '/aluno/revisao' : '/revisao'} className="group mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#8b5cf6] bg-gradient-to-br from-[#44218B] to-[#6C2179] px-5 py-5 text-white shadow-lg transition hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8b5cf6]">
    <div><span className="block text-xs font-bold uppercase tracking-wider text-[#FFE14D]">Arte · ENEM · Aulão interativo</span><span className="mt-1 block text-xl font-black">Revisão ao Vivo</span><span className="mt-1 block text-sm text-[#ede9fe]">{aluno ? 'Entre com o código do professor e participe da revisão.' : 'Prepare questões, abra sua sala e projete a participação dos alunos.'}</span></div>
    <span className="rounded-xl bg-white/15 px-4 py-2 font-bold group-hover:bg-white/25">{aluno ? 'Entrar na sala' : 'Preparar aulão'} →</span>
  </Link>;
}
