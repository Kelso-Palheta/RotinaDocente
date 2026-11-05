import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
it('PV-15: a marca continua legível nos cabeçalhos e rodapés escuros', () => {
  for (const file of ['components/Dashboard.js', 'components/landing/LandingFooter.jsx']) {
    const source = fs.readFileSync(path.join(root, 'frontend/src', file), 'utf8');
    expect(source).toMatch(/Rotina<span className="text-\[#B9A6EF\]">Docente/);
  }
});
