import fs from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
const root=process.cwd().endsWith('frontend')?path.resolve('..'):process.cwd();
const ler=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
it('cada bloco tem curadoria própria, referências válidas e palavras presentes no original',()=>{
 const cenas=ler('content/revisao-enem/aulas/cenas.json').aulas;
 const visuais=ler('content/revisao-enem/aulas/visuais.json').aulas;
 const pasta=path.join(root,'content/revisao-enem/aulas/conteudos');let total=0;
 for(const f of fs.readdirSync(pasta).filter(f=>f.endsWith('.json'))){
  const a=ler('content/revisao-enem/aulas/conteudos/'+f),mapa=cenas[a.id]?.blocos;
  expect(Object.keys(mapa||{}).sort(),a.id).toEqual(a.blocos.map(b=>b.id).sort());
  expect(new Set(Object.values(mapa).map(c=>c.layout)).size,a.id).toBeGreaterThanOrEqual(3);
  for(const b of a.blocos){
   const c=mapa[b.id];total++;
   expect(c.tituloVisual.length).toBeGreaterThan(6);
   expect(c.destaques.length,`${a.id}/${b.id}`).toBeGreaterThanOrEqual(2);
   for(const palavra of c.destaques)expect(b.texto.toLocaleLowerCase('pt-BR').includes(palavra.toLocaleLowerCase('pt-BR')),`${a.id}/${b.id}: ${palavra}`).toBe(true);
   for(const id of c.imagemIds)expect(visuais[a.id].imagens.some(i=>i.id===id),`${a.id}/${b.id}/${id}`).toBe(true);
   expect(['abertura','obra','comparacao','processo','conexoes','sintese']).toContain(c.layout);
  }
 }
 expect(total).toBe(304);
});
it('manguebeat, baião e Lenine não reutilizam viola como exemplo nem observações de O Violeiro',()=>{
 const b=ler('content/revisao-enem/aulas/cenas.json').aulas['musica-popular-regional'].blocos;
 for(const id of ['exemplo-mangue','exemplo-baiao','exemplo-lenine'])expect(b[id].imagemIds).not.toContain('almeida-junior-violeiro');
 expect(b['exemplo-mangue'].tituloVisual).toMatch(/mangue|mistura|referências/i);
 expect(b['imagem-violeiro'].imagemIds).toContain('almeida-junior-violeiro');
 expect(new Set(Object.values(b).map(c=>c.tituloVisual)).size).toBe(Object.keys(b).length);
});
