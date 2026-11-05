import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
const raiz = fileURLToPath(new URL('../../content/revisao-enem/', import.meta.url));
const fontes = JSON.parse(fs.readFileSync(path.join(raiz,'fontes.json'),'utf8')).aplicacoes;
describe('RV-REV-01 — fontes da revisão', () => {
  it('mantém PPL/reaplicação de 2024 no mesmo conteúdo sem excluir uma modalidade', () => {
    const ppl = fontes.find(f => f.ano === 2024 && f.aplicacao === 'ppl');
    const reap = fontes.find(f => f.ano === 2024 && f.aplicacao === 'reaplicacao');
    expect(reap.provaUrl).toBe(ppl.provaUrl);
    expect(reap.gabaritoUrl).toBe(ppl.gabaritoUrl);
    expect(reap.questaoIds).toEqual(ppl.questaoIds);
    for (const id of ppl.questaoIds) {
      const q = JSON.parse(fs.readFileSync(path.join(raiz,'questoes',`${id}.json`),'utf8'));
      expect(q.aplicacoes).toContain('reaplicacao');
      expect(q.fontes.some(f => f.aplicacao === 'reaplicacao')).toBe(true);
    }
  });
  it('fontes regulares anteriores a 2017 apontam o segundo dia de Linguagens', () => {
    for (const fonte of fontes.filter(f => f.ano < 2017 && f.aplicacao === 'regular')) {
      expect(fonte.provaUrl, String(fonte.ano)).not.toMatch(/dia1|D1|01_AZUL/i);
      expect(fonte.observacoes, String(fonte.ano)).not.toMatch(/1º dia/);
    }
  });
});
