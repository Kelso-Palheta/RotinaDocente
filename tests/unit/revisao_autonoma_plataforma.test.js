import { describe, expect, it } from 'vitest';
import { criarMundo, criarJogador, passoFisica } from '@/dominio/revisao-autonoma/plataforma';
describe('Plataforma 2D — física independente da aprendizagem',()=>{
 it('movimenta, salta e pousa sem atravessar o chão',()=>{
  const mundo=criarMundo(1);let p=criarJogador(mundo);
  for(let i=0;i<40;i++)p=passoFisica(p,{direita:true},mundo,1/60);
  expect(p.x).toBeGreaterThan(80);expect(p.noChao).toBe(true);
  p=passoFisica(p,{pular:true},mundo,1/60);expect(p.vy).toBeLessThan(0);
  for(let i=0;i<140;i++)p=passoFisica(p,{},mundo,1/60);
  expect(p.noChao).toBe(true);expect(p.y+p.h).toBeCloseTo(mundo.chao,3);
 });
 it('colisão com obstáculo retorna ao checkpoint sem reduzir aprendizagem',()=>{
  const m=criarMundo(1),p=criarJogador(m);const perigo=m.obstaculos[0];
  const r=passoFisica({...p,x:perigo.x,y:perigo.y,noChao:true},{},m,1/60);
  expect(r.x).toBe(p.checkpoint.x);expect(r).not.toHaveProperty('acertos');
 });
 it('colisão lateral com plataforma não permite atravessar; estrelas e portal fazem parte da fase',()=>{
  const m=criarMundo(2);expect(m.plataformas.length).toBeGreaterThan(2);expect(m.estrelas.length).toBeGreaterThan(2);expect(m.portal.x).toBeGreaterThan(1000);
  const plat=m.plataformas[0];const p={...criarJogador(m),x:plat.x-25,y:plat.y+3,vx:0};
  const r=passoFisica(p,{direita:true},m,0.033);expect(r.x+r.w).toBeLessThanOrEqual(plat.x+0.01);
 });
});
