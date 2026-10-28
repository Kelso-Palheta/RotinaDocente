import { describe, expect, it } from 'vitest';
import {
  CENTESIMOS_TOTAL,
  calcularRecuperacaoAluno,
  finalidadeDaAtividade,
  paraCentesimos,
  validarComposicao,
  validarConjunto,
} from '../../frontend/src/dominio/atividades/recuperacaoSemestral';

const parcela = (atividadeId, maximo) => ({ atividadeId, maximo });

const entrega = (atividadeId, alunoId, { notaFinal, notaRevisada, status = 'corrigido', turmaId = 't1' } = {}) => ({
  id: `${atividadeId}__${alunoId}`,
  activityId: atividadeId,
  alunoId,
  turmaId,
  status,
  notaFinal,
  notaRevisada,
});

describe('R81-01 (RN-81): distribuição de 10 pontos e soma das notas', () => {
  it('aceita uma atividade valendo 10', () => {
    const composicao = validarComposicao([parcela('a1', 10)]);
    expect(composicao).toMatchObject({ total: CENTESIMOS_TOTAL, restante: 0, completo: true });
  });

  it('aceita 4+6 e soma 3+5 como 8, sem média', () => {
    const parcelas = [parcela('a1', 4), parcela('a2', 6)];
    expect(validarComposicao(parcelas).completo).toBe(true);
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas,
      entregas: [entrega('a1', 'ana', { notaFinal: 3 }), entrega('a2', 'ana', { notaFinal: 5 })],
    });
    expect(resultado.total).toBe(8);
    expect(resultado.completo).toBe(true);
    expect(resultado.pendencias).toEqual([]);
  });

  it('soma três parcelas com centésimos sem erro de ponto flutuante', () => {
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 3), parcela('a2', 3), parcela('a3', 4)],
      entregas: [
        entrega('a1', 'ana', { notaFinal: 0.1 }),
        entrega('a2', 'ana', { notaFinal: 0.2 }),
        entrega('a3', 'ana', { notaFinal: 2.35 }),
      ],
    });
    expect(resultado.total).toBe(2.65);
    expect(resultado.totalCentesimos).toBe(265);
  });

  it('trata zero corrigido como nota válida', () => {
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 10)],
      entregas: [entrega('a1', 'ana', { notaFinal: 0 })],
    });
    expect(resultado.total).toBe(0);
    expect(resultado.completo).toBe(true);
  });

  it.each([
    [NaN, /inválid/i],
    [Infinity, /inválid/i],
    [-1, /inválid/i],
    ['', /inválid/i],
    [null, /inválid/i],
  ])('rejeita nota inválida %s', valor => {
    expect(() => paraCentesimos(valor)).toThrow(/inválid/i);
  });

  it('rejeita orçamento acima de 10 sem normalizar', () => {
    expect(() => validarComposicao([parcela('a1', 6), parcela('a2', 6)])).toThrow(/12 pontos.*limite.*10/i);
  });

  it('rejeita máximo nulo, zero, repetido e lista vazia', () => {
    expect(() => validarComposicao([])).toThrow(/ao menos uma atividade/i);
    expect(() => validarComposicao([parcela('a1', 0)])).toThrow(/maior que zero/i);
    expect(() => validarComposicao([parcela('a1', null)])).toThrow(/inválid/i);
    expect(() => validarComposicao([parcela('a1', 5), parcela('a1', 5)])).toThrow(/repetida/i);
  });

  it('não completa quando a distribuição soma menos de 10', () => {
    const composicao = validarComposicao([parcela('a1', 4), parcela('a2', 5)]);
    expect(composicao).toMatchObject({ total: 900, restante: 100, completo: false });
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 4), parcela('a2', 5)],
      entregas: [entrega('a1', 'ana', { notaFinal: 4 }), entrega('a2', 'ana', { notaFinal: 5 })],
    });
    expect(resultado.total).toBe(9);
    expect(resultado.completo).toBe(false);
  });
});

