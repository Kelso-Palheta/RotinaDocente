import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { MODALIDADES_PADRAO } from '@/components/aula-gamificada/constantes';

describe('Capas fotográficas do catálogo, mantendo as URLs e miniaturas existentes', () => {
  it.each(MODALIDADES_PADRAO)('$id usa imagem raster local otimizada, sem placeholder vetorial', async (jogo) => {
    const arquivo = path.resolve('public', jogo.capa.replace(/^\//, ''));
    const svg = fs.readFileSync(arquivo, 'utf8');
    const imagens = [...svg.matchAll(/href="data:image\/(?:webp|jpeg|png);base64,([^"]+)"/g)];
    expect(imagens.length).toBeGreaterThan(0);
    expect(svg).toContain('viewBox="0 0 640 360"');
    expect(Buffer.byteLength(svg)).toBeLessThan(500_000);
    for (const [, base64] of imagens) {
      const dados = await sharp(Buffer.from(base64, 'base64')).metadata();
      expect(dados.width).toBeGreaterThanOrEqual(600);
      expect(dados.height).toBeGreaterThanOrEqual(320);
    }
    expect(svg).not.toMatch(/href="https?:\/\//);
  });
});
