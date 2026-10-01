import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from '../../frontend/src/app/api/adaptacoes/imagem-fallback/route';

function montarRequest(body) {
  return new Request('http://localhost/api/adaptacoes/imagem-fallback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

function respostaImagem({ ok = true, contentType = 'image/jpeg', binario = [1, 2, 3] } = {}) {
  return {
    ok,
    status: ok ? 200 : 502,
    headers: {
      get: (h) => (String(h).toLowerCase() === 'content-type' ? contentType : null),
    },
    arrayBuffer: async () => new Uint8Array(binario).buffer,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('IT-14 (RN-39): Endpoint de fallback gratuito de imagens (/api/adaptacoes/imagem-fallback)', () => {
  it('com POLLINATIONS_API_KEY usa gen.pollinations.ai com model=flux e devolve data URL', async () => {
    vi.stubEnv('POLLINATIONS_API_KEY', 'sk-servidor-123');
    const fetchMock = vi.fn().mockResolvedValue(respostaImagem());
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(
      montarRequest({ prompt: 'educational illustration of a solar system' })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.servico).toBe('flux');
    expect(json.imagemUrl).toMatch(/^data:image\/jpeg;base64,/);

    const urlChamada = fetchMock.mock.calls[0][0];
    expect(urlChamada).toContain('https://gen.pollinations.ai/image/');
    expect(urlChamada).toContain('model=flux');
    expect(urlChamada).toContain('sk-servidor-123');
    expect(urlChamada).toContain(
      encodeURIComponent('educational illustration of a solar system')
    );
  });

  it('sem chave do servidor usa o endpoint legado e devolve a URL validada', async () => {
    vi.stubEnv('POLLINATIONS_API_KEY', '');
    const fetchMock = vi.fn().mockResolvedValue(respostaImagem());
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(montarRequest({ prompt: 'educational illustration of a tree' }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sucesso).toBe(true);
    expect(json.servico).toBe('legado');
    expect(json.imagemUrl).toContain('https://image.pollinations.ai/prompt/');

    const urlChamada = fetchMock.mock.calls[0][0];
    expect(urlChamada).toContain('https://image.pollinations.ai/prompt/');
    expect(urlChamada).toContain(encodeURIComponent('educational illustration of a tree'));
  });

  it('quando o flux devolve corpo não-imagem, cai para o legado', async () => {
    vi.stubEnv('POLLINATIONS_API_KEY', 'sk-servidor-123');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respostaImagem({ ok: false, contentType: 'application/json' }))
      .mockResolvedValueOnce(respostaImagem());
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(montarRequest({ prompt: 'árvore frutífera' }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.servico).toBe('legado');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('image.pollinations.ai');
  });

  it('falha total dos dois serviços responde 502 com mensagem de erro', async () => {
    vi.stubEnv('POLLINATIONS_API_KEY', 'sk-servidor-123');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respostaImagem({ ok: false, contentType: 'text/html' }))
      .mockResolvedValueOnce(respostaImagem({ ok: false, contentType: 'text/html' }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(montarRequest({ prompt: 'mapa do brasil' }));

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBeTruthy();
    expect(typeof json.error).toBe('string');
  });

  it('prompt ausente ou vazio responde 400', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const semPrompt = await POST(montarRequest({}));
    expect(semPrompt.status).toBe(400);

    const promptVazio = await POST(montarRequest({ prompt: '   ' }));
    expect(promptVazio.status).toBe(400);
  });

  it('prompt acima do limite responde 400', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const res = await POST(montarRequest({ prompt: 'a'.repeat(4001) }));
    expect(res.status).toBe(400);
  });
});
