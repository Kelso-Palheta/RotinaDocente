/** Executar após o build para impedir publicação de acervo cliente ou credenciais locais. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const build = path.join(raiz, 'frontend/.next');
async function arquivos(diretorio) {
  const itens = await fs.readdir(diretorio, { withFileTypes: true });
  return (await Promise.all(itens.map(item => item.isDirectory()
    ? arquivos(path.join(diretorio, item.name)) : [path.join(diretorio, item.name)]))).flat();
}
const manifesto = path.join(build, 'server/app/api/revisao/[...partes]/route.js.nft.json');
const { files } = JSON.parse(await fs.readFile(manifesto, 'utf8'));
const incluidos = new Set(files.map(f => path.resolve(path.dirname(manifesto), f)));
const privados = await arquivos(path.join(raiz, 'content/revisao-enem'));
for (const arquivo of privados) assert(incluidos.has(arquivo), `Arquivo do acervo ausente no servidor: ${path.basename(arquivo)}`);
for (const nft of (await arquivos(path.join(build, 'server'))).filter(f => f.endsWith('.nft.json'))) {
  const conteudo = JSON.parse(await fs.readFile(nft, 'utf8'));
  for (const arquivo of conteudo.files) {
    const nome = path.basename(arquivo);
    assert(!/^\.env(?:\.|$)/.test(nome) && nome !== 'firebase-admin-key.json', `Arquivo local proibido no pacote: ${nome}`);
  }
}
assert(!files.some(f => /(?:^|\/)AGENTS\.md$|(?:^|\/)next\.config\.mjs$/.test(f)), 'Rastreamento indevido da raiz do projeto.');
const questoes = privados.filter(f => /\/questoes\/[^/]+\.json$/.test(f));
const ids = await Promise.all(questoes.map(async f => JSON.parse(await fs.readFile(f, 'utf8')).id));
for (const arquivo of (await arquivos(path.join(build, 'static/chunks'))).filter(f => f.endsWith('.js'))) {
  const texto = await fs.readFile(arquivo, 'utf8');
  assert(!ids.some(id => texto.includes(id)), `Questão privada encontrada no chunk cliente: ${path.basename(arquivo)}`);
}
console.log(JSON.stringify({ questoes: ids.length, arquivosPrivadosNoServidor: privados.length, credenciaisLocaisNoPacote: 0, questoesNoCliente: 0 }));
