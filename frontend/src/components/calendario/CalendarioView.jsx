'use client';
import {useState} from 'react';
import {format,startOfMonth,endOfMonth,startOfWeek,endOfWeek,eachDayOfInterval,addMonths,addWeeks,parseISO,isToday} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {CardAula} from './CardAula';
export function CalendarioView({aulas=[],dataAtual,setDataAtual,feriados=[],dataInicio,dataFim,onDropTopico,onOpenDetalhes}){
 const [modo,setModo]=useState('semana');
 const primeiro=modo==='semana'?startOfWeek(dataAtual,{weekStartsOn:1}):startOfMonth(dataAtual);
 const ultimo=modo==='semana'?endOfWeek(dataAtual,{weekStartsOn:1}):endOfMonth(dataAtual);
 const dias=eachDayOfInterval({start:primeiro,end:ultimo});
 const mapa=new Map();aulas.forEach(a=>{const arr=mapa.get(a.dataAgendada)||[];arr.push(a);mapa.set(a.dataAgendada,arr);});
 const limitar=d=>{const s=format(d,'yyyy-MM-dd');return dataInicio&&s<dataInicio?parseISO(dataInicio):dataFim&&s>dataFim?parseISO(dataFim):d;};
 const navegar=n=>setDataAtual(limitar(modo==='semana'?addWeeks(dataAtual,n):addMonths(dataAtual,n)));
 const card=a=><CardAula key={a.id} aula={a} onDropTopico={onDropTopico} onOpenDetalhes={onOpenDetalhes}/>;
 return <section className="rounded-2xl border border-[#dce0f0] bg-white overflow-hidden">
   <header className="p-4 border-b flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold capitalize">{format(dataAtual,'MMMM yyyy',{locale:ptBR})}</h2><p className="text-xs text-[#6070a0]">{format(primeiro,'dd/MM')} a {format(ultimo,'dd/MM')}</p></div><div className="flex flex-wrap items-center gap-2">{[['lista','Lista'],['semana','Semana'],['mes','Mês']].map(([id,label])=><button key={id} aria-pressed={modo===id} onClick={()=>setModo(id)} className={`rounded-lg border px-3 py-2 text-sm ${modo===id?'bg-[#101942] text-white':''}`}>{label}</button>)}<button aria-label="Período anterior" className="p-2 border rounded-lg" onClick={()=>navegar(-1)}>←</button><button className="p-2 border rounded-lg text-sm" onClick={()=>setDataAtual(limitar(new Date()))}>Hoje</button><button aria-label="Próximo período" className="p-2 border rounded-lg" onClick={()=>navegar(1)}>→</button></div></header>
   <div className={modo==='lista'?'p-3 space-y-4':'p-3 space-y-4 lg:hidden'}>
    {[...mapa].filter(([data])=>data>=format(primeiro,'yyyy-MM-dd')&&data<=format(ultimo,'yyyy-MM-dd')).sort(([a],[b])=>a.localeCompare(b)).map(([data,items])=><section key={data} className="space-y-2"><h3 className="font-bold capitalize">{format(parseISO(data),"EEEE, dd/MM",{locale:ptBR})}{feriados.some(f=>f.data===data)?` · ${feriados.find(f=>f.data===data).nome}`:''}</h3>{items.sort((a,b)=>a.horarioInicio.localeCompare(b.horarioInicio)).map(card)}</section>)}
    {!aulas.some(a=>a.dataAgendada>=format(primeiro,'yyyy-MM-dd')&&a.dataAgendada<=format(ultimo,'yyyy-MM-dd'))&&<p className="text-sm text-[#6070a0] p-4">Nenhuma aula neste período. Confira as datas selecionadas e a grade em Configurações.</p>}
   </div>
   {modo!=='lista'&&<div className="hidden lg:grid grid-cols-7 divide-x border-t">
    {modo==='mes'&&Array.from({length:(primeiro.getDay()+6)%7},(_,i)=><div key={`v${i}`} className="bg-[#f7f8fc]"/>)}
    {dias.map(d=>{const data=format(d,'yyyy-MM-dd');return <section key={data} className={`p-2 border-b min-h-32 space-y-2 ${isToday(d)?'bg-[#fff2f6]/50':''}`}><h3 className="font-bold text-xs capitalize">{format(d,'EEE dd/MM',{locale:ptBR})}</h3>{feriados.filter(f=>f.data===data).map(f=><p key={f.nome} className="text-xs text-red-700">{f.nome}</p>)}{(mapa.get(data)||[]).map(card)}</section>;})}
   </div>}
 </section>;
}
