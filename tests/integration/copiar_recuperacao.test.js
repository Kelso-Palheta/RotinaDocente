import { beforeEach, expect, it, vi } from 'vitest';

// Banco sintético equivalente ao usado na RN-81: lote atômico, transação com
// controle otimista, leitura antes de escrita e subcoleções reais.
const m = vi.hoisted(() => ({ docs: new Map(), revisions: new Map(), seq: 0 }));

vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => {
  const clone = value => value === undefined ? undefined : structuredClone(value);
  const collection = (_db, ...parts) => ({ path: parts.join('/'), collection: true });
  const doc = (dbOrCollection, ...parts) => {
    const path = dbOrCollection?.collection
      ? `${dbOrCollection.path}/${parts[0] || `auto_${++m.seq}`}`
      : parts.join('/');
    return { path, id: path.split('/').at(-1) };
  };
  const snap = ref => {
    const data = clone(m.docs.get(ref.path));
    return { id: ref.id, ref, exists: () => data !== undefined, data: () => clone(data) };
  };
  const getDoc = async ref => snap(ref);
  const query = (ref, ...filters) => ({ ...ref, filters });
  const where = (field, op, value) => ({ field, op, value });
  const getDocs = async ref => ({
    docs: [...m.docs.entries()]
      .filter(([path, data]) => path.startsWith(`${ref.path}/`)
        && path.split('/').length === ref.path.split('/').length + 1
        && (ref.filters || []).every(f => f.op === 'array-contains'
          ? data[f.field]?.includes(f.value) : data[f.field] === f.value))
      .map(([path]) => snap({ path, id: path.split('/').at(-1) })),
  });
  const apply = writes => {
    for (const [type, ref, data, options] of writes) {
      if (type === 'delete') m.docs.delete(ref.path);
      else m.docs.set(ref.path, clone(options?.merge ? { ...m.docs.get(ref.path), ...data } : data));
      m.revisions.set(ref.path, (m.revisions.get(ref.path) || 0) + 1);
    }
  };
  const makeWriter = writes => ({
    set: (ref, data, options) => writes.push(['set', ref, data, options]),
    delete: ref => writes.push(['delete', ref]),
  });
  const writeBatch = () => {
    const writes = [];
    return { ...makeWriter(writes), commit: async () => apply(writes) };
  };
  // Transações serializadas, como no Firestore real: a segunda só lê depois
  // que a primeira commitou e então repete vendo a versão nova.
  let fila = Promise.resolve();
  const runTransaction = (_db, fn) => {
    const execucao = fila.then(async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const reads = new Map();
        const writes = [];
        const result = await fn({
          ...makeWriter(writes),
          get: async ref => {
            if (writes.length) throw new Error('Firestore: leituras devem preceder escritas.');
            reads.set(ref.path, m.revisions.get(ref.path) || 0);
            return snap(ref);
          },
        });
        if ([...reads].some(([path, revision]) => (m.revisions.get(path) || 0) !== revision)) continue;
        apply(writes);
        return result;
      }
      throw new Error('Conflito transacional após novas tentativas.');
    });
    fila = execucao.catch(() => {});
    return execucao;
  };
  return {
    collection, doc, query, where, getDoc, getDocs, writeBatch, runTransaction,
    setDoc: async (ref, data, options) => apply([['set', ref, data, options]]),
    deleteDoc: async ref => apply([['delete', ref]]),
    serverTimestamp: () => 123,
  };
});

import { createAtividade, getAtividade } from '@/lib/firebase-atividades';
import { getConjuntoRecuperacao } from '@/lib/firebase-recuperacao';
import { copiarRecuperacaoParaOutraTurma } from '@/aplicacao/atividades/copiarRecuperacao';
import { chaveVinculoAtividade, decodeToken } from '@/utils/diario/tokenUtils';

const C1 = 'professores/p/conjuntos_recuperacao/c1';
const C2 = 'professores/p/conjuntos_recuperacao/c2';
const DIARIO = 'professores/p/turmas/data';

const turmaB = {
  id: 't2',
  nome: 'Turma B',
  anoLetivo: 2026,
  alunos: [{ id: 'b', nome: 'Bia' }, { id: 'c', nome: 'Caio' }],
};

