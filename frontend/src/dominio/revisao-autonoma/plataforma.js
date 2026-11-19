/** Física pura; obstáculos e estrelas nunca alteram resultados pedagógicos. */
export function criarMundo(fase = 1) {
  const deslocamento = (fase % 3) * 10;
  return {
    largura: 2200, altura: 480, chao: 420,
    plataformas: [
      { x: 290, y: 345, w: 190, h: 28 },
      { x: 560, y: 290 - deslocamento, w: 180, h: 28 },
      { x: 1050, y: 340, w: 180, h: 28 },
      { x: 1320, y: 285 - deslocamento, w: 200, h: 28 },
      { x: 1620, y: 340, w: 160, h: 28 },
    ],
    obstaculos: [{ x: 540, y: 394, w: 44, h: 26 }, { x: 1300, y: 394, w: 46, h: 26 }, { x: 1840, y: 394, w: 46, h: 26 }],
    estrelas: [
      { x: 380, y: 300 },
      { x: 650, y: 245 - deslocamento },
      { x: 1140, y: 295 },
      { x: 1420, y: 240 - deslocamento },
      { x: 1970, y: 355 },
    ],
    portal: { x: 2090, y: 320, w: 66, h: 100 },
  };
}
export function criarJogador(mundo) {
  return { x: 60, y: mundo.chao - 44, w: 28, h: 44, vx: 0, vy: 0, noChao: true, checkpoint: { x: 60, y: mundo.chao - 44 } };
}
const colide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export function passoFisica(jogador, entrada, mundo, delta) {
  const dt = Math.max(0, Math.min(Number(delta) || 0, 0.033));
  const p = { ...jogador };
  p.vx = (Number(Boolean(entrada.direita)) - Number(Boolean(entrada.esquerda))) * 260;
  if (entrada.pular && p.noChao) { p.vy = -580; p.noChao = false; }
  p.x = Math.max(0, Math.min(mundo.largura - p.w, p.x + p.vx * dt));
  for (const bloco of mundo.plataformas) {
    if (colide(p, bloco)) p.x = p.vx > 0 ? bloco.x - p.w : p.vx < 0 ? bloco.x + bloco.w : p.x;
  }
  const yAnterior = jogador.y;
  p.vy = Math.min(850, p.vy + 1550 * dt);
  p.y += p.vy * dt;
  p.noChao = false;
  for (const bloco of mundo.plataformas) {
    if (!colide(p, bloco)) continue;
    if (p.vy >= 0 && yAnterior + p.h <= bloco.y + 1) { p.y = bloco.y - p.h; p.vy = 0; p.noChao = true; }
    else if (p.vy < 0 && yAnterior >= bloco.y + bloco.h - 1) { p.y = bloco.y + bloco.h; p.vy = 0; }
  }
  if (p.y + p.h >= mundo.chao) { p.y = mundo.chao - p.h; p.vy = 0; p.noChao = true; }
  if (mundo.obstaculos.some(o => colide(p, o)) || p.y > mundo.altura + 100) {
    return { ...p, x: p.checkpoint.x, y: p.checkpoint.y, vx: 0, vy: 0, noChao: true };
  }
  if (p.x > 1000 && p.noChao && p.y + p.h === mundo.chao) p.checkpoint = { x: 1000, y: mundo.chao - p.h };
  return p;
}
