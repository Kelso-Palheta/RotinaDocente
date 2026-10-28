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

it('R81-06: prévia soma 3+5 como 8 e não grava nada', () => {
  const base = cenario();
  const previa = prepararLancamentoRecuperacao({
    turmas: base.turmas,
    conjunto: conjunto(),
    atividades: atividades(),
    entregas: [
      entrega('r1', 'a', 3),
      entrega('r2', 'a', 5),
    ],
  });

  expect(previa.campo).toBe('rec1');
  expect(previa.alunos.find(a => a.alunoId === 'a')).toMatchObject({
    total: 8,
    completo: true,
    notaAtual: null,
  });
  expect(previa.alunos.find(a => a.alunoId === 'a').parcelas.map(p => p.nota)).toEqual([3, 5]);
  expect(previa.alunos.find(a => a.alunoId === 'b').pendencias).toEqual([
    { atividadeId: 'r1', motivo: 'sem_entrega' },
    { atividadeId: 'r2', motivo: 'sem_entrega' },
  ]);
  expect(m.data.get(DIARIO).turmas).toEqual([turma()]);
  expect(m.writes).toEqual([]);
});

it('R81-06: 1º semestre lança em rec1 e 2º semestre lança em rec2', () => {
  expect(campoDoSemestre('1')).toBe('rec1');
  expect(campoDoSemestre('2')).toBe('rec2');

  const base = cenario();
  const previa = prepararLancamentoRecuperacao({
    turmas: base.turmas,
    conjunto: conjunto({ semestre: '2' }),
    atividades: atividades().map(a => ({ ...a, semestre: '2' })),
    entregas: [entrega('r1', 'a', 4), entrega('r2', 'a', 6)],
  });
  const plano = aplicarLancamentoRecuperacao({ turmas: base.turmas, previa, por: 'p' });
  const resultado = plano.turmas[0];
  expect(resultado.recuperacao.a).toEqual({ rec2: 10 });
  expect(resultado.recuperacao.b).toEqual({ rec1: 6 });
  expect(resultado.recuperacaoLancamentos.a.rec2).toMatchObject({
    conjuntoId: 'c1',
    versao: 3,
    semestre: '2',
    total: 10,
  });
  expect(resultado.recuperacaoLancamentos.b).toBeUndefined();
  expect(resultado.bimestres).toEqual(turma().bimestres);
});

it('R81-06: lançamento grava rec1/rec2 com proveniência sem tocar bimestres ou outros alunos', async () => {
  const base = cenario();
  const previa = prepararLancamentoRecuperacao({
    turmas: base.turmas,
    conjunto: conjunto(),
    atividades: atividades(),
    entregas: [entrega('r1', 'a', 3), entrega('r2', 'a', 5)],
  });

  const resultado = await new RecuperacaoRepository('p').lancar({
    base,
    conjunto: conjunto(),
    atividades: atividades(),
    previa,
    por: 'p',
  });

  expect(resultado.lancados).toEqual([expect.objectContaining({ alunoId: 'a', campo: 'rec1', total: 8 })]);
  const gravado = m.data.get(DIARIO);
  expect(gravado.revision).toBe(5);
  expect(gravado.turmas[0].recuperacao.a).toEqual({ rec1: 8 });
  expect(gravado.turmas[0].recuperacao.b).toEqual({ rec1: 6 });
  expect(gravado.turmas[0].bimestres).toEqual(turma().bimestres);
  expect(gravado.turmas[0].recuperacaoLancamentos.a.rec1).toMatchObject({
    conjuntoId: 'c1',
    versao: 3,
    semestre: '1',
    total: 8,
    parcelas: [{ atividadeId: 'r1', nota: 3 }, { atividadeId: 'r2', nota: 5 }],
    anterior: null,
    por: 'p',
  });
});

it('R81-06: prévia sobre Diário que mudou não grava e devolve conflito', async () => {
  const base = cenario();
  const previa = prepararLancamentoRecuperacao({
    turmas: base.turmas,
    conjunto: conjunto(),
    atividades: atividades(),
    entregas: [entrega('r1', 'a', 3), entrega('r2', 'a', 5)],
  });
  m.data.set(DIARIO, { ...m.data.get(DIARIO), revision: 9 });

  await expect(new RecuperacaoRepository('p').lancar({
    base,
    conjunto: conjunto(),
    atividades: atividades(),
    previa,
    por: 'p',
  })).rejects.toMatchObject({ code: 'DIARIO_CONFLITO' });
  expect(m.writes).toEqual([]);
  expect(m.data.get(DIARIO).turmas[0].recuperacao.a).toBeUndefined();
});

