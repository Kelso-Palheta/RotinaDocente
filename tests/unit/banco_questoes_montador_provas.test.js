import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestaoAdaptada } from '../../frontend/src/dominio/adaptacoes/QuestaoAdaptada';
import { ProvaAdaptada } from '../../frontend/src/dominio/adaptacoes/ProvaAdaptada';
import { QuestaoAdaptadaRepository } from '../../frontend/src/infraestrutura/adaptacoes/QuestaoAdaptadaRepository';
import { ProvaAdaptadaRepository } from '../../frontend/src/infraestrutura/adaptacoes/ProvaAdaptadaRepository';

describe('UT-25 (RN-42): Entidade de Domínio QuestaoAdaptada', () => {
  it('deve instanciar uma QuestaoAdaptada com campos válidos', () => {
    const q = new QuestaoAdaptada({
      enunciado: 'Qual é o estado físico da água a 100°C ao nível do mar?',
      tipo: 'multipla_escolha',
      alternativas: ['(A) Sólido', '(B) Líquido', '(C) Gasoso'],
      gabarito: '(C) Gasoso',
      apoioVisualDescricao: 'Ilustração de água fervendo em uma panela com vapor subindo.',
      scaffolding: 'Lembre-se do que acontece quando a água ferve na chaleira.',
      disciplina: 'Ciências',
      anoEscolar: '6º Ano',
      necessidades: ['tea', 'baixa_visao'],
      nivelSuporte: 1,
    });

    expect(q.id).toBeDefined();
    expect(q.enunciado).toBe('Qual é o estado físico da água a 100°C ao nível do mar?');
    expect(q.tipo).toBe('multipla_escolha');
    expect(q.alternativas).toHaveLength(3);
    expect(q.gabarito).toBe('(C) Gasoso');
    expect(q.necessidades).toEqual(['tea', 'baixa_visao']);
    expect(q.nivelSuporte).toBe(1);
  });

  it('deve lançar erro se o enunciado estiver vazio', () => {
    expect(() => {
      new QuestaoAdaptada({
        enunciado: '   ',
        tipo: 'multipla_escolha',
      });
    }).toThrow(/enunciado.*obrigatório/i);
  });

  it('deve normalizar o tipo de questão desconhecido para multipla_escolha por padrão', () => {
    const q = new QuestaoAdaptada({
      enunciado: 'Pergunta teste',
      tipo: 'tipo_desconhecido',
    });
    expect(q.tipo).toBe('multipla_escolha');
  });

  it('deve serializar corretamente para JSON puro com toJSON()', () => {
    const q = new QuestaoAdaptada({
      enunciado: 'Explique com suas palavras a fotossíntese.',
      tipo: 'discursiva',
      disciplina: 'Biologia',
    });
    const json = q.toJSON();
    expect(json.enunciado).toBe('Explique com suas palavras a fotossíntese.');
    expect(json.tipo).toBe('discursiva');
    expect(json.disciplina).toBe('Biologia');
    expect(json.createdAt).toBeDefined();
  });
});

describe('UT-26 (RN-42): Entidade de Domínio ProvaAdaptada', () => {
  it('deve criar uma prova com metadados e permitir adicionar e remover questões', () => {
    const prova = new ProvaAdaptada({
      titulo: 'Avaliação Diagnóstica de Ciências',
      disciplina: 'Ciências',
      anoEscolar: '7º Ano',
      instrucoes: 'Leia com calma e utilize os apoios visuais quando necessário.',
    });

    expect(prova.titulo).toBe('Avaliação Diagnóstica de Ciências');
    expect(prova.questoes).toEqual([]);

    const q1 = new QuestaoAdaptada({
      id: 'q-1',
      enunciado: 'Questão 1',
      tipo: 'multipla_escolha',
    });
    const q2 = new QuestaoAdaptada({
      id: 'q-2',
      enunciado: 'Questão 2',
      tipo: 'verdadeiro_falso',
    });

    prova.adicionarQuestao(q1);
    prova.adicionarQuestao(q2);

    expect(prova.questoes).toHaveLength(2);
    expect(prova.questoes[0].id).toBe('q-1');
    expect(prova.questoes[1].id).toBe('q-2');

    prova.removerQuestao('q-1');
    expect(prova.questoes).toHaveLength(1);
    expect(prova.questoes[0].id).toBe('q-2');
  });

  it('deve permitir reordenar questões na prova (mover posição)', () => {
    const prova = new ProvaAdaptada({ titulo: 'Prova Teste' });
    prova.adicionarQuestao({ id: 'a', enunciado: 'A' });
    prova.adicionarQuestao({ id: 'b', enunciado: 'B' });
    prova.adicionarQuestao({ id: 'c', enunciado: 'C' });

    // Move 'c' (index 2) para a primeira posição (index 0)
    prova.moverQuestao(2, 0);
    expect(prova.questoes.map((q) => q.id)).toEqual(['c', 'a', 'b']);
  });

  it('deve atribuir aluno PEI e herdar necessidades para o cabeçalho da prova', () => {
    const prova = new ProvaAdaptada({ titulo: 'Prova Adaptada 1' });
    prova.atribuirAluno({
      id: 'aluno-123',
      nome: 'Matheus Oliveira',
      necessidades: ['tea', 'tdah'],
      nivelSuporte: 2,
    });

    expect(prova.alunoId).toBe('aluno-123');
    expect(prova.alunoNome).toBe('Matheus Oliveira');
    expect(prova.necessidades).toEqual(['tea', 'tdah']);
    expect(prova.nivelSuporte).toBe(2);
  });
});

