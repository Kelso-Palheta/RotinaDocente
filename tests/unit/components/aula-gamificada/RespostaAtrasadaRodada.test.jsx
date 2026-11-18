import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ entrar: vi.fn(), estado: vi.fn(), resposta: vi.fn() }));
vi.mock('@/components/aula-gamificada/api', () => ({
  entrarSala: (...args) => mocks.entrar(...args),
  obterEstadoSala: (...args) => mocks.estado(...args),
  enviarRespostaSala: (...args) => mocks.resposta(...args),
  enviarComandoSala: vi.fn(), gerarRequestId: () => 'request',
}));
import { useSalaGamificada } from '@/components/aula-gamificada/useSalaGamificada';
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

it('recibo atrasado da rodada anterior não confirma resposta na rodada seguinte', async () => {
  vi.useFakeTimers();
  const estado = rodada => ({ codigo: 'TEST42', modalidade: 'quiz', fase: 'pergunta',
    rodada, revision: rodada, servidorAgora: rodada * 1000, questao: { id: `q${rodada}` } });
  mocks.entrar.mockResolvedValue({ estado: estado(1) });
  mocks.estado.mockResolvedValue({ estado: estado(2) });
  let concluirResposta;
  mocks.resposta.mockImplementation(() => new Promise(resolve => { concluirResposta = resolve; }));
  const hook = renderHook(() => useSalaGamificada({ codigo: 'TEST42', papel: 'aluno', intervaloMs: 50 }));
  await act(async () => { await Promise.resolve(); });
  expect(hook.result.current.estado.rodada).toBe(1);
  let envio;
  act(() => { envio = hook.result.current.enviarResposta({ alternativaId: 'A' }, 'resp-1'); });
  await act(async () => { await vi.advanceTimersByTimeAsync(50); });
  expect(hook.result.current.estado.rodada).toBe(2);
  await act(async () => {
    concluirResposta({ recibo: { rodadaId: '1', status: 'confirmado', resposta: { alternativaId: 'A' } } });
    await envio;
  });
  expect(hook.result.current.estado.rodada).toBe(2);
  expect(hook.result.current.estado.recibo).toBeNull();
});
