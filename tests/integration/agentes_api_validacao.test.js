import { afterEach, expect, it, vi } from 'vitest';
import { POST } from '../../frontend/src/app/api/agentes/route';

const HEADERS = {
  'Content-Type': 'application/json',
  'x-user-ai-provider': 'gemini',
  'x-user-ai-key': 'chave-sintetica',
  'x-user-ai-model': 'modelo-sintetico',
};

const requisicao = (body) =>
  new Request('http://localhost/api/agentes', {
    method: 'POST',
    headers: HEADERS,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const requisicaoComMensagens = (messages) =>
  requisicao({ agentId: 'ensino-medio', messages });

const respostaOk = () =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: 'Resposta simulada' }, finish_reason: 'stop' }],
    })
  );

const prepararFetch = () => {
  const fetch = vi.fn(async () => respostaOk());
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

const mensagem = (role, content) => ({ role, content });

afterEach(() => vi.unstubAllGlobals());

it('AG-04b: recusa system e developer antes de chamar o provedor', async () => {
  const fetch = prepararFetch();

  for (const role of ['system', 'developer']) {
    const res = await POST(requisicaoComMensagens([mensagem(role, 'Instrução do cliente')]));
    expect(res.status).toBe(400);
    const corpo = await res.json();
    expect(corpo.error).toBe('INVALID_MESSAGES');
    expect(corpo.message).toMatch(/role|user|assistant/i);
  }

  expect(fetch).not.toHaveBeenCalled();
});

it('AG-04c: recusa conteúdo vazio, apenas espaços ou não string', async () => {
  const fetch = prepararFetch();

  for (const content of ['', '   ', null, 42, ['texto']]) {
    const res = await POST(requisicaoComMensagens([mensagem('user', content)]));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('INVALID_MESSAGES');
  }

  expect(fetch).not.toHaveBeenCalled();
});

it('AG-04d: recusa campos extras em qualquer mensagem', async () => {
  const fetch = prepararFetch();
  const res = await POST(
    requisicaoComMensagens([
      { role: 'user', content: 'Pergunta', system: 'Injeção' },
    ])
  );

  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe('INVALID_MESSAGES');
  expect(fetch).not.toHaveBeenCalled();
});

it('AG-04e: aplica limites de quantidade e de tamanho por mensagem', async () => {
  const fetch = prepararFetch();

  const muitas = Array.from({ length: 51 }, (_, i) => mensagem('user', `Pergunta ${i}`));
  const resQuantidade = await POST(requisicaoComMensagens(muitas));
  expect(resQuantidade.status).toBe(400);
  expect((await resQuantidade.json()).error).toBe('INVALID_MESSAGES');

  const resTamanho = await POST(
    requisicaoComMensagens([mensagem('user', 'x'.repeat(32_001))])
  );
  expect(resTamanho.status).toBe(400);
  expect((await resTamanho.json()).error).toBe('INVALID_MESSAGES');

  expect(fetch).not.toHaveBeenCalled();
});

it('AG-04f: corpo acima de 256 KiB retorna 413 antes de interpretar o JSON', async () => {
  const fetch = prepararFetch();
  const res = await POST(requisicao('x'.repeat(262_145)));

  expect(res.status).toBe(413);
  expect((await res.json()).error).toBe('PAYLOAD_TOO_LARGE');
  expect(fetch).not.toHaveBeenCalled();
});

it('AG-04g: JSON malformado ou corpo que não é objeto retorna 400 legível', async () => {
  const fetch = prepararFetch();

  const invalido = await POST(requisicao('{'));
  expect(invalido.status).toBe(400);
  expect((await invalido.json()).error).toBe('INVALID_JSON');

  const lista = await POST(requisicao([]));
  expect(lista.status).toBe(400);
  expect((await lista.json()).error).toBe('INVALID_BODY');

  const semMensagens = await POST(requisicao({ agentId: 'ensino-medio' }));
  expect(semMensagens.status).toBe(400);
  expect((await semMensagens.json()).error).toBe('INVALID_MESSAGES');

  expect(fetch).not.toHaveBeenCalled();
});

it('AG-04h: conversa válida com user e assistant continua sendo encaminhada', async () => {
  const fetch = prepararFetch();
  const res = await POST(
    requisicaoComMensagens([
      mensagem('user', 'Pergunta anterior'),
      mensagem('assistant', 'Resposta anterior'),
      mensagem('user', 'Nova pergunta'),
    ])
  );

  expect(res.status).toBe(200);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect((await res.json()).choices[0].message.content).toBe('Resposta simulada');
});
