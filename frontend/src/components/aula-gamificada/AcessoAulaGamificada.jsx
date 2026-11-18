import React from 'react';
import Link from 'next/link';
import { AULA_GAMIFICADA_MODULE } from '@/config/modules';

/**
 * Entrada independente no Hub Docente e no Portal do Aluno, seguindo o mesmo
 * padrão de permissões do Aulão (sem alterar PLATFORM_MODULES nem editar perfis).
 */
export function AcessoAulaGamificada({ aluno = false }) {
  const destino = aluno ? '/aluno/aula-gamificada' : AULA_GAMIFICADA_MODULE.path;
  const descricao = aluno
    ? 'Participe de quizzes, memória, associação, ordenação e desafios em equipe com o código da turma.'
    : AULA_GAMIFICADA_MODULE.descricao;

  return (
    <Link
      href={destino}
      className="group mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#6315D9] bg-[#FFFDF7] px-5 py-5 text-[#25104A] shadow-sm transition hover:border-[#25104A] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6315D9]"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-md bg-[#FFE500] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#25104A]">
            Todas as disciplinas · 5 jogos
          </span>
          <span className="inline-block rounded-md bg-[#E7DBFD] px-2.5 py-0.5 text-[11px] font-bold text-[#25104A]">
            Quiz · Memória · Associação · Ordenação · Equipes
          </span>
        </div>
        <span className="block font-head text-xl font-black text-[#25104A]">
          {AULA_GAMIFICADA_MODULE.nome}
        </span>
        <span className="block text-sm text-[#5B4B86]">
          {descricao}
        </span>
      </div>
      <span className="rounded-xl bg-[#6315D9] px-4 py-2.5 text-sm font-extrabold text-white transition group-hover:bg-[#5411B8]">
        {aluno ? 'Entrar na sala →' : 'Abrir Aula Gamificada →'}
      </span>
    </Link>
  );
}
