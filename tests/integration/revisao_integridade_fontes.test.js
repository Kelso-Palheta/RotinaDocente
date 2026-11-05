import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { criarHandlerRevisao } from '../../frontend/src/infraestrutura/revisao/httpServidor.js';
import { hashRevisaoAcervo, lerQuestaoAcervo, listarAcervo } from '../../frontend/src/infraestrutura/revisao/acervoServidor.js';

const temporarios = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporarios.splice(0).map(dir => fs.rm(dir, { force: true, recursive: true })));
});
async function fixture(imagens = [{ id: 'figura-a', arquivo: 'imagens/figura-a.png' }]) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'revisao-hash-pixels-')); temporarios.push(base);
  const raiz = path.join(base, 'content/revisao-enem');
  await fs.mkdir(path.join(raiz, 'questoes'), { recursive: true }); await fs.mkdir(path.join(raiz, 'imagens'));
  const questao = { id: 'enem-2024-fingerprint', ano: 2024, tema: 'Arte', aplicacoes: ['regular'], imagens };
  const arquivo = path.join(raiz, 'questoes', `${questao.id}.json`);
  await fs.writeFile(arquivo, JSON.stringify(questao));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWXcAAAAASUVORK5CYII=', 'base64');
  for (const imagem of imagens) if (imagem.arquivo.startsWith('imagens/') && !imagem.arquivo.includes('..')) await fs.writeFile(path.join(raiz, imagem.arquivo), png);
  vi.spyOn(process, 'cwd').mockReturnValue(base);
  return { base, raiz, questao, arquivo, png };
}

describe('RV-INT-06 — revisão vinculada aos bytes do JSON e das imagens', () => {
  it('mudar os bytes de imagem invalida fingerprint sem alterar o hashFonte do JSON', async () => {
    const f = await fixture(); const original = await fs.readFile(f.arquivo);
    const fonte = await lerQuestaoAcervo(f.questao.id); const antes = await hashRevisaoAcervo(f.questao.id);
    expect(antes).toMatch(/^[a-f0-9]{64}$/); expect(await hashRevisaoAcervo(f.questao.id)).toBe(antes);
    const alterada = Buffer.from(f.png); alterada[alterada.length - 5] ^= 1;
    await fs.writeFile(path.join(f.raiz, 'imagens/figura-a.png'), alterada);
    expect(await hashRevisaoAcervo(f.questao.id)).not.toBe(antes);
    expect((await lerQuestaoAcervo(f.questao.id)).hashFonte).toBe(fonte.hashFonte);
    expect(await fs.readFile(f.arquivo)).toEqual(original);
    expect(Object.keys((await listarAcervo())[0]).sort()).toEqual(['id', 'ano', 'tema', 'aplicacoes', 'hashFonte'].sort());
  });
  it('inclui todas as imagens e não usa cache que esconda alteração na segunda referência', async () => {
    const f = await fixture([{ id: 'figura-z', arquivo: 'imagens/figura-z.png' }, { id: 'figura-a', arquivo: 'imagens/figura-a.png' }]);
    const antes = await hashRevisaoAcervo(f.questao.id);
    await fs.writeFile(path.join(f.raiz, 'imagens/figura-a.png'), Buffer.concat([f.png, Buffer.from('metadado alterado')]));
    expect(await hashRevisaoAcervo(f.questao.id)).not.toBe(antes);
  });
  it('mudança dos bytes de JSON também invalida a impressão da revisão, inclusive sem imagens', async () => {
    const f = await fixture([]); const antes = await hashRevisaoAcervo(f.questao.id);
    await fs.appendFile(f.arquivo, '\n');
    expect(await hashRevisaoAcervo(f.questao.id)).not.toBe(antes);
  });
  it.each(['ausente', 'assinatura', 'traversal', 'symlink'])('não assina revisão com referência inválida: %s', async modo => {
    const f = await fixture(); const img = path.join(f.raiz, 'imagens/figura-a.png');
    if (modo === 'ausente') await fs.rm(img);
    if (modo === 'assinatura') await fs.writeFile(img, 'não é uma imagem');
    if (modo === 'traversal') { f.questao.imagens[0].arquivo = 'imagens/../segredo.png'; await fs.writeFile(f.arquivo, JSON.stringify(f.questao)); }
    if (modo === 'symlink') { await fs.writeFile(path.join(f.base, 'fora.png'), f.png); await fs.rm(img); await fs.symlink(path.join(f.base, 'fora.png'), img); }
    await expect(hashRevisaoAcervo(f.questao.id)).rejects.toMatchObject({ status: 422 });
  });
});

describe('RV-INT — erros públicos deliberados, falhas internas sanitizadas', () => {
  function handler(erro) {
    return criarHandlerRevisao({ service: { catalogo: vi.fn().mockRejectedValue(erro) }, autenticar: async () => ({ tipo: 'professor', uid: 'u' }) });
  }
  const chamar = h => h(new Request('https://rotina.example/api/revisao/catalogo'), { params: { partes: ['catalogo'] } });
  it('preserva mensagem de validação marcada explicitamente como pública', async () => {
    const mensagem = 'As turmas devem conter de 1 a 100 alunos no total. Divida em salas menores.';
    const r = await chamar(handler(Object.assign(new Error(mensagem), { status: 422, publica: true })));
    expect(r.status).toBe(422); expect(await r.json()).toEqual({ error: mensagem });
  });
  it.each([false, undefined, 'true'])('oculta segredo se publica não for booleano true: %j', async publica => {
    const r = await chamar(handler(Object.assign(new Error('senha /srv/privado token'), { status: 422, publica })));
    expect(r.status).toBe(422); expect(JSON.stringify(await r.json())).not.toMatch(/senha|privado|token/);
  });
  it('não expõe erro500 mesmo se marcado público', async () => {
    const r = await chamar(handler(Object.assign(new Error('senha /srv/privado token'), { status: 500, publica: true })));
    expect(r.status).toBe(500); expect(JSON.stringify(await r.json())).not.toContain('senha');
  });
});
