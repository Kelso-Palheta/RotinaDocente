import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/utils/aiHeaders', () => ({ getClientAIHeaders: () => ({}) }));

import { useAgentChat } from '@/hooks/agentes/useAgentChat';
import ChatWindow from '@/components/agentes/ChatWindow';

const CHAVE_EM = 'agente_history_ensino-medio';
const msg = (role, content) => ({ role, content });
const respostaOk = (content) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
  });
const respostaErro = (message) =>
  new Response(JSON.stringify({ error: 'UPSTREAM_ERROR', message }), {
    status: 500,
  });

const agenteEm = {
  id: 'ensino-medio',
  name: 'Agente EM',
  segmento: 'Ensino Médio',
  descricao: 'Apoio pedagógico para o Ensino Médio.',
  cor: '#1a73e8',
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => localStorage.clear());

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('AG-02c: desmontagem aborta espera local, funciona em StrictMode e não grava resposta atrasada após limpeza', async () => {
  let responder;
  let sinalRecebido;
  vi.stubGlobal(
    'fetch',
    vi.fn((_url, init) => {
      sinalRecebido = init?.signal;
      return new Promise((resolve) => {
        responder = resolve;
      });
    })
  );

  const wrapper = ({ children }) => <React.StrictMode>{children}</React.StrictMode>;
  const { result, unmount } = renderHook(() => useAgentChat('ensino-medio'), {
    wrapper,
  });

  let envio;
  await act(async () => {
    envio = result.current.sendMessage('Pergunta antes de sair');
  });

  expect(sinalRecebido?.aborted).toBe(false);

  unmount();
  expect(sinalRecebido?.aborted).toBe(true);
  localStorage.removeItem(CHAVE_EM);

  await act(async () => {
    responder(respostaOk('Resposta atrasada'));
    await envio;
  });

  expect(localStorage.getItem(CHAVE_EM)).toBeNull();
});

it('AG-02d: repetir envio após falha preserva histórico anterior e não duplica a pergunta', async () => {
  const historicoInicial = [
    msg('user', 'Pergunta anterior'),
    msg('assistant', 'Resposta anterior'),
  ];
  localStorage.setItem(CHAVE_EM, JSON.stringify(historicoInicial));

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(respostaErro('Falha temporária no provedor.'))
    .mockResolvedValueOnce(respostaOk('Resposta após retry'));
  vi.stubGlobal('fetch', fetchMock);

  const { result } = renderHook(() => useAgentChat('ensino-medio'));

  await act(async () => {
    await result.current.sendMessage('Pergunta com falha');
  });

  expect(result.current.error).toMatch(/Falha temporária/i);
  expect(result.current.messages).toEqual([
    ...historicoInicial,
    msg('user', 'Pergunta com falha'),
  ]);

  await act(async () => {
    await result.current.retryLastMessage();
  });

  const conversaFinal = [
    ...historicoInicial,
    msg('user', 'Pergunta com falha'),
    msg('assistant', 'Resposta após retry'),
  ];
  expect(result.current.error).toBeNull();
  expect(result.current.messages).toEqual(conversaFinal);
  expect(JSON.parse(localStorage.getItem(CHAVE_EM))).toEqual(conversaFinal);

  const segundoPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(segundoPayload.messages).toEqual([
    ...historicoInicial,
    msg('user', 'Pergunta com falha'),
  ]);
});

it('AG-02e: ChatWindow permite tentar novamente após erro sem duplicar a pergunta na tela', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(respostaErro('Falha temporária'))
    .mockResolvedValueOnce(respostaOk('Orientação recuperada'));
  vi.stubGlobal('fetch', fetchMock);

  render(<ChatWindow agente={agenteEm} onBack={() => {}} />);

  const campo = screen.getByRole('textbox', { name: /Mensagem para Agente EM/i });
  fireEvent.change(campo, { target: { value: 'Como trabalhar competência 3?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

  expect(await screen.findByText(/Falha temporária/i)).toBeInTheDocument();
  expect(screen.getAllByText('Como trabalhar competência 3?')).toHaveLength(1);

  const botaoRetry = screen.getByRole('button', { name: /Tentar novamente/i });
  fireEvent.click(botaoRetry);

  expect(await screen.findByText('Orientação recuperada')).toBeInTheDocument();
  expect(screen.getAllByText('Como trabalhar competência 3?')).toHaveLength(1);
});
