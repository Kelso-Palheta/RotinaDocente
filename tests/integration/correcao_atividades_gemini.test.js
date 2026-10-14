import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/aiHeaders', () => ({
  getClientAIHeaders: () => ({
    'x-user-ai-provider': 'gemini',
    'x-user-ai-key': 'chave-teste',
    'x-user-ai-model': 'gemini-modelo-configurado',
  }),
}));

import { corrigirAtividade } from '../../frontend/src/utils/atividades/correcaoIA';
import { POST } from '../../frontend/src/app/api/maritaca/route';
import { callAIRaw } from '../../frontend/src/lib/ai-provider-central';

const config = { provider: 'gemini', apiKey: 'chave-teste', model: 'gemini-modelo-configurado' };
const nota = { nota: 1.5, feedback: 'Boa análise.', criterios: [] };
const json = JSON.stringify(nota);
const params = {
  questoes: [{ id: 'q1', tipo: 'discursiva', enunciado: 'Impactos da IA na arte?', notaMaxima: 2,
    imagens: [{ url: 'data:image/png;base64,aW1hZ2Vt' }] }],
  respostas: { q1: { resposta: 'A IA amplia as possibilidades da arte.' } },
};
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
// Resposta reutilizável: mocks persistentes não podem reutilizar um stream HTTP consumido.
const native = (parts, finishReason = 'STOP') => ({ ok: true, status: 200,
  json: async () => ({ candidates: [{ content: { parts }, finishReason }] }) });
const compatError = () => response({ error: { message: 'Use generateContent' } }, 404);
const body = { model: 'sabiazinho-4', messages: [{ role: 'user', content: 'Corrija. JSON.' }],
  response_format: { type: 'json_object' }, max_tokens: 2048 };

afterEach(() => vi.unstubAllGlobals());

describe('IT-15: Correção de atividades com Gemini BYOK', () => {
  it('usa Google, modelo configurado, JSON explícito e registra modelo efetivo', async () => {
    const external = vi.fn(async () => response({ model: 'gemini-modelo-efetivo',
      choices: [{ message: { content: json }, finish_reason: 'stop' }] }));
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      if (url === '/api/maritaca') return POST(new Request('http://localhost/api/maritaca', options));
      return external(url, options);
    }));

    const result = await corrigirAtividade(params);
    expect(result.notaFinal).toBe(1.5);
    const [url, options] = external.mock.calls[0];
    expect(new URL(url).hostname).toBe('generativelanguage.googleapis.com');
    expect(options.headers.Authorization).toBe('Bearer chave-teste');
    expect(JSON.parse(options.body).model).toBe(config.model);
    expect(JSON.parse(options.body).response_format).toEqual({ type: 'json_object' });
    expect(result.modelo).toBe('gemini-modelo-efetivo');
  });

  it('preserva prompt, imagem e modo JSON no fallback nativo', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(compatError())
      .mockResolvedValueOnce(native([{ thought: true, text: 'High School Teacher/Grader.' }, { text: json }]));
    vi.stubGlobal('fetch', fetch);
    const content = [{ type: 'text', text: 'Corrija. JSON.' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,aW1hZ2Vt' } }];
    const result = await callAIRaw({ ...body, messages: [{ role: 'user', content }] }, config);
    const [url, options] = fetch.mock.calls[1];
    expect(url).toContain(`${config.model}:generateContent`);
    const payload = JSON.parse(options.body);
    expect(payload.contents[0].parts).toEqual([{ text: 'Corrija. JSON.' },
      { inlineData: { mimeType: 'image/png', data: 'aW1hZ2Vt' } }]);
    expect(payload.generationConfig.responseMimeType).toBe('application/json');
    expect(result.data.choices[0].message.content).toBe(json);
    expect(result.data.choices[0].finish_reason).toBe('stop');
  });

  it('não entrega raciocínio como resposta quando não há texto final', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(compatError())
      .mockResolvedValue(native([{ thought: true, text: 'High School Teacher/Grader.' }])));
    const result = await callAIRaw(body, config);
    expect(result.ok).toBe(false);
    expect(result.data.error.message).toMatch(/resposta final/i);
    expect(JSON.stringify(result.data)).not.toContain('High School');
  });

  it('repete uma vez quando Gemini retorna MAX_TOKENS, preservando JSON', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(compatError())
      .mockResolvedValueOnce(native([{ thought: true, text: 'High School Teacher/Grader.' }], 'MAX_TOKENS'))
      .mockResolvedValueOnce(native([{ text: json }]));
    vi.stubGlobal('fetch', fetch);
    const result = await callAIRaw(body, config);
    expect(result.ok).toBe(true);
    expect(result.data.choices[0].message.content).toBe(json);
    expect(fetch).toHaveBeenCalledTimes(3);
    const initial = JSON.parse(fetch.mock.calls[1][1].body).generationConfig;
    const retry = JSON.parse(fetch.mock.calls[2][1].body).generationConfig;
    expect(retry.maxOutputTokens).toBe(initial.maxOutputTokens * 2);
    expect(retry.responseMimeType).toBe('application/json');
  });

  it('recusa truncamento persistente sem repetir indefinidamente', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(compatError())
      .mockResolvedValue(native([{ text: '{"nota":' }], 'MAX_TOKENS'));
    vi.stubGlobal('fetch', fetch);
    const result = await callAIRaw(body, config);
    expect(result.ok).toBe(false);
    expect(result.data.error.message).toMatch(/truncada/i);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('repete uma vez em truncamento na API compatível', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response({ choices: [{ message: { content: '{"nota":' }, finish_reason: 'length' }] }))
      .mockResolvedValueOnce(response({ model: config.model, choices: [{ message: { content: json }, finish_reason: 'stop' }] }));
    vi.stubGlobal('fetch', fetch);
    const result = await callAIRaw(body, config);
    expect(result.data.choices[0].message.content).toBe(json);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetch.mock.calls[1][1].body).max_tokens).toBe(4096);
  });
});