const origem = (extra = {}) => ({
  id: 'r1',
  professorId: 'p',
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  semestre: '1',
  anoLetivo: '2026',
  turmaIds: ['t1'],
  destinatariosIds: ['a'],
  notaMaxima: 4,
  titulo: 'Recuperação de frações',
  status: 'ativa',
  dataEntrega: '2026-03-01T23:59:00.000Z',
  questoes: [{
    id: 'q1',
    numero: 1,
    tipo: 'objetiva',
    enunciado: 'Qual é a fração equivalente?',
    notaMaxima: 4,
    rubrica: 'Critério',
    alternativas: [{ id: 'A', texto: '1/2' }, { id: 'B', texto: '2/3' }],
    gabarito: 'A',
    imagens: [{ base64: 'data:image/png;base64,AAAA' }],
    resposta: 'resposta discente',
    alunoId: 'a',
    token: 'token-da-origem',
    feedback: 'feedback discente',
  }],
  textosBase: [],
  materiais: [],
  materialApoio: null,
  ...extra,
});

const dadosCopia = (extra = {}) => ({
  id: 'atv_copia',
  titulo: 'Cópia revisada',
  turmaIds: ['t2'],
  turmas: ['t2'],
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c2',
  conjuntoVersao: 1,
  semestre: '2',
  anoLetivo: '2026',
  destinatariosIds: ['b'],
  notaMaxima: 4,
  dataEntrega: new Date('2099-05-01T23:59:00'),
  questoes: [{
    id: 'q1',
    numero: 1,
    tipo: 'objetiva',
    enunciado: 'Qual é a fração equivalente?',
    notaMaxima: 4,
    rubrica: 'Critério',
    alternativas: [{ id: 'A', texto: '1/2' }, { id: 'B', texto: '2/3' }],
    gabarito: 'A',
    imagens: [{ base64: 'data:image/png;base64,AAAA' }],
    resposta: 'resposta discente',
    alunoId: 'a',
    token: 'token-da-origem',
    feedback: 'feedback discente',
  }],
  textosBase: [],
  materiais: [],
  materialApoio: null,
  alunosPorTurma: { t2: [{ id: 'b', nome: 'Bia' }] },
  ...extra,
});

const semear = ({ origemExtra = {}, destinoExtra = {} } = {}) => {
  m.docs.set(C1, {
    id: 'c1',
    professorId: 'p',
    turmaId: 't1',
    anoLetivo: '2026',
    semestre: '1',
    destinatariosIds: ['a'],
    atividadeIds: ['r1'],
    escalas: { r1: 4 },
    estado: 'rascunho',
    versao: 2,
    congelado: true,
  });
  m.docs.set('atividades/r1', origem(origemExtra));
  m.docs.set('entregas/e1', {
    id: 'e1',
    activityId: 'r1',
    alunoId: 'a',
    turmaId: 't1',
    conjuntoRecuperacaoId: 'c1',
    semestre: '1',
    status: 'corrigido',
    notaFinal: 3,
    feedback: 'Feedback preservado',
  });
  m.docs.set(`atividades/r1/tokens/${chaveVinculoAtividade('t1', 'a')}`, {
    token: 'token-da-origem',
    alunoId: 'a',
    turmaId: 't1',
    nome: 'Ana',
    revogado: false,
  });
  m.docs.set(DIARIO, {
    revision: 7,
    turmas: [{
      id: 't1',
      anoLetivo: 2026,
      alunos: [{ id: 'a', nome: 'Ana' }],
      recuperacao: { a: { rec1: 3 } },
      recuperacaoLancamentos: { a: { rec1: 3 } },
    }],
  });
  m.docs.set(C2, {
    id: 'c2',
    professorId: 'p',
    turmaId: 't2',
    anoLetivo: '2026',
    semestre: '2',
    destinatariosIds: ['b'],
    atividadeIds: [],
    escalas: {},
    estado: 'rascunho',
    versao: 1,
    ...destinoExtra,
  });
};

