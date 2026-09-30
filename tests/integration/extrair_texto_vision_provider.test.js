import { describe, it, expect, vi, afterEach } from 'vitest';
import { extractTextOnly } from '../../frontend/src/lib/redacao/ai-provider';

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const GEMINI_COMPAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

describe('IT-10 (RN-47): Provedor/modelo e propagação de erro na transcrição de imagem', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('gemini: deve usar o modelo configurado pelo professor no caminho OpenAI-compat', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse(200, { choices: [{ message: { content: 'Transcrição do Gemini' } }] })
    );
    globalThis.fetch = mockFetch;

    const texto = await extractTextOnly('aW1hZ2Vj', 'image/jpeg', {
      provider: 'gemini',
      apiKey: 'AIzaFakeKey',
      model: 'gemini-2.5-flash',
    });

    expect(texto).toBe('Transcrição do Gemini');
    const [url, options] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(GEMINI_COMPAT_URL);
    expect(JSON.parse(options.body).model).toBe('gemini-2.5-flash');
  });

  it('gemini: modelo aposentado deve acionar a cascata nativa e usar modelo disponível da chave', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes('/openai/chat/completions')) {
        return jsonResponse(404, {
          error: { message: 'models/gemini-1.5-flash is not found or has been retired' },
        });
      }
      if (u.includes('/v1beta/models?key=')) {
        return jsonResponse(200, {
          models: [
            { name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] },
          ],
        });
      }
      if (u.includes(':generateContent')) {
        if (u.includes('gemini-1.5-flash')) {
          return jsonResponse(404, {
            error: { code: 404, message: 'models/gemini-1.5-flash is retired' },
          });
        }
        return jsonResponse(200, {
          candidates: [{ content: { parts: [{ text: 'Transcrição via cascata' }] } }],
        });
      }
      throw new Error(`URL inesperada: ${u}`);
    });
    globalThis.fetch = mockFetch;

    const texto = await extractTextOnly('aW1hZ2Vj', 'image/jpeg', {
      provider: 'gemini',
      apiKey: 'AIzaFakeKey',
      model: 'gemini-1.5-flash',
    });

    expect(texto).toBe('Transcrição via cascata');

    const generateCalls = mockFetch.mock.calls.filter(([u]) => String(u).includes(':generateContent'));
    expect(generateCalls.length).toBeGreaterThanOrEqual(2);
    const lastUrl = String(generateCalls[generateCalls.length - 1][0]);
    expect(lastUrl).toContain('gemini-3.6-flash');
    expect(lastUrl).not.toContain('gemini-1.5-flash');

    const firstNativeBody = JSON.parse(generateCalls[0][1].body);
    const parts = firstNativeBody.contents[0].parts;
    const imagePart = parts.find((p) => p.inlineData?.data === 'aW1hZ2Vj' || p.inline_data?.data === 'aW1hZ2Vj');
    expect(imagePart).toBeDefined();
    expect(
      (imagePart.inlineData?.mimeType || imagePart.inline_data?.mime_type) === 'image/jpeg'
    ).toBe(true);
  });

  it('openai: deve usar o modelo configurado pelo professor', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse(200, { choices: [{ message: { content: 'Transcrição do GPT' } }] })
    );
    globalThis.fetch = mockFetch;

    const texto = await extractTextOnly('aW1hZ2Vj', 'image/jpeg', {
      provider: 'openai',
      apiKey: 'sk-proj-Fake',
      model: 'gpt-4o',
    });

    expect(texto).toBe('Transcrição do GPT');
    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body).model).toBe('gpt-4o');
  });

  it('anthropic: deve usar o modelo configurado em vez de um modelo fixo antigo', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse(200, { content: [{ type: 'text', text: 'Transcrição do Claude' }] })
    );
    globalThis.fetch = mockFetch;

    const texto = await extractTextOnly('aW1hZ2Vj', 'image/jpeg', {
      provider: 'anthropic',
      apiKey: 'sk-ant-Fake',
      model: 'claude-3-5-sonnet-latest',
    });

    expect(texto).toBe('Transcrição do Claude');
    const [, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body).model).toBe('claude-3-5-sonnet-latest');
  });

  it('deve propagar o erro real do provedor quando a chave existe (nunca AI_KEY_REQUIRED)', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { error: { message: 'Incorrect API key provided' } }));
    globalThis.fetch = mockFetch;

    let captured = null;
    try {
      await extractTextOnly('aW1hZ2Vj', 'image/jpeg', {
        provider: 'openai',
        apiKey: 'sk-invalida',
        model: 'gpt-4o-mini',
      });
    } catch (e) {
      captured = e;
    }

    expect(captured).toBeTruthy();
    expect(captured.message).not.toMatch(/AI_KEY_REQUIRED/);
    expect(captured.message).toMatch(/Incorrect API key|401/);
  });

  it('deve recusar com AI_KEY_REQUIRED quando a chave não veio configurada', async () => {
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    await expect(
      extractTextOnly('aW1hZ2Vj', 'image/jpeg', { provider: 'gemini', apiKey: '' })
    ).rejects.toThrowError(/AI_KEY_REQUIRED/);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('provedor sem suporte a visão deve receber mensagem clara em vez de AI_KEY_REQUIRED', async () => {
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    await expect(
      extractTextOnly('aW1hZ2Vj', 'image/jpeg', {
        provider: 'openrouter',
        apiKey: 'sk-or-v1-Fake',
        model: 'meta-llama/llama-3.1-8b-instruct:free',
      })
    ).rejects.toThrowError(/openrouter/i);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
