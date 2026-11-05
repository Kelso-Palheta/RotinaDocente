import { describe, expect, it, vi } from 'vitest';
import { consumirEventosRevisao, requisitarRevisao, incorporarAtualizacao } from '@/components/revisao/integracaoTransporte';

function respostaStream(partes) {
  let i = 0;
  return { ok: true, body: { getReader: () => ({ read: async () => i < partes.length ? { done: false, value: new TextEncoder().encode(partes[i++]) } : { done: true }, cancel: vi.fn(), releaseLock: vi.fn() }) } };
}
const estado = (revisao, rodadaId = 'r1') => ({ sala: { revisao }, rodada: { id: rodadaId }, agoraServidorMs: revisao * 1000 });

describe('RV-INT-05 — transporte e reconciliação reais', () => {
  it('remonta UTF-8 e frames SSE partidos, ignorando heartbeat', async () => {
    const receber = vi.fn();
    await consumirEventosRevisao(respostaStream([': ping\r\n\r\nevent: est', 'ado\r\ndata: {"estado":{"tema":"Arte"}}\r', '\n\r\nevent: estado\ndata: {"envio":\ndata: {"status":"confirmado"}}\n\n']), receber);
    expect(receber.mock.calls.map(c => c[0])).toEqual([{ estado: { tema: 'Arte' } }, { envio: { status: 'confirmado' } }]);
  });
  it('propaga erro SSE sem fabricar confirmação', async () => {
    await expect(consumirEventosRevisao(respostaStream(['event: erro\ndata: {"error":"Vínculo revogado","status":403}\n\n']), vi.fn())).rejects.toMatchObject({ message: 'Vínculo revogado', status: 403 });
  });
  it('aluno usa cookie e nunca Bearer; professor exige token', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    await requisitarRevisao('/salas/ARTE42/entrar', { body: {}, fetcher });
    expect(fetcher.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBeUndefined();
    await expect(requisitarRevisao('/catalogo', { obterToken: async () => null, fetcher })).rejects.toThrow(/login/i);
    await requisitarRevisao('/catalogo', { obterToken: async () => 'segredo', fetcher });
    expect(fetcher.mock.calls[1][0]).toBe('/api/revisao/catalogo');
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer segredo');
  });
  it('ignora revisão antiga e preserva recibo confirmado da mesma rodada', () => {
    const anterior = { estado: estado(3), envio: { status: 'confirmado', alternativa: 'C', rodadaId: 'r1', reciboId: 'recibo' } };
    expect(incorporarAtualizacao(anterior, { estado: estado(2), envio: { status: 'nao_enviado' } })).toBe(anterior);
    expect(incorporarAtualizacao(anterior, { estado: estado(3), envio: { status: 'nao_enviado' } }).envio).toEqual(anterior.envio);
    expect(incorporarAtualizacao(anterior, { estado: estado(4, 'r2') }).envio).toEqual({ status: 'nao_enviado', alternativa: null });
  });
  it('não aplica recibo de rodada anterior na rodada nova', () => {
    const atual = { estado: estado(4, 'r2'), envio: { status: 'nao_enviado', alternativa: null } };
    expect(incorporarAtualizacao(atual, { envio: { status: 'confirmado', rodadaId: 'r1', alternativa: 'D' } }).envio).toEqual(atual.envio);
  });
});