const copiar = (dados = dadosCopia(), extra = {}) => copiarRecuperacaoParaOutraTurma({
  professorId: 'p',
  origemId: 'r1',
  destinoId: 'c2',
  dados,
  turmaDestino: turmaB,
  versaoEsperada: 1,
  carregarOrigem: getAtividade,
  carregarDestino: getConjuntoRecuperacao,
  criarAtividade: createAtividade,
  ...extra,
});

const conjunto = () => m.docs.get(C2);
const atividadesGravadas = () => [...m.docs.keys()]
  .filter(path => path.startsWith('atividades/') && path.split('/').length === 2)
  .map(path => path.split('/').at(-1));
const entregasGravadas = () => [...m.docs.keys()].filter(path => path.startsWith('entregas/'));

const codigoDoErro = async promessa => {
  try {
    await promessa;
  } catch (error) {
    return error.code;
  }
  return null;
};

beforeEach(() => {
  m.docs.clear();
  m.revisions.clear();
  m.seq = 0;
});

it('R82-02/R82-04: copia conteúdo para outro conjunto, com ID, contexto, prazo e tokens novos', async () => {
  semear();
  const origemAntes = structuredClone(m.docs.get('atividades/r1'));
  const entregaAntes = structuredClone(m.docs.get('entregas/e1'));
  const diarioAntes = structuredClone(m.docs.get(DIARIO));
  const tokensOrigemAntes = structuredClone([...m.docs.keys()].filter(path => path.startsWith('atividades/r1/tokens/')));

  const id = await copiar();

  expect(id).toBe('atv_copia');
  const copia = m.docs.get('atividades/atv_copia');
  expect(copia).toMatchObject({
    professorId: 'p',
    finalidade: 'recuperacao_semestral',
    conjuntoRecuperacaoId: 'c2',
    semestre: '2',
    anoLetivo: '2026',
    turmaIds: ['t2'],
    destinatariosIds: ['b'],
    notaMaxima: 4,
    titulo: 'Cópia revisada',
    status: 'rascunho',
  });
  expect(copia.questoes[0]).toMatchObject({
    id: 'q1',
    gabarito: 'A',
    alternativas: [{ id: 'A', texto: '1/2' }, { id: 'B', texto: '2/3' }],
    imagens: [{ base64: 'data:image/png;base64,AAAA' }],
  });
  expect(new Date(copia.dataEntrega).toISOString()).toBe(new Date('2099-05-01T23:59:00').toISOString());
  expect(copia.alunosPorTurma).toBeUndefined();
  expect(copia.conjuntoVersao).toBeUndefined();

  const serializado = JSON.stringify(copia);
  for (const proibido of ['resposta discente', 'feedback discente', 'token-da-origem', 'alunoExclusivoId', 'publicado', 'historico']) {
    expect(serializado).not.toContain(proibido);
  }

  expect(conjunto()).toMatchObject({
    atividadeIds: ['atv_copia'],
    escalas: { atv_copia: 4 },
    estado: 'rascunho',
    liberado: false,
    versao: 2,
  });
  expect(m.docs.get(`atividades/atv_copia/tokens/${chaveVinculoAtividade('t2', 'b')}`)).toMatchObject({
    alunoId: 'b',
    turmaId: 't2',
    revogado: false,
  });
  expect(decodeToken(m.docs.get(`atividades/atv_copia/tokens/${chaveVinculoAtividade('t2', 'b')}`).token)).toMatchObject({
    alunoId: 'b',
    activityId: 'atv_copia',
    turmaId: 't2',
  });
  expect(m.docs.has(`atividades/atv_copia/tokens/${chaveVinculoAtividade('t1', 'a')}`)).toBe(false);

  expect(m.docs.get('atividades/r1')).toEqual(origemAntes);
  expect(m.docs.get('entregas/e1')).toEqual(entregaAntes);
  expect(m.docs.get(DIARIO)).toEqual(diarioAntes);
  expect([...m.docs.keys()].filter(path => path.startsWith('atividades/r1/tokens/'))).toEqual(tokensOrigemAntes);
  expect(entregasGravadas()).toEqual(['entregas/e1']);
});

