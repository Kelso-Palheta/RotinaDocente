'use client';
import React, { useEffect, useRef } from 'react';
import { criarJogador, passoFisica } from '@/dominio/revisao-autonoma/plataforma';
import { useSpriteAvatar, desenharAvatar } from './spritesAvatar';
import { avatarPorId } from '@/dominio/revisao-autonoma/avatares';
import { criarMundoV2 } from '@/dominio/revisao-autonoma/plataformaV2';

const LARGURA_TELA = 900;
const ALTURA_TELA = 480;

const chavePosicao = (sessaoId, fase) => `ra_pos:${sessaoId}:${fase}`;

function lerPosicao(sessaoId, fase) {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(chavePosicao(sessaoId, fase)) || 'null');
    return v && Number.isFinite(v.x) && Number.isFinite(v.cp) ? v : null;
  } catch { return null; }
}
function gravarPosicao(sessaoId, fase, p) {
  try { window.sessionStorage.setItem(chavePosicao(sessaoId, fase), JSON.stringify({ x: Math.round(p.x), cp: p.checkpoint.x })); } catch { /* storage indisponível */ }
}

function desenharDecor(ctx, area, camera, tempo, reduzir) {
  const par = camera * 0.3;
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 9; i++) {
    const x = ((i * 190 - par) % (LARGURA_TELA + 200) + LARGURA_TELA + 200) % (LARGURA_TELA + 200) - 100;
    const osc = reduzir ? 0 : Math.sin(tempo / 1800 + i) * 3;
    ctx.fillStyle = area.cores[2];
    if (area.decor === 'cristais') { ctx.beginPath(); ctx.moveTo(x, 420); ctx.lineTo(x + 16, 340 + (i % 3) * 20); ctx.lineTo(x + 32, 420); ctx.fill(); }
    else if (area.decor === 'cavernas') { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18, 70 + (i % 4) * 22 + osc); ctx.lineTo(x + 36, 0); ctx.fill(); }
    else if (area.decor === 'vento') { ctx.beginPath(); ctx.ellipse(x + 40, 90 + (i % 4) * 36 + osc, 52, 12, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (area.decor === 'cidadela') { ctx.fillRect(x, 300 - (i % 3) * 45, 38, 120 + (i % 3) * 45); ctx.fillRect(x + 6, 290 - (i % 3) * 45, 8, 10); ctx.fillRect(x + 22, 290 - (i % 3) * 45, 8, 10); }
    else { ctx.beginPath(); ctx.arc(x + 20, 40 + (i * 53) % 260 + osc, 2 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

/**
 * Percurso V2: personagem, câmera e estrelas persistem durante a fase; o Canvas só é remontado quando a fase física muda.
 * Estado dos eventos (resolvido, aberto, portal liberado) chega por ref e nunca reinicia a simulação.
 */
export function PercursoV2({ sessaoId, fase, avatarId, layoutVersao = 2, eventos, portalLiberado, pausado, entradaRef, onEvento, onPortalFechado, onSom, reduzirAnimacao = false, rotuloAcessivel }) {
  const canvas = useRef(null);
  const sprite = useSpriteAvatar(avatarId);
  const avatarRef = useRef(avatarId);
  useEffect(() => { avatarRef.current = avatarId; }, [avatarId]);
  const vivo = useRef({ eventos, portalLiberado, pausado, onEvento, onPortalFechado, onSom, reduzirAnimacao });
  useEffect(() => { vivo.current = { eventos, portalLiberado, pausado, onEvento, onPortalFechado, onSom, reduzirAnimacao }; });
  const nEstrelas = eventos.filter((e) => e.tipo === 'estrela').length;

  useEffect(() => {
    const tela = canvas.current;
    const ctx = tela?.getContext?.('2d');
    if (!ctx) return undefined;
    const entradaAtual = entradaRef.current;
    const mundo = criarMundoV2(fase, nEstrelas, layoutVersao);
    let p = criarJogador(mundo);
    const salvo = lerPosicao(sessaoId, fase);
    if (salvo) { p = { ...p, x: salvo.x, checkpoint: { x: salvo.cp, y: mundo.chao - p.h } }; }
    let ultimo = 0; let frame = 0; let areaAnterior = -1; let bannerAte = 0; let ultimoSalto = 0; let ultimoAvisoPortal = 0; let bloqueioGlobal = 0; let ultimoSalvar = 0;
    const cooldown = new Map();
    const indiceArea = (x) => Math.max(0, Math.min(mundo.areas.length - 1, Math.floor(x / 1100)));

    function desenhar(tempo) {
      const v = vivo.current;
      const camera = Math.max(0, Math.min(mundo.largura - LARGURA_TELA, p.x - 360));
      const area = mundo.areas[indiceArea(camera + 450)];
      const fundo = ctx.createLinearGradient(0, 0, 0, ALTURA_TELA);
      fundo.addColorStop(0, area.cores[0]); fundo.addColorStop(1, area.cores[1]);
      ctx.fillStyle = fundo; ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);
      desenharDecor(ctx, area, camera, tempo, v.reduzirAnimacao);
      ctx.save(); ctx.translate(-camera, 0);
      for (const a of mundo.areas) {
        if (a.x + a.w < camera || a.x > camera + LARGURA_TELA) continue;
        ctx.fillStyle = '#160B2E'; ctx.fillRect(a.x, mundo.chao, a.w, 60);
        ctx.fillStyle = a.cores[2]; ctx.fillRect(a.x, mundo.chao, a.w, 7);
      }
      for (const b of mundo.plataformas) {
        if (b.x + b.w < camera - 10 || b.x > camera + LARGURA_TELA + 10) continue;
        const cor = mundo.areas[b.area].cores[2];
        ctx.fillStyle = '#25104A'; ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = cor; ctx.fillRect(b.x, b.y, b.w, 7);
        ctx.fillStyle = '#ffffff33'; ctx.fillRect(b.x + 10, b.y + 12, b.w - 20, 4);
      }
      for (const o of mundo.obstaculos) {
        if (o.x + o.w < camera || o.x > camera + LARGURA_TELA) continue;
        ctx.fillStyle = '#FF2C9C';
        for (let x = o.x; x < o.x + o.w; x += 15) { ctx.beginPath(); ctx.moveTo(x, o.y + o.h); ctx.lineTo(x + 7, o.y); ctx.lineTo(x + 15, o.y + o.h); ctx.fill(); }
      }
      for (const c of mundo.checkpoints.slice(1)) {
        const ativo = p.checkpoint.x >= c.x;
        ctx.fillStyle = ativo ? '#B9EF00' : '#ffffff77'; ctx.fillRect(c.x, 340, 5, 80);
        ctx.beginPath(); ctx.moveTo(c.x + 5, 340); ctx.lineTo(c.x + 48, 353); ctx.lineTo(c.x + 5, 366); ctx.fill();
      }
      const estrelas = v.eventos.filter((e) => e.tipo === 'estrela');
      estrelas.forEach((e, i) => {
        const pos = mundo.estrelas[i];
        if (!pos) return;
        ctx.font = '30px sans-serif';
        const pulso = v.reduzirAnimacao ? 0 : Math.sin(tempo / 300 + i) * 3;
        if (e.estado === 'concluido' || e.estado === 'respondido') {
          ctx.fillStyle = e.correta ? '#4ADE80' : '#FBBF24';
          ctx.fillText(e.correta ? '★' : '☆', pos.x - 14, pos.y);
          ctx.font = 'bold 14px sans-serif'; ctx.fillText(e.correta ? '✓' : '!', pos.x - 4, pos.y - 28);
        } else {
          ctx.fillStyle = '#FFE500'; ctx.shadowColor = '#FFE500'; ctx.shadowBlur = v.reduzirAnimacao ? 0 : 12;
          ctx.fillText('★', pos.x - 14, pos.y + pulso); ctx.shadowBlur = 0;
        }
      });
      const portal = mundo.portal;
      ctx.fillStyle = v.portalLiberado ? '#00DDEB' : '#64748B'; ctx.fillRect(portal.x, 312, 68, 108);
      ctx.fillStyle = v.portalLiberado ? '#6315D9' : '#334155'; ctx.fillRect(portal.x + 7, 320, 54, 100);
      ctx.fillStyle = '#FFE500'; ctx.font = 'bold 36px sans-serif'; ctx.fillText(v.portalLiberado ? '?' : '🔒', portal.x + (v.portalLiberado ? 23 : 18), 380);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('PORTAL', portal.x + 2, 300);
      desenharAvatar(ctx, p, sprite.current, avatarRef.current);
      ctx.restore();
      // Minimapa do percurso
      const mx = 250; const mw = 400;
      ctx.fillStyle = '#00000066'; ctx.fillRect(mx, 8, mw, 6);
      estrelas.forEach((e, i) => { const pos = mundo.estrelas[i]; if (!pos) return; ctx.fillStyle = e.estado === 'concluido' ? (e.correta ? '#4ADE80' : '#FBBF24') : '#FFE500'; ctx.fillRect(mx + (pos.x / mundo.largura) * mw - 2, 5, 5, 12); });
      ctx.fillStyle = v.portalLiberado ? '#00DDEB' : '#94A3B8'; ctx.fillRect(mx + (mundo.portal.x / mundo.largura) * mw - 2, 4, 5, 14);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(mx + (p.x / mundo.largura) * mw, 11, 5, 0, Math.PI * 2); ctx.fill();
      if (tempo < bannerAte) {
        ctx.globalAlpha = Math.min(1, (bannerAte - tempo) / 500);
        ctx.fillStyle = '#00000088'; ctx.fillRect(250, 28, 400, 38);
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(area.nome, 450, 54); ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }
    }

    const loop = (tempo) => {
      const v = vivo.current;
      const dt = ultimo ? (tempo - ultimo) / 1000 : 0;
      ultimo = tempo;
      const parado = v.pausado || (typeof document !== 'undefined' && document.hidden);
      if (!parado) {
        const antes = p;
        p = passoFisica(p, entradaRef.current, mundo, dt);
        if (antes.noChao && p.vy < 0 && tempo - ultimoSalto > 250) { ultimoSalto = tempo; v.onSom?.('salto'); }
        if (Math.abs(p.x - antes.x) > 120) { v.onSom?.('queda'); }
        const area = indiceArea(p.x);
        if (area !== areaAnterior) { areaAnterior = area; bannerAte = tempo + 2600; }
        if (tempo > bloqueioGlobal) {
          const estrelas = v.eventos.filter((e) => e.tipo === 'estrela');
          for (const [i, e] of estrelas.entries()) {
            const pos = mundo.estrelas[i];
            if (e.estado !== 'pendente' || !pos || (cooldown.get(e.id) || 0) > tempo) continue;
            if (Math.abs(p.x + 14 - pos.x) < 38 && Math.abs(p.y + 20 - pos.y) < 50) {
              cooldown.set(e.id, tempo + 3000); bloqueioGlobal = tempo + 800;
              limparEntradaLocal(entradaRef.current); vivo.current.pausado = true;
              gravarPosicao(sessaoId, fase, p);
              v.onEvento?.(e);
              break;
            }
          }
          const portalEv = v.eventos.find((e) => e.tipo === 'portal');
          if (portalEv && portalEv.estado === 'pendente' && p.x + p.w > mundo.portal.x + 8) {
            if (v.portalLiberado && (cooldown.get(portalEv.id) || 0) <= tempo) {
              cooldown.set(portalEv.id, tempo + 3000); bloqueioGlobal = tempo + 800;
              limparEntradaLocal(entradaRef.current); vivo.current.pausado = true;
              gravarPosicao(sessaoId, fase, p);
              v.onEvento?.(portalEv);
            } else if (!v.portalLiberado) {
              p = { ...p, x: mundo.portal.x + 8 - p.w };
              if (tempo - ultimoAvisoPortal > 2500) { ultimoAvisoPortal = tempo; v.onPortalFechado?.(); }
            }
          }
        }
        if (tempo - ultimoSalvar > 80) { ultimoSalvar = tempo; gravarPosicao(sessaoId, fase, p); }
      }
      desenhar(tempo);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); limparEntradaLocal(entradaAtual); };
    // Dependências físicas apenas: eventos/portal chegam por ref e não reiniciam personagem ou câmera.
  }, [sessaoId, fase, nEstrelas, entradaRef, layoutVersao, sprite]);

  return (
    <canvas
      data-avatar={avatarPorId(avatarId).id}
      ref={canvas}
      width={LARGURA_TELA}
      height={ALTURA_TELA}
      data-testid="canvas-percurso"
      role="img"
      aria-label={rotuloAcessivel || 'Percurso da aventura. Use os botões na tela ou o teclado (setas, A, D, espaço). Modo acessível disponível no menu.'}
      className="block h-full w-full touch-none select-none object-contain"
      style={{ touchAction: 'none' }}
    />
  );
}

function limparEntradaLocal(entrada) {
  entrada.esquerda = false; entrada.direita = false; entrada.pular = false;
}
