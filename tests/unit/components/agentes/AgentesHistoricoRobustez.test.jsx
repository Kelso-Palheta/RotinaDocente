import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/utils/aiHeaders', () => ({ getClientAIHeaders: () => ({}) }));

import { useAgentChat } from '@/hooks/agentes/useAgentChat';

const CHAVE_EM = 'agente_history_ensino-medio';
const CHAVE_EF2 = 'agente_history_fundamental-2';
const BACKUP_EM = 'agente_history_backup_ensino-medio';

const msg = (role, content) => ({ role, content });
const resposta = (content) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('AG-01b: resposta pendente do agente anterior não contamina o destino', async () => {
  const historicoEf2 = [msg('user', 'Conversa EF2')];
  localStorage.setItem(CHAVE_EF2, JSON.stringify(historicoEf2));

  let responder;
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise((resolve) => { responder = resolve; }))
  );

  const { result, rerender } = renderHook(({ id }) => useAgentChat(id), {
    initialProps: { id: 'ensino-medio' },
  });

  let envio;
  await act(async () => {
    envio = result.current.sendMessage('Pergunta EM');
  });

  rerender({ id: 'fundamental-2' });

  expect(result.current.messages).toEqual(historicoEf2);
  expect(result.current.isLoading).toBe(false);

  await act(async () => {
    responder(resposta('Resposta EM'));
    await envio;
  });

  expect(result.current.messages).toEqual(historicoEf2);
  expect(JSON.parse(localStorage.getItem(CHAVE_EF2))).toEqual(historicoEf2);
  expect(JSON.parse(localStorage.getItem(CHAVE_EM))).toEqual([
    msg('user', 'Pergunta EM'),
  ]);
});

it('AG-02b: resposta antiga é descartada após limpar e iniciar outro envio', async () => {
  const pendentes = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise((resolve) => { pendentes.push(resolve); }))
  );

  const { result } = renderHook(() => useAgentChat('ensino-medio'));

  let primeiroEnvio;
  await act(async () => {
    primeiroEnvio = result.current.sendMessage('Pergunta 1');
  });

  act(() => result.current.clearHistory());

  expect(result.current.messages).toEqual([]);
  expect(result.current.isLoading).toBe(false);

  let segundoEnvio;
  await act(async () => {
    segundoEnvio = result.current.sendMessage('Pergunta 2');
  });

  expect(pendentes).toHaveLength(2);

  await act(async () => {
    pendentes[1](resposta('Resposta 2'));
    await segundoEnvio;
  });

  expect(result.current.messages).toEqual([
    msg('user', 'Pergunta 2'),
    msg('assistant', 'Resposta 2'),
  ]);

  await act(async () => {
    pendentes[0](resposta('Resposta 1'));
    await primeiroEnvio;
  });

  expect(result.current.messages).toEqual([
    msg('user', 'Pergunta 2'),
    msg('assistant', 'Resposta 2'),
  ]);
  expect(result.current.isLoading).toBe(false);
});

it('AG-03b: JSON malformado é preservado em backup e gera aviso recuperável', () => {
  const bruto = '{"conteudo": "formato inválido"';
  localStorage.setItem(CHAVE_EM, bruto);

  const { result } = renderHook(() => useAgentChat('ensino-medio'));

  expect(result.current.messages).toEqual([]);
  expect(localStorage.getItem(BACKUP_EM)).toBe(bruto);
  expect(localStorage.getItem(CHAVE_EM)).not.toBe(bruto);
  expect(result.current.storageNotice?.message).toMatch(/backup|recuper/i);
});

it('AG-03c: papel inválido invalida o histórico inteiro e não quebra a conversa', () => {
  const bruto = JSON.stringify([
    msg('system', 'Instrução indevida'),
    msg('user', 'Mensagem válida'),
  ]);
  localStorage.setItem(CHAVE_EM, bruto);

  const { result } = renderHook(() => useAgentChat('ensino-medio'));

  expect(result.current.messages).toEqual([]);
  expect(localStorage.getItem(BACKUP_EM)).toBe(bruto);
  expect(result.current.storageNotice?.message).toBeTruthy();
});

it('AG-03d: se o backup falhar, o conteúdo original não é sobrescrito', () => {
  const bruto = JSON.stringify({ formato: 'inválido' });
  localStorage.setItem(CHAVE_EM, bruto);

  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (chave, valor) {
    if (chave === BACKUP_EM) {
      throw new DOMException('Quota excedida', 'QuotaExceededError');
    }
    return original.call(this, chave, valor);
  });

  const { result } = renderHook(() => useAgentChat('ensino-medio'));

  expect(result.current.messages).toEqual([]);
  expect(localStorage.getItem(CHAVE_EM)).toBe(bruto);
  expect(result.current.storageNotice?.message).toMatch(/preserv/i);
});

it('AG-03e: falha de quota mantém a conversa em memória e informa o professor', async () => {
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (chave, valor) {
    if (chave === CHAVE_EM) {
      throw new DOMException('Quota excedida', 'QuotaExceededError');
    }
    return original.call(this, chave, valor);
  });
  vi.stubGlobal('fetch', vi.fn(async () => resposta('Resposta')));

  const { result } = renderHook(() => useAgentChat('ensino-medio'));

  expect(result.current.storageNotice).toBeNull();

  await act(async () => {
    await result.current.sendMessage('Oi');
  });

  expect(result.current.messages).toEqual([
    msg('user', 'Oi'),
    msg('assistant', 'Resposta'),
  ]);
  expect(result.current.storageNotice?.message).toMatch(/salvar|armazenamento/i);
});

it('AG-03f: mensagens de um agente não alteram a chave do outro', async () => {
  const historicoEm = [msg('user', 'Conversa EM')];
  const historicoEf2 = [msg('user', 'Conversa EF2')];
  localStorage.setItem(CHAVE_EM, JSON.stringify(historicoEm));
  localStorage.setItem(CHAVE_EF2, JSON.stringify(historicoEf2));
  vi.stubGlobal('fetch', vi.fn(async () => resposta('Resposta EF2')));

  const { result, rerender } = renderHook(({ id }) => useAgentChat(id), {
    initialProps: { id: 'ensino-medio' },
  });

  rerender({ id: 'fundamental-2' });

  await act(async () => {
    await result.current.sendMessage('Nova pergunta');
  });

  expect(JSON.parse(localStorage.getItem(CHAVE_EM))).toEqual(historicoEm);
  expect(JSON.parse(localStorage.getItem(CHAVE_EF2))).toEqual([
    ...historicoEf2,
    msg('user', 'Nova pergunta'),
    msg('assistant', 'Resposta EF2'),
  ]);
});
