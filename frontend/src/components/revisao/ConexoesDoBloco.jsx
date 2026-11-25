'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './slidesExplicativos.module.css';

/** Conceitos vêm do trecho atual. Não herda observações de outra obra da mesma aula. */
export function ConexoesDoBloco({ cena, textoEtapa = '', textoApresentado = '' }) {
  const reduzido = useReducedMotion();
  const termos = cena.destaques.slice(0,6);
  const contem = (texto, termo) => texto.toLocaleLowerCase('pt-BR').includes(termo.toLocaleLowerCase('pt-BR'));
  const ativos = new Set(termos.flatMap((t,i) => contem(textoEtapa,t) ? [i] : []));
  const revelados = new Set(termos.flatMap((t,i) => contem(textoApresentado || textoEtapa,t) ? [i] : []));
  const tipo = cena.tipoCena;
  const pos = termos.map((_,i)=>tipo==='relacoes'
    ? [175+Math.cos(-Math.PI/2+i*2*Math.PI/termos.length)*115,95+Math.sin(-Math.PI/2+i*2*Math.PI/termos.length)*65]
    : tipo==='camadas' ? [95+i*30,145-i*23]
      : [35+i*(280/Math.max(1,termos.length-1)),100+(i%2?20:-20)]);
  const caminho = pos.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')+(tipo==='relacoes'?'Z':'');
  return <aside key={cena.tituloVisual} data-testid="conexoes-bloco" className={`${styles.diagram} ${styles.blockConnections}`} aria-label={cena.tituloVisual}>
    <h3>{cena.tituloVisual}</h3>
    <svg viewBox="0 0 350 190" role="img" aria-label={`Mapa de conceitos: ${termos.join(', ')}`} className={styles.conceptMap}>
      <motion.path initial={false} d={caminho} fill="none" stroke="#6315D9" strokeWidth="3" strokeDasharray="4 6" animate={{pathLength:revelados.size/Math.max(1,termos.length)}} transition={{duration:reduzido?0:.7}}/>
      {termos.map((t,i)=>{
        const [x,y]=pos[i];
        return <motion.g initial={false} key={t} animate={{opacity:ativos.has(i)?1:revelados.has(i)?.65:.3,scale:ativos.has(i)?1.12:1}} style={{transformOrigin:`${x}px ${y}px`}} transition={{duration:reduzido?0:.45}}>
          {tipo==='camadas'?<path d={`M${x-30} ${y}l30 -15l30 15l-30 15Z`} fill={ativos.has(i)?'#00DDEB':'#6315D9'}/>:<circle cx={x} cy={y} r={ativos.has(i)?20:15} fill={ativos.has(i)?'#FFE14D':'#6315D9'}/>}
          <text x={x} y={y+5} textAnchor="middle" fontWeight="900" fontSize="13" fill={ativos.has(i)?'#25104A':'#FFFDF7'}>{i+1}</text>
        </motion.g>;
      })}
    </svg>
    <ol className={styles.conceptList}>{termos.map((t,i)=><li key={t} data-ativo={ativos.has(i)} style={{'--ordem':i}}><span>{i+1}</span>{t}</li>)}</ol>
    <small>Conceitos deste slide · a explicação avança com o professor</small>
  </aside>;
}
