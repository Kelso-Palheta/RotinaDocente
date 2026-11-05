import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSalaRevisao } from '@/components/revisao/useSalaRevisao';

const inicial = (codigo = 'ARTE42', revisao = 1, rodada = 'r1') => ({ sala: { codigo, revisao }, fase: 'pergunta', agoraServidorMs: Date.now(), rodada: { id: rodada, encerraEmMs: Date.now() + 60000 } });
const json = dados => ({ ok: true, json: async () => dados });
function pendente() { let resolver; const promise = new Promise(r => { resolver = r; }); return { promise, resolver }; }
function configurar() {
  const sinais = [];
  const fetcher = vi.fn(async (url, opts) => {
    sinais.push(opts.signal);
    if (url.endsWith('/eventos')) {
      let resolver;
      return { ok: true, body: { getReader: () => ({ read: () => new Promise(r => { resolver = r; }), cancel: async () => resolver?.({ done: true }), releaseLock: () => {} }) } };
    }
    return json({ estado: inicial(url.includes('OUTRA') ? 'OUTRA' : 'ARTE42') });
  });
  vi.stubGlobal('fetch', fetcher);
  return { fetcher, sinais };
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('RV-INT-05 — controlador conectado', () => {
  it('confirma somente após servidor e retry preserva a alternativa original', async () => {
    const { fetcher } = configurar();
    const { result } = renderHook(() => useSalaRevisao({ codigo: 'ARTE42', papel: 'aluno', contexto: 'aluno-1' }));
    await waitFor(() => expect(result.current.estado?.conexao).toBe('conectado'));
    const resposta = pendente();
    fetcher.mockImplementationOnce(() => resposta.promise);
    let envio;
    act(() => { envio = result.current.responder('C'); });
    expect(result.current.envio).toMatchObject({ status: 'enviando', alternativa: 'C' });
    await act(async () => { resposta.resolver({ ok: false, status: 503, json: async () => ({ error: 'Sem conexão' }) }); await envio; });
    expect(result.current.envio).toMatchObject({ status: 'falha', alternativa: 'C' });
    fetcher.mockResolvedValueOnce(json({ envio: { status: 'confirmado', rodadaId: 'r1', alternativa: 'C', reciboId: 'ok' } }));
    await act(async () => { await result.current.tentarNovamente(); });
    expect(JSON.parse(fetcher.mock.calls.at(-1)[1].body)).toEqual({ rodadaId: 'r1', alternativa: 'C' });
    expect(result.current.envio).toMatchObject({ status: 'confirmado', alternativa: 'C' });
    expect(fetcher.mock.calls.every(c => !c[1].headers.Authorization)).toBe(true);
  });
  it('descarta resposta antiga e aborta conexões ao trocar contexto', async () => {
    const { fetcher, sinais } = configurar();
    const { result, rerender, unmount } = renderHook(({ codigo }) => useSalaRevisao({ codigo, papel: 'aluno', contexto: 'aluno-1' }), { initialProps: { codigo: 'ARTE42' } });
    await waitFor(() => expect(result.current.estado?.conexao).toBe('conectado'));
    const resposta = pendente(); fetcher.mockImplementationOnce(() => resposta.promise);
    let envio; act(() => { envio = result.current.responder('B'); });
    rerender({ codigo: 'OUTRA' });
    await waitFor(() => expect(result.current.estado?.sala.codigo).toBe('OUTRA'));
    await act(async () => { resposta.resolver(json({ envio: { status: 'confirmado', rodadaId: 'r1', alternativa: 'B' } })); await envio; });
    expect(result.current.envio.status).toBe('nao_enviado');
    expect(sinais[0].aborted).toBe(true);
    unmount(); expect(sinais.every(s => s.aborted)).toBe(true);
  });
  it('StrictMode reativa sessão e impede clique duplicado', async () => {
    const { fetcher } = configurar();
    const { result } = renderHook(() => useSalaRevisao({ codigo: 'ARTE42', papel: 'aluno', contexto: 'a1' }), { wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode> });
    await waitFor(() => expect(result.current.estado?.conexao).toBe('conectado'));
    const resposta = pendente(); fetcher.mockImplementationOnce(() => resposta.promise);
    let envio; act(() => { envio = result.current.responder('A'); result.current.responder('B'); });
    expect(fetcher.mock.calls.filter(c => c[0].endsWith('/respostas'))).toHaveLength(1);
    await act(async () => { resposta.resolver(json({ envio: { status: 'confirmado', rodadaId: 'r1', alternativa: 'A' } })); await envio; });
    expect(result.current.envio.status).toBe('confirmado');
  });
});
