import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { opcoesConfiguracao, criarMundoV2, distribuirReforco } from '@/dominio/revisao-autonoma/plataformaV2';
import { AVATARES_AVENTURA, validarAvatar, AVATAR_PADRAO } from '@/dominio/revisao-autonoma/avatares';
describe('Aventura: seis fases, estrelas e oito avatares', () => {
 it('oferece seis fases e 24 questões sem inventar material', () => {
  expect(opcoesConfiguracao(24).sugerida).toEqual({fases:6,estrelasPorFase:3,necessarias:24});
  expect(opcoesConfiguracao(100).opcoes.every(o=>o.fases<=6 && o.necessarias<=24)).toBe(true);
  expect(opcoesConfiguracao(5).opcoes.every(o=>o.necessarias<=5)).toBe(true);
  expect(distribuirReforco(24)).toEqual([4,4,4,4,4,4]);
 });
 it.each([1,2,3])('%s estrelas: primeira estrela fica na tela inicial no novo layout', n => {
  expect(criarMundoV2(1,n,3).estrelas[0].x).toBeLessThan(900);
  expect(criarMundoV2(1,n,3).estrelas).toHaveLength(n);
 });
 it('preserva a posição do layout antigo e varia os percursos das fases extras', () => {
  expect(criarMundoV2(1,1,2).estrelas[0].x).toBe(3155);
  expect(criarMundoV2(1,2,2).estrelas[0].x).toBe(1765);
  expect(criarMundoV2(4,3,3).plataformas).not.toEqual(criarMundoV2(1,3,3).plataformas);
 });
 it('oito avatares locais distintos; nenhum caminho arbitrário aceito', () => {
  expect(AVATARES_AVENTURA).toHaveLength(8);
  const imagens=AVATARES_AVENTURA.map(a=>fs.readFileSync(path.resolve(__dirname,'../../frontend/public',a.imagem.slice(1)),'utf8'));
  expect(new Set(imagens).size).toBe(8);
  expect(AVATARES_AVENTURA.some(a=>a.perfil==='masculino')).toBe(true);
  expect(AVATARES_AVENTURA.some(a=>a.perfil==='feminino')).toBe(true);
  expect(validarAvatar()).toBe(AVATAR_PADRAO);
  for(const a of AVATARES_AVENTURA)expect(validarAvatar(a.id)).toBe(a.id);
  expect(()=>validarAvatar('https://outro.site/avatar.svg')).toThrow();
 });
});