describe('R81-02 (RN-81): completude sem inventar zero', () => {
  const parcelas = [parcela('a1', 4), parcela('a2', 6)];

  it('marca ausência de entrega como pendência', () => {
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas,
      entregas: [entrega('a1', 'ana', { notaFinal: 4 })],
    });
    expect(resultado.completo).toBe(false);
    expect(resultado.total).toBe(4);
    expect(resultado.pendencias).toEqual([{ atividadeId: 'a2', motivo: 'sem_entrega' }]);
  });

  it('marca entrega não corrigida e erro de correção como pendência', () => {
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas,
      entregas: [
        entrega('a1', 'ana', { notaFinal: 4, status: 'entregue' }),
        entrega('a2', 'ana', { notaFinal: 5, status: 'erro_correcao' }),
      ],
    });
    expect(resultado.pendencias.map(p => p.motivo)).toEqual(['nao_corrigida', 'nao_corrigida']);
    expect(resultado.total).toBe(0);
  });

  it('revisada válida prevalece sobre a nota final', () => {
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 10)],
      entregas: [entrega('a1', 'ana', { notaFinal: 2, notaRevisada: 7, status: 'revisado' })],
    });
    expect(resultado.total).toBe(7);
  });

  it('revisão inválida bloqueia sem cair silenciosamente para a nota antiga', () => {
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 10)],
      entregas: [entrega('a1', 'ana', { notaFinal: 8, notaRevisada: NaN, status: 'revisado' })],
    });
    expect(resultado.total).toBe(0);
    expect(resultado.pendencias).toEqual([{ atividadeId: 'a1', motivo: 'nota_invalida' }]);
  });

  it('rejeita nota acima do máximo da parcela', () => {
    const resultado = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 4)],
      entregas: [entrega('a1', 'ana', { notaFinal: 5 })],
    });
    expect(resultado.pendencias).toEqual([{ atividadeId: 'a1', motivo: 'nota_acima_do_maximo' }]);
  });

  it('não conta entrega de outro aluno nem entrega duplicada', () => {
    const deOutro = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 10)],
      entregas: [entrega('a1', 'bruno', { notaFinal: 9 })],
    });
    expect(deOutro.pendencias).toEqual([{ atividadeId: 'a1', motivo: 'sem_entrega' }]);

    const duplicada = calcularRecuperacaoAluno({
      alunoId: 'ana',
      parcelas: [parcela('a1', 10)],
      entregas: [entrega('a1', 'ana', { notaFinal: 9 }), entrega('a1', 'ana', { notaFinal: 8 })],
    });
    expect(duplicada.pendencias).toEqual([{ atividadeId: 'a1', motivo: 'entrega_duplicada' }]);
  });
});

describe('R81-03 (RN-81): conjunto explícito', () => {
  const base = { professorId: 'p1', turmaId: 't1', anoLetivo: '2026', semestre: 1, destinatariosIds: ['ana', 'ana', 'bruno'] };

  it('normaliza destinatários por ID e semestre', () => {
    expect(validarConjunto(base)).toMatchObject({ semestre: '1', destinatariosIds: ['ana', 'bruno'] });
  });

  it('exige ano letivo explícito e semestre 1 ou 2', () => {
    expect(() => validarConjunto({ ...base, anoLetivo: '' })).toThrow(/ano letivo/i);
    expect(() => validarConjunto({ ...base, semestre: 3 })).toThrow(/semestre/i);
    expect(() => validarConjunto({ ...base, destinatariosIds: [] })).toThrow(/aluno/i);
    expect(() => validarConjunto({ ...base, turmaId: '' })).toThrow(/turma/i);
  });

  it('atividade legada sem finalidade continua regular', () => {
    expect(finalidadeDaAtividade({ id: 'a1' })).toBe('regular');
    expect(finalidadeDaAtividade({ id: 'a1', finalidade: 'recuperacao_semestral' })).toBe('recuperacao_semestral');
  });
});
