import { describe, it, expect, vi } from 'vitest';
import { FilaPersistenciaDiario } from '@/aplicacao/diario/FilaPersistenciaDiario';
const adiar = () => { let resolve, reject; const promise = new Promise((sim, nao) => { resolve = sim; reject = nao; }); return { promise, resolve, reject }; };
function ambiente() {
  const dados = new Map();
  const storage = { getItem: k => dados.get(k) || null, setItem: (k, v) => dados.set(k, v) };
  const inicial = [{ id: 't', nome: 'Original' }];
  const repository = { carregar: vi.fn(async () => ({ turmas: inicial, revision: 1, _existe: true })), salvar: vi.fn(async (base, turmas) => ({ ...base, turmas, revision: base.revision + 1 })) };
  const fila = new FilaPersistenciaDiario({ userId: 'p', repository, storage });
  return { fila, storage, repository, inicial };
}

describe('RN-68 regressões da revisão de concorrência', () => {
  it('edição enquanto restauração aguarda nuvem não deixa cache/UI diferente da última gravação', async () => {
    const { fila, repository, storage } = ambiente(); await fila.carregar();
    const bloqueio = adiar();
    repository.salvar.mockImplementationOnce(async (base, turmas) => { await bloqueio.promise; return { ...base, turmas, revision: 2 }; });
    const restauracao = fila.salvarConfirmado([{ id: 't', nome: 'Backup' }]);
    await Promise.resolve();
    const ultimo = [{ id: 't', nome: 'Edição posterior' }];
    const edicao = fila.salvar(ultimo);
    bloqueio.resolve();
    await Promise.all([restauracao, edicao]);
    expect(repository.salvar.mock.lastCall[1]).toEqual(ultimo);
    expect(fila.turmas).toEqual(ultimo);
    expect(JSON.parse(storage.getItem(fila.chave)).turmas).toEqual(ultimo);
  });
  it('restauração que falha preserva flag de rascunho ainda não salvo', async () => {
    const { fila, repository, storage } = ambiente(); await fila.carregar();
    repository.salvar.mockRejectedValue(new Error('offline'));
    const rascunho = [{ id: 't', nome: 'Nota ainda não salva' }];
    await expect(fila.salvar(rascunho)).rejects.toThrow('offline');
    await expect(fila.salvarConfirmado([{ id: 't', nome: 'Backup' }])).rejects.toThrow('offline');
    expect(JSON.parse(storage.getItem(fila.chave)).pendente).toBe(true);
    const reaberto = new FilaPersistenciaDiario({ userId: 'p', repository, storage });
    await reaberto.carregar();
    expect(reaberto.turmas).toEqual(rascunho);
  });
  it('recarregar durante gravação não deixa nuvem salva com interface antiga', async () => {
    const { fila, repository, inicial } = ambiente();
    let nuvem = { turmas: inicial, revision: 1, _existe: true };
    repository.carregar.mockImplementation(async () => nuvem);
    await fila.carregar();
    const bloqueio = adiar();
    repository.salvar.mockImplementationOnce(async (base, turmas) => { await bloqueio.promise; nuvem = { ...base, turmas, revision: 2 }; return nuvem; });
    const novo = [{ id: 't', nome: 'Nota nova' }];
    const gravacao = fila.salvar(novo);
    await Promise.resolve();
    const recarga = fila.carregar({ descartarRascunho: true });
    await Promise.resolve();
    bloqueio.resolve();
    await Promise.all([gravacao, recarga]);
    expect(nuvem.turmas).toEqual(novo);
    expect(fila.turmas).toEqual(novo);
  });
});
