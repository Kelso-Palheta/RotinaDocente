import { expect, it } from 'vitest';
import { criarJogador, passoFisica } from '@/dominio/revisao-autonoma/plataforma';
import { criarMundoV2 } from '@/dominio/revisao-autonoma/plataformaV2';
function jogarPercurso(mundo, maxFrames = 60 * 120) {
  let p = criarJogador(mundo);
  const coletadas = new Set();
  const checkpoints = new Set();
  let mortes = 0;
  let frames = 0;
  while (frames++ < maxFrames) {
    const frente = p.x + p.w;
    let pular = false;
    const espinho = mundo.obstaculos.find((o) => o.x + o.w > p.x && o.x - frente < 70 && o.x - frente > -10);
    if (espinho && p.noChao) pular = true;
    const alvo = mundo.plataformas.find((b) => b.x + b.w > p.x + 5 && b.x - frente < 95 && b.x >= p.x - 5);
    const noTopo = mundo.plataformas.some((b) => Math.abs(p.y + p.h - b.y) < 1.5 && p.x + p.w > b.x && p.x < b.x + b.w);
    if (alvo && p.noChao && !noTopo && p.y + p.h - alvo.y <= 100 && alvo.x - frente > 0) pular = true;
    if (noTopo && p.noChao) {
      const b = mundo.plataformas.find((q) => Math.abs(p.y + p.h - q.y) < 1.5 && p.x + p.w > q.x && p.x < q.x + q.w);
      const proxima = mundo.plataformas.find((q) => q.x > b.x + b.w - 2 && q.x - (b.x + b.w) < 130 && b.y - q.y <= 100 && b.y - q.y >= -5);
      if (proxima && b.x + b.w - frente < 22) pular = true;
    }
    const antes = p.x;
    p = passoFisica(p, { direita: true, pular }, mundo, 1 / 60);
    if (p.x < antes - 100) mortes++;
    p.checkpoint && checkpoints.add(p.checkpoint.x);
    for (const [i, e] of mundo.estrelas.entries()) {
      if (Math.abs(p.x + 14 - e.x) < 38 && Math.abs(p.y + 20 - e.y) < 50) coletadas.add(i);
    }
    if (p.x + p.w > mundo.portal.x) return { coletadas, checkpoints, mortes, frames, chegou: true };
  }
  return { coletadas, checkpoints, mortes, frames, chegou: false };
}


it.each([1,2,3,4,5,6])('fase %s do novo layout permite alcançar estrelas e portal com a física real', fase => {
 for(const n of [1,2,3]) { const r=jogarPercurso(criarMundoV2(fase,n,3));expect(r.chegou).toBe(true);expect(r.coletadas.size).toBe(n); }
});
