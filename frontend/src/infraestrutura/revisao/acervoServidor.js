/** Acervo privado: importar exclusivamente em adaptadores Node do servidor. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ID_QUESTAO = /^enem-\d{4}-[a-z0-9-]+$/;
const TIPOS = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function falha(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}

function dentro(raiz, arquivo) {
  const relativo = path.relative(raiz, arquivo);
  return relativo !== '' && relativo !== '..' && !relativo.startsWith(`..${path.sep}`) && !path.isAbsolute(relativo);
}

async function raizAcervo() {
  const cwd = process.cwd();
  for (const candidato of [path.resolve(cwd, '../content/revisao-enem'), path.resolve(cwd, 'content/revisao-enem')]) {
    try {
      // Apenas content/revisao-enem é incluído explicitamente no outputFileTracingIncludes.
      // O ignore no argumento simples evita que realpath dinâmico faça o bundler rastrear a raiz inteira.
      const raiz = await fs.realpath(/* turbopackIgnore: true */ candidato);
      const questoes = path.join(raiz, 'questoes');
      if ((await fs.stat(/* turbopackIgnore: true */ questoes)).isDirectory()) return raiz;
    } catch { /* O segundo caminho contempla os testes executados pela raiz. */ }
  }
  throw falha(503, 'Acervo indisponível.');
}

async function arquivosPermitidos(raiz) {
  const diretorio = path.join(raiz, 'questoes');
  return (await fs.readdir(/* turbopackIgnore: true */ diretorio, { withFileTypes: true }))
    .filter(item => item.isFile() && item.name.endsWith('.json') && ID_QUESTAO.test(item.name.slice(0, -5)))
    .map(item => item.name).sort();
}

async function lerArquivoQuestao(raiz, nome) {
  try {
    const caminhoDiretorio = path.join(raiz, 'questoes');
    const diretorio = await fs.realpath(/* turbopackIgnore: true */ caminhoDiretorio);
    if (!dentro(raiz, diretorio)) throw falha(404, 'Questão não encontrada.');
    const caminhoArquivo = path.join(diretorio, nome);
    const arquivo = await fs.realpath(/* turbopackIgnore: true */ caminhoArquivo);
    if (!dentro(diretorio, arquivo)) throw falha(404, 'Questão não encontrada.');
    const bytes = await fs.readFile(/* turbopackIgnore: true */ arquivo);
    const questao = JSON.parse(bytes.toString('utf8'));
    if (questao.id !== nome.slice(0, -5)) throw falha(422, 'Questão inválida no acervo.');
    return { questao, hashFonte: createHash('sha256').update(bytes).digest('hex'), bytes };
  } catch (erro) {
    if (erro.status) throw erro;
    if (erro.code === 'ENOENT') throw falha(404, 'Questão não encontrada.');
    throw falha(422, 'Não foi possível ler a questão.');
  }
}

/** Metadados para seleção docente; nunca inclui respostas ou conteúdo integral. */
export async function listarAcervo() {
  const raiz = await raizAcervo();
  return Promise.all((await arquivosPermitidos(raiz)).map(async nome => {
    const { questao, hashFonte } = await lerArquivoQuestao(raiz, nome);
    return { id: questao.id, ano: questao.ano, tema: questao.tema, aplicacoes: [...questao.aplicacoes], hashFonte };
  }));
}

async function lerRegistroAcervo(id) {
  if (typeof id !== 'string' || !ID_QUESTAO.test(id)) throw falha(400, 'Identificador de questão inválido.');
  const raiz = await raizAcervo();
  if (!(await arquivosPermitidos(raiz)).includes(`${id}.json`)) throw falha(404, 'Questão não encontrada.');
  // Cada leitura desserializa os bytes: o chamador não pode modificar uma cópia compartilhada.
  return { raiz, ...await lerArquivoQuestao(raiz, `${id}.json`) };
}

export async function lerQuestaoAcervo(id) {
  const { questao, hashFonte } = await lerRegistroAcervo(id);
  return { questao, hashFonte };
}

