import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { FirestoreRevisaoStore } from '../../frontend/src/infraestrutura/revisao/FirestoreStore';

it('adapta documentos ausentes, consultas e substituição sem merge', async () => {
  const documento = { get: vi.fn().mockResolvedValue({ exists: false }), set: vi.fn() };
  const consulta = { where: vi.fn(), get: vi.fn().mockResolvedValue({ docs: [{ id: 'real', data: () => ({ id: 'falso', turma: 't' }) }] }) };
  consulta.where.mockReturnValue(consulta);
  const db = { doc: vi.fn(() => documento), collection: vi.fn(() => consulta) };
  const store = new FirestoreRevisaoStore(db);
  expect(await store.get('salas/s')).toBeNull();
  expect(await store.list('salas', [['turma', '==', 't']])).toEqual([{ id: 'real', turma: 't' }]);
  expect(consulta.where).toHaveBeenCalledWith('turma', '==', 't');
  await store.set('salas/s', { fase: 'espera' });
  expect(documento.set).toHaveBeenCalledWith({ fase: 'espera' });
});

it('preserva erro e cancelamento dos listeners e rejeita operadores fora do contrato', () => {
  const parar = vi.fn(), proximo = vi.fn(), erro = vi.fn(); let receber;
  const ref = { onSnapshot: vi.fn((next, fail) => { receber = next; expect(fail).toBe(erro); return parar; }) };
  const store = new FirestoreRevisaoStore({ doc: () => ref, collection: () => ref });
  const cancelar = store.listenDoc('salas/s', proximo, erro);
  receber({ exists: false }); expect(proximo).toHaveBeenCalledWith(null); cancelar(); expect(parar).toHaveBeenCalledOnce();
  const cancelarLista = store.listenList('salas', [], proximo, erro);
  receber({ docs: [{ id: 's', data: () => ({ fase: 'espera' }) }] });
  expect(proximo).toHaveBeenLastCalledWith([{ id: 's', fase: 'espera' }]); cancelarLista();
  expect(() => store.listenList('salas', [['x', '!=', 1]], proximo, erro)).toThrow();
});

const host = process.env.FIRESTORE_EMULATOR_HOST;
const local = Boolean(host && /^(127\.0\.0\.1|localhost):\d+$/.test(host));
describe.skipIf(!local)('Firestore real isolado no emulador demo-revisao', () => {
  let db, outroDb, store, outro;
  const raiz = `revisaoSalas/ensaio-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  beforeAll(async () => {
    const { Firestore } = await import('../../frontend/node_modules/firebase-admin/lib/firestore/index.js');
    db = new Firestore({ projectId: 'demo-revisao' }); outroDb = new Firestore({ projectId: 'demo-revisao' });
    store = new FirestoreRevisaoStore(db); outro = new FirestoreRevisaoStore(outroDb);
  });
  afterAll(async () => { if (db) { await db.recursiveDelete(db.doc(raiz)); await Promise.all([db.terminate(), outroDb.terminate()]); } });
  it('persiste entre instâncias e substitui campos antigos', async () => {
    expect(await store.get(raiz)).toBeNull(); await store.set(raiz, { fase: 'espera', antigo: true });
    await outro.set(raiz, { fase: 'conteudo' }); expect(await store.get(raiz)).toEqual({ fase: 'conteudo' });
  });
  it('cria recibo e pontos uma única vez sob concorrência de duas instâncias', async () => {
    const participante = `${raiz}/participantes/p`, recibo = `${raiz}/respostas/r__p`;
    await store.set(participante, { pontos: 0 });
    const responder = adaptador => adaptador.transaction(async tx => {
      const aceito = await tx.get(recibo); const aluno = await tx.get(participante);
      if (aceito) return aceito;
      tx.create(recibo, { alternativa: 'A' }); tx.set(participante, { pontos: aluno.pontos + 1000 }); return { alternativa: 'A' };
    });
    expect(await Promise.all([responder(store), responder(outro), responder(store)])).toEqual(Array(3).fill({ alternativa: 'A' }));
    expect(await outro.get(participante)).toEqual({ pontos: 1000 });
    expect(await store.list(`${raiz}/respostas`, [['alternativa', '==', 'A']])).toHaveLength(1);
  }, 20000);
  it('consulta na transação, falha create duplicado sem gravar outros documentos e remove atomicamente', async () => {
    const original = `${raiz}/respostas/existente`, outroPath = `${raiz}/respostas/novo`;
    await store.set(original, { alternativa: 'B' });
    await expect(store.transaction(async tx => { await tx.list(`${raiz}/respostas`, [['alternativa', '==', 'B']]); tx.set(outroPath, { alternativa: 'C' }); tx.create(original, {}); })).rejects.toThrow();
    expect(await store.get(outroPath)).toBeNull();
    await store.transaction(async tx => { expect(await tx.get(original)).toEqual({ alternativa: 'B' }); tx.delete(original); });
    expect(await store.get(original)).toBeNull();
  });
  it('entrega alterações e cancela assinatura sem novas notificações', async () => {
    const path = `${raiz}/publicacao/estado`; let ultimo; let notificar;
    const esperar = () => new Promise(resolve => { notificar = resolve; });
    const inicial = esperar(); let chamadas = 0;
    const parar = outro.listenDoc(path, valor => { ultimo = valor; chamadas++; notificar(); }, err => { throw err; });
    await inicial; expect(ultimo).toBeNull(); const proximo = esperar(); await store.set(path, { fase: 'pergunta' }); await proximo;
    expect(ultimo).toEqual({ fase: 'pergunta' }); parar(); const antes = chamadas;
    await store.set(path, { fase: 'feedback' }); await new Promise(resolve => setTimeout(resolve, 100)); expect(chamadas).toBe(antes);
  }, 10000);
});