describe('UT-27 (RN-42): Persistência Híbrida de Questões (QuestaoAdaptadaRepository)', () => {
  let repository;
  let mockLocalStorage = {};

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    };

    repository = new QuestaoAdaptadaRepository({ firestoreDb: null });
  });

  it('deve salvar e listar uma questão individualmente em localStorage', async () => {
    const questao = {
      id: 'q-test-1',
      enunciado: 'O que é a fotossíntese?',
      tipo: 'discursiva',
      disciplina: 'Biologia',
      anoEscolar: '1º Ano EM',
      necessidades: ['tea'],
    };

    const salva = await repository.salvarQuestao('prof_1', questao);
    expect(salva.id).toBe('q-test-1');

    const lista = await repository.listarQuestoes('prof_1');
    expect(lista).toHaveLength(1);
    expect(lista[0].enunciado).toBe('O que é a fotossíntese?');
  });

  it('deve salvar múltiplas questões em lote (ex: geradas pela IA)', async () => {
    const questoes = [
      { id: 'q-lote-1', enunciado: 'Questão A', disciplina: 'História', necessidades: ['tdah'] },
      { id: 'q-lote-2', enunciado: 'Questão B', disciplina: 'História', necessidades: ['di'] },
    ];

    const salvas = await repository.salvarQuestoesEmLote('prof_1', questoes);
    expect(salvas).toHaveLength(2);

    const lista = await repository.listarQuestoes('prof_1');
    expect(lista).toHaveLength(2);
  });

  it('deve filtrar questões por necessidade DUA, disciplina e busca textual', async () => {
    await repository.salvarQuestoesEmLote('prof_1', [
      { id: '1', enunciado: 'Identifique o sujeito da oração', disciplina: 'Português', necessidades: ['tea'] },
      { id: '2', enunciado: 'Resolva a equação de segundo grau', disciplina: 'Matemática', necessidades: ['discalculia'] },
      { id: '3', enunciado: 'Classifique o advérbio', disciplina: 'Português', necessidades: ['tdah'] },
    ]);

    const filtradasPort = await repository.listarQuestoes('prof_1', { disciplina: 'Português' });
    expect(filtradasPort).toHaveLength(2);

    const filtradasTea = await repository.listarQuestoes('prof_1', { filtroNecessidades: ['tea'] });
    expect(filtradasTea).toHaveLength(1);
    expect(filtradasTea[0].id).toBe('1');

    const busca = await repository.listarQuestoes('prof_1', { busca: 'equação' });
    expect(busca).toHaveLength(1);
    expect(busca[0].id).toBe('2');
  });

  it('deve remover uma questão pelo ID', async () => {
    await repository.salvarQuestao('prof_1', { id: 'q-del', enunciado: 'Questão a deletar' });
    let lista = await repository.listarQuestoes('prof_1');
    expect(lista).toHaveLength(1);

    await repository.removerQuestao('prof_1', 'q-del');
    lista = await repository.listarQuestoes('prof_1');
    expect(lista).toHaveLength(0);
  });
});

describe('UT-28 (RN-42): Persistência Híbrida de Provas Adaptadas (ProvaAdaptadaRepository)', () => {
  let repository;
  let mockLocalStorage = {};

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    };

    repository = new ProvaAdaptadaRepository({ firestoreDb: null });
  });

  it('deve salvar e listar uma prova montada', async () => {
    const provaData = {
      id: 'prova-100',
      titulo: 'Avaliação Trimestral Adaptada',
      disciplina: 'Geografia',
      alunoNome: 'Gabriel Costa',
      questoes: [{ id: 'q1', enunciado: 'Questão 1' }, { id: 'q2', enunciado: 'Questão 2' }],
    };

    await repository.salvarProva('prof_1', provaData);
    const lista = await repository.listarProvas('prof_1');
    expect(lista).toHaveLength(1);
    expect(lista[0].titulo).toBe('Avaliação Trimestral Adaptada');
    expect(lista[0].questoes).toHaveLength(2);
  });

  it('deve obter prova por ID e remover prova', async () => {
    await repository.salvarProva('prof_1', { id: 'p-1', titulo: 'Prova 1' });
    const obtida = await repository.obterProvaPorId('prof_1', 'p-1');
    expect(obtida).toBeDefined();
    expect(obtida.titulo).toBe('Prova 1');

    await repository.removerProva('prof_1', 'p-1');
    const aposRemocao = await repository.obterProvaPorId('prof_1', 'p-1');
    expect(aposRemocao).toBeNull();
  });
});