function mimeDosBytes(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function lerImagemDeclarada(raiz, imagem) {
  const arquivo = imagem?.arquivo;
  if (typeof arquivo !== 'string' || !arquivo.startsWith('imagens/') || arquivo.includes('\\') || arquivo.includes('\0') || arquivo.split('/').some(parte => !parte || parte === '.' || parte === '..')) {
    throw falha(400, 'Referência de imagem inválida.');
  }
  const mime = TIPOS[path.extname(arquivo).toLowerCase()];
  if (!mime) throw falha(400, 'Tipo de imagem não permitido.');
  try {
    const caminhoDiretorio = path.join(raiz, 'imagens');
    const caminhoArquivo = path.resolve(raiz, arquivo);
    const diretorio = await fs.realpath(/* turbopackIgnore: true */ caminhoDiretorio);
    const absoluto = await fs.realpath(/* turbopackIgnore: true */ caminhoArquivo);
    if (!dentro(raiz, diretorio) || !dentro(diretorio, absoluto)) throw falha(400, 'Referência de imagem inválida.');
    if (!(await fs.stat(/* turbopackIgnore: true */ absoluto)).isFile()) throw falha(404, 'Imagem não encontrada.');
    const buffer = await fs.readFile(/* turbopackIgnore: true */ absoluto);
    if (mimeDosBytes(buffer) !== mime) throw falha(422, 'Imagem ilegível ou incompatível com o tipo declarado.');
    return { buffer, mime };
  } catch (erro) {
    if (erro.status) throw erro;
    if (erro.code === 'ENOENT') throw falha(404, 'Imagem não encontrada.');
    throw falha(422, 'Não foi possível ler a imagem.');
  }
}

/** A autorização da questão/sala é responsabilidade do adaptador HTTP chamador. */
export async function lerImagemAcervo(questaoId, imagemId) {
  if (typeof imagemId !== 'string' || !imagemId || imagemId.length > 200 || /[\\/\0]/.test(imagemId)) throw falha(400, 'Identificador de imagem inválido.');
  const { questao } = await lerQuestaoAcervo(questaoId);
  const imagem = questao.imagens?.find(item => item.id === imagemId);
  if (!imagem) throw falha(404, 'Imagem não encontrada.');
  return lerImagemDeclarada(await raizAcervo(), imagem);
}

/** Integridade técnica dos arquivos; não constitui conferência visual/docente. */
export async function validarImagensAcervo(questao) {
  if (!Array.isArray(questao?.imagens)) throw falha(422, 'Referências de imagens inválidas.');
  try {
    const raiz = await raizAcervo();
    for (const imagem of questao.imagens) await lerImagemDeclarada(raiz, imagem);
    return true;
  } catch {
    throw falha(422, 'Uma ou mais imagens não estão disponíveis para conferência.');
  }
}

/** Impressão de revisão inclui pixels originais, sem alterar o hash público do JSON. */
export async function hashRevisaoAcervo(id) {
  const { raiz, questao, bytes } = await lerRegistroAcervo(id);
  try {
    if (!Array.isArray(questao.imagens) || questao.imagens.some(i => typeof i?.id !== 'string' || !i.id) || new Set(questao.imagens.map(i => i.id)).size !== questao.imagens.length) {
      throw falha(422, 'Referências de imagens inválidas.');
    }
    const hash = createHash('sha256').update('rotina-docente:revisao-acervo:v1\0');
    // Prefixos de tamanho impedem ambiguidades entre IDs, JSON e bytes concatenados.
    function incluir(buffer) {
      hash.update(String(buffer.length)).update(':').update(buffer);
    }
    incluir(bytes);
    const imagens = [...questao.imagens].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    for (const imagem of imagens) {
      const { buffer } = await lerImagemDeclarada(raiz, imagem);
      incluir(Buffer.from(imagem.id, 'utf8'));
      incluir(buffer);
    }
    return hash.digest('hex');
  } catch {
    throw falha(422, 'Não foi possível verificar os arquivos desta questão para revisão.');
  }
}
