import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useSalaRevisao } from '@/components/revisao/useSalaRevisao';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('RV-INT-05 recibo recebido por SSE prevalece sobre falha HTTP tardia', async () => {
  let entregarFrame; let falhar;
  const estado = { sala: { codigo: 'ARTE42', revisao: 1 }, rodada: { id: 'r1', encerraEmMs: Date.now() + 60000 }, fase: 'pergunta', agoraServidorMs: Date.now() };
  const fetcher = vi.fn(async url => {
    if (url.endsWith('/eventos')) return { ok: true, body: { getReader: () => ({ read: () => new Promise(r => { entregarFrame = r; }), cancel: async () => entregarFrame?.({ done: true }), releaseLock: () => {} }) } };
    if (url.endsWith('/respostas')) return new Promise((resolve, reject) => { falhar = reject; });
    return { ok: true, json: async () => ({ estado }) };
  });
  vi.stubGlobal('fetch', fetcher);
  const { result } = renderHook(() => useSalaRevisao({ codigo: 'ARTE42', contexto: 'a1', papel: 'aluno' }));
  await waitFor(() => expect(result.current.estado?.conexao).toBe('conectado'));
  let resposta; act(() => { resposta = result.current.responder('D'); });
  await act(async () => { entregarFrame({ done: false, value: new TextEncoder().encode(`event: estado\ndata: ${JSON.stringify({ estado, envio: { status: 'confirmado', alternativa: 'D', rodadaId: 'r1', reciboId: 'recebido' } })}\n\n`) }); });
  await act(async () => { falhar(new Error('Falha tardia de rede')); await resposta; });
  expect(result.current.envio.status).toBe('confirmado');
  expect(result.current.erro).toBeNull();
});
