const falha = (status, message) => Object.assign(new Error(message), { status });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
async function corpo(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw falha(415, 'Envie uma requisição JSON.');
  if (Number(request.headers.get('content-length')) > 12000) throw falha(413, 'Pedido muito grande.');
  const leitor = request.body?.getReader();
  if (!leitor) throw falha(400, 'Pedido vazio.');
  const partes = [];
  let tamanho = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > 12000) { await leitor.cancel(); throw falha(413, 'Pedido muito grande.'); }
      partes.push(value);
    }
  } finally { leitor.releaseLock(); }
  let body;
  try { body = JSON.parse(Buffer.concat(partes, tamanho).toString('utf8')); } catch { throw falha(400, 'JSON inválido.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw falha(400, 'Pedido inválido.');
  return body;
}
export function criarHandlerRevisaoAutonoma({ service, autenticar }) {
  return async request => {
    try {
      const url = new URL(request.url);
      if (request.method === 'POST') {
        const origin = request.headers.get('origin');
        if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw falha(403, 'Origem não autorizada.');
      }
      const ator = await autenticar(request);
      const path = url.pathname.split('/api/revisao-autonoma/')[1] || '';
      if (request.method === 'GET' && path === 'catalogo') return json(await service.catalogo(ator));
      if (request.method === 'GET' && path === 'historico') return json(await service.historico(ator));
      if (request.method === 'POST' && path === 'publicar') {
        if (ator?.tipo !== 'professor') throw falha(403, 'Somente o professor libera conteúdos.');
        return json(await service.publicar(ator, await corpo(request)));
      }
      if (request.method === 'POST' && path === 'sessoes') return json(await service.criarSessao(ator, await corpo(request)));
      const match = /^sessoes\/([^/]+)(?:\/(responder|avancar))?$/.exec(path);
      if (match) {
        let id;
        try { id = decodeURIComponent(match[1]); } catch { throw falha(400, 'Identificador inválido.'); }
        if (request.method === 'GET' && !match[2]) return json(await service.obterSessao(ator, id));
        if (request.method === 'POST' && match[2]) return json(await service[match[2]](ator, id, await corpo(request)));
      }
      return json({ error: 'Caminho não encontrado.' }, 404);
    } catch (e) {
      const status = Number.isInteger(e.status) && e.status >= 400 && e.status < 600 ? e.status : 500;
      return json({ error: status >= 500 ? 'Serviço indisponível. Tente novamente.' : e.message }, status);
    }
  };
}
