import { describe, expect, it } from 'vitest';
import {
  deserializarBackupTurmas,
  prepararRestauracaoBackup,
} from '@/dominio/diario/backupTurmas';

const turma = (extra = {}) => ({
  id: 't',
  nome: 'Turma',
  alunos: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bia' }],
  bimestres: {
    1: { atividades: [], notas: { a: { simulado: 5 } }, config: {} },
    2: { atividades: [], notas: {}, config: {} },
    3: { atividades: [], notas: {}, config: {} },
    4: { atividades: [], notas: {}, config: {} },
  },
  recuperacao: { a: { rec1: 8, rec2: 9 } },
  recuperacaoLancamentos: {
    a: {
      rec1: {
        conjuntoId: 'c1',
        versao: 3,
        semestre: '1',
        chave: 'c1:3:a:1:800',
        total: 8,
        parcelas: [{ atividadeId: 'r1', nota: 3 }, { atividadeId: 'r2', nota: 5 }],
        anterior: null,
        em: '2026-10-27T10:00:00.000Z',
        por: 'p',
      },
    },
  },
  ...extra,
});

describe('R81-08 (RN-81): backup preserva recuperação e proveniência', () => {
  it('exporta e reimporta rec1/rec2 numéricos com recuperacaoLancamentos intactos', () => {
    const original = [turma()];
    const importado = deserializarBackupTurmas(JSON.stringify(original));
    expect(importado).toEqual(original);
    expect(importado[0].recuperacao.a).toEqual({ rec1: 8, rec2: 9 });
    expect(importado[0].recuperacaoLancamentos.a.rec1).toMatchObject({
      conjuntoId: 'c1',
      chave: 'c1:3:a:1:800',
      total: 8,
      parcelas: [{ atividadeId: 'r1', nota: 3 }, { atividadeId: 'r2', nota: 5 }],
    });
  });

  it('backup antigo sem proveniência mantém a nota numérica e não inventa histórico', () => {
    const antigo = turma();
    delete antigo.recuperacaoLancamentos;
    const importado = deserializarBackupTurmas([antigo]);
    expect(importado[0].recuperacao.a).toEqual({ rec1: 8, rec2: 9 });
    expect(importado[0].recuperacaoLancamentos).toBeUndefined();
  });

  it('restauração por mesclagem conserva a proveniência local quando o backup não a traz', () => {
    const backup = turma();
    delete backup.recuperacaoLancamentos;
    const plano = prepararRestauracaoBackup([turma()], [backup], 'mesclar');
    expect(plano.turmas[0].recuperacao.a).toEqual({ rec1: 8, rec2: 9 });
    expect(plano.turmas[0].recuperacaoLancamentos.a.rec1.chave).toBe('c1:3:a:1:800');
    expect(plano.conflitos).toEqual([]);
  });

  it('substituição por backup com proveniência nova atualiza os dois registros juntos', () => {
    const novo = turma();
    novo.recuperacao.a = { rec1: 6 };
    novo.recuperacaoLancamentos.a = {
      rec1: { conjuntoId: 'c2', versao: 1, semestre: '1', chave: 'c2:1:a:1:600', total: 6, parcelas: [] },
    };
    const plano = prepararRestauracaoBackup([turma()], [novo], 'substituir');
    expect(plano.turmas[0].recuperacao.a).toEqual({ rec1: 6 });
    expect(plano.turmas[0].recuperacaoLancamentos.a.rec1.chave).toBe('c2:1:a:1:600');
    expect(plano.resumo.recebido).toEqual(plano.resumo.resultado);
  });

  it('mesclagem com notas diferentes mantém o valor local e registra conflito sem perder proveniência', () => {
    const backup = turma();
    backup.recuperacao.a = { rec1: 5 };
    backup.recuperacaoLancamentos.a.rec1 = { conjuntoId: 'c2', versao: 2, semestre: '1', chave: 'c2:2:a:1:500', total: 5, parcelas: [] };
    const plano = prepararRestauracaoBackup([turma()], [backup], 'mesclar');
    expect(plano.turmas[0].recuperacao.a).toEqual({ rec1: 8, rec2: 9 });
    expect(plano.turmas[0].recuperacaoLancamentos.a.rec1.chave).toBe('c1:3:a:1:800');
    expect(plano.conflitos).toEqual(expect.arrayContaining([
      'turmas.t.recuperacao.a.rec1',
      'turmas.t.recuperacaoLancamentos.a.rec1.conjuntoId',
      'turmas.t.recuperacaoLancamentos.a.rec1.chave',
      'turmas.t.recuperacaoLancamentos.a.rec1.total',
    ]));
  });

  it('backup recusa nota de recuperação inválida mesmo com proveniência presente', () => {
    const invalido = turma();
    invalido.recuperacao.a = { rec1: 'oito' };
    expect(() => deserializarBackupTurmas([invalido])).toThrow(/recuperacao/);
  });
});
