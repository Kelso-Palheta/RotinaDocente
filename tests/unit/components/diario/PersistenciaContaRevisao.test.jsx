import { renderHook, waitFor, act } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
vi.mock('@/infraestrutura/diario/DiarioRepository', () => ({ DiarioRepository: vi.fn() }));
import { usePersistenciaDiario } from '@/hooks/diario/usePersistenciaDiario';

it('callback de restauração iniciado na conta anterior não grava na conta nova', async () => {
  localStorage.clear();
  const repos = new Map();
  const criarRepository = uid => {
    if (!repos.has(uid)) repos.set(uid, { carregar: vi.fn(async () => ({ turmas: [{ id: uid }], revision: 1, _existe: true })), salvar: vi.fn(async (base, turmas) => ({ ...base, turmas, revision: base.revision + 1 })) });
    return repos.get(uid);
  };
  const { result, rerender } = renderHook(({ uid }) => usePersistenciaDiario(uid, { criarRepository }), { initialProps: { uid: 'contaA' } });
  await waitFor(() => expect(result.current.estado).toBe('salvo'));
  const restaurarContaA = result.current.restaurar;
  rerender({ uid: 'contaB' });
  await waitFor(() => expect(result.current.estado).toBe('salvo'));
  await act(async () => { await expect(restaurarContaA([{ id: 'dadosDaContaA' }])).rejects.toThrow(/conta|carregamento/i); });
  expect(repos.get('contaB').salvar).not.toHaveBeenCalled();
});
it('sair durante carregamento lento não substitui rascunho existente por lista vazia', () => {
  localStorage.clear();
  const rascunho = { turmas: [{ id: 't', nome: 'Notas pendentes' }], base: { turmas: [{ id: 't', nome: 'Nuvem anterior' }], revision: 1, _existe: true }, historico: [], pendente: true };
  localStorage.setItem('diario:contaA:v2', JSON.stringify(rascunho));
  const criarRepository = () => ({ carregar: () => new Promise(() => {}), salvar: vi.fn() });
  const { unmount } = renderHook(() => usePersistenciaDiario('contaA', { criarRepository }));
  unmount();
  expect(JSON.parse(localStorage.getItem('diario:contaA:v2'))).toEqual(rascunho);
});
