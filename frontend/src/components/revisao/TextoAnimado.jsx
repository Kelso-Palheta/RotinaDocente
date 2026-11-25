'use client';
import React from 'react';
import styles from './slidesExplicativos.module.css';

function unidades(texto, destaques) {
  const termos = destaques.filter(Boolean).sort((a,b)=>b.length-a.length);
  const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const grupos = termos.length ? texto.split(new RegExp(`(${termos.map(escapar).join('|')})`, 'giu')) : [texto];
  return grupos.flatMap(parte => termos.some(t=>t.toLocaleLowerCase('pt-BR')===parte.toLocaleLowerCase('pt-BR'))
    ? [{ texto: parte, destaque: true }]
    : parte.split(/(\s+)/).filter(Boolean).map(t=>({ texto:t,destaque:false })));
}

/** Uma leitura contínua para leitores de tela; coreografia visual sem fragmentar a fala. */
export function TextoAnimado({ texto, destaques = [] }) {
  let ordem = 0;
  return <>
    <span className="sr-only">{texto}</span>
    <span aria-hidden="true" data-texto-visual>
      {unidades(texto, destaques).map((u,i)=>{
        if (/^\s+$/.test(u.texto)) return <React.Fragment key={i}>{u.texto}</React.Fragment>;
        const Tag = u.destaque ? 'mark' : 'span';
        return <Tag key={i} data-unidade-texto className={`${styles.word} ${u.destaque?styles.keyword:''}`} style={{'--ordem':Math.min(ordem++,24)}}>{u.texto}</Tag>;
      })}
    </span>
  </>;
}
