import React from 'react';
import Link from 'next/link';

/** Entrada independente: não altera a ordem nem os direitos dos nove módulos. */
export function AcessoRevisao({ aluno = false }) {
  return <Link href={aluno ? '/aluno/revisao' : '/revisao'} className="group mb-6 flex flex-wrap items-center justify-between gap-3 arte-banner-festival rounded-2xl border border-[#5411B8] px-5 py-5 text-white shadow-lg transition hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8b5cf6]">
    <div><span className="arte-selo">Arte · ENEM · Aulão interativo</span><span className="mt-2 block text-xl font-black">Revisão ao Vivo</span><span className="mt-1 block text-sm text-[#ede9fe]">{aluno ? 'Entre com o código do professor e participe da revisão.' : 'Prepare questões, abra sua sala e projete a participação dos alunos.'}</span></div>
    <span className="rounded-xl bg-[#00DDEB] px-4 py-2 font-extrabold text-[#25104A] group-hover:bg-[#FFE500]">{aluno ? 'Entrar na sala' : 'Preparar aulão'} →</span>
  </Link>;
}
