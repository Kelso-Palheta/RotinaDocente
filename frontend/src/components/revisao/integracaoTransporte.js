/** Transporte cliente: credenciais ficam nos headers/cookies, nunca na URL. */
export async function requisitarRevisao(caminho, { body, obterToken, signal, stream = false, fetcher = fetch } = {}) {
  const headers = {};
  if (obterToken) {
    const token = await obterToken();
    if (!token) throw new Error('Faça login de professor com sua conta Firebase para continuar.');
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resposta = await fetcher(`/api/revisao${caminho}`, {
    method: body === undefined ? 'GET' : 'POST', headers, credentials: 'same-origin',
    cache: 'no-store', signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}));
    const erro = new Error(dados.error || 'Não foi possível conectar à revisão. Tente novamente.');
    erro.status = resposta.status;
    throw erro;
  }
  return stream ? resposta : resposta.json();
}

/** Reader cancelável: aceita fronteiras de rede em qualquer ponto de um frame/UTF-8. */
export async function consumirEventosRevisao(resposta, receber, signal) {
  if (!resposta.body?.getReader) throw new Error('Este navegador não conseguiu abrir a conexão ao vivo.');
  const reader = resposta.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const cancelar = () => { reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', cancelar, { once: true });
  try {
    while (!signal?.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let limite;
      while ((limite = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, limite.index);
        buffer = buffer.slice(limite.index + limite[0].length);
        const linhas = frame.split(/\r?\n/);
        const evento = linhas.find(l => l.startsWith('event:'))?.slice(6).trim() || 'message';
        const dados = linhas.filter(l => l.startsWith('data:')).map(l => l.slice(5).replace(/^ /, '')).join('\n');
        if (!dados || signal?.aborted) continue;
        if (evento !== 'estado' && evento !== 'erro') continue;
        const payload = JSON.parse(dados);
        if (evento === 'erro') {
          const erro = new Error(payload.error || 'Conexão ao vivo interrompida.');
          erro.status = payload.status;
          throw erro;
        }
        receber(payload);
      }
      if (buffer.length > 2_000_000) throw new Error('Atualização ao vivo excedeu o tamanho permitido.');
    }
  } finally {
    signal?.removeEventListener('abort', cancelar);
    try { await reader.cancel(); } catch { /* Conexão pode já estar encerrada. */ }
    reader.releaseLock?.();
  }
}

export const ENVIO_VAZIO = { status: 'nao_enviado', alternativa: null };

export function incorporarAtualizacao(anterior, dados) {
  const previo = anterior.estado;
  const proximo = dados.estado || previo;
  if (previo && dados.estado && Number(proximo.sala?.revisao) < Number(previo.sala?.revisao)) return anterior;
  if (previo && dados.estado && Number(proximo.sala?.revisao) === Number(previo.sala?.revisao)
    && Number(proximo.agoraServidorMs) < Number(previo.agoraServidorMs)) return anterior;
  const rodadaId = proximo?.rodada?.id;
  const mudou = previo?.rodada?.id !== rodadaId;
  let envio = mudou ? ENVIO_VAZIO : anterior.envio;
  const recebido = dados.envio;
  if (recebido && recebido.rodadaId === rodadaId
    && (envio.status !== 'confirmado' || recebido.status === 'confirmado')) envio = recebido;
  return { ...anterior, estado: proximo, envio };
}
