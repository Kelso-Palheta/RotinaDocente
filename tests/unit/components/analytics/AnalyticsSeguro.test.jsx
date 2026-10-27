import React from 'react';
import { renderHook, render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { test, expect, vi, afterEach } from 'vitest';
const m = vi.hoisted(() => ({ carregar: vi.fn() }));
vi.mock('@/infraestrutura/diario/DiarioRepository', () => ({
  DiarioRepository: class {
    constructor(uid) {
      this.uid = uid;
    }
    carregar() {
      return m.carregar(this.uid);
    }
  },
}));
import { useDadosAnalytics } from '@/hooks/analytics/useDadosAnalytics';
import { AlunosRiscoTable } from '@/components/analytics/AlunosRiscoTable';
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});
test('ignora cache global e resposta atrasada da conta anterior', async () => {
  sessionStorage.setItem('diario_turmas', JSON.stringify([{ id: 'privada' }]));
  let concluir;
  m.carregar.mockImplementation((uid) =>
    uid === 'a'
      ? new Promise((r) => {
          concluir = r;
        })
      : Promise.resolve({ turmas: [] }),
  );
  const { result, rerender } = renderHook(({ uid }) => useDadosAnalytics(uid), {
    initialProps: { uid: 'a' },
  });
  rerender({ uid: 'b' });
  await waitFor(() => expect(result.current.carregando).toBe(false));
  await act(async () => concluir({ turmas: [{ id: 'privada' }] }));
  expect(result.current.turmas).toEqual([]);
});
test('falha usa somente cache próprio com estado e nova tentativa', async () => {
  localStorage.setItem('diario:b:v2', JSON.stringify({ turmas: [{ id: 'b' }], pendente: true }));
  m.carregar.mockRejectedValueOnce(Error('Offline')).mockResolvedValueOnce({ turmas: [] });
  const { result } = renderHook(() => useDadosAnalytics('b'));
  await waitFor(() => expect(result.current.erro).toContain('Offline'));
  expect(result.current.turmas[0].id).toBe('b');
  await act(async () => result.current.recarregar());
  expect(result.current.turmas).toEqual([]);
  expect(result.current.origem).toBe('nuvem');
});
test('radar distingue ausência de avaliações e permite abrir aluno', async () => {
  const { rerender } = render(<AlunosRiscoTable alunos={[]} totalAvaliados={0} />);
  expect(screen.getByText(/Nenhum aluno avaliado/)).toBeInTheDocument();
  const abrir = vi.fn();
  rerender(
    <AlunosRiscoTable
      alunos={[
        {
          alunoId: 'a',
          turmaId: 't',
          nome: 'Ana',
          turmaNome: '101',
          nota: 2,
          bimestre: 1,
          classificacao: 'critico',
          minimo: 5,
        },
      ]}
      totalAvaliados={1}
      onSelectAluno={abrir}
    />,
  );
  screen.getByRole('button', { name: /Abrir Diário.*Ana/ }).click();
  expect(abrir).toHaveBeenCalledWith(expect.objectContaining({ alunoId: 'a' }));
});
