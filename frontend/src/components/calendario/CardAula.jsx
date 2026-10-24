'use client';
import {conteudos} from '@/dominio/calendario/evolucao';
const rotulos={AGENDADA:'Agendada',CONCLUIDA:'Concluída',PARCIAL:'Parcial',NAO_REALIZADA:'Não realizada'};
const cores={CONCLUIDA:'border-green-200 bg-green-50',PARCIAL:'border-amber-200 bg-amber-50',NAO_REALIZADA:'border-red-200 bg-red-50',AGENDADA:'border-[#dce0f0] bg-white'};
export function CardAula({aula,onDropTopico,onOpenDetalhes}){
 return <article className={`rounded-xl border p-3 space-y-2 shadow-sm ${cores[aula.status]||cores.AGENDADA}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();try{const t=JSON.parse(e.dataTransfer.getData('application/json'));onDropTopico?.(aula.id,t);}catch{ /* Conteúdo externo não é um tópico válido. */ }}}>
   <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-bold">{aula.horarioInicio}–{aula.horarioFim}</span><span>{rotulos[aula.status]||'Agendada'}</span></div>
   {conteudos(aula).length?conteudos(aula).map((t,i)=><button key={i} className="block w-full text-left text-sm font-semibold text-[#101942]" onClick={()=>onOpenDetalhes?.(aula)}>{t.topicoTitulo||t.titulo}{t.continuacao?' · continuação':''}</button>):<p className="text-xs text-[#6070a0]">{aula.bloqueioAutomatico?aula.motivoCancelamento:'Sem conteúdo vinculado'}</p>}
   {aula.conteudoEncaminhado&&<p className="text-xs text-[#6070a0]">Conteúdo mostrado como registro histórico.</p>}
   <button className="text-xs font-bold text-blue-700 underline py-1" onClick={()=>onOpenDetalhes?.(aula)}>Ver aula / registrar realização</button>
 </article>;
}