it('R81-06: correção alterada depois da prévia invalida o lançamento', async () => {
  const base = cenario();
  const previa = prepararLancamentoRecuperacao({
    turmas: base.turmas,
    conjunto: conjunto(),
    atividades: atividades(),
    entregas: [entrega('r1', 'a', 3), entrega('r2', 'a', 5)],
  });
  m.data.set(`entregas/${entregaId('r2', 'a')}`, entrega('r2', 'a', 6));

  await expect(new RecuperacaoRepository('p').lancar({
    base,
    conjunto: conjunto(),
    atividades: atividades(),
    previa,
    por: 'p',
  })).rejects.toMatchObject({ code: 'RECUPERACAO_PREVIA_OBSOLETA' });
  expect(m.writes).toEqual([]);
});

it('R81-06: repetir o mesmo lançamento é idempotente e preserva a nota', async () => {
  const base = cenario();
  const argumentos = {
    base,
    turmas: base.turmas,
    conjunto: conjunto(),
    atividades: atividades(),
    entregas: [entrega('r1', 'a', 3), entrega('r2', 'a', 5)],
  };
  const previa = prepararLancamentoRecuperacao(argumentos);
  await new RecuperacaoRepository('p').lancar({ ...argumentos, previa, por: 'p' });

  const atualizado = m.data.get(DIARIO);
  const novaBase = { revision: atualizado.revision, turmas: atualizado.turmas };
  const novaPrevia = prepararLancamentoRecuperacao({ ...argumentos, turmas: atualizado.turmas });
  expect(novaPrevia.alunos.find(a => a.alunoId === 'a').repetido).toBe(true);

  const resultado = await new RecuperacaoRepository('p').lancar({
    ...argumentos,
    base: novaBase,
    previa: novaPrevia,
    por: 'p',
  });
  expect(resultado.lancados).toEqual([]);
  expect(resultado.ignorados).toEqual([{ alunoId: 'a', motivo: 'repetido' }]);
  expect(m.writes).toEqual([]);
  expect(m.data.get(DIARIO).turmas[0].recuperacao.a).toEqual({ rec1: 8 });
});

it('R81-06: recuperação manual diferente só é substituída com confirmação explícita', async () => {
  const base = cenario();
  base.turmas[0].recuperacao.a = { rec1: 6 };
  m.data.set(DIARIO, { turmas: JSON.parse(JSON.stringify(base.turmas)), revision: 4 });
  const previa = prepararLancamentoRecuperacao({
    turmas: base.turmas,
    conjunto: conjunto(),
    atividades: atividades(),
    entregas: [entrega('r1', 'a', 3), entrega('r2', 'a', 5)],
  });
  expect(previa.alunos.find(a => a.alunoId === 'a').substitui).toBe(true);

  const semConfirmar = aplicarLancamentoRecuperacao({ turmas: base.turmas, previa, por: 'p' });
  expect(semConfirmar.lancados).toEqual([]);
  expect(semConfirmar.ignorados).toEqual([{ alunoId: 'a', motivo: 'substituicao_nao_confirmada' }]);
  expect(semConfirmar.turmas[0].recuperacao.a).toEqual({ rec1: 6 });

  const confirmado = aplicarLancamentoRecuperacao({
    turmas: base.turmas,
    previa,
    confirmarSubstituicao: ['a'],
    por: 'p',
  });
  expect(confirmado.turmas[0].recuperacao.a).toEqual({ rec1: 8 });
  expect(confirmado.turmas[0].recuperacaoLancamentos.a.rec1).toMatchObject({ anterior: 6, total: 8 });
  expect(base.turmas[0].recuperacao.a).toEqual({ rec1: 6 });
});

it('R81-06: seleção vazia explícita não lança ninguém', () => {
  const base = cenario();
  const previa = prepararLancamentoRecuperacao({
    turmas: base.turmas,
    conjunto: conjunto(),
    atividades: atividades(),
    entregas: [entrega('r1', 'a', 3), entrega('r2', 'a', 5)],
  });
  const plano = aplicarLancamentoRecuperacao({ turmas: base.turmas, previa, selecionados: [], por: 'p' });
  expect(plano.lancados).toEqual([]);
  expect(plano.turmas).toBe(base.turmas);
});

it('R81-06: chave idempotente muda com conjunto, versão, aluno, semestre e total', () => {
  const base = { conjuntoId: 'c1', versao: 1, alunoId: 'a', semestre: '1', totalCentesimos: 800 };
  const chave = chaveLancamentoRecuperacao(base);
  expect(chave).toBe('c1:1:a:1:800');
  expect(chaveLancamentoRecuperacao({ ...base, versao: 2 })).not.toBe(chave);
  expect(chaveLancamentoRecuperacao({ ...base, semestre: '2' })).not.toBe(chave);
  expect(chaveLancamentoRecuperacao({ ...base, alunoId: 'b' })).not.toBe(chave);
  expect(chaveLancamentoRecuperacao({ ...base, totalCentesimos: 700 })).not.toBe(chave);
});
