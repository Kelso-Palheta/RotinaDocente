import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ler = p => fs.readFileSync(path.join(root, 'frontend/src', p), 'utf8');
const hueAntigo = /\b(?:bg|text|border|from|via|to|ring)-(?:red|rose|blue|green|emerald|amber|yellow|cyan|sky)-\d{2,3}\b/;
it('PV-10: planos da landing usam somente a identidade nova nos destaques', () => {
  expect(ler('components/landing/LandingPricing.jsx')).not.toMatch(hueAntigo);
});
it('PV-11: feedback da conexão de IA também usa a nova paleta', () => {
  expect(ler('components/ai/ModalConectarIA.jsx')).not.toMatch(hueAntigo);
});
it('PV-12: faixas e pareceres do boletim não mantêm o rosa RGB antigo', () => {
  expect(ler('lib/aluno/boletim-pdf.js')).not.toMatch(/(?:255\s*,\s*242\s*,\s*246|253\s*,\s*228\s*,\s*236|212\s*,\s*8\s*,\s*64)/);
});
