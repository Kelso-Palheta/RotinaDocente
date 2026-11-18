import { getClientAIHeaders } from '@/utils/aiHeaders';

const PREFIXO = '/api/aula-gamificada';

export function gerarRequestId(prefixo = 'req') {
  const aleatorio =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefixo}_${aleatorio}`;
}

async function requisitar(caminho, { method = 'GET', body, obterToken, incluirBYOK = false, signal, fetcher = fetch } = {}) {
  const headers = {};

  if (obterToken) {
    const token = await obterToken();
    if (!token) {
      const erroAuth = new Error('Faça login de professor com sua conta Firebase para continuar.');
      erroAuth.status = 401;
      erroAuth.code = 'AUTH_REQUIRED';
      throw erroAuth;
    }
    headers.Authorization = `Bearer ${token}`;
  }

  if (incluirBYOK) {
    const aiHeaders = getClientAIHeaders();
    if (aiHeaders && typeof aiHeaders === 'object') {
      Object.assign(headers, aiHeaders);
    }
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const resposta = await fetcher(`${PREFIXO}${caminho}`, {
    method,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const mensagem =
      dados?.message ||
      dados?.error ||
      'Não foi possível concluir a operação agora. Tente novamente.';
    const erro = new Error(mensagem);
    erro.status = resposta.status;
    erro.code = dados?.error || `HTTP_${resposta.status}`;
    erro.payload = dados;
    throw erro;
  }

  return dados;
}

export async function buscarCatalogo({ obterToken, signal, fetcher } = {}) {
  return requisitar('/catalogo', { method: 'GET', obterToken, signal, fetcher });
}

export async function gerarQuestoesIA({ entrada, obterToken, signal, fetcher } = {}) {
  return requisitar('/gerar', {
    method: 'POST',
    body: entrada,
    obterToken,
    incluirBYOK: true,
    signal,
    fetcher,
  });
}

export async function salvarQuestao({ questao, expectedRevision, requestId, obterToken, signal, fetcher } = {}) {
  const payload = {
    questao,
    requestId: requestId || gerarRequestId('questao'),
    ...(expectedRevision !== undefined && expectedRevision !== null ? { expectedRevision } : {}),
  };
  return requisitar('/questoes', {
    method: 'POST',
    body: payload,
    obterToken,
    signal,
    fetcher,
  });
}

export async function revisarQuestao({ id, expectedRevision, requestId, obterToken, signal, fetcher } = {}) {
  return requisitar(`/questoes/${encodeURIComponent(id)}/revisar`, {
    method: 'POST',
    body: {
      expectedRevision,
      requestId: requestId || gerarRequestId('revisar'),
    },
    obterToken,
    signal,
    fetcher,
  });
}

export async function criarSala({ configuracao, requestId, obterToken, signal, fetcher } = {}) {
  return requisitar('/salas', {
    method: 'POST',
    body: {
      ...configuracao,
      requestId: requestId || gerarRequestId('sala'),
    },
    obterToken,
    signal,
    fetcher,
  });
}

export async function entrarSala({ codigo, requestId, signal, fetcher } = {}) {
  return requisitar(`/salas/${encodeURIComponent(codigo)}/entrar`, {
    method: 'POST',
    body: {
      requestId: requestId || gerarRequestId('entrar'),
    },
    signal,
    fetcher,
  });
}

export async function obterEstadoSala({ codigo, obterToken, signal, fetcher } = {}) {
  return requisitar(`/salas/${encodeURIComponent(codigo)}/estado`, {
    method: 'GET',
    obterToken,
    signal,
    fetcher,
  });
}

export async function enviarComandoSala({ codigo, acao, expectedRevision, rodada, requestId, obterToken, signal, fetcher } = {}) {
  return requisitar(`/salas/${encodeURIComponent(codigo)}/comandos`, {
    method: 'POST',
    body: {
      acao,
      expectedRevision,
      rodada,
      requestId: requestId || gerarRequestId('cmd'),
    },
    obterToken,
    signal,
    fetcher,
  });
}

export async function enviarRespostaSala({ codigo, rodada, requestId, resposta, signal, fetcher } = {}) {
  return requisitar(`/salas/${encodeURIComponent(codigo)}/respostas`, {
    method: 'POST',
    body: {
      rodada,
      requestId: requestId || gerarRequestId('resp'),
      resposta,
    },
    signal,
    fetcher,
  });
}