it('R82-05: cópia de 4 fica oculta; segunda cópia de 6 fecha 10 e libera', async () => {
  semear();
  m.docs.set('atividades/r2', origem({
    id: 'r2',
    titulo: 'Recuperação de geometria',
    notaMaxima: 6,
    questoes: [{ id: 'q2', tipo: 'discursiva', enunciado: 'Explique.', notaMaxima: 6, alternativas: [], imagens: [] }],
  }));
  m.docs.set(C1, { ...m.docs.get(C1), atividadeIds: ['r1', 'r2'], escalas: { r1: 4, r2: 6 }, estado: 'pronto', liberado: true, versao: 3 });

  await copiar(dadosCopia({ id: 'copia4', notaMaxima: 4 }));
  expect(conjunto()).toMatchObject({ estado: 'rascunho', escalas: { copia4: 4 }, versao: 2 });
  expect(m.docs.get('atividades/copia4').status).toBe('rascunho');

  const dados6 = dadosCopia({
    id: 'copia6',
    titulo: 'Cópia de geometria',
    notaMaxima: 6,
    conjuntoVersao: 2,
    questoes: [{ id: 'q2', tipo: 'discursiva', enunciado: 'Explique.', notaMaxima: 6, alternativas: [], imagens: [] }],
  });
  await copiar(dados6, { origemId: 'r2', versaoEsperada: 2 });

  expect(conjunto()).toMatchObject({
    atividadeIds: ['copia4', 'copia6'],
    escalas: { copia4: 4, copia6: 6 },
    estado: 'pronto',
    liberado: true,
    versao: 3,
  });
  expect(m.docs.get('atividades/copia4').status).toBe('ativa');
  expect(m.docs.get('atividades/copia6').status).toBe('ativa');
});

it('R82-05: excedente acima de 10 é recusado sem gravação parcial', async () => {
  semear({ destinoExtra: { atividadeIds: ['existente'], escalas: { existente: 7 }, versao: 2, estado: 'rascunho' } });
  m.docs.set('atividades/existente', origem({ id: 'existente', titulo: 'Existente', conjuntoRecuperacaoId: 'c2', turmaIds: ['t2'], notaMaxima: 7 }));
  const antes = structuredClone(m.docs.get(C2));

  const erro = await codigoDoErro(copiar(dadosCopia({ conjuntoVersao: 2 }), { versaoEsperada: 2 }));

  expect(erro).toBe('RECUPERACAO_COPIA_SALDO_INSUFICIENTE');
  expect(m.docs.has('atividades/atv_copia')).toBe(false);
  expect(m.docs.has(`atividades/atv_copia/tokens/${chaveVinculoAtividade('t2', 'b')}`)).toBe(false);
  expect(m.docs.get(C2)).toEqual(antes);
});

it('R82-05: duas cópias concorrentes não somam duas vezes o mesmo saldo', async () => {
  semear();
  const [primeira, segunda] = await Promise.allSettled([
    copiar(dadosCopia({ id: 'copiaA' })),
    copiar(dadosCopia({ id: 'copiaB' })),
  ]);

  expect([primeira.status, segunda.status].sort()).toEqual(['fulfilled', 'rejected']);
  expect(conjunto()).toMatchObject({ versao: 2, escalas: { [primeira.status === 'fulfilled' ? 'copiaA' : 'copiaB']: 4 } });
  expect(atividadesGravadas().filter(id => id === 'copiaA' || id === 'copiaB')).toHaveLength(1);
  expect(Object.values(conjunto().escalas).reduce((soma, valor) => soma + valor, 0)).toBe(4);
});

it('R82-06: retry após resposta perdida não duplica atividade, pontos nem tokens', async () => {
  semear();
  const dados = dadosCopia({ titulo: '  Cópia revisada  ' });

  await copiar(dados);
  const conjuntoDepoisPrimeira = structuredClone(m.docs.get(C2));
  const tokensDepoisPrimeira = [...m.docs.keys()].filter(path => path.startsWith('atividades/atv_copia/tokens/')).sort();

  const id = await copiar(dados);

  expect(id).toBe('atv_copia');
  expect(m.docs.get('atividades/atv_copia').titulo).toBe('Cópia revisada');
  expect(m.docs.get(C2)).toEqual(conjuntoDepoisPrimeira);
  expect(atividadesGravadas().filter(id => id === 'atv_copia')).toHaveLength(1);
  expect([...m.docs.keys()].filter(path => path.startsWith('atividades/atv_copia/tokens/')).sort()).toEqual(tokensDepoisPrimeira);
});

