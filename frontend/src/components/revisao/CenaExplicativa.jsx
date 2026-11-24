'use client';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './slidesExplicativos.module.css';
import { MecanismoVisual } from './MecanismoVisual';

const nomes = { obra:'Olhar → interpretar', comparacao:'Compare as escolhas', sequencia:'Observe a transformação', camadas:'Como se constrói', percurso:'Contexto → experiência', relacoes:'Conecte as ideias' };

/** Diagrama didático separado da obra: relações conceituais, sem atribuir marcas falsas à fotografia. */
export function CenaExplicativa({ tipo = 'obra', pontos = [], etapa = 0, totalEtapas = 1, conteudoId }) {
  const reduzido = useReducedMotion();
  const itens = pontos.slice(0, 4);
  if (!itens.length) return null;
  const atual = Math.min(itens.length - 1, Math.floor(etapa * itens.length / Math.max(1, totalEtapas)));
  const posicoes = tipo === 'relacoes'
    ? [[170,40],[300,95],[170,150],[40,95]]
    : tipo === 'camadas'
      ? [[100,140],[140,105],[180,70],[220,35]]
      : itens.map((_,i)=>[45+i*84, tipo === 'sequencia' ? 115-Math.sin(i)*40 : 90]);
  return <aside className={styles.diagram} aria-label={`Leitura visual: ${nomes[tipo] || nomes.obra}`}>
    <span className={styles.eyebrow}>{nomes[tipo] || nomes.obra}</span>
    <MecanismoVisual conteudoId={conteudoId} etapa={etapa}/>
    {!conteudoId && <svg viewBox="0 0 350 190" className={styles.diagramSvg} aria-hidden="true">
      <path d={tipo === 'relacoes' ? 'M170 40L300 95L170 150L40 95Z' : tipo === 'camadas' ? 'M100 140L140 105L180 70L220 35' : posicoes.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')} fill="none" stroke="#B9A6EF" strokeWidth="2" strokeDasharray="5 7" />
      {itens.map((p,i)=>{
        const [x,y] = posicoes[i];
        return <motion.g initial={false} key={p.titulo} animate={{opacity: i<=atual ? 1 : .25, y: reduzido ? 0 : i===atual ? -5 : 0}} transition={{duration: reduzido ? 0 : .45}}>
          {tipo === 'camadas' ? <path d={`M${x-42} ${y}l42 -22l42 22l-42 22Z`} fill={i===atual?'#00DDEB':'#6315D9'} stroke="#FFFDF7" strokeWidth="2"/> : <circle cx={x} cy={y} r={i===atual?25:19} fill={i===atual?'#FFE14D':'#6315D9'} stroke="#FFFDF7" strokeWidth="2"/>}
          <text x={x} y={y+5} textAnchor="middle" fill={i===atual?'#25104A':'#FFFDF7'} fontWeight="800" fontSize="16">{i+1}</text>
        </motion.g>;
      })}
    </svg>}
    <div className={styles.visualPoints}>
      {itens.map((p,i)=><div key={p.titulo} className={`${styles.visualPoint} ${i===atual?styles.pointActive:''}`}>
        <span className={styles.pointNumber}>{i+1}</span>
        <details key={`${i}:${atual}`} open={i===atual}><summary><strong>{p.titulo}</strong></summary><p>{p.texto}</p></details>
      </div>)}
    </div>
    <small>Esquema de leitura didática · não integra a obra</small>
  </aside>;
}
