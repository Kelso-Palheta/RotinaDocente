import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
const raiz=new URL('../../content/revisao-enem/',import.meta.url);
describe('RV-REV-02 — aplicação regular regional de 2025', () => {
  it('mantém D3 como regular, com edição explícita, sem misturar com reaplicação D5', () => {
    const fontes=JSON.parse(fs.readFileSync(new URL('fontes.json',raiz),'utf8')).aplicacoes;
    const regular=fontes.find(f=>f.ano===2025&&f.aplicacao==='regular');
    const reap=fontes.find(f=>f.ano===2025&&f.aplicacao==='reaplicacao');
    const arquivos=fs.readdirSync(fileURLToPath(new URL('questoes/',raiz))).filter(n=>n.includes('2025-reaplicacao-d3'));
    expect(arquivos.length).toBeGreaterThan(0);
    for(const nome of arquivos){
      const q=JSON.parse(fs.readFileSync(new URL(`questoes/${nome}`,raiz),'utf8'));
      expect(q.aplicacoes).toEqual(['regular']);
      expect(q.edicao).toBe('belem-ananindeua-marituba');
      expect(q.fontes.every(f=>f.aplicacao==='regular')).toBe(true);
      expect(regular.questaoIds).toContain(q.id);
      expect(reap.questaoIds).not.toContain(q.id);
    }
  });
});
