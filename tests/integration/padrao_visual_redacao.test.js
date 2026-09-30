import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REDACAO_DIR = fileURLToPath(new URL('../../frontend/src/app/redacao', import.meta.url));
const RENDERER = fileURLToPath(new URL('../../frontend/src/lib/redacao/renderFeedback.jsx', import.meta.url));

const OFF_BRAND = /\b(violet|indigo|purple)-\d{2,3}\b/g;

const listSourceFiles = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const read = (f) => readFileSync(f, 'utf8');
const allFiles = [...listSourceFiles(REDACAO_DIR), RENDERER];

describe('IT-13 (RN-50): Padrão visual navy+pink do módulo de redação', () => {
  it('nenhum arquivo do módulo usa a paleta off-brand violeta/índigo/roxo', () => {
    const offenders = allFiles
      .map((f) => ({ file: f.split('/').slice(-2).join('/'), hits: read(f).match(OFF_BRAND) || [] }))
      .filter((x) => x.hits.length > 0);
    expect(offenders).toEqual([]);
  });

  it('a tela de correção usa os tokens de marca (pink #f60c49, navy #101942, btn-brand)', () => {
    const src = read(join(REDACAO_DIR, 'page.js'));
    expect(src).toMatch(/#f60c49/);
    expect(src).toMatch(/#101942/);
    expect(src).toMatch(/btn-brand-/);
  });

  it('o renderizador de feedback usa acento pink no lugar do violeta', () => {
    const src = read(RENDERER);
    expect(src).toMatch(/#f60c49/);
    expect(src).not.toMatch(OFF_BRAND);
  });

  it('a visão do resultado pelo aluno usa os tokens de marca', () => {
    const src = read(join(REDACAO_DIR, 'aluno', '[id]', 'page.js'));
    expect(src).toMatch(/#f60c49/);
    expect(src).not.toMatch(OFF_BRAND);
  });
});
