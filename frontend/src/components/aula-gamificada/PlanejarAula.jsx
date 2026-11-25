'use client';
import React, { useEffect, useRef, useState } from 'react';
import { listarPlanos, obterPlano, salvarPlano, gerarRequestId } from './api';
import { normalizarPlano } from '@/dominio/aula-gamificada/planos';
import { MODALIDADES_PADRAO, questaoCompativelComModalidade, rotuloDificuldade } from './constantes';

const campo = 'mt-1 block w-full rounded-xl border-2 border-[#E2D9F7] bg-white p-3 text-[#25104A]';
const botao = 'min-h-11 rounded-xl border-2 border-[#E2D9F7] bg-white px-4 py-2 font-bold disabled:opacity-45';
function etapasModelo(resgate=false) {
  return resgate ? [
    {id:'abertura',titulo:'Apresentar o problema',tipo:'introducao',minutos:5,orientacao:'Apresente o objetivo e levante hipóteses da turma.'},
    {id:'missao1',titulo:'Investigar a nascente',tipo:'jogo',minutos:10,orientacao:'Reúna pistas e responda ao primeiro conjunto de desafios.'},
    {id:'missao2',titulo:'Conectar as evidências',tipo:'jogo',minutos:10,orientacao:'Compare observações e justifique as escolhas.'},
    {id:'missao3',titulo:'Recuperar o rio',tipo:'jogo',minutos:15,orientacao:'Revise o plano de ação com base no feedback.'},
    {id:'fechamento',titulo:'Conectar jogo e aprendizagem',tipo:'fechamento',minutos:10,orientacao:'Discuta o que mudou nas hipóteses e quais evidências sustentam as conclusões.'},
  ] : [
    {id:'abertura',titulo:'Abertura e contexto',tipo:'introducao',minutos:5,orientacao:'Apresente o objetivo e ative conhecimentos prévios.'},
    {id:'desafio',titulo:'Desafios do jogo',tipo:'jogo',minutos:35,orientacao:'Conduza as rodadas e discuta o feedback.'},
    {id:'fechamento',titulo:'Síntese e devolutiva',tipo:'fechamento',minutos:10,orientacao:'Retome o objetivo e as dificuldades observadas.'},
  ];
}
const novoPlano = () => ({titulo:'',disciplina:'',anoEscolar:'',conteudo:'',objetivo:'',duracaoMinutos:50,modalidade:'quiz',experiencia:'padrao',turmaIds:[],questaoIds:[],etapas:etapasModelo()});

