'use client';
import { useEffect, useRef } from 'react';
import { avatarPorId } from '@/dominio/revisao-autonoma/avatares';
const imagens = new Map();
export function useSpriteAvatar(avatarId) {
  const ref = useRef(null);
  useEffect(() => {
    const avatar = avatarPorId(avatarId);
    let img = imagens.get(avatar.id);
    if (!img) { img = new Image(); img.src = avatar.imagem; imagens.set(avatar.id,img); }
    ref.current = img;
  }, [avatarId]);
  return ref;
}
/** Aparência cosmética: preserva jogador/hitbox/posição e não concede pontos. */
export function desenharAvatar(ctx, jogador, imagem, avatarId) {
  if (imagem?.complete && imagem.naturalWidth > 0 && typeof ctx.drawImage === 'function') {
    ctx.save();ctx.translate(jogador.x+14,jogador.y+20);
    if (jogador.vx < 0) ctx.scale(-1,1);
    ctx.drawImage(imagem,-18,-24,36,48);ctx.restore();
    return;
  }
  const avatar=avatarPorId(avatarId);
  ctx.fillStyle=avatar.cor;ctx.fillRect(jogador.x,jogador.y+16,28,28);
  ctx.fillStyle='#FFFDF7';ctx.fillRect(jogador.x+3,jogador.y,22,20);
  ctx.fillStyle='#25104A';ctx.fillRect(jogador.x+7,jogador.y+7,14,6);
}
