import { describe, it, expect } from 'vitest';
import { extrairTextoAtividadeTurma } from '../../frontend/src/dominio/adaptacoes/importadorAtividadeTurma';
import { filtrarAlunosComNecessidades } from '../../frontend/src/dominio/diario/AlunoDiario';
import { consolidarFichaAluno360 } from '../../frontend/src/dominio/diario/fichaAluno';

describe('UT-34 (RN-60): Extração de Atividades da Turma para Adaptação DUA', () => {
  it('deve extrair e formatar título, descrição e questões de múltipla escolha e discursivas', () => {
    const atividadeTurma = {
      id: 'atv_1',
      titulo: 'Avaliação Bimestral de História',
      descricao: 'Leia atentamente as questões e responda.',
      disciplina: 'História',
      questoes: [
        {
          numero: 1,
          enunciado: 'Qual foi o principal fator que desencadeou a Revolução Francesa?',
          alternativas: [
            { id: 'A', texto: 'A crise fiscal e privilégios feudais.' },
            { id: 'B', texto: 'A invasão napoleônica na Espanha.' },
          ],
        },
        {
          numero: 2,
          enunciado: 'Explique a importância da Queda da Bastilha.',
          tipo: 'discursiva',
        },
      ],
    };

    const textoExtraido = extrairTextoAtividadeTurma(atividadeTurma);

    expect(textoExtraido).toContain('=== Avaliação Bimestral de História ===');
    expect(textoExtraido).toContain('Instruções: Leia atentamente as questões e responda.');
    expect(textoExtraido).toContain('Questão 1: Qual foi o principal fator que desencadeou a Revolução Francesa?');
    expect(textoExtraido).toContain('A) A crise fiscal e privilégios feudais.');
    expect(textoExtraido).toContain('B) A invasão napoleônica na Espanha.');
    expect(textoExtraido).toContain('Questão 2: Explique a importância da Queda da Bastilha.');
  });

  it('deve tolerar atividade sem questões ou nula sem lançar exceção', () => {
    expect(extrairTextoAtividadeTurma(null)).toBe('');
    expect(extrairTextoAtividadeTurma({})).toBe('');
    expect(extrairTextoAtividadeTurma({ titulo: 'Lista 1', questoes: [] })).toContain('Lista 1');
  });
});

describe('UT-35 (RN-61): Filtragem de Alunos com Necessidades / CID do Diário', () => {
  const listaAlunos = [
    { id: '1', nome: 'Ana Silva', necessidades: ['tea'] },
    { id: '2', nome: 'Bruno Souza', necessidades: [] },
    { id: '3', nome: 'Carlos Eduardo', necessidades: ['tdah', 'baixa_visao'] },
    { id: '4', nome: 'Daniela Lima' }, // sem campo necessidades
  ];

  it('deve filtrar apenas alunos com necessidades quando apenasComNecessidades for true (padrão)', () => {
    const filtrados = filtrarAlunosComNecessidades(listaAlunos, { apenasComNecessidades: true });
    expect(filtrados).toHaveLength(2);
    expect(filtrados.map((a) => a.id)).toEqual(['1', '3']);
  });

  it('deve retornar todos os alunos quando apenasComNecessidades for false', () => {
    const todos = filtrarAlunosComNecessidades(listaAlunos, { apenasComNecessidades: false });
    expect(todos).toHaveLength(4);
  });

  it('deve retornar array vazio para entradas nulas ou inválidas', () => {
    expect(filtrarAlunosComNecessidades(null)).toEqual([]);
    expect(filtrarAlunosComNecessidades('invalido')).toEqual([]);
  });
});

describe('UT-36 (RN-62): Sigilo de Dados Médicos (LGPD / LBI) na Ficha 360º', () => {
  const aluno = {
    id: 'al_1',
    nome: 'Lucas Santos',
    necessidades: ['tea', 'tdah'],
  };

  const turma = {
    id: 'turma_9a',
    nome: '9º Ano A',
    disciplina: 'Ciências',
    bimestres: {},
  };

  it('deve ocultar diagnósticos e CID quando incluirDiagnosticoClinico for false (Relatório para Pais)', () => {
    const ficha = consolidarFichaAluno360({
      aluno,
      turma,
      incluirDiagnosticoClinico: false,
    });

    expect(ficha.inclusao.exibirDiagnosticoClinico).toBe(false);
    // Não expõe termos diagnósticos clínicos na identificação familiar
    expect(ficha.inclusao.rotuloSigiloso).toBe('Metodologias Ativas e Diretrizes de Acessibilidade Pedagógica DUA');
    // Mas preserva as recomendações metodológicas práticas (apoio visual, etapas curtas)
    expect(ficha.inclusao.recomendacoes.length).toBeGreaterThan(0);
    expect(ficha.inclusao.labelsExibicao).toBeUndefined();
  });

  it('deve exibir diagnósticos e categorias completas quando incluirDiagnosticoClinico for true (Conselho de Classe)', () => {
    const ficha = consolidarFichaAluno360({
      aluno,
      turma,
      incluirDiagnosticoClinico: true,
    });

    expect(ficha.inclusao.exibirDiagnosticoClinico).toBe(true);
    expect(ficha.inclusao.labels).toBeDefined();
    expect(ficha.inclusao.labels.join(', ')).toMatch(/Autismo|TEA|TDAH/);
  });
});