export function PlanejarAula({ turmas=[], questoes=[], modalidadesServidor, obterToken, onUsarPlano }) {
  const [lista,setLista] = useState([]),[plano,setPlano] = useState(novoPlano),[salvo,setSalvo] = useState(null);
  const [carregando,setCarregando] = useState(true),[ocupado,setOcupado] = useState(false),[incerto,setIncerto] = useState(false);
  const [conflito,setConflito]=useState(false);
  const [erro,setErro] = useState(''),[aviso,setAviso] = useState(''),[todosConteudos,setTodosConteudos] = useState(false);
  const trava=useRef(false),pedido=useRef(null),vivo=useRef(true),leitura=useRef(null);
  useEffect(()=>{
    vivo.current=true;const controller=new AbortController();
    listarPlanos({obterToken,signal:controller.signal}).then(r=>{if(!controller.signal.aborted)setLista(r.planos||[]);}).catch(e=>{if(!controller.signal.aborted)setErro(e.message||'Não foi possível carregar os planos.');}).finally(()=>{if(!controller.signal.aborted)setCarregando(false);});
    return()=>{vivo.current=false;controller.abort();leitura.current?.abort();};
  },[obterToken]);
  const sujo=JSON.stringify(plano)!==JSON.stringify(salvo);
  const novoAlterado=!salvo&&JSON.stringify(plano)!==JSON.stringify(novoPlano());
  const bloqueado=ocupado||incerto;
  const alterar=(chave,valor)=>{setPlano(p=>({...p,[chave]:valor}));setAviso('');};
  const alterarEtapa=(i,chave,valor)=>alterar('etapas',plano.etapas.map((e,j)=>j===i?{...e,[chave]:valor}:e));
  const abrir=async (id,descartar=false)=>{
    if(bloqueado)return;
    if(!descartar&&salvo&&sujo){setErro('Salve suas alterações antes de abrir outro plano.');return;}
    if(!descartar&&novoAlterado){setErro('Salve o rascunho antes de abrir outro plano.');return;}
    setOcupado(true);setErro('');leitura.current?.abort();const c=new AbortController();leitura.current=c;
    try{const r=await obterPlano({id,obterToken,signal:c.signal});if(vivo.current&&!c.signal.aborted){setPlano(r.plano);setSalvo(r.plano);setAviso('Plano carregado.');setConflito(false);pedido.current=null;}}
    catch(e){if(vivo.current&&!c.signal.aborted)setErro(e.message);}
    finally{if(vivo.current&&!c.signal.aborted)setOcupado(false);}
  };
  const salvar=async e=>{
    e.preventDefault();if(trava.current)return;setErro('');setAviso('');
    let dados;try{dados=normalizarPlano(plano);}catch(e){setErro(e.message);return;}
    const assinatura=JSON.stringify([dados,salvo?.revision]);
    if(pedido.current?.assinatura!==assinatura)pedido.current={assinatura,requestId:gerarRequestId('plano')};
    trava.current=true;setOcupado(true);
    try{
      const r=await salvarPlano({plano:dados,expectedRevision:salvo?.revision,requestId:pedido.current.requestId,obterToken});
      if(!vivo.current)return;
      setPlano(r.plano);setSalvo(r.plano);setIncerto(false);setConflito(false);pedido.current=null;
      setLista(l=>[r.plano,...l.filter(p=>p.id!==r.plano.id)]);setAviso('Planejamento salvo na nuvem.');
    }catch(e){if(vivo.current){setErro(e.message||'Não foi possível salvar. Tente novamente.');setIncerto(!e.status);setConflito(e.status===409);}}
    finally{trava.current=false;if(vivo.current)setOcupado(false);}
  };
  const turmasAtivas=turmas.filter(t=>!t.arquivada);
  const turmasIndisponiveis=plano.turmaIds.filter(id=>!turmasAtivas.some(t=>String(t.id)===id));
  const disponiveis=questoes.filter(q=>q.status==='revisada'&&questaoCompativelComModalidade(q,plano.modalidade,modalidadesServidor));
  const visiveis=disponiveis.filter(q=>todosConteudos||(!plano.disciplina||q.disciplina.toLowerCase()===plano.disciplina.trim().toLowerCase())&&(!plano.conteudo||q.conteudo.toLowerCase()===plano.conteudo.trim().toLowerCase()));
  const invalidas=plano.questaoIds.filter(id=>!disponiveis.some(q=>q.id===id));
  const pronto=Boolean(salvo&&!sujo&&plano.turmaIds.length&&plano.questaoIds.length>=(plano.experiencia==='resgate'?3:1)&&!invalidas.length&&!turmasIndisponiveis.length);
  const total=plano.etapas.reduce((n,e)=>n+(Number(e.minutos)||0),0);
  const alternarQuestao=id=>alterar('questaoIds',plano.questaoIds.includes(id)?plano.questaoIds.filter(x=>x!==id):[...plano.questaoIds,id]);
  const moverQuestao=(i,delta)=>{const ids=[...plano.questaoIds];[ids[i],ids[i+delta]]=[ids[i+delta],ids[i]];alterar('questaoIds',ids);};
  return <section aria-label="Planejar aula gamificada" className="space-y-5 text-[#25104A]">
    <header className="rounded-3xl bg-[#25104A] p-6 text-white"><span className="text-xs font-black uppercase tracking-widest text-[#FFE500]">PLANO → QUESTÕES → PARTIDA</span><h2 className="mt-2 text-3xl font-black">Planejar aula gamificada</h2><p className="mt-2">Organize objetivo, etapas e jogo. Salve o plano, revise as questões e confirme a criação da sala.</p></header>
    {erro&&<div role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-4">{erro}{incerto&&<p>O envio não foi confirmado. Tente salvar novamente antes de editar ou abrir outro plano.</p>}{conflito&&salvo&&!incerto&&<button type="button" className={`${botao} ml-3`} disabled={ocupado} onClick={()=>abrir(salvo.id,true)}>Reabrir versão atual (descarta alterações locais)</button>}</div>}
    {aviso&&<p role="status" className="rounded-xl bg-green-50 p-3 font-bold">{aviso}</p>}
    <section className="rounded-2xl border-2 border-[#E2D9F7] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-black">Meus planejamentos</h3><button type="button" className={botao} disabled={bloqueado||(salvo?sujo:novoAlterado)} onClick={()=>{setPlano(novoPlano());setSalvo(null);setAviso('');setErro('');pedido.current=null;}}>Novo planejamento</button></div>{carregando?<p role="status">Carregando planos...</p>:lista.length?<div className="mt-3 flex flex-wrap gap-2">{lista.map(p=><button type="button" key={p.id} disabled={bloqueado} className={botao} aria-label={`Abrir ${p.titulo}`} onClick={()=>abrir(p.id)}>{p.titulo}<span className="ml-2 text-xs font-normal">v{p.revision} · {p.disciplina}</span></button>)}</div>:<p className="mt-3">Seu primeiro plano aparecerá aqui após salvar.</p>}</section>
    <form onSubmit={salvar} className="space-y-5 rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-7">
      <fieldset disabled={bloqueado} className="space-y-5">
        <legend className="mb-3 text-xl font-black">1. Contexto da aula</legend>
        <div className="grid gap-4 sm:grid-cols-2">{[['titulo','Título do plano',160],['disciplina','Disciplina',100],['anoEscolar','Série / ano escolar',80],['conteudo','Conteúdo / tema',160]].map(([key,label,max])=><label key={key} className="font-bold">{label}<input required maxLength={max} className={campo} value={plano[key]} onChange={e=>alterar(key,e.target.value)}/></label>)}</div>
        <label className="block font-bold">Objetivo de aprendizagem<textarea required maxLength={1500} className={campo} rows={3} value={plano.objetivo} onChange={e=>alterar('objetivo',e.target.value)}/></label>
        <label className="block max-w-xs font-bold">Duração da aula (minutos)<input type="number" min={10} max={240} required className={campo} value={plano.duracaoMinutos} onChange={e=>alterar('duracaoMinutos',Number(e.target.value))}/></label>
        <fieldset><legend className="font-bold">Turmas previstas</legend><div className="mt-2 flex flex-wrap gap-2">{turmasAtivas.map(t=><label key={t.id} className="rounded-xl border p-3"><input type="checkbox" checked={plano.turmaIds.includes(String(t.id))} onChange={()=>alterar('turmaIds',plano.turmaIds.includes(String(t.id))?plano.turmaIds.filter(id=>id!==String(t.id)):[...plano.turmaIds,String(t.id)])}/> {t.nome||t.id}</label>)}</div></fieldset>
        {turmasIndisponiveis.length>0&&<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3"><p>Há turmas arquivadas ou indisponíveis. Remova-as antes de salvar ou preparar a partida.</p>{turmasIndisponiveis.map(id=><button key={id} type="button" className={`${botao} mt-2 mr-2`} onClick={()=>alterar('turmaIds',plano.turmaIds.filter(x=>x!==id))}>Remover turma indisponível {id}</button>)}</div>}
        <h3 className="text-xl font-black">2. Jogo e roteiro</h3>
        <label className="block font-bold">Modalidade do plano<select className={campo} value={plano.modalidade} onChange={e=>{const modalidade=e.target.value;setPlano(p=>({...p,modalidade,experiencia:'padrao',questaoIds:p.questaoIds.filter(id=>questoes.some(q=>q.id===id&&questaoCompativelComModalidade(q,modalidade,modalidadesServidor)))}));}}>{MODALIDADES_PADRAO.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
        {plano.modalidade==='quiz'&&<label className="block font-bold">Experiência do Quiz<select className={campo} value={plano.experiencia} onChange={e=>alterar('experiencia',e.target.value)}><option value="padrao">Quiz padrão</option><option value="plataforma">Plataforma</option><option value="resgate">Resgate do Rio · investigação 2D</option></select></label>}
        <button type="button" className={botao} onClick={()=>{alterar('etapas',etapasModelo(plano.experiencia==='resgate'));alterar('duracaoMinutos',50);}}>Aplicar roteiro sugerido de 50 minutos</button><p className="text-sm">Substitui as etapas abaixo. Tempos do planejamento não alteram o cronômetro das questões. O roteiro orienta o professor; o cenário mantém as regras do jogo escolhido.</p>
        <ol className="space-y-3">{plano.etapas.map((e,i)=><li key={e.id} className="rounded-2xl border-2 border-[#E2D9F7] bg-[#F7F3FF] p-4"><div className="grid gap-3 sm:grid-cols-[1fr_140px_110px]"><label className="font-bold">Etapa {i+1}<input required maxLength={120} className={campo} value={e.titulo} onChange={ev=>alterarEtapa(i,'titulo',ev.target.value)}/></label><label className="font-bold">Tipo<select className={campo} value={e.tipo} onChange={ev=>alterarEtapa(i,'tipo',ev.target.value)}><option value="introducao">Introdução</option><option value="jogo">Jogo / missão</option><option value="fechamento">Fechamento</option></select></label><label className="font-bold">Minutos<input type="number" required min={1} max={240} className={campo} value={e.minutos} onChange={ev=>alterarEtapa(i,'minutos',Number(ev.target.value))}/></label></div><label className="mt-3 block text-sm font-bold">Orientação da etapa {i+1}<textarea maxLength={1000} rows={2} className={campo} value={e.orientacao} onChange={ev=>alterarEtapa(i,'orientacao',ev.target.value)}/></label><button type="button" disabled={plano.etapas.length<=3} className={`${botao} mt-2 text-sm`} onClick={()=>alterar('etapas',plano.etapas.filter((_,j)=>j!==i))}>Remover etapa {i+1}</button></li>)}</ol>
        <div className="flex flex-wrap items-center gap-3"><button type="button" className={botao} disabled={plano.etapas.length>=10} onClick={()=>alterar('etapas',[...plano.etapas,{id:gerarRequestId('etapa'),titulo:'Nova missão',tipo:'jogo',minutos:5,orientacao:''}])}>Adicionar etapa</button><p className={`font-bold ${total!==Number(plano.duracaoMinutos)?'text-red-700':'text-green-700'}`}>Etapas: {total} / {plano.duracaoMinutos} minutos</p></div>
        <h3 className="text-xl font-black">3. Questões revisadas do banco</h3><p className="text-sm">A seleção segue a ordem marcada; as questões serão distribuídas entre as etapas de jogo. Você também pode salvar sem questões para gerar com IA depois.</p>
        <label className="block"><input type="checkbox" checked={todosConteudos} onChange={e=>setTodosConteudos(e.target.checked)}/> Mostrar outros conteúdos compatíveis</label>
        {invalidas.length>0&&<p role="alert">Há questões removidas ou não revisadas neste plano. Retire-as e salve antes de preparar a partida.</p>}
        <div className="max-h-80 space-y-2 overflow-y-auto">{visiveis.length?visiveis.map(q=><label key={q.id} className="flex gap-3 rounded-xl border p-3"><input type="checkbox" checked={plano.questaoIds.includes(q.id)} onChange={()=>alternarQuestao(q.id)}/><span>{q.enunciado}<small className="mt-1 block">{q.disciplina} · {q.conteudo} · {rotuloDificuldade(q.dificuldade)}</small></span></label>):<p>Não há questões revisadas para esse filtro. Salve o plano e use “Gerar questões deste plano”, ou mostre outros conteúdos compatíveis.</p>}</div>
        {plano.questaoIds.length>0&&<ol className="space-y-2" aria-label="Ordem dos desafios">{plano.questaoIds.map((id,i)=><li key={id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#F3EDFF] p-3"><span className="min-w-0 flex-1">{i+1}. {questoes.find(q=>q.id===id)?.enunciado||`Questão indisponível: ${id}`}</span><button type="button" className={botao} aria-label={`Subir desafio ${i+1}`} disabled={i===0} onClick={()=>moverQuestao(i,-1)}>↑</button><button type="button" className={botao} aria-label={`Descer desafio ${i+1}`} disabled={i===plano.questaoIds.length-1} onClick={()=>moverQuestao(i,1)}>↓</button><button type="button" className={botao} aria-label={`Remover desafio ${i+1}`} onClick={()=>alternarQuestao(id)}>×</button></li>)}</ol>}
      </fieldset>
      <div className="flex flex-wrap gap-3">{(salvo?sujo:novoAlterado)&&<button type="button" disabled={bloqueado} className={botao} onClick={()=>{setPlano(salvo||novoPlano());setErro('');setConflito(false);setAviso('Alterações locais descartadas.');}}>Descartar alterações locais</button>}<button type="submit" disabled={ocupado} className="min-h-12 rounded-xl bg-[#6315D9] px-5 py-3 font-black text-white disabled:opacity-45">{ocupado?'Salvando...':'Salvar planejamento'}</button><button type="button" disabled={bloqueado||!salvo||sujo} className={botao} onClick={()=>onUsarPlano?.(salvo,'gerar')}>Gerar questões deste plano</button><button type="button" disabled={bloqueado||!pronto} className={`${botao} border-[#00CAD5]`} onClick={()=>onUsarPlano?.(salvo,'salas')}>Preparar partida deste plano</button></div>
      <p className="text-sm">Salve as alterações antes de continuar. Para preparar uma partida, selecione turmas e questões revisadas; Resgate exige pelo menos três. Criar o plano não publica atividades nem altera notas. Para revisão em casa, libere as questões às turmas no Banco de Questões → Revisar sozinho.</p>
    </form>
  </section>;
}
