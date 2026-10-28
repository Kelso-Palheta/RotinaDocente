import { expect, it } from 'vitest';
import {
  anoLetivoDaTurma,
  validarConjunto,
} from '../../frontend/src/dominio/atividades/recuperacaoSemestral';
import {
  aplicarLancamentoRecuperacao,
  prepararLancamentoRecuperacao,
} from '../../frontend/src/aplicacao/diario/lancarRecuperacao';

const turmaBase = (extra = {}) => ({
  id: 't1',
  nome: '1º A',
  anoLetivo: 2026,
  alunos: [{ id: 'ana', nome: 'Ana' }, { id: 'bruno', nome: 'Bruno' }],
  recuperacao: { ana: { rec1: 4 } },
  ...extra,
});

const conjuntoBase = (extra = {}) => ({
  id: 'c1',
  professorId: 'p1',
  turmaId: 't1',
  anoLetivo: '2026',
  semestre: 1,
  versao: 1,
  destinatariosIds: ['ana', 'bruno'],
  atividadeIds: ['a1', 'a2'],
  ...extra,
});

const atividadesBase = [
  { id: 'a1', notaMaxima: 4, semestre: '1', conjuntoRecuperacaoId: 'c1', turmaIds: ['t1'] },
  { id: 'a2', notaMaxima: 6, semestre: '1', conjuntoRecuperacaoId: 'c1', turmaIds: ['t1'] },
];

const entrega = (atividadeId, alunoId, nota, extra = {}) => ({
  id: `${atividadeId}_${alunoId}`,
  activityId: atividadeId,
  alunoId,
  turmaId: 't1',
  status: 'revisado',
  notaRevisada: nota,
  ...extra,
});

it('REV-R81-08: ano letivo da turma é derivado e turma sem ano é legada', () => {
  expect(anoLetivoDaTurma({ anoLetivo: 2026 })).toBe(2026);
  expect(anoLetivoDaTurma({ ano: '2025' })).toBe(2025);
  expect(anoLetivoDaTurma({})).toBeNull();
  expect(anoLetivoDaTurma({ anoLetivo: 1200 })).toBeNull();
  expect(() => validarConjunto(conjuntoBase({ anoLetivo: 'ontem' }))).toThrow(/ano/i);
  expect(validarConjunto(conjuntoBase({ anoLetivo: 'legado' })).anoLetivo).toBe('legado');
});

it('REV-R81-09: conjunto de outro ano da turma não gera prévia', () => {
  expect(() => prepararLancamentoRecuperacao({
    turmas: [turmaBase()],
    conjunto: conjuntoBase({ anoLetivo: '2025' }),
    atividades: atividadesBase,
    entregas: [],
  })).toThrow(/ano letivo/i);
});

it('REV-R81-10: composição canônica divergente é recusada', () => {
  expect(() => prepararLancamentoRecuperacao({
    turmas: [turmaBase()],
    conjunto: conjuntoBase({ atividadeIds: ['a1', 'a9'] }),
    atividades: atividadesBase,
    entregas: [],
  })).toThrow(/composição/i);

  expect(() => prepararLancamentoRecuperacao({
    turmas: [turmaBase()],
    conjunto: conjuntoBase({ atividadeIds: ['a1', 'a2', 'a3'] }),
    atividades: atividadesBase,
    entregas: [],
  })).toThrow(/composição/i);
});

it('REV-R81-11: destinatário fora da turma ou do conjunto é recusado', () => {
  expect(() => prepararLancamentoRecuperacao({
    turmas: [turmaBase({ alunos: [{ id: 'ana', nome: 'Ana' }] })],
    conjunto: conjuntoBase(),
    atividades: atividadesBase,
    entregas: [],
    destinatarios: ['bruno'],
  })).toThrow(/não pertence à turma/i);

  expect(() => prepararLancamentoRecuperacao({
    turmas: [turmaBase()],
    conjunto: conjuntoBase(),
    atividades: atividadesBase,
    entregas: [],
    destinatarios: ['carla'],
  })).toThrow(/fora do conjunto/i);
});

it('REV-R81-12: escala que não fecha 10 pontos é recusada', () => {
  expect(() => prepararLancamentoRecuperacao({
    turmas: [turmaBase()],
    conjunto: conjuntoBase(),
    atividades: [
      { ...atividadesBase[0], notaMaxima: 3 },
      atividadesBase[1],
    ],
    entregas: [],
  })).toThrow(/10 pontos/i);
});

it('REV-R81-13: histórico de lançamentos é cumulativo quando a nota muda', () => {
  const primeira = prepararLancamentoRecuperacao({
    turmas: [turmaBase()],
    conjunto: conjuntoBase(),
    atividades: atividadesBase,
    entregas: [entrega('a1', 'ana', 3), entrega('a2', 'ana', 5)],
    destinatarios: ['ana'],
  });
  const aplicado = aplicarLancamentoRecuperacao({
    turmas: [turmaBase()],
    previa: primeira,
    selecionados: ['ana'],
    confirmarSubstituicao: ['ana'],
    em: '2026-06-01T10:00:00.000Z',
  });
  expect(aplicado.lancados).toHaveLength(1);
  expect(aplicado.turmas[0].recuperacao.ana.rec1).toBe(8);
  expect(aplicado.turmas[0].recuperacaoLancamentos.ana.rec1.historico).toBeUndefined();

  const segunda = prepararLancamentoRecuperacao({
    turmas: aplicado.turmas,
    conjunto: conjuntoBase(),
    atividades: atividadesBase,
    entregas: [entrega('a1', 'ana', 4), entrega('a2', 'ana', 6)],
    destinatarios: ['ana'],
  });
  const aplicado2 = aplicarLancamentoRecuperacao({
    turmas: aplicado.turmas,
    previa: segunda,
    selecionados: ['ana'],
    confirmarSubstituicao: ['ana'],
    em: '2026-06-02T10:00:00.000Z',
  });
  const registro = aplicado2.turmas[0].recuperacaoLancamentos.ana.rec1;
  expect(registro.total).toBe(10);
  expect(registro.historico).toHaveLength(1);
  expect(registro.historico[0]).toMatchObject({ total: 8, chave: primeira.alunos[0].chave });
  expect(aplicado2.turmas[0].recuperacao.ana.rec1).toBe(10);
});

it('REV-R81-14: repetição idêntica é ignorada e não apaga histórico nem nota', () => {
  const previa = prepararLancamentoRecuperacao({
    turmas: [turmaBase()],
    conjunto: conjuntoBase(),
    atividades: atividadesBase,
    entregas: [entrega('a1', 'ana', 3), entrega('a2', 'ana', 5)],
    destinatarios: ['ana'],
  });
  const primeira = aplicarLancamentoRecuperacao({
    turmas: [turmaBase()],
    previa,
    selecionados: ['ana'],
    confirmarSubstituicao: ['ana'],
  });
  const repetida = prepararLancamentoRecuperacao({
    turmas: primeira.turmas,
    conjunto: conjuntoBase(),
    atividades: atividadesBase,
    entregas: [entrega('a1', 'ana', 3), entrega('a2', 'ana', 5)],
    destinatarios: ['ana'],
  });
  expect(repetida.alunos[0].repetido).toBe(true);
  const segunda = aplicarLancamentoRecuperacao({
    turmas: primeira.turmas,
    previa: repetida,
    selecionados: ['ana'],
  });
  expect(segunda.lancados).toHaveLength(0);
  expect(segunda.ignorados).toEqual([{ alunoId: 'ana', motivo: 'repetido' }]);
  expect(segunda.turmas[0].recuperacao.ana.rec1).toBe(8);
});
