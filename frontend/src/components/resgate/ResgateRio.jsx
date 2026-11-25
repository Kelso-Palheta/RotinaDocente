'use client';
import React, { useEffect, useRef, useState } from 'react';
import { missoes, missaoDoDesafio, iniciarExploracao, investigar, mover, distancia } from '@/dominio/resgate/expedicao';
import { JogoQuiz } from '@/components/aula-gamificada/jogos/JogoQuiz';
import { RenderTextoSeguro } from '@/components/aula-gamificada/RenderTextoSeguro';
import { validarUrlImagemSegura } from '@/components/aula-gamificada/constantes';
import { CenarioRio } from './CenarioRio';
import './resgate.css';

/** Only server receipts decide results. Spatial actions and items are narrative aids. */
export function ResgateRio({ questao, indice=0, total=3, fase='pergunta', recibo=null, bloqueado=false, ocupado=false, onEnviar, observador=false }) {
 const missao=missoes[missaoDoDesafio(indice,total)];
 const [exploracao,setExploracao]=useState(()=>iniciarExploracao(missaoDoDesafio(indice,total)));
 const [som,setSom]=useState(false),[erroSom,setErroSom]=useState('');
 const [ampliado,setAmpliado]=useState(false);
 const audio=useRef(null), teclas=useRef(new Set()), palco=useRef(null);
 const feedback=fase==='feedback', respondido=Boolean(recibo);
 const correta=recibo?.correta===true || Number(recibo?.pontuacao)>0;
 const liberado=exploracao.itens.length===missao.estacoes.length;
 const pausado=bloqueado||ocupado||feedback||respondido||observador;
 useEffect(()=>{
  if(pausado) return;
  const timer=setInterval(()=>{const k=teclas.current,dx=(k.has('ArrowRight')||k.has('d')?1:0)-(k.has('ArrowLeft')||k.has('a')?1:0),dy=(k.has('ArrowDown')||k.has('s')?1:0)-(k.has('ArrowUp')||k.has('w')?1:0);if(dx||dy)setExploracao(s=>mover(s,dx*9/(dx&&dy?1.414:1),dy*9/(dx&&dy?1.414:1)));},35);
  const limpar=()=>teclas.current.clear();window.addEventListener('blur',limpar);
  return()=>{clearInterval(timer);limpar();window.removeEventListener('blur',limpar);};
 },[pausado]);
 useEffect(()=>()=>{audio.current?.close?.().catch(()=>{});},[]);
 useEffect(()=>{const fechar=e=>{if(e.key==='Escape')setAmpliado(false);};window.addEventListener('keydown',fechar);return()=>window.removeEventListener('keydown',fechar);},[]);
 const tocar=()=>{
  const ctx=audio.current;if(!ctx||ctx.state!=='running')return;
  const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(523,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(784,ctx.currentTime+.12);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.22);osc.connect(g);g.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.24);
 };
 const alternarSom=async()=>{
  if(som){await audio.current?.suspend();setSom(false);return;}
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error();audio.current ||= new AC();await audio.current.resume();if(audio.current.state!=='running')throw new Error();setSom(true);setErroSom('');}catch{setErroSom('Som indisponível neste navegador. O jogo continua com sinais visuais.');}
 };
 const interagir=(id,acessivel=false)=>{if(pausado)return;setExploracao(s=>investigar(acessivel?{...s,posicao:{x:missao.estacoes.find(e=>e.id===id).x,y:missao.estacoes.find(e=>e.id===id).y+45}}:s,id));tocar();};
 const proxima=()=>{const e=[...missao.estacoes].sort((a,b)=>distancia(a,exploracao.posicao)-distancia(b,exploracao.posicao))[0];if(distancia(e,exploracao.posicao)<85)interagir(e.id);else setExploracao(s=>({...s,mensagem:'Aproxime-se de uma estação numerada ou use a lista acessível.'}));};
 const tecla=e=>{
  if(e.target!==e.currentTarget)return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(e.key)){e.preventDefault();teclas.current.add(e.key);}
  if(e.key===' '||e.key==='Enter'){e.preventDefault();proxima();}
 };
 return <section ref={palco} aria-label="Resgate do Rio" className={`resgate ${ampliado?'resgate-ampliado':''}`}>
  <header className="resgate-cabecalho"><div><span className="resgate-etiqueta">EXPEDIÇÃO • RESGATE DO RIO</span><h2>{missaoDoDesafio(indice,total)+1} / 3 · {missao.titulo}</h2><p>{missao.objetivo}</p></div><div className="resgate-acoes"><button type="button" aria-pressed={som} onClick={alternarSom}>{som?'Som ligado':'Ativar som'}</button><button type="button" onClick={()=>setAmpliado(v=>!v)}>{ampliado?'Reduzir mapa':'Ampliar jogo'}</button></div></header>
  <div className="resgate-faixa"><span>Desafio {indice+1} de {total}</span><span>Investigações {exploracao.itens.length} / 3</span><span>Checkpoint: desafio atual</span></div>
  <div className="resgate-palco" tabIndex={observador?-1:0} aria-label="Explorar mapa: setas ou WASD; espaço para investigar" onKeyDown={tecla} onKeyUp={e=>teclas.current.delete(e.key)} onBlur={()=>teclas.current.clear()}>
   <CenarioRio missao={missao} exploracao={exploracao} feedback={feedback&&respondido&&!observador} correta={correta} onEstacao={id=>interagir(id)}/>
   {!observador&&<div className="resgate-controles"><div className="resgate-direcional" aria-label="Direção">{[['↑','ArrowUp'],['←','ArrowLeft'],['↓','ArrowDown'],['→','ArrowRight']].map(([label,key])=><button key={key} type="button" aria-label={`Mover ${label}`} disabled={pausado} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId);teclas.current.add(key);palco.current?.querySelector('.resgate-palco')?.focus({preventScroll:true});}} onPointerUp={()=>teclas.current.delete(key)} onPointerCancel={()=>teclas.current.delete(key)} onLostPointerCapture={()=>teclas.current.delete(key)} onClick={e=>{if(e.detail===0&&!pausado)setExploracao(s=>mover(s,key==='ArrowLeft'?-18:key==='ArrowRight'?18:0,key==='ArrowUp'?-18:key==='ArrowDown'?18:0));}}>{label}</button>)}</div><button type="button" className="resgate-interagir" disabled={pausado} onClick={proxima}>Investigar <span>✦</span></button></div>}
  </div>
  <p className="resgate-instrucoes">Setas ou WASD para mover · Enter ou espaço para investigar perto de uma estação. No celular, use os controles abaixo do mapa.</p>
  <div className="resgate-paineis"><aside className="resgate-mochila"><h3>Mochila de evidências</h3>{exploracao.itens.length?<ul>{missao.estacoes.filter(e=>exploracao.itens.includes(e.id)).map(e=><li key={e.id}>✓ {e.item}</li>)}</ul>:<p>Procure as três estações numeradas.</p>}<p className="resgate-nota">Itens narrativos não valem pontos. Ao retornar, o desafio salvo continua; pistas locais podem ser recolhidas novamente.</p></aside><div className="resgate-dialogo" role="status" aria-live="polite"><span>DIÁRIO DE CAMPO</span><p>{observador?'Acompanhe a missão da turma. O cenário é individual; use os comandos da sala para revelar e avançar.':feedback&&!respondido?'Sem resposta registrada nesta rodada. Observe a explicação e continue a investigação.':feedback?(correta?'Intervenção confirmada! O viveiro floresceu. Continue acompanhando os efeitos das decisões.':'Plano precisa de revisão. Consulte a explicação e leve essa evidência à próxima missão. Você pode continuar.'):respondido?'Resposta registrada. Aguarde a revelação para observar a consequência.':exploracao.mensagem}</p></div></div>
  {erroSom&&<p role="status">{erroSom}</p>}
  {!observador&&!feedback&&!respondido&&<details className="resgate-lista"><summary>Explorar pela lista acessível</summary><p>As mesmas pistas e ferramentas, sem precisar movimentar o personagem. Sem desconto na pontuação.</p><div>{missao.estacoes.map(e=><button type="button" key={e.id} disabled={pausado} aria-pressed={exploracao.itens.includes(e.id)} onClick={()=>interagir(e.id,true)}>{e.nome}</button>)}</div></details>}
  {!observador&&fase==='pergunta'&&(liberado||respondido)&&<section className="resgate-desafio" aria-label="Desafio da expedição"><h3>Use suas evidências · desafio curricular</h3><RenderTextoSeguro texto={questao?.enunciado||''}/>{questao?.imagem?.url && validarUrlImagemSegura(questao.imagem.url) && <figure className="resgate-imagem-desafio">{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={questao.imagem.url} alt={questao.imagem.alt || 'Imagem da questão'}/>{questao.imagem.alt && <figcaption>{questao.imagem.alt}</figcaption>}</figure>}<JogoQuiz questao={questao} recibo={recibo} ocupado={ocupado} bloqueado={bloqueado} onEnviar={onEnviar}/></section>}
  {observador&&<p className="resgate-nota">Cada aluno investiga no próprio aparelho. Revele a resposta e avance usando os comandos da sala.</p>}
  <footer className="resgate-nota">Cenário fictício. Dados ambientais ilustrativos. A correção e os pontos usam somente o desafio da disciplina, confirmado pelo servidor.</footer>
 </section>;
}
