import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,it,expect} from 'vitest';
const raiz=fileURLToPath(new URL('../../content/revisao-enem/',import.meta.url));
const fontes=JSON.parse(fs.readFileSync(raiz+'fontes.json','utf8'));
const questoes=fs.readdirSync(raiz+'questoes').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(raiz+'questoes/'+f,'utf8')));
describe('Continuação do acervo oficial de Arte',()=>{
 it('inclui questões reais de todos os anos do recorte 2009–2025',()=>{
  for(let ano=2009;ano<=2025;ano++)expect(questoes.some(q=>q.ano===ano),String(ano)).toBe(true);
 });
 it('integra cada questão pendente ao inventário sem promover rascunhos automaticamente',()=>{
  for(const q of questoes){
   for(const app of q.aplicacoes)expect(fontes.aplicacoes.find(f=>f.ano===q.ano&&f.aplicacao===app)?.questaoIds,q.id).toContain(q.id);
   if(q.status==='rascunho')expect(q.revisao.explicacoes,q.id).toBe(false);
  }
 });
 it('registra o percurso dos cadernos e as exclusões de curadoria, sem imagens órfãs',()=>{
  const curadoria=JSON.parse(fs.readFileSync(raiz+'curadoria.json','utf8'));
  expect(curadoria.schemaVersion).toBe(1);
  expect(curadoria.provas.length).toBeGreaterThan(25);
  for(const p of curadoria.provas){
   expect(p.sha256Prova).toMatch(/^[a-f0-9]{64}$/);
   expect(p.sha256Gabarito).toMatch(/^[a-f0-9]{64}$/);
   expect(p.itens.length).toBeGreaterThanOrEqual(40);
   for(const item of p.itens){
    expect(['incluida','fora_do_recorte','curadoria_pendente','anulada']).toContain(item.decisao);
    expect(item.justificativa.length).toBeGreaterThan(15);
    if(item.decisao==='incluida')expect(questoes.some(q=>q.id===item.questaoId)).toBe(true);
   }
  }
  const usadas=new Set(questoes.flatMap(q=>q.imagens.map(i=>i.arquivo.slice(8))));
  for(const img of fs.readdirSync(raiz+'imagens').filter(f=>/\.(png|jpe?g|webp)$/i.test(f)))expect(usadas.has(img),img).toBe(true);
 });
});
