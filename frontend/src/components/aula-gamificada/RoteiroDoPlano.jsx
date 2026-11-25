import React from 'react';
export function RoteiroDoPlano({ plano, questaoId, fase }) {
  if (!plano) return null;
  const etapas=plano.etapas||[];
  const atual=fase==='espera'?etapas.find(e=>e.tipo==='introducao'):fase==='encerrada'?etapas.find(e=>e.tipo==='fechamento'):etapas.find(e=>e.questaoIds?.includes(questaoId));
  return <details className="rounded-2xl border-2 border-[#00CAD5] bg-[#FFFDF7] p-4 text-[#25104A]">
    <summary className="cursor-pointer font-black">Plano: {plano.titulo} · versão {plano.revision}{atual&&<span className="ml-3 rounded-full bg-[#FFE500] px-3 py-1 text-sm">{atual.titulo}</span>}</summary>
    <p className="mt-3 font-bold">Objetivo: {plano.objetivo}</p>
    <ol className="mt-3 space-y-2">{etapas.map(e=><li key={e.id} aria-current={e===atual?'step':undefined} className={`rounded-xl border p-3 ${e===atual?'border-[#6315D9] bg-[#F3EDFF]':'border-[#E2D9F7]'}`}><strong>{e.titulo} · {e.minutos!=null?`${e.minutos} min`:e.prazo}</strong><p className="mt-1 text-sm">{e.orientacao}</p>{e.questaoIds?.length>0&&<p className="mt-1 text-xs">{e.questaoIds.length} desafios previstos</p>}</li>)}</ol>
    <p className="mt-3 text-xs">Cópia do planejamento usado para criar esta sala. Tempos são uma previsão; os comandos da partida e as notas mantêm suas configurações.</p>
  </details>;
}
