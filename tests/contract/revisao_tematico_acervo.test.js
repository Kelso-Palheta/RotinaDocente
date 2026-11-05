/**
 * Contrato do acervo temático — Revisão ao Vivo (RT-01/RT-02/RT-10)
 *
 * Fonte normativa: specs/REVISAO_TEMATICA_SPEC.md, seções 2 e 3.
 *
 * Este teste valida:
 * - catálogo de trilhas e conteúdos;
 * - aulas completas (objetivos, blocos, fontes, status de rascunho);
 * - vínculos explícitos entre cada questão atual e os objetivos ensinados;
 * - cobertura integral e sem duplicidade dos 197 IDs;
 * - imagens de aula existentes, seguras, licenciadas e não reutilizadas das questões.
 *
 * O teste NÃO acessa a rede. A verificação de URL é estrutural. A conferência
 * editorial das fontes e a qualidade pedagógica são registradas na análise
 * entregue junto com o acervo e continuam sujeitas à revisão docente.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../content/revisao-enem'
);
const QUESTOES_DIR = path.join(RAIZ, 'questoes');
const IMAGENS_QUESTOES_DIR = path.join(RAIZ, 'imagens');
const AULAS_DIR = path.join(RAIZ, 'aulas');
const CATALOGO_PATH = path.join(AULAS_DIR, 'catalogo.json');
const VINCULOS_PATH = path.join(AULAS_DIR, 'vinculos.json');
const CONTEUDOS_DIR = path.join(AULAS_DIR, 'conteudos');
const IMAGENS_AULAS_DIR = path.join(AULAS_DIR, 'imagens');

const SITUACOES = new Set(['vinculada', 'pendente', 'fora_escopo']);
const TIPOS_BLOCO = new Set(['texto', 'imagem']);
const EXTENSOES_IMAGEM = new Set(['.png', '.jpg', '.webp']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHAVES_PROIBIDAS = new Set([
  'gabarito',
  'alternativacorreta',
  'respostacorreta',
  'letracorreta',
  'resolucao',
  'comentariogabarito',
]);

function lerJson(caminho, contexto) {
  expect(fs.existsSync(caminho), `${contexto}: arquivo ausente em ${caminho}`).toBe(true);
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

function textoNaoVazio(valor, minimo = 1) {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

function urlHttp(valor) {
  if (typeof valor !== 'string' || valor.trim().length === 0) return false;
  try {
    const url = new URL(valor);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function eDataISO(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function listarArquivos(diretorio, extensao) {
  if (!fs.existsSync(diretorio)) return [];
  return fs
    .readdirSync(diretorio)
    .filter((nome) => nome.endsWith(extensao))
    .sort()
    .map((nome) => path.join(diretorio, nome));
}

function listarQuestoes() {
  const arquivos = listarArquivos(QUESTOES_DIR, '.json');
  expect(arquivos.length, 'acervo de questões ausente').toBeGreaterThanOrEqual(197);
  return arquivos.map((caminho) => lerJson(caminho, 'questão'));
}

function hashArquivo(caminho) {
  return crypto.createHash('sha256').update(fs.readFileSync(caminho)).digest('hex');
}

function hashesDeImagens(diretorio) {
  const hashes = new Map();
  if (!fs.existsSync(diretorio)) return hashes;
  const visitar = (atual) => {
    for (const entrada of fs.readdirSync(atual, { withFileTypes: true })) {
      const caminho = path.join(atual, entrada.name);
      if (entrada.isDirectory()) visitar(caminho);
      else if (EXTENSOES_IMAGEM.has(path.extname(entrada.name).toLowerCase())) {
        hashes.set(hashArquivo(caminho), caminho);
      }
    }
  };
  visitar(diretorio);
  return hashes;
}

function procurarChavesProibidas(valor, caminho = '') {
  const encontrados = [];
  if (Array.isArray(valor)) {
    valor.forEach((item, indice) => {
      encontrados.push(...procurarChavesProibidas(item, `${caminho}[${indice}]`));
    });
  } else if (valor && typeof valor === 'object') {
    for (const [chave, conteudo] of Object.entries(valor)) {
      const normalizada = chave.toLowerCase();
      if (CHAVES_PROIBIDAS.has(normalizada)) {
        encontrados.push(`${caminho}.${chave}`);
      }
      encontrados.push(...procurarChavesProibidas(conteudo, `${caminho}.${chave}`));
    }
  }
  return encontrados;
}

function exigirCaminhoDeImagemDeAula(arquivo, contexto) {
  expect(textoNaoVazio(arquivo, 10), `${contexto}: arquivo de imagem ausente`).toBe(true);
  expect(arquivo, `${contexto}: caminho deve começar em aulas/imagens/`).toMatch(
    /^aulas\/imagens\/[a-z0-9][a-z0-9-]*\.(png|jpg|webp)$/
  );
  expect(arquivo.includes('..'), `${contexto}: caminho inseguro`).toBe(false);
  expect(arquivo.includes('\\'), `${contexto}: caminho inseguro`).toBe(false);

  const absoluto = path.resolve(RAIZ, arquivo);
  const relativo = path.relative(IMAGENS_AULAS_DIR, absoluto);
  expect(relativo.startsWith('..'), `${contexto}: imagem fora de aulas/imagens/`).toBe(false);
  expect(path.isAbsolute(relativo), `${contexto}: imagem fora de aulas/imagens/`).toBe(false);
  expect(fs.existsSync(absoluto), `${contexto}: arquivo inexistente ${arquivo}`).toBe(true);
  expect(fs.statSync(absoluto).isFile(), `${contexto}: ${arquivo} não é arquivo`).toBe(true);
}

function carregarCatalogo() {
  const catalogo = lerJson(CATALOGO_PATH, 'catálogo');
  return catalogo;
}

function carregarAulas(catalogo) {
  return new Map(
    catalogo.conteudos.map((conteudo) => {
      const caminho = path.join(CONTEUDOS_DIR, `${conteudo.id}.json`);
      return [conteudo.id, lerJson(caminho, `aula ${conteudo.id}`)];
    })
  );
}

describe('RT-01/RT-02 — catálogo e aulas temáticas', () => {
  it('mantém catálogo com trilhas e conteúdos específicos resolvíveis', () => {
    const catalogo = carregarCatalogo();

    expect(catalogo.schemaVersion).toBe(1);
    expect(Array.isArray(catalogo.trilhas)).toBe(true);
    expect(catalogo.trilhas.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(catalogo.conteudos)).toBe(true);
    expect(catalogo.conteudos.length).toBeGreaterThanOrEqual(20);

    const trilhas = new Map();
    for (const trilha of catalogo.trilhas) {
      expect(SLUG.test(trilha.id), `trilha com id inválido: ${trilha.id}`).toBe(true);
      expect(textoNaoVazio(trilha.titulo, 3), `trilha ${trilha.id}: título ausente`).toBe(true);
      expect(trilhas.has(trilha.id), `trilha duplicada: ${trilha.id}`).toBe(false);
      trilhas.set(trilha.id, trilha);
    }

    const conteudos = new Map();
    for (const conteudo of catalogo.conteudos) {
      const contexto = `conteúdo ${conteudo.id}`;
      expect(SLUG.test(conteudo.id), `${contexto}: id inválido`).toBe(true);
      expect(conteudos.has(conteudo.id), `${contexto}: conteúdo duplicado`).toBe(false);
      conteudos.set(conteudo.id, conteudo);

      expect(trilhas.has(conteudo.trilhaId), `${contexto}: trilha inexistente`).toBe(true);
      expect(textoNaoVazio(conteudo.titulo, 3), `${contexto}: título ausente`).toBe(true);
      expect(textoNaoVazio(conteudo.resumo, 40), `${contexto}: resumo insuficiente`).toBe(true);
      expect(Array.isArray(conteudo.objetivos), `${contexto}: objetivos inválidos`).toBe(true);
      expect(conteudo.objetivos.length, `${contexto}: sem objetivos`).toBeGreaterThan(0);

      const objetivos = new Set();
      for (const objetivo of conteudo.objetivos) {
        expect(SLUG.test(objetivo.id), `${contexto}: objetivo com id inválido`).toBe(true);
        expect(objetivos.has(objetivo.id), `${contexto}: objetivo duplicado ${objetivo.id}`).toBe(false);
        objetivos.add(objetivo.id);
        expect(
          textoNaoVazio(objetivo.descricao, 20),
          `${contexto}: descrição insuficiente do objetivo ${objetivo.id}`
        ).toBe(true);
      }
    }

    for (const trilha of catalogo.trilhas) {
      expect(
        catalogo.conteudos.some((conteudo) => conteudo.trilhaId === trilha.id),
        `trilha ${trilha.id}: sem conteúdos`
      ).toBe(true);
    }
  });

  it('mantém uma aula completa e pedagogicamente conectada para cada conteúdo', () => {
    const catalogo = carregarCatalogo();
    const aulas = carregarAulas(catalogo);

    expect(aulas.size, 'quantidade de aulas diverge do catálogo').toBe(catalogo.conteudos.length);

    const arquivosDeAula = listarArquivos(CONTEUDOS_DIR, '.json').map((caminho) =>
      path.basename(caminho, '.json')
    );
    expect([...arquivosDeAula].sort(), 'há aula fora do catálogo').toEqual(
      [...aulas.keys()].sort()
    );

    for (const conteudo of catalogo.conteudos) {
      const aula = aulas.get(conteudo.id);
      const contexto = `aula ${conteudo.id}`;

      expect(aula.schemaVersion, contexto).toBe(1);
      expect(aula.id, contexto).toBe(conteudo.id);
      expect(aula.titulo, contexto).toBe(conteudo.titulo);
      expect(aula.status, `${contexto}: toda aula deve permanecer em rascunho`).toBe('rascunho');
      expect(
        Number.isInteger(aula.duracaoEstimadaMinutos) &&
          aula.duracaoEstimadaMinutos >= 10 &&
          aula.duracaoEstimadaMinutos <= 20,
        `${contexto}: duração deve ser inteira entre 10 e 20 minutos`
      ).toBe(true);

      expect(aula.objetivos, `${contexto}: objetivos divergem do catálogo`).toEqual(
        conteudo.objetivos
      );

      expect(Array.isArray(aula.blocos), `${contexto}: blocos inválidos`).toBe(true);
      expect(aula.blocos.length, `${contexto}: quantidade de blocos fora do intervalo`).toBeGreaterThanOrEqual(6);
      expect(aula.blocos.length, `${contexto}: quantidade de blocos fora do intervalo`).toBeLessThanOrEqual(12);

      const idsObjetivos = new Set(aula.objetivos.map((objetivo) => objetivo.id));
      const objetivosEnsinados = new Set();
      const idsBlocos = new Set();

      for (const bloco of aula.blocos) {
        expect(SLUG.test(bloco.id), `${contexto}: bloco com id inválido`).toBe(true);
        expect(idsBlocos.has(bloco.id), `${contexto}: bloco duplicado ${bloco.id}`).toBe(false);
        idsBlocos.add(bloco.id);

        expect(textoNaoVazio(bloco.titulo, 3), `${contexto}: bloco ${bloco.id} sem título`).toBe(true);
        expect(TIPOS_BLOCO.has(bloco.tipo), `${contexto}: bloco ${bloco.id} com tipo inválido`).toBe(true);
        expect(textoNaoVazio(bloco.texto, 120), `${contexto}: bloco ${bloco.id} sem desenvolvimento`).toBe(true);
        expect(Array.isArray(bloco.objetivoIds), `${contexto}: bloco ${bloco.id} sem objetivos`).toBe(true);
        expect(bloco.objetivoIds.length, `${contexto}: bloco ${bloco.id} sem objetivos`).toBeGreaterThan(0);

        const vistos = new Set();
        for (const objetivoId of bloco.objetivoIds) {
          expect(idsObjetivos.has(objetivoId), `${contexto}: objetivo inexistente ${objetivoId}`).toBe(true);
          expect(vistos.has(objetivoId), `${contexto}: objetivo repetido no bloco ${bloco.id}`).toBe(false);
          vistos.add(objetivoId);
          objetivosEnsinados.add(objetivoId);
        }

        if (bloco.tipo === 'imagem') {
          expect(textoNaoVazio(bloco.imagemId, 3), `${contexto}: bloco de imagem sem imagemId`).toBe(true);
          const imagem = (aula.imagens || []).find((item) => item.id === bloco.imagemId);
          expect(imagem, `${contexto}: imagem do bloco ${bloco.id} não declarada`).toBeTruthy();
        }
      }

      for (const objetivo of aula.objetivos) {
        expect(
          objetivosEnsinados.has(objetivo.id),
          `${contexto}: objetivo ${objetivo.id} não é ensinado em nenhum bloco`
        ).toBe(true);
      }

      expect(Array.isArray(aula.imagens), `${contexto}: imagens inválidas`).toBe(true);
      const idsImagens = new Set();
      for (const imagem of aula.imagens) {
        expect(SLUG.test(imagem.id), `${contexto}: imagem com id inválido`).toBe(true);
        expect(idsImagens.has(imagem.id), `${contexto}: imagem duplicada ${imagem.id}`).toBe(false);
        idsImagens.add(imagem.id);

        exigirCaminhoDeImagemDeAula(imagem.arquivo, `${contexto}/${imagem.id}`);
        expect(textoNaoVazio(imagem.alt, 20), `${contexto}: alt insuficiente em ${imagem.id}`).toBe(true);
        expect(textoNaoVazio(imagem.legenda, 10), `${contexto}: legenda insuficiente em ${imagem.id}`).toBe(true);
        expect(urlHttp(imagem.fonteUrl), `${contexto}: fonteUrl inválida em ${imagem.id}`).toBe(true);
        expect(textoNaoVazio(imagem.licenca, 10), `${contexto}: licença insuficiente em ${imagem.id}`).toBe(true);
      }

      for (const imagem of aula.imagens) {
        expect(
          aula.blocos.some((bloco) => bloco.tipo === 'imagem' && bloco.imagemId === imagem.id),
          `${contexto}: imagem ${imagem.id} não é usada em bloco de imagem`
        ).toBe(true);
      }

      expect(Array.isArray(aula.fontes), `${contexto}: fontes inválidas`).toBe(true);
      expect(aula.fontes.length, `${contexto}: sem fontes`).toBeGreaterThan(0);
      for (const fonte of aula.fontes) {
        expect(textoNaoVazio(fonte.titulo, 5), `${contexto}: fonte sem título`).toBe(true);
        expect(urlHttp(fonte.url), `${contexto}: URL de fonte inválida`).toBe(true);
        expect(eDataISO(fonte.consultadoEm), `${contexto}: data de consulta inválida`).toBe(true);
      }

      expect(
        procurarChavesProibidas(aula),
        `${contexto}: aula contém campo de gabarito/resolução`
      ).toEqual([]);
    }
  });

  it('não reutiliza imagens das questões nem deixa arquivos órfãos', () => {
    const catalogo = carregarCatalogo();
    const aulas = carregarAulas(catalogo);

    const hashesDasQuestoes = hashesDeImagens(IMAGENS_QUESTOES_DIR);
    const hashesDasAulas = hashesDeImagens(IMAGENS_AULAS_DIR);

    for (const [hash, caminho] of hashesDasAulas) {
      expect(
        hashesDasQuestoes.has(hash),
        `imagem de aula reutiliza arquivo de questão: ${caminho}`
      ).toBe(false);
    }

    const referenciadas = new Set();
    for (const aula of aulas.values()) {
      for (const imagem of aula.imagens) {
        referenciadas.add(path.resolve(RAIZ, imagem.arquivo));
      }
    }

    for (const caminho of hashesDasAulas.values()) {
      expect(
        referenciadas.has(path.resolve(caminho)),
        `imagem de aula não referenciada por nenhuma aula: ${caminho}`
      ).toBe(true);
    }
  });

  it('mapeia cada questão atual exatamente uma vez, com vínculo ou justificativa', () => {
    const catalogo = carregarCatalogo();
    const aulas = carregarAulas(catalogo);
    const vinculos = lerJson(VINCULOS_PATH, 'mapa de vínculos');

    expect(vinculos.schemaVersion).toBe(1);
    expect(Array.isArray(vinculos.questoes)).toBe(true);

    const questoes = listarQuestoes();
    const idsQuestoes = new Set(questoes.map((questao) => questao.id));
    const vistos = new Set();
    const contagem = { vinculada: 0, pendente: 0, fora_escopo: 0 };

    for (const entrada of vinculos.questoes) {
      const contexto = `vínculo ${entrada.questaoId}`;
      expect(idsQuestoes.has(entrada.questaoId), `${contexto}: questão inexistente`).toBe(true);
      expect(vistos.has(entrada.questaoId), `${contexto}: questão repetida no mapa`).toBe(false);
      vistos.add(entrada.questaoId);
      expect(SITUACOES.has(entrada.situacao), `${contexto}: situação inválida`).toBe(true);
      contagem[entrada.situacao] += 1;
      expect(typeof entrada.observacao, `${contexto}: observação deve ser texto`).toBe('string');

      if (entrada.situacao === 'vinculada') {
        expect(Array.isArray(entrada.vinculos), `${contexto}: vínculos inválidos`).toBe(true);
        expect(entrada.vinculos.length, `${contexto}: vinculada sem vínculo`).toBeGreaterThan(0);

        const conteudosVistos = new Set();
        for (const vinculo of entrada.vinculos) {
          expect(aulas.has(vinculo.conteudoId), `${contexto}: aula inexistente ${vinculo.conteudoId}`).toBe(true);
          expect(
            conteudosVistos.has(vinculo.conteudoId),
            `${contexto}: aula repetida no mesmo vínculo`
          ).toBe(false);
          conteudosVistos.add(vinculo.conteudoId);

          const aula = aulas.get(vinculo.conteudoId);
          const idsObjetivos = new Set(aula.objetivos.map((objetivo) => objetivo.id));
          expect(Array.isArray(vinculo.objetivoIds), `${contexto}: objetivoIds inválidos`).toBe(true);
          expect(vinculo.objetivoIds.length, `${contexto}: vínculo sem objetivo`).toBeGreaterThan(0);

          const objetivosVistos = new Set();
          for (const objetivoId of vinculo.objetivoIds) {
            expect(idsObjetivos.has(objetivoId), `${contexto}: objetivo inexistente ${objetivoId}`).toBe(true);
            expect(objetivosVistos.has(objetivoId), `${contexto}: objetivo repetido`).toBe(false);
            objetivosVistos.add(objetivoId);
          }

          expect(
            textoNaoVazio(vinculo.justificativa, 80),
            `${contexto}: justificativa insuficiente para ${vinculo.conteudoId}`
          ).toBe(true);
        }
      } else {
        expect(entrada.vinculos, `${contexto}: ${entrada.situacao} deve ter vínculos vazios`).toEqual([]);
        expect(
          textoNaoVazio(entrada.observacao, 40),
          `${contexto}: ${entrada.situacao} exige observação específica`
        ).toBe(true);
      }
    }

    expect([...vistos].sort(), 'o mapa não cobre exatamente as questões atuais').toEqual(
      [...idsQuestoes].sort()
    );
    expect(contagem.vinculada, 'nenhuma questão vinculada').toBeGreaterThan(0);
    expect(contagem.fora_escopo + contagem.pendente, 'nenhuma questão justificada fora do mapa').toBeGreaterThan(0);

    for (const conteudo of catalogo.conteudos) {
      expect(
        vinculos.questoes.some(
          (entrada) =>
            entrada.situacao === 'vinculada' &&
            entrada.vinculos.some((vinculo) => vinculo.conteudoId === conteudo.id)
        ),
        `aula ${conteudo.id}: nenhuma questão vinculada`
      ).toBe(true);
    }
  });
});
