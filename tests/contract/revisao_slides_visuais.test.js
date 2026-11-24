import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from '../../frontend/node_modules/sharp/lib/index.js';
const raiz=process.cwd().endsWith('frontend')?path.resolve('..'):process.cwd();
const pasta=path.join(raiz,'content/revisao-enem/aulas/conteudos');
const manifesto=path.join(raiz,'content/revisao-enem/aulas/visuais.json');
describe('SLIDE-01: cobertura e integridade das mídias explicativas',()=>{
 it('cobre cada uma das34aulas com cena, exemplos reais e roteiro visual específico',()=>{
  const dados=JSON.parse(fs.readFileSync(manifesto,'utf8'));
  const ids=fs.readdirSync(pasta).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
  expect(Object.keys(dados.aulas).sort()).toEqual(ids.sort());
  expect(ids).toHaveLength(34);
  const roteiros=new Set();
  for(const [id,a] of Object.entries(dados.aulas)){
   expect(['obra','comparacao','sequencia','camadas','percurso','relacoes']).toContain(a.tipoCena);
   expect(a.imagens.length,id).toBeGreaterThanOrEqual(1);
   expect(a.pontos.length,id).toBeGreaterThanOrEqual(3);
   expect(a.pontos.every(p=>p.titulo?.length>2&&p.texto?.length>20),id).toBe(true);
   roteiros.add(JSON.stringify(a.pontos));
  }
  expect(roteiros.size).toBe(34);
 });
 it('cada arquivo é local, decodificável, com resolução/crédito/licença e fonteHTTPS',async()=>{
  const dados=JSON.parse(fs.readFileSync(manifesto,'utf8'));
  for(const a of Object.values(dados.aulas))for(const i of a.imagens){
   expect(i.src).toMatch(/^\/revisao\/visuais\/[a-z0-9-]+\.(webp|jpg|png)$/);
   expect(i.src).not.toMatch(/esquema/);
   expect(i.alt.length).toBeGreaterThan(15);
   expect(i.credito.length).toBeGreaterThan(3);
   expect(i.licenca.length).toBeGreaterThan(2);
   expect(new URL(i.fonteUrl).protocol).toBe('https:');
   expect(new URL(i.licencaUrl).protocol).toBe('https:');
   const file=path.join(raiz,'frontend/public',i.src);
   const info=await sharp(file).metadata();
   expect(Math.max(info.width,info.height),i.src).toBeGreaterThanOrEqual(600);
   expect(fs.statSync(file).size,i.src).toBeLessThan(900000);
  }
 });
});
