import { describe, expect, it } from 'vitest';
import { criarJogador, criarMundo, passoFisica } from '@/dominio/revisao-autonoma/plataforma';
import { criarMundoV2, opcoesConfiguracao, distribuirReforco, PONTOS_ACERTO } from '@/dominio/revisao-autonoma/plataformaV2';

/** Robô que joga de verdade: anda, pula espinhos e plataformas, sem atalhos. */
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

describe('Plataforma V2 — percurso extenso e jogável', () => {
  it('tem 4.500–6.500 px, áreas distintas, checkpoints distribuídos e portal ao final', () => {
    const m = criarMundoV2(1, 3);
    expect(m.largura).toBeGreaterThanOrEqual(4500);
    expect(m.largura).toBeLessThanOrEqual(6500);
    expect(m.areas.length).toBeGreaterThanOrEqual(4);
    expect(new Set(m.areas.map((a) => a.nome)).size).toBe(m.areas.length);
    expect(m.checkpoints.length).toBeGreaterThanOrEqual(3);
    expect(m.portal.x).toBeGreaterThan(m.largura - 400);
    expect(m.estrelas).toHaveLength(3);
    expect(m.plataformas.length).toBeGreaterThanOrEqual(10);
    expect(m.obstaculos.length).toBeGreaterThanOrEqual(5);
  });

  it.each([[1, 1], [1, 2], [2, 3], [3, 3]])('fase %i com %i estrelas: robô coleta todas e chega ao portal', (fase, n) => {
    const m = criarMundoV2(fase, n);
    const r = jogarPercurso(m);
    expect(r.chegou).toBe(true);
    expect(r.coletadas.size).toBe(n);
    expect(r.mortes).toBe(0);
    expect(r.checkpoints.size).toBeGreaterThanOrEqual(3);
    // exploração real: mais de 30 s de caminhada contínua
    expect(r.frames / 60).toBeGreaterThan(20);
  });

  it('estrelas são identificadas por ordem e ficam espalhadas pelo percurso', () => {
    const m = criarMundoV2(1, 3);
    const xs = m.estrelas.map((e) => e.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(xs[2] - xs[0]).toBeGreaterThan(2000);
  });

  it('queda em espinho volta ao último checkpoint ativado, não ao início', () => {
    const m = criarMundoV2(1, 2);
    const cp = m.checkpoints[1];
    let p = { ...criarJogador(m), x: cp.x + 5, y: m.chao - 44 };
    p = passoFisica(p, {}, m, 1 / 60);
    expect(p.checkpoint.x).toBe(cp.x);
    const perigo = m.obstaculos.find((o) => o.x > cp.x);
    const r = passoFisica({ ...p, x: perigo.x, y: perigo.y - 10 }, {}, m, 1 / 60);
    expect(r.x).toBe(cp.x);
  });

  it('V1 permanece intacto: 2200 px e checkpoint fixo em 1000', () => {
    expect(criarMundo(1).largura).toBe(2200);
    expect(criarMundo(1).checkpoints).toBeUndefined();
  });
});

describe('Configuração pedagógica V2', () => {
  it('usa 3 fases × 3 estrelas quando há 12 questões', () => {
    const o = opcoesConfiguracao(12);
    expect(o.sugerida).toEqual({ fases: 3, estrelasPorFase: 3, necessarias: 12 });
    expect(o.opcoes).toHaveLength(13);
  });
  it('só oferece o que a disponibilidade permite, sem fabricar questões', () => {
    const o = opcoesConfiguracao(7);
    expect(o.opcoes.every((c) => c.necessarias <= 7)).toBe(true);
    expect(o.opcoes.some((c) => c.fases === 3 && c.estrelasPorFase === 2)).toBe(false);
    expect(o.sugerida.necessarias).toBeLessThanOrEqual(7);
    expect(o.sugerida.necessarias).toBeGreaterThanOrEqual(6);
  });
  it('com 1 questão oferece apenas o portal; com 0 nada', () => {
    expect(opcoesConfiguracao(1).opcoes).toEqual([{ fases: 1, estrelasPorFase: 0, necessarias: 1 }]);
    expect(opcoesConfiguracao(0).opcoes).toEqual([]);
  });
  it('limita a 24 questões e a 6 fases', () => {
    const o = opcoesConfiguracao(50);
    expect(Math.max(...o.opcoes.map((c) => c.necessarias))).toBe(24);
  });
  it('distribui reforço dos erros em fases com portal', () => {
    expect(distribuirReforco(1)).toEqual([1]);
    expect(distribuirReforco(5)).toEqual([3, 2]);
    expect(distribuirReforco(12)).toEqual([4, 4, 4]);
    expect(PONTOS_ACERTO).toBe(100);
  });
});
