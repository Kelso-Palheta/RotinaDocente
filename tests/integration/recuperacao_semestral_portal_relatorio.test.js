import { describe, expect, it } from 'vitest';
import { filtrarAtividadesParaAluno } from '@/dominio/adaptacoes/publicadorAtividadeOnline';
import { atividadePublica } from '@/dominio/atividades/acessoAluno';
import { calcDesempenhoAnual } from '@/utils/diario/calculos';
import { consolidarFichaAluno360 } from '@/dominio/diario/fichaAluno';

const recuperacao = (extra = {}) => ({
  id: 'rec1',
  titulo: 'Recuperação 1º semestre',
  status: 'ativa',
  professorId: 'p',
  turmaIds: ['t'],
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  semestre: '1',
  destinatariosIds: ['a'],
  notaMaxima: 10,
  questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Questão', rubrica: 'Privada', gabarito: 'Privado' }],
  alunosPorTurma: { t: [{ id: 'a' }, { id: 'b' }] },
  ...extra,
});

const regular = { id: 'reg', status: 'ativa', professorId: 'p', turmaIds: ['t'], bimestre: 1, titulo: 'Regular' };

describe('R81-07 (RN-81): Portal só mostra recuperação aos destinatários', () => {
  it('inclui a recuperação para o aluno destinatário e mantém a atividade regular para todos', () => {
    expect(filtrarAtividadesParaAluno([recuperacao(), regular], 'a').map(a => a.id)).toEqual(['rec1', 'reg']);
    expect(filtrarAtividadesParaAluno([recuperacao(), regular], 'b').map(a => a.id)).toEqual(['reg']);
  });

  it('recuperação sem destinatários não aparece para ninguém, mesmo com outro aluno exclusivo', () => {
    expect(filtrarAtividadesParaAluno([recuperacao({ destinatariosIds: [] })], 'a')).toEqual([]);
    expect(filtrarAtividadesParaAluno([recuperacao({ destinatariosIds: ['b'] })], 'a')).toEqual([]);
    expect(filtrarAtividadesParaAluno([recuperacao({ destinatariosIds: ['a'], alunoExclusivoId: 'b' })], 'a')).toEqual([]);
  });

  it('projeção do Portal informa finalidade/semestre sem expor gabarito, rubrica, colegas ou turma inteira', () => {
    const publica = atividadePublica(recuperacao());
    expect(publica).toMatchObject({ finalidade: 'recuperacao_semestral', semestre: '1', conjuntoRecuperacaoId: 'c1' });
    expect(publica).not.toHaveProperty('destinatariosIds');
    expect(publica).not.toHaveProperty('alunosPorTurma');
    expect(publica.questoes[0]).not.toHaveProperty('rubrica');
    expect(publica.questoes[0]).not.toHaveProperty('gabarito');
    expect(JSON.stringify(publica)).not.toContain('"b"');
  });
});

describe('R81-07 (RN-81): boletim e relatório usam a recuperação lançada', () => {
  const turma = () => ({
    id: 't',
    nome: 'Turma',
    anoLetivo: 2026,
    alunos: [{ id: 'a', nome: 'Ana' }],
    bimestres: {
      1: { atividades: [], notas: { a: { simulado: 6 } }, config: {} },
      2: { atividades: [], notas: { a: { simulado: 6 } }, config: {} },
      3: { atividades: [], notas: { a: { simulado: 7 } }, config: {} },
      4: { atividades: [], notas: { a: { simulado: 7 } }, config: {} },
    },
    recuperacao: {},
    recuperacaoLancamentos: {},
  });

  it('rec1 lançado substitui a menor nota do 1º semestre pela fórmula existente (pesos 2 e 3)', () => {
    const comRecuperacao = turma();
    comRecuperacao.recuperacao.a = { rec1: 8 };
    comRecuperacao.recuperacaoLancamentos.a = {
      rec1: { conjuntoId: 'c1', versao: 3, chave: 'c1:3:a:1:800', total: 8, parcelas: [] },
    };
    const desempenho = calcDesempenhoAnual(comRecuperacao, 'a');
    expect(desempenho.S1).toMatchObject({ finalN1: 5, finalN2: 8, substituted: 'second', total: 34 });
    expect(desempenho.S2.total).toBe(25);

    const semRecuperacao = calcDesempenhoAnual(turma(), 'a');
    expect(semRecuperacao.S1).toMatchObject({ finalN1: 5, finalN2: 5, total: 25 });
    expect(semRecuperacao.S2.total).toBe(25);
  });

  it('rec2 lançado altera apenas o 2º semestre', () => {
    const comRecuperacao = turma();
    comRecuperacao.recuperacao.a = { rec2: 9 };
    const desempenho = calcDesempenhoAnual(comRecuperacao, 'a');
    expect(desempenho.S1.total).toBe(25);
    expect(desempenho.S2).toMatchObject({ finalN1: 5, finalN2: 9, substituted: 'second', total: 37 });
  });

  it('ficha individual do aluno reflete a recuperação lançada e não expõe a proveniência', () => {
    const comRecuperacao = turma();
    comRecuperacao.recuperacao.a = { rec1: 8, rec2: 9 };
    comRecuperacao.recuperacaoLancamentos.a = {
      rec1: { conjuntoId: 'c1', total: 8, chave: 'chave-interna' },
      rec2: { conjuntoId: 'c1', total: 9, chave: 'chave-interna' },
    };
    const ficha = consolidarFichaAluno360({
      aluno: { id: 'a', nome: 'Ana' },
      turma: comRecuperacao,
      frequenciasTurma: null,
      historicoRedacoes: null,
    });
    expect(ficha.academico.S1.total).toBe(34);
    expect(ficha.academico.S2.total).toBe(37);
    expect(ficha.academico.totalAnual).toBe(71);
    expect(JSON.stringify(ficha)).not.toContain('recuperacaoLancamentos');
    expect(JSON.stringify(ficha)).not.toContain('chave-interna');
  });
});
