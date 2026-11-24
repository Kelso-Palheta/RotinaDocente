'use client';
import React from 'react';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';
import { RenderTextoSeguro } from '@/components/aula-gamificada/RenderTextoSeguro';
import { obterModalidadeInfo } from '@/components/aula-gamificada/constantes';
export function JogoAutonomo({ sessao, ocupado, pendente, onResponder, onAvancar, onSair, onRecarregar }) {
  const q = sessao.estadoJogo.rodada?.questao || sessao.questao;
  const gabarito = sessao.feedback?.respostaCorreta;
  const pares = sessao.estadoJogo.rodada?.paresCorretos || [];
  return <section aria-label="Treino individual" className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#25104A] p-4 text-white"><div><strong>{obterModalidadeInfo(sessao.modalidade).nome} · treino individual</strong><p className="mt-1 text-sm">No seu ritmo, sem sala nem professor conectado. Seu resultado fica no histórico.</p>{['equipes','tabuleiro'].includes(sessao.modalidade) && <p className="mt-1 text-sm text-[#FFE500]">Versão de treino: avance sua própria meta. Não há outros jogadores nesta partida.</p>}</div><button type="button" disabled={ocupado || pendente} onClick={onSair} className="rounded-xl border px-4 py-3 font-bold">Sair e continuar depois</button></header>
    <SalaAlunoView key={`${sessao.id}:${sessao.indice}`} estado={sessao.estadoJogo} ocupado={ocupado || pendente} onResponder={onResponder} onReconectar={onRecarregar} />
    {sessao.fase === 'feedback' && <section aria-label="Gabarito do desafio" className="rounded-2xl border-2 border-[#00DDEB] bg-white p-5 text-[#25104A]"><h2 className="mb-3 text-xl font-black">Resposta correta</h2>
      {q?.tipo === 'multipla_escolha' && <RenderTextoSeguro texto={q.alternativas?.find(a => a.id===gabarito)?.texto || 'Consulte a explicação do desafio.'} />}
      {q?.tipo === 'ordenacao' && <ol className="list-inside list-decimal space-y-2">{(Array.isArray(gabarito) ? gabarito : []).map(id => <li key={id}>{q.itens?.find(i=>i.id===id)?.texto}</li>)}</ol>}
      {q?.tipo === 'pares' && <ul className="space-y-2">{pares.map((p,i) => <li key={i} className="flex flex-wrap gap-2"><RenderTextoSeguro texto={p.esquerda?.texto || ''} /><span aria-hidden="true">→</span><RenderTextoSeguro texto={p.direita?.texto || ''} /></li>)}</ul>}
    </section>}
    {sessao.fase === 'feedback' && <button type="button" disabled={ocupado || pendente} onClick={onAvancar} className="min-h-12 w-full rounded-2xl bg-[#6315D9] p-4 font-black text-white disabled:opacity-40">Li a explicação · {sessao.indice+1 === sessao.total ? 'Concluir treino' : 'Próximo desafio →'}</button>}
  </section>;
}
