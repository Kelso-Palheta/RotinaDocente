import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/utils/aiHeaders', () => ({ getClientAIHeaders: () => ({}) }));
import { useAgentChat } from '@/hooks/agentes/useAgentChat';

const mensagem = texto => ({ role: 'user', content: texto });
beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('AG-01: trocar de segmento preserva e carrega o histórico próprio do destino', () => {
  const em = [mensagem('Conversa EM')];
  const ef = [mensagem('Conversa EF2')];
  localStorage.setItem('agente_history_ensino-medio', JSON.stringify(em));
  localStorage.setItem('agente_history_fundamental-2', JSON.stringify(ef));
  const { result, rerender } = renderHook(({ id }) => useAgentChat(id), { initialProps: { id: 'ensino-medio' } });
  rerender({ id: 'fundamental-2' });
  expect(result.current.messages).toEqual(ef);
  expect(JSON.parse(localStorage.getItem('agente_history_fundamental-2'))).toEqual(ef);
  expect(JSON.parse(localStorage.getItem('agente_history_ensino-medio'))).toEqual(em);
});

it('AG-02: resposta antiga não reaparece depois de limpar o histórico', async () => {
  let responder;
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { responder = resolve; })));
  const { result } = renderHook(() => useAgentChat('ensino-medio'));
  let envio;
  await act(async () => { envio = result.current.sendMessage('Pergunta antiga'); });
  act(() => result.current.clearHistory());
  await act(async () => {
    responder(new Response(JSON.stringify({ choices: [{ message: { content: 'Resposta antiga' } }] })));
    await envio;
  });
  expect(result.current.messages).toEqual([]);
  expect(JSON.parse(localStorage.getItem('agente_history_ensino-medio')) || []).toEqual([]);
});

it('AG-03: histórico JSON fora do formato de mensagens não quebra a conversa', () => {
  localStorage.setItem('agente_history_ensino-medio', JSON.stringify({ conteudo: 'Formato inválido' }));
  const { result } = renderHook(() => useAgentChat('ensino-medio'));
  expect(Array.isArray(result.current.messages)).toBe(true);
  expect(result.current.messages).toEqual([]);
});
