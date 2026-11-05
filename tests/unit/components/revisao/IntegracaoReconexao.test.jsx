import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSalaRevisao } from '@/components/revisao/useSalaRevisao';
const json = data => ({ ok: true, json: async () => data });
const estado = (revisao = 1, rodadaId = 'r1') => ({ sala: { codigo: 'ARTE42', revisao }, rodada: { id: rodadaId, encerraEmMs: Date.now() + 60000 }, fase: 'pergunta', agoraServidorMs: Date.now() });
function canal() {
  let resolver;
  const leitor = { read: () => new Promise(r => { resolver = r; }), cancel: async () => resolver?.({ done: true }), releaseLock: vi.fn() };
  return { resposta: { ok: true, body: { getReader: () => leitor } }, emitir: async data => { await act(async () => { resolver({ done: false, value: new TextEncoder().encode(`event: estado\ndata: ${JSON.stringify(data)}\n\n`) }); }); }, encerrar: async () => { await act(async () => { resolver({ done: true }); }); } };
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('RV-INT-05 — reconexão, sessão e comandos', () => {
  it('SSE confirma resposta recebida mesmo após falha HTTP, sem novo envio', async () => {
    const stream = canal();
    const fetcher = vi.fn(async url => url.endsWith('/eventos') ? stream.resposta : url.endsWith('/respostas') ? { ok: false, status: 503, json: async () => ({ error: 'Tempo de rede excedido' }) } : json({ estado: estado() }));
    vi.stubGlobal('fetch', fetcher);
    const { result } = renderHook(() => useSalaRevisao({ codigo: 'ARTE42', papel: 'aluno', contexto: 'a1' }));
    await waitFor(() => expect(result.current.estado?.conexao).toBe('conectado'));
    await act(async () => { await result.current.responder('E'); });
    expect(result.current.envio.status).toBe('falha');
    await stream.emitir({ estado: estado(), envio: { status: 'confirmado', rodadaId: 'r1', alternativa: 'E', reciboId: 'recuperado' } });
    expect(result.current.envio.status).toBe('confirmado');
    await act(async () => { await result.current.tentarNovamente(); });
    expect(fetcher.mock.calls.filter(c => c[0].endsWith('/respostas'))).toHaveLength(1);
  });
  it('renova stream e preserva recibo após estado vazio antigo', async () => {
    const stream1 = canal(); const stream2 = canal(); let streams = 0;
    vi.stubGlobal('fetch', vi.fn(async url => url.endsWith('/eventos') ? (++streams === 1 ? stream1.resposta : stream2.resposta) : json({ estado: estado() })));
    const { result } = renderHook(() => useSalaRevisao({ codigo: 'ARTE42', papel: 'aluno', contexto: 'a1' }));
    await waitFor(() => expect(streams).toBe(1));
    await stream1.emitir({ estado: estado(3), envio: { status: 'confirmado', rodadaId: 'r1', alternativa: 'B', reciboId: 'r' } });
    vi.useFakeTimers();
    await stream1.encerrar();
    expect(result.current.estado.conexao).toBe('reconectando');
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(streams).toBe(2);
    await stream2.emitir({ estado: estado(3), envio: { status: 'nao_enviado', rodadaId: 'r1', alternativa: null } });
    expect(result.current.envio).toMatchObject({ status: 'confirmado', alternativa: 'B' });
  });
  it('comando contém revisão/rodada, troca de conta invalida stream anterior', async () => {
    const stream1 = canal(); const stream2 = canal(); let streams = 0;
    const fetcher = vi.fn(async url => url.endsWith('/eventos') ? (++streams === 1 ? stream1.resposta : stream2.resposta) : json({ estado: estado(url.endsWith('/comandos') ? 2 : 1) }));
    vi.stubGlobal('fetch', fetcher);
    const obterToken = async () => 'token';
    const { result, rerender } = renderHook(({ contexto }) => useSalaRevisao({ codigo: 'ARTE42', papel: 'professor', contexto, obterToken }), { initialProps: { contexto: 'p1' } });
    await waitFor(() => expect(result.current.estado?.conexao).toBe('conectado'));
    await act(async () => { await result.current.acao('encerrar_pergunta'); });
    const comando = fetcher.mock.calls.find(c => c[0].endsWith('/comandos'));
    expect(JSON.parse(comando[1].body)).toEqual({ acao: 'encerrar_pergunta', revisao: 1, rodadaId: 'r1' });
    rerender({ contexto: 'p2' });
    await waitFor(() => expect(streams).toBe(2));
    expect(comando[1].signal.aborted).toBe(true);
    expect(result.current.estado.sala.revisao).toBe(1);
  });
  it('offline bloqueia ações mesmo que estado anterior esteja conectado', async () => {
    const stream = canal();
    const fetcher = vi.fn(async url => url.endsWith('/eventos') ? stream.resposta : json({ estado: estado() })); vi.stubGlobal('fetch', fetcher);
    const { result } = renderHook(() => useSalaRevisao({ codigo: 'ARTE42', papel: 'aluno', contexto: 'a1' }));
    await waitFor(() => expect(result.current.estado?.conexao).toBe('conectado'));
    act(() => { window.dispatchEvent(new Event('offline')); });
    await act(async () => { await result.current.responder('A'); });
    expect(fetcher.mock.calls.filter(c => c[0].endsWith('/respostas'))).toHaveLength(0);
  });
});
