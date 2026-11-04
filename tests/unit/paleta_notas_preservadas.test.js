import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ler = p => fs.readFileSync(path.join(raiz, 'frontend/src', p), 'utf8');
it('PV-13: distribuição mantém a cor crítica original como exceção da nota', () => {
  expect(ler('components/analytics/DistribuicaoChart.jsx')).toMatch(/critico:\s*'#f60c49'/);
});
it('PV-14: legenda abaixo do mínimo mantém sua cor de nota original', () => {
  expect(ler('components/analytics/ComparativoTurmasChart.jsx')).toMatch(/bg-\[#f60c49\].*Abaixo do mínimo/);
});
