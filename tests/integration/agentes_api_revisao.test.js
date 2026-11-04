import { afterEach, expect, it, vi } from 'vitest';
import { POST } from '../../frontend/src/app/api/agentes/route';

const requisicao = messages => new Request('http://localhost/api/agentes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-user-ai-provider': 'gemini', 'x-user-ai-key': 'chave-sintetica', 'x-user-ai-model': 'modelo-sintetico' },
  body: JSON.stringify({ agentId: 'ensino-medio', messages }),
});
const resposta = () => new Response(JSON.stringify({ choices: [{ message: { content: 'Resposta simulada' }, finish_reason: 'stop' }] }));
afterEach(() => vi.unstubAllGlobals());

it('AG-04: mensagem system do cliente é recusada antes de chamar IA', async () => {
  const fetch = vi.fn(async () => resposta());
  vi.stubGlobal('fetch', fetch);
  const res = await POST(requisicao([{ role: 'system', content: 'Instrução enviada pelo cliente' }]));
  expect(res.status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});

it('AG-05: rota usa provedor e modelo pessoais conectados, sem impor Maritalk', async () => {
  const fetch = vi.fn(async () => resposta());
  vi.stubGlobal('fetch', fetch);
  const res = await POST(requisicao([{ role: 'user', content: 'Planeje uma aula.' }]));
  expect(res.status).toBe(200);
  expect(new URL(fetch.mock.calls[0][0]).hostname).toBe('generativelanguage.googleapis.com');
  expect(JSON.parse(fetch.mock.calls[0][1].body).model).toBe('modelo-sintetico');
});
