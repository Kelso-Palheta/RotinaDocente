import React from 'react';
import Link from 'next/link';
export function NavegacaoAulaGamificada({ aluno = false, ativa }) {
  const raiz = aluno ? '/aluno/aula-gamificada' : '/aula-gamificada';
  const abas = [
    ['revisao','Revisão interativa',aluno ? '/aluno/revisao' : '/revisao'],
    ['salas','Sala de jogos',`${raiz}/salas`],
    ['solo','Revisar sozinho',aluno ? '/aluno/revisar' : `${raiz}/revisao-autonoma`],
  ];
  return <nav aria-label="Áreas da Aula Gamificada" className="flex flex-wrap items-center gap-2 border-b-2 border-[#E2D9F7] bg-[#FFFDF7] p-3 text-[#25104A] sm:px-6"><Link href={raiz} className="mr-3 rounded-xl px-3 py-2 font-black">← Aula Gamificada</Link>{abas.map(([id,nome,href]) => <Link key={id} href={href} aria-current={ativa===id ? 'page' : undefined} className={`rounded-full border-2 px-4 py-2 font-bold ${ativa===id ? 'border-[#6315D9] bg-[#6315D9] text-white' : 'border-[#E2D9F7] bg-white'}`}>{nome}</Link>)}</nav>;
}
