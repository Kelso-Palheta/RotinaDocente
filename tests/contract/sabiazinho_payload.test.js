/**
 * Teste de Contrato — Integração com Maritaca AI (Sabiá-zinho 4)
 * Referência: specs/RULES.md (RN-06, RN-27) e specs/TESTS_SPEC.md (CT-01)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { callAI, PROVIDER_ENDPOINTS } from '../../frontend/src/lib/ai-provider-central';

describe('CT-01 (RN-06 & RN-27): Validação de Contrato do Payload para sabiazinho-4', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('deve formatar o endpoint e headers corretamente para Maritaca AI', () => {
    const maritacaSpec = PROVIDER_ENDPOINTS.maritaca;
    expect(maritacaSpec).toBeDefined();
    expect(maritacaSpec.baseUrl).toBe('https://chat.maritaca.ai/api/v1/chat/completions');
    expect(maritacaSpec.defaultModel).toBe('sabiazinho-4');

    const headers = maritacaSpec.headers('fake-maritaca-key');
    expect(headers.Authorization).toBe('Bearer fake-maritaca-key');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('deve enviar payload estritamente compatível contendo model="sabiazinho-4" e nunca aliases proibidos', async () => {
    let capturedUrl = null;
    let capturedPayload = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url, options) => {
      capturedUrl = String(url);
      capturedPayload = JSON.parse(options.body);

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Resposta contratual válida gerada pelo Sabiá-zinho 4.',
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const resposta = await callAI({
      systemPrompt: 'Você é um assistente pedagógico especializado na BNCC.',
      messages: [{ role: 'user', content: 'Planeje uma aula de História para o 9º ano.' }],
      temperature: 0.3,
      maxTokens: 2000,
      userConfig: {
        provider: 'maritaca',
        apiKey: 'maritaca_key_123',
        model: 'sabiazinho-4',
      },
    });

    expect(resposta).toContain('Sabiá-zinho 4');
    expect(capturedUrl).toBe('https://chat.maritaca.ai/api/v1/chat/completions');

    // Validação estrita do contrato do payload (RN-06)
    expect(capturedPayload).toBeDefined();
    expect(capturedPayload.model).toBe('sabiazinho-4');
    expect(capturedPayload.model).not.toBe('Sabia-4');
    expect(capturedPayload.model).not.toBe('sabia-4');

    expect(Array.isArray(capturedPayload.messages)).toBe(true);
    expect(capturedPayload.messages.length).toBe(2);
    expect(capturedPayload.messages[0]).toEqual({
      role: 'system',
      content: 'Você é um assistente pedagógico especializado na BNCC.',
    });
    expect(capturedPayload.messages[1]).toEqual({
      role: 'user',
      content: 'Planeje uma aula de História para o 9º ano.',
    });

    expect(capturedPayload.temperature).toBe(0.3);
    expect(capturedPayload.max_tokens).toBe(2000);
  });
});
