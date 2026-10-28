import { beforeEach, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ data: new Map(), writes: [], failTransaction: false }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({
  doc: (_db, ...p) => ({ path: p.join('/') }),
  runTransaction: async (_db, fn) => {
    if (m.failTransaction) throw new Error('offline');
    const writes = [];
    const result = await fn({
      get: async r => ({ exists: () => m.data.has(r.path), data: () => m.data.get(r.path) }),
      set: (r, value) => writes.push([r.path, value]),
    });
    m.writes = writes;
    writes.forEach(([p, value]) => m.data.set(p, value));
    return result;
  },
}));

import {
  aplicarLancamentoRecuperacao,
  campoDoSemestre,
  chaveLancamentoRecuperacao,
  prepararLancamentoRecuperacao,
} from '@/aplicacao/diario/lancarRecuperacao';
import { RecuperacaoRepository } from '@/infraestrutura/diario/RecuperacaoRepository';
import { chaveVinculoAtividade } from '@/utils/diario/tokenUtils';

const DIARIO = 'professores/p/turmas/data';
const CONJUNTO = 'professores/p/conjuntos_recuperacao/c1';

const turma = () => ({
  id: 't',
  nome: 'Turma',
  alunos: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }],
  bimestres: { 1: { atividades: [], notas: { a: { simulado: 7 }, b: { simulado: 8 } } } },
  recuperacao: { b: { rec1: 6 } },
});

const conjunto = (extra = {}) => ({
  id: 'c1',
  professorId: 'p',
  turmaId: 't',
  anoLetivo: '2026',
  semestre: '1',
  destinatariosIds: ['a', 'b'],
  versao: 3,
  estado: 'pronto',
  ...extra,
});

const atividades = () => ([
  { id: 'r1', professorId: 'p', turmaIds: ['t'], finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c1', semestre: '1', notaMaxima: 4, status: 'ativa' },
  { id: 'r2', professorId: 'p', turmaIds: ['t'], finalidade: 'recuperacao_semestral', conjuntoRecuperacaoId: 'c1', semestre: '1', notaMaxima: 6, status: 'ativa' },
]);

const entregaId = (atividadeId, alunoId) => `${atividadeId}__${chaveVinculoAtividade('t', alunoId)}`;

const entrega = (atividadeId, alunoId, nota) => ({
  activityId: atividadeId,
  alunoId,
  turmaId: 't',
  status: 'corrigido',
  notaFinal: nota,
});

/** Diário + conjunto + atividades + entregas corrigidas (3+5 = 8 para Ana). */
function cenario({ notas = { r1: 3, r2: 5 } } = {}) {
  const base = { revision: 4, turmas: [turma()] };
  m.data.set(DIARIO, { turmas: [turma()], revision: 4 });
  m.data.set(CONJUNTO, conjunto());
  for (const atividade of atividades()) m.data.set(`atividades/${atividade.id}`, atividade);
  for (const [atividadeId, nota] of Object.entries(notas)) {
    if (nota == null) continue;
    m.data.set(`entregas/${entregaId(atividadeId, 'a')}`, entrega(atividadeId, 'a', nota));
  }
  return base;
}

beforeEach(() => {
  m.data.clear();
  m.writes = [];
  m.failTransaction = false;
});


const previaDoCenario = (base, c = conjunto()) => prepararLancamentoRecuperacao({
  turmas: base.turmas, conjunto: c, atividades: atividades(),
  entregas: [entrega('r1', 'a', 3), entrega('r2', 'a', 5)],
});

it('REV-R81-01: lançamento recusa conjunto de outro ano letivo', async () => {
  const base = cenario();
  base.turmas[0].anoLetivo = 2026;
  m.data.set(DIARIO, { turmas: structuredClone(base.turmas), revision: 4 });
  const c = conjunto({ anoLetivo: '2025' });
  m.data.set(CONJUNTO, c);
  await expect((async () => {
    const previa = previaDoCenario(base, c);
    return new RecuperacaoRepository('p').lancar({ base, conjunto: c, atividades: atividades(), previa, selecionados: ['a'] });
  })()).rejects.toThrow();
  expect(m.writes).toEqual([]);
});

it('REV-R81-02: mudança de parcelas com mesmo total invalida prévia', async () => {
  const base = cenario();
  const previa = previaDoCenario(base);
  m.data.set(`entregas/${entregaId('r1', 'a')}`, entrega('r1', 'a', 4));
  m.data.set(`entregas/${entregaId('r2', 'a')}`, entrega('r2', 'a', 4));
  await expect(new RecuperacaoRepository('p').lancar({ base, conjunto: conjunto(), atividades: atividades(), previa, selecionados: ['a'] }))
    .rejects.toMatchObject({ code: 'RECUPERACAO_PREVIA_OBSOLETA' });
  expect(m.writes).toEqual([]);
});

it('REV-R81-03: alteração manual posterior permite novo lançamento confirmado', () => {
  const base = cenario();
  const previa = previaDoCenario(base);
  const primeiro = aplicarLancamentoRecuperacao({ turmas: base.turmas, previa, selecionados: ['a'] });
  const editado = structuredClone(primeiro.turmas);
  editado[0].recuperacao.a.rec1 = 9;
  const nova = previaDoCenario({ turmas: editado });
  const resultado = aplicarLancamentoRecuperacao({ turmas: editado, previa: nova, selecionados: ['a'], confirmarSubstituicao: ['a'] });
  expect(resultado.lancados).toHaveLength(1);
  expect(resultado.turmas[0].recuperacao.a.rec1).toBe(8);
});

it('REV-R81-04: prévia recusa semestre fora de 1 ou 2', () => {
  const base = cenario();
  expect(() => previaDoCenario(base, conjunto({ semestre: '3' }))).toThrow();
});

it('REV-R81-05: prévia não pode ampliar destinatários do conjunto', () => {
  const base = cenario();
  expect(() => prepararLancamentoRecuperacao({
    turmas: base.turmas, conjunto: conjunto({ destinatariosIds: ['a'] }),
    atividades: atividades(), entregas: [], destinatarios: ['b'],
  })).toThrow();
});
