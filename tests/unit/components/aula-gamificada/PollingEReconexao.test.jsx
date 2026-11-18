import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSalaGamificada } from '@/components/aula-gamificada/useSalaGamificada';

function HarnessPolling({ codigo = 'POL1', papel = 'docente', intervaloMs = 100 }) {
  const { estado, conexao, erro } = useSalaGamificada({
    codigo,
    papel,
    obterToken: papel === 'aluno' ? null : async () => 'tok-prof',
    intervaloMs,
  });
  return (
    <div>
      <span data-testid="conexao">{conexao}</span>
      <span data-testid="fase">{estado?.fase || 'vazio'}</span>
      <span data-testid="revisao">{estado?.revision ?? 0}</span>
      <span data-testid="recibo">{estado?.recibo?.status || 'sem-recibo'}</span>
      <span data-testid="erro">{erro || ''}</span>
    </div>
  );
}

describe('Aula Gamificada — polling sem sobreposição, cancelamento no unmount, backoff e estado durável', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('não sobrepõe requisições lentas e cancela AbortSignal no unmount', async () => {
    let resolverPendente = null;
    let sinalCapturado = null;

    const fetcher = vi.fn((_url, init) => {
      sinalCapturado = init.signal;
      return new Promise((resolve) => {
        resolverPendente = () =>
          resolve({
            ok: true,
            status: 200,
            json: async () => ({ estado: { codigo: 'POL1', revision: 1, fase: 'espera', servidorAgora: Date.now() } }),
          });
      });
    });
    vi.stubGlobal('fetch', fetcher);

    const { unmount } = render(<HarnessPolling intervaloMs={50} />);

    // Aguarda primeira chamada em voo
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Mesmo avançando muito além do intervalo, não dispara 2ª chamada enquanto a 1ª está em voo
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Unmount aborta a requisição em voo e impede novos ciclos
    unmount();
    expect(sinalCapturado?.aborted).toBe(true);

    resolverPendente?.();
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('aplica recuo (backoff) após falha 503 e recupera estado durável com recibo do aluno sem reiniciar rodada', async () => {
    let tentativa = 0;
    const fetcher = vi.fn(async () => {
      tentativa += 1;
      if (tentativa === 1) {
        return {
          ok: false,
          status: 503,
          json: async () => ({ error: 'TEMP_DOWN', message: 'Servidor temporariamente ocupado.' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          estado: {
            codigo: 'DUR1',
            revision: 4,
            fase: 'pergunta',
            rodada: 2,
            servidorAgora: Date.now(),
            recibo: { rodada: 2, status: 'confirmado', resposta: { alternativaId: 'alt-2' } },
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetcher);

    render(<HarnessPolling codigo="DUR1" papel="aluno" intervaloMs={100} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId('conexao')).toHaveTextContent('reconectando');
    expect(screen.getByTestId('erro')).toHaveTextContent(/Servidor temporariamente ocupado/i);

    // Após 100ms (intervalo normal), ainda não deve tentar porque aplicou backoff (200ms)
    await act(async () => {
      vi.advanceTimersByTime(110);
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Após completar backoff (200ms), recupera estado durável
    await act(async () => {
      vi.advanceTimersByTime(150);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('conexao')).toHaveTextContent('conectado');
    expect(screen.getByTestId('fase')).toHaveTextContent('pergunta');
    expect(screen.getByTestId('recibo')).toHaveTextContent('confirmado');
  });

  it('preserva a resposta da rodada atual quando recibo atrasado da rodada anterior resolve depois', async () => {
    let resolverRodada1;
    let rodadaServidor = 1;

    const fetcher = vi.fn((url, init) => {
      if (url.endsWith('/entrar') || url.endsWith('/estado')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            estado: {
              codigo: 'ROD2',
              revision: rodadaServidor,
              fase: 'pergunta',
              rodada: rodadaServidor,
              servidorAgora: rodadaServidor * 1000,
              questao: { id: `q-${rodadaServidor}`, tipo: 'multipla_escolha', alternativas: [] },
            },
          }),
        });
      }
      if (url.endsWith('/respostas')) {
        const body = JSON.parse(init.body);
        if (body.rodada === 1) {
          return new Promise((resolve) => {
            resolverRodada1 = () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({
                  recibo: { rodadaId: '1', status: 'confirmado', resposta: { alternativaId: 'A' } },
                }),
              });
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            recibo: { rodadaId: '2', status: 'confirmado', resposta: { alternativaId: 'B' } },
          }),
        });
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    const { renderHook } = await import('@testing-library/react');
    const hook = renderHook(() => useSalaGamificada({ codigo: 'ROD2', papel: 'aluno', intervaloMs: 50 }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(hook.result.current.estado.rodada).toBe(1);

    // Envia na rodada 1 (fica pendente)
    let p1;
    act(() => {
      p1 = hook.result.current.enviarResposta({ alternativaId: 'A' }, 'req-r1');
    });

    // Polling avança para rodada 2 e aluno responde na rodada 2
    rodadaServidor = 2;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60);
    });
    expect(hook.result.current.estado.rodada).toBe(2);

    await act(async () => {
      await hook.result.current.enviarResposta({ alternativaId: 'B' }, 'req-r2');
    });
    expect(hook.result.current.estado.recibo?.resposta).toEqual({ alternativaId: 'B' });

    // Recibo atrasado da rodada 1 resolve agora: NÃO deve sobrescrever a resposta B da rodada 2
    await act(async () => {
      resolverRodada1();
      await p1;
    });
    expect(hook.result.current.estado.rodada).toBe(2);
    expect(hook.result.current.estado.recibo?.rodadaId).toBe('2');
    expect(hook.result.current.estado.recibo?.resposta).toEqual({ alternativaId: 'B' });
  });
});
