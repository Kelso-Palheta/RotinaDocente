import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callAI, callAIRaw } from '../../frontend/src/lib/ai-provider-central';

describe('IT-04 (RN-27 & RN-29): Gateway Central de IA com BYOK Estrito', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('deve rejeitar chamada com erro AI_KEY_REQUIRED se não houver chave de IA informada pelo usuário', async () => {
    await expect(
      callAI({
        messages: [{ role: 'user', content: 'Olá' }],
        userConfig: { provider: 'openai', apiKey: '' },
      })
    ).rejects.toThrowError(/AI_KEY_REQUIRED|Você precisa conectar sua chave de IA/);
  });

  it('deve rejeitar chamada se userConfig não for fornecido (nenhum fallback central permitido)', async () => {
    await expect(
      callAI({
        messages: [{ role: 'user', content: 'Olá' }],
      })
    ).rejects.toThrowError(/AI_KEY_REQUIRED|Você precisa conectar sua chave de IA/);
  });

  it('deve direcionar chamada para Google Gemini quando provider for gemini', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Resposta do Gemini' } }],
      }),
    });
    globalThis.fetch = mockFetch;

    const res = await callAI({
      messages: [{ role: 'user', content: 'Teste Gemini' }],
      userConfig: {
        provider: 'gemini',
        apiKey: 'AIzaSyFakeGeminiKey',
        model: 'gemini-1.5-flash',
      },
    });

    expect(res).toBe('Resposta do Gemini');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('googleapis.com');
    expect(options.headers.Authorization).toBe('Bearer AIzaSyFakeGeminiKey');
  });

  it('deve direcionar chamada para OpenAI quando provider for openai', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Resposta do GPT' } }],
      }),
    });
    globalThis.fetch = mockFetch;

    const res = await callAI({
      messages: [{ role: 'user', content: 'Teste GPT' }],
      userConfig: {
        provider: 'openai',
        apiKey: 'sk-proj-FakeOpenAIKey',
        model: 'gpt-4o-mini',
      },
    });

    expect(res).toBe('Resposta do GPT');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('api.openai.com');
    expect(options.headers.Authorization).toBe('Bearer sk-proj-FakeOpenAIKey');
  });

  it('deve direcionar chamada para Maritaca AI quando provider for maritaca', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Resposta da Maritaca' } }],
      }),
    });
    globalThis.fetch = mockFetch;

    const res = await callAI({
      messages: [{ role: 'user', content: 'Teste Maritaca' }],
      userConfig: {
        provider: 'maritaca',
        apiKey: 'maritaca-key-123',
        model: 'sabiazinho-4',
      },
    });

    expect(res).toBe('Resposta da Maritaca');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('maritaca.ai');
    expect(options.headers.Authorization).toBe('Bearer maritaca-key-123');
  });
});
