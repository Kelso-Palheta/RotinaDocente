import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/utils/aiHeaders', () => ({ getClientAIHeaders: () => ({}) }));

import { useAgentChat } from '@/hooks/agentes/useAgentChat';

const CHAVE_EM = 'agente_history_ensino-medio';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('REV-AG-01: resposta pendente após desmontagem não recria histórico apagado', async () => {
  let responder;
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise((resolve) => { responder = resolve; }))
  );

  const { result, unmount } = renderHook(() => useAgentChat('ensino-medio'));

  let envio;
  await act(async () => {
    envio = result.current.sendMessage('Pergunta antiga');
  });

  unmount();
  localStorage.removeItem(CHAVE_EM);

  await act(async () => {
    responder(
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'Resposta antiga' } }] })
      )
    );
    await envio;
  });

  expect(localStorage.getItem(CHAVE_EM)).toBeNull();
});
