const TIMEOUT_PADRAO_MS = 15000;

export async function requisitarLivre(path, { body, obterToken, signal, timeoutMs = TIMEOUT_PADRAO_MS } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (obterToken) headers.Authorization = `Bearer ${await obterToken()}`;

  const ctrl = new AbortController();
  let expirou = false;
  const aoAbortarExterno = () => ctrl.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) ctrl.abort(signal.reason);
    else signal.addEventListener('abort', aoAbortarExterno, { once: true });
  }
  const timer = timeoutMs > 0
    ? setTimeout(() => { expirou = true; ctrl.abort('timeout'); }, timeoutMs)
    : null;

  try {
    const r = await fetch(`/api/revisao-autonoma/${path}`, {
      method: body ? 'POST' : 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers,
      signal: ctrl.signal,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw Object.assign(new Error(data?.error || 'Não foi possível concluir.'), { status: r.status });
    }
    return data;
  } catch (e) {
    if (expirou) {
      throw Object.assign(
        new Error('A requisição demorou demais. Verifique a conexão e tente novamente.'),
        { status: 408, timeout: true },
      );
    }
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', aoAbortarExterno);
  }
}

export const novoPedidoLivre = () => crypto.randomUUID();
