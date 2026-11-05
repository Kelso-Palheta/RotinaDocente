import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,it,expect} from 'vitest';
const raiz=fileURLToPath(new URL('../../content/revisao-enem/questoes/',import.meta.url));
const ler=id=>JSON.parse(fs.readFileSync(raiz+id+'.json','utf8'));
describe('Fidelidade dos rascunhos recuperados por OCR',()=>{
 it('não incorpora marcadores OCR às alternativas',()=>{
  for(const id of ['enem-2014-reaplicacao-arte-98','enem-2021-regular-arte-20']){
   const q=ler(id);
   for(const a of q.alternativas)expect(a.texto,q.id+':'+a.id).not.toMatch(/\s+[OQ&()0-9]{1,5}$/);
  }
 });
 it('separa as legendas visuais do comando em 2016 PPL 111',()=>{
  const q=ler('enem-2016-ppl-arte-111');
  expect(q.enunciado).not.toContain('Samba em terreiro');
  expect(q.alternativas).toHaveLength(5);
  expect(q.imagens).toHaveLength(5);
 });
 it('representa os cadernos compartilhados de 2017 sem duplicar questões',()=>{
  const q=ler('enem-2017-ppl-arte-20');
  expect(q.aplicacoes).toContain('reaplicacao');
  expect(q.fontes.some(f=>f.aplicacao==='reaplicacao'&&f.numeroQuestao===32)).toBe(true);
 });
});