it('R82-06: retry de cópia com subconjunto explícito não amplia destinatários nem duplica tokens', async () => {
  semear({ destinoExtra: { destinatariosIds: ['b', 'c'] } });
  const dados = dadosCopia({ destinatariosIds: ['b'] });

  await copiar(dados);
  const conjuntoDepoisPrimeira = structuredClone(m.docs.get(C2));
  const id = await copiar(dados);

  expect(id).toBe('atv_copia');
  expect(m.docs.get(C2)).toEqual(conjuntoDepoisPrimeira);
  expect(m.docs.get('atividades/atv_copia').destinatariosIds).toEqual(['b']);
  expect(m.docs.has(`atividades/atv_copia/tokens/${chaveVinculoAtividade('t2', 'b')}`)).toBe(true);
  expect(m.docs.has(`atividades/atv_copia/tokens/${chaveVinculoAtividade('t2', 'c')}`)).toBe(false);
});

it('R82-03: recusa destino obsoleto, mesma turma, cancelado, congelado, ano e aluno inválidos', async () => {
  semear({ destinoExtra: { versao: 2 } });
  expect(await codigoDoErro(copiar(dadosCopia(), { versaoEsperada: 1 }))).toBe('RECUPERACAO_COPIA_DESTINO_OBSOLETO');

  semear({ destinoExtra: { turmaId: 't1', destinatariosIds: ['a'] } });
  m.docs.set(C2, { ...m.docs.get(C2), turmaId: 't1' });
  expect(await codigoDoErro(copiar())).toBe('RECUPERACAO_COPIA_MESMA_TURMA');

  semear({ destinoExtra: { estado: 'cancelado' } });
  expect(await codigoDoErro(copiar())).toBe('RECUPERACAO_COPIA_DESTINO_CANCELADO');

  semear({ destinoExtra: { congelado: true } });
  expect(await codigoDoErro(copiar())).toBe('RECUPERACAO_COPIA_DESTINO_CONGELADO');

  semear({ destinoExtra: { anoLetivo: '2025' } });
  expect(await codigoDoErro(copiar())).toBe('RECUPERACAO_COPIA_ANO_INCOMPATIVEL');

  semear();
  expect(await codigoDoErro(copiar(dadosCopia({ destinatariosIds: ['a'] })))).toBe('RECUPERACAO_COPIA_DESTINATARIO_INVALIDO');

  expect(m.docs.has('atividades/atv_copia')).toBe(false);
});

it('R82-03: recusa origem de outra conta e atividade adaptada no boundary de persistência', async () => {
  semear({ origemExtra: { professorId: 'outro' } });
  expect(await codigoDoErro(copiar())).toBe('RECUPERACAO_COPIA_OUTRA_CONTA');

  semear({ origemExtra: { alunoExclusivoId: 'a', alunoNome: 'Ana' } });
  expect(await codigoDoErro(copiar())).toBe('RECUPERACAO_COPIA_ADAPTADA');

  expect(m.docs.has('atividades/atv_copia')).toBe(false);
  expect(conjunto()).toMatchObject({ versao: 1, atividadeIds: [], escalas: {} });
});

it('R82-04: copiar não escreve no Diário, entregas ou boletins', async () => {
  semear();
  const chavesAntes = [...m.docs.keys()].sort();

  await copiar();

  const novasChaves = [...m.docs.keys()].filter(path => !chavesAntes.includes(path));
  expect(novasChaves.some(path => path.startsWith('entregas/'))).toBe(false);
  expect(novasChaves.some(path => path.startsWith('notasAluno/'))).toBe(false);
  expect(novasChaves.some(path => path === DIARIO)).toBe(false);
  expect(m.docs.get(DIARIO)).toEqual(expect.objectContaining({ revision: 7 }));
});
