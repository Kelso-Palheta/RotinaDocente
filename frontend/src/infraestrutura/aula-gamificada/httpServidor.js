import { extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';

const CABECALHOS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};
const MENSAGENS = {
  400: 'Requisição inválida.',
  401: 'Sessão inválida ou expirada.',
  403: 'Acesso não autorizado.',
  404: 'Recurso não encontrado.',
  405: 'Método não permitido.',
  409: 'O estado mudou. Atualize e tente novamente.',
  413: 'Arquivo de requisição muito grande.',
  422: 'Dados inválidos para esta operação.',
  429: 'Limite de acesso atingido. Tente novamente.',
  503: 'Serviço temporariamente indisponível.',
};
const LIMITE_CORPO = 400_000;

const falha = (status) => Object.assign(new Error(MENSAGENS[status]), { status });

const erroPublico = (erro) => {
  const status = Object.hasOwn(MENSAGENS, erro?.status) ? erro.status : 500;
  const mensagem =
    erro?.publica === true &&
    status !== 500 &&
    typeof erro.message === 'string' &&
    erro.message.trim()
      ? erro.message
      : MENSAGENS[status] || 'Não foi possível concluir a operação.';
  return { status, error: mensagem, message: mensagem };
};

const responder = (dados, status, segredo) => {
  let corpo = JSON.stringify(dados);
  if (segredo) corpo = corpo.split(segredo).join('[redigido]');
  return new Response(corpo, {
    status,
    headers: { ...CABECALHOS, 'Content-Type': 'application/json; charset=utf-8' },
  });
};

async function lerBody(request) {
  if (Number(request.headers.get('content-length')) > LIMITE_CORPO)
    throw falha(413);
  const leitor = request.body?.getReader();
  if (!leitor) throw falha(400);
  const partes = [];
  let tamanho = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > LIMITE_CORPO) {
        await leitor.cancel();
        throw falha(413);
      }
      partes.push(value);
    }
    const body = JSON.parse(Buffer.concat(partes, tamanho).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw falha(400);
    return body;
  } catch (erro) {
    if (erro.status) throw erro;
    throw falha(400);
  } finally {
    leitor.releaseLock();
  }
}

function exigirOrigem(request) {
  if (request.method !== 'POST') return;
  const origem = request.headers.get('origin');
  if (!origem || origem !== new URL(request.url).origin) throw falha(403);
}

async function partesDoContexto(contexto) {
  const params = await contexto?.params;
  const partes = params?.partes;
  if (!Array.isArray(partes) || partes.some((parte) => typeof parte !== 'string'))
    throw falha(404);
  return partes;
}

const DEFINICOES = [
  {
    caminho: ['catalogo'],
    metodo: 'GET',
    docente: true,
    executar: ({ service, ator }) => service.catalogo(ator),
  },
  {
    caminho: ['gerar'],
    metodo: 'POST',
    docente: true,
    corpo: true,
    executar: ({ service, ator, body, request }) =>
      service.gerar(ator, body, extractUserAIConfigFromHeaders(request.headers)),
  },
  {
    caminho: ['questoes'],
    metodo: 'POST',
    docente: true,
    corpo: true,
    executar: ({ service, ator, body }) => service.salvarQuestao(ator, body),
  },
  {
    caminho: ['questoes', ':id', 'revisar'],
    metodo: 'POST',
    docente: true,
    corpo: true,
    executar: ({ service, ator, body, params }) =>
      service.revisarQuestao(ator, params.id, body),
  },
  {
    caminho: ['salas'],
    metodo: 'POST',
    docente: true,
    corpo: true,
    executar: ({ service, ator, body }) => service.criarSala(ator, body),
  },
  {
    caminho: ['salas', ':codigo', 'entrar'],
    metodo: 'POST',
    corpo: true,
    executar: ({ service, ator, body, params }) =>
      service.entrar(ator, params.codigo, body),
  },
  {
    caminho: ['salas', ':codigo', 'estado'],
    metodo: 'GET',
    executar: ({ service, ator, params }) =>
      service.estado(ator, params.codigo),
  },
  {
    caminho: ['salas', ':codigo', 'comandos'],
    metodo: 'POST',
    docente: true,
    corpo: true,
    executar: ({ service, ator, body, params }) =>
      service.comandar(ator, params.codigo, body),
  },
  {
    caminho: ['salas', ':codigo', 'respostas'],
    metodo: 'POST',
    corpo: true,
    executar: ({ service, ator, body, params }) =>
      service.responder(ator, params.codigo, body),
  },
];

function combina(padrao, partes) {
  if (padrao.length !== partes.length) return false;
  return padrao.every(
    (segmento, indice) => segmento.startsWith(':') || segmento === partes[indice],
  );
}

function resolverRota(partes) {
  const mesmaForma = DEFINICOES.filter((definicao) =>
    combina(definicao.caminho, partes),
  );
  if (!mesmaForma.length) throw falha(404);
  return { mesmaForma };
}

/**
 * Handler puro: recebe o serviço e o autenticador injetados, sem Firebase.
 * Erros públicos preservam mensagem; os demais usam texto genérico.
 */
export function criarHandlerAulaGamificada({ service, autenticar }) {
  return async function handler(request, contexto) {
    const segredo = request.headers.get('x-user-ai-key') || null;
    try {
      const partes = await partesDoContexto(contexto);
      const { mesmaForma } = resolverRota(partes);
      const definicao = mesmaForma.find(
        (candidata) => candidata.metodo === request.method,
      );
      if (!definicao) throw falha(405);

      exigirOrigem(request);
      const ator = await autenticar(request);
      if (definicao.docente && ator?.tipo !== 'professor') throw falha(403);

      const params = Object.fromEntries(
        definicao.caminho
          .map((segmento, indice) => [segmento, partes[indice]])
          .filter(([segmento]) => segmento.startsWith(':'))
          .map(([segmento, valor]) => [segmento.slice(1), valor]),
      );
      const body = definicao.corpo ? await lerBody(request) : null;
      const dados = await definicao.executar({
        service,
        ator,
        body,
        params,
        request,
      });
      return responder(dados, 200, segredo);
    } catch (erro) {
      const { status, ...corpo } = erroPublico(erro);
      return responder(corpo, status, segredo);
    }
  };
}
