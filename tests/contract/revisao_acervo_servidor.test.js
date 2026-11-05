import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { listarAcervo, lerQuestaoAcervo, lerImagemAcervo, validarImagensAcervo } from '../../frontend/src/infraestrutura/revisao/acervoServidor.js';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const raiz = path.join(repo, 'content/revisao-enem');
const temporarios = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporarios.splice(0).map(p => fs.rm(p, { recursive: true, force: true })));
});

async function fixture(imagens = []) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'revisao-acervo-servidor-'));
  temporarios.push(base);
  const acervo = path.join(base, 'content/revisao-enem');
  await fs.mkdir(path.join(acervo, 'questoes'), { recursive: true });
  await fs.mkdir(path.join(acervo, 'imagens'));
  const questao = { id: 'enem-2024-teste', ano: 2024, tema: 'Arte', aplicacoes: ['regular'], imagens };
  await fs.writeFile(path.join(acervo, 'questoes', `${questao.id}.json`), JSON.stringify(questao));
  vi.spyOn(process, 'cwd').mockReturnValue(base);
  return { base, acervo, questao };
}

describe('RV-INT-03 — acervo privado no servidor', () => {
  it('lista somente metadados, sem transcrição, gabarito ou explicações', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(repo, 'frontend'));
    const lista = await listarAcervo();
    expect(lista).toHaveLength(197);
    for (const item of lista) {
      expect(Object.keys(item).sort()).toEqual(['id', 'ano', 'tema', 'aplicacoes', 'hashFonte'].sort());
      expect(item.hashFonte).toMatch(/^[a-f0-9]{64}$/);
    }
    lista[0].aplicacoes.push('alteracao');
    expect((await listarAcervo())[0].aplicacoes).not.toContain('alteracao');
  });

  it('usa SHA256 dos bytes originais e devolve cópias independentes, preservando a fonte', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(repo);
    const [item] = await listarAcervo();
    const arquivo = path.join(raiz, 'questoes', `${item.id}.json`);
    const antes = await fs.readFile(arquivo);
    const original = JSON.parse(antes);
    const recebido = await lerQuestaoAcervo(item.id);
    expect(recebido.hashFonte).toBe(createHash('sha256').update(antes).digest('hex'));
    expect(recebido.questao).toEqual(original);
    recebido.questao.gabarito = 'INVALIDO';
    recebido.questao.imagens.length = 0;
    expect((await lerQuestaoAcervo(item.id)).questao).toEqual(original);
    expect(await fs.readFile(arquivo)).toEqual(antes);
  });

  it.each(['../fontes', 'enem-2024-../../segredo', '/etc/passwd', 'enem-2024-a%2f..', null, ['enem-2024-teste']])('rejeita ID inválido sem expor o sistema de arquivos: %j', async id => {
    await expect(lerQuestaoAcervo(id)).rejects.toMatchObject({ status: 400 });
  });

  it('nega ID válido inexistente com 404 e mensagem sem caminhos', async () => {
    try { await lerQuestaoAcervo('enem-2024-inexistente'); expect.fail('Deveria negar'); }
    catch (erro) { expect(erro.status).toBe(404); expect(erro.message).not.toContain(repo); }
  });

  it('lê imagem original como Buffer com MIME real e nega a imagem de outra questão', async () => {
    const lista = await listarAcervo();
    const { questao } = await lerQuestaoAcervo(lista[0].id);
    const imagem = questao.imagens[0];
    const leitura = await lerImagemAcervo(questao.id, imagem.id);
    expect(Buffer.isBuffer(leitura.buffer)).toBe(true);
    expect(leitura.mime).toBe('image/png');
    expect(leitura.buffer).toEqual(await fs.readFile(path.join(raiz, imagem.arquivo)));
    const outra = lista.find(q => q.id !== questao.id);
    await expect(lerImagemAcervo(outra.id, imagem.id)).rejects.toMatchObject({ status: 404 });
    expect(await validarImagensAcervo(questao)).toBe(true);
    expect(await validarImagensAcervo({ imagens: [] })).toBe(true);
  });

  it.each(['../fora.png', 'imagens/../fora.png', 'imagens\\fora.png', 'imagens/a.svg', '/imagens/a.png'])('nega referência insegura: %s', async arquivo => {
    const { questao } = await fixture([{ id: 'imagem-teste', arquivo }]);
    await expect(lerImagemAcervo(questao.id, 'imagem-teste')).rejects.toMatchObject({ status: 400 });
    await expect(validarImagensAcervo(questao)).rejects.toMatchObject({ status: 422 });
  });

  it('nega symlink de imagem que sai do diretório autorizado', async () => {
    const { base, acervo, questao } = await fixture([{ id: 'imagem-teste', arquivo: 'imagens/escape.png' }]);
    await fs.writeFile(path.join(base, 'fora.png'), Buffer.from('89504e470d0a1a0a', 'hex'));
    await fs.symlink(path.join(base, 'fora.png'), path.join(acervo, 'imagens/escape.png'));
    await expect(lerImagemAcervo(questao.id, 'imagem-teste')).rejects.toMatchObject({ status: 400 });
    await expect(validarImagensAcervo(questao)).rejects.toMatchObject({ status: 422 });
  });

  it('nega arquivo ausente ou bytes incompatíveis com o tipo declarado', async () => {
    const { acervo, questao } = await fixture([{ id: 'imagem-teste', arquivo: 'imagens/ausente.png' }]);
    await expect(lerImagemAcervo(questao.id, 'imagem-teste')).rejects.toMatchObject({ status: 404 });
    await expect(validarImagensAcervo(questao)).rejects.toMatchObject({ status: 422 });
    await fs.writeFile(path.join(acervo, 'imagens/ausente.png'), '<svg>não é PNG</svg>');
    await expect(lerImagemAcervo(questao.id, 'imagem-teste')).rejects.toMatchObject({ status: 422 });
    await expect(validarImagensAcervo(questao)).rejects.toMatchObject({ status: 422 });
  });

  it('não lê questão por symlink fora da whitelist real', async () => {
    const { base, acervo } = await fixture();
    await fs.writeFile(path.join(base, 'segredo.json'), JSON.stringify({ segredo: true }));
    await fs.symlink(path.join(base, 'segredo.json'), path.join(acervo, 'questoes/enem-2024-escape.json'));
    await expect(lerQuestaoAcervo('enem-2024-escape')).rejects.toMatchObject({ status: 404 });
  });
});
