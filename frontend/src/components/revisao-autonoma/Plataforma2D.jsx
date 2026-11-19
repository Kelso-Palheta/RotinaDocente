'use client';
import React, { useEffect, useRef, useState } from 'react';
import { criarJogador, criarMundo, passoFisica } from '@/dominio/revisao-autonoma/plataforma';

const TEMAS = [['#150D35', '#5330A4', '#00DDEB'], ['#052F37', '#086D77', '#B9EF00'], ['#31104B', '#8D2887', '#FFE500']];

export function Plataforma2D({ fase = 1, pausado = false, onDesafio }) {
  const canvas = useRef(null);
  const teclas = useRef({});
  const pausaExterna = useRef(pausado);
  const [pausa, setPausa] = useState(false);
  const [estrelas, setEstrelas] = useState(0);
  useEffect(() => { pausaExterna.current = pausado || pausa; }, [pausado, pausa]);
  useEffect(() => {
    const tela = canvas.current;
    const ctx = tela?.getContext('2d');
    if (!ctx) return;
    const mundo = criarMundo(fase);
    let p = criarJogador(mundo);
    let ultimo = 0;
    let frame;
    let chegou = false;
    const coletadas = new Set();
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const tema = TEMAS[(fase - 1) % TEMAS.length];
    const limpar = () => { teclas.current = {}; ultimo = 0; };
    document.addEventListener('visibilitychange', limpar);
    window.addEventListener('blur', limpar);
    function desenhar(tempo) {
      const camera = Math.max(0, Math.min(mundo.largura - 900, p.x - 300));
      const fundo = ctx.createLinearGradient(0, 0, 0, 480);
      fundo.addColorStop(0, tema[0]); fundo.addColorStop(1, tema[1]);
      ctx.fillStyle = fundo; ctx.fillRect(0, 0, 900, 480);
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = i % 2 ? '#FFFFFF55' : '#00DDEB66';
        const oscilacao = reduzir?.matches ? 0 : Math.sin(tempo / 1500 + i) * 4;
        ctx.beginPath(); ctx.arc((i * 157 - camera * 0.16 + 1800) % 950, 25 + (i * 47) % 220 + oscilacao, i % 3 + 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save(); ctx.translate(-camera, 0);
      ctx.fillStyle = '#160B2E'; ctx.fillRect(0, mundo.chao, mundo.largura, 60);
      ctx.fillStyle = tema[2]; ctx.fillRect(0, mundo.chao, mundo.largura, 7);
      for (const bloco of mundo.plataformas) {
        ctx.fillStyle = '#25104A'; ctx.fillRect(bloco.x, bloco.y, bloco.w, bloco.h);
        ctx.fillStyle = tema[2]; ctx.fillRect(bloco.x, bloco.y, bloco.w, 7);
        ctx.fillStyle = '#ffffff33'; ctx.fillRect(bloco.x + 10, bloco.y + 11, bloco.w - 20, 4);
      }
      for (const o of mundo.obstaculos) {
        ctx.fillStyle = '#FF2C9C';
        for (let x = o.x; x < o.x + o.w; x += 15) { ctx.beginPath(); ctx.moveTo(x, o.y + o.h); ctx.lineTo(x + 7, o.y); ctx.lineTo(x + 15, o.y + o.h); ctx.fill(); }
      }
      for (const [i, estrela] of mundo.estrelas.entries()) {
        if (coletadas.has(i)) continue;
        ctx.font = '28px sans-serif'; ctx.fillStyle = '#FFE500'; ctx.fillText('★', estrela.x, estrela.y);
      }
      ctx.fillStyle = '#B9EF00'; ctx.fillRect(1005, 340, 5, 80); ctx.beginPath(); ctx.moveTo(1010, 340); ctx.lineTo(1055, 353); ctx.lineTo(1010, 366); ctx.fill();
      ctx.fillStyle = '#00DDEB'; ctx.fillRect(mundo.portal.x, 312, 68, 108);
      ctx.fillStyle = '#6315D9'; ctx.fillRect(mundo.portal.x + 7, 320, 54, 100);
      ctx.fillStyle = '#FFE500'; ctx.font = 'bold 36px sans-serif'; ctx.fillText('?', mundo.portal.x + 23, 380);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('DESAFIO', mundo.portal.x - 2, 300);
      // Explorador com traje e visor: movimento físico, sem pontos pedagógicos locais.
      ctx.fillStyle = '#FFE500'; ctx.fillRect(p.x + 3, p.y + 20, 22, 19);
      ctx.fillStyle = '#B9EF00'; ctx.fillRect(p.x - 5, p.y + 22, 10, 12);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(p.x + 14, p.y + 13, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00DDEB'; ctx.fillRect(p.x + 9, p.y + 8, 18, 11);
      ctx.fillStyle = '#25104A'; ctx.fillRect(p.x + 22, p.y + 10, 3, 4);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(p.x + 3, p.y + 37, 8, 7); ctx.fillRect(p.x + 17, p.y + 37, 8, 7);
      ctx.restore();
      if (pausaExterna.current || document.hidden) { ctx.fillStyle = '#150D35AA'; ctx.fillRect(0, 0, 900, 480); ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('PAUSADO', 365, 235); }
    }
    const loop = tempo => {
      const dt = ultimo ? (tempo - ultimo) / 1000 : 0;
      ultimo = tempo;
      if (!pausaExterna.current && !document.hidden && !chegou) {
        p = passoFisica(p, teclas.current, mundo, dt);
        for (const [i, e] of mundo.estrelas.entries()) {
          if (!coletadas.has(i) && Math.abs(p.x + 14 - e.x) < 38 && Math.abs(p.y + 20 - e.y) < 50) { coletadas.add(i); setEstrelas(coletadas.size); }
        }
        if (p.x + p.w > mundo.portal.x) { chegou = true; teclas.current = {}; onDesafio?.(); }
      }
      desenhar(tempo);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', limpar); window.removeEventListener('blur', limpar); teclas.current = {}; };
  }, [fase, onDesafio]);
  const tecla = (e, ligar) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const mapa = { ArrowLeft: 'esquerda', a: 'esquerda', ArrowRight: 'direita', d: 'direita', ArrowUp: 'pular', ' ': 'pular', w: 'pular' };
    if (mapa[k]) { e.preventDefault(); teclas.current[mapa[k]] = ligar; }
  };
  const toque = (campo, ligar, e) => { e.preventDefault(); teclas.current[campo] = ligar; if (ligar) e.currentTarget.setPointerCapture?.(e.pointerId); };
  return <section aria-label="Aventura de plataforma 2D" className="rounded-3xl border-4 border-[#00DDEB] overflow-hidden bg-[#25104A] text-white shadow-xl">
    <header className="flex flex-wrap justify-between items-center p-3 gap-3"><strong>Fase {fase} · ★ {estrelas}/5 estrelas</strong><button type="button" aria-pressed={pausa} onClick={() => { setPausa(p => !p); teclas.current = {}; }} className="rounded-lg border px-3 py-2">{pausa ? 'Continuar jogo' : 'Pausar'}</button></header>
    <canvas ref={canvas} width={900} height={480} tabIndex={0} aria-label="Mova com as setas ou A e D; pule com espaço. Evite obstáculos e encontre o portal." onKeyDown={e => tecla(e, true)} onKeyUp={e => tecla(e, false)} onBlur={() => { teclas.current = {}; }} className="w-full aspect-[900/480] block focus-visible:outline-4 focus-visible:outline-[#FFE500]" />
    <div className="flex justify-between gap-3 p-3 bg-[#160B2E]">
      <div className="flex gap-3">{[['esquerda','←','Mover para a esquerda'],['direita','→','Mover para a direita'],['pular','↑','Pular']].map(([campo,simbolo,label]) => <button key={campo} type="button" aria-label={label} disabled={pausado} onPointerDown={e => toque(campo,true,e)} onPointerUp={e => toque(campo,false,e)} onPointerCancel={e => toque(campo,false,e)} onLostPointerCapture={() => { teclas.current[campo] = false; }} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') teclas.current[campo] = true; }} onKeyUp={() => { teclas.current[campo] = false; }} style={{ touchAction:'none' }} className="h-14 w-14 rounded-xl bg-[#6315D9] text-3xl font-black disabled:opacity-40">{simbolo}</button>)}</div>
      <button type="button" onClick={onDesafio} className="rounded-xl bg-[#FFE500] px-3 py-2 text-xs sm:text-sm text-[#25104A] font-black">Ir direto ao desafio<br /><span className="font-normal">Modo acessível</span></button>
    </div>
    <p className="p-3 pt-0 text-xs text-[#E7DBFD]">Clique no cenário para usar o teclado. Obstáculos retornam ao checkpoint, sem perder acertos. Estrelas são diversão; não valem nota.</p>
  </section>;
}
