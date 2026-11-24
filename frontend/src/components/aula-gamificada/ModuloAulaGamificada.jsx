import React from 'react';
import Link from 'next/link';
export function ModuloAulaGamificada({ aluno = false }) {
  const areas = [
    { nome:'Revisão interativa', icone:'🎯', destino:aluno ? '/aluno/revisao' : '/revisao', texto:aluno ? 'Entre no aulão, acompanhe o conteúdo e responda aos desafios.' : 'Prepare conteúdo por tema, apresente e revele respostas com a turma.', cor:'border-[#00DDEB]' },
    { nome:'Sala de jogos', icone:'🎮', destino:aluno ? '/aluno/aula-gamificada/salas' : '/aula-gamificada/salas', texto:aluno ? 'Participe com o código da sala do professor.' : 'Escolha o jogo, prepare questões e acompanhe a participação ao vivo.', cor:'border-[#FF2C9C]' },
    { nome:'Revisar sozinho', icone:'🚀', destino:aluno ? '/aluno/revisar' : '/aula-gamificada/revisao-autonoma', texto:aluno ? 'Escolha o conteúdo e o jogo. Pratique no seu ritmo e acompanhe seu histórico.' : 'Libere questões revisadas para os alunos treinarem em casa.', cor:'border-[#FFE500]' },
  ];
  return <main className="arte-pagina min-h-screen px-4 py-7 text-[#25104A] sm:p-8"><div className="mx-auto max-w-6xl space-y-7">
    <Link className="inline-block rounded-full border-2 border-[#B9A6EF] px-5 py-3 font-bold" href={aluno ? '/aluno/notas' : '/'}>← {aluno ? 'Portal do Aluno' : 'Hub'}</Link>
    <header className="arte-banner-festival rounded-3xl p-6 text-white sm:p-10"><span className="arte-selo">TODAS AS DISCIPLINAS</span><h1 className="mt-4 text-4xl font-black sm:text-6xl">Aula Gamificada</h1><p className="mt-4 max-w-3xl text-lg">Aprenda, jogue e revise. Escolha a experiência para continuar.</p></header>
    <div className="grid gap-5 md:grid-cols-3">{areas.map(a => <Link href={a.destino} key={a.nome} className={`group rounded-3xl border-t-8 ${a.cor} bg-white p-6 shadow-md ring-1 ring-[#E2D9F7] transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-4 focus-visible:outline-[#6315D9]`}><span className="text-5xl" aria-hidden="true">{a.icone}</span><h2 className="mt-5 text-2xl font-black">{a.nome}</h2><p className="mt-3 text-[#5B4B86]">{a.texto}</p><span className="mt-6 inline-block rounded-xl bg-[#6315D9] px-5 py-3 font-black text-white">Abrir →</span></Link>)}</div>
  </div></main>;
}
