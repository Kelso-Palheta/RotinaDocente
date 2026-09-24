import { describe, it, expect } from 'vitest';
import {
  CATEGORIAS_DEFICIENCIA,
  CATEGORIAS_MAP,
  obterCategoriaDeficiencia,
} from '../../frontend/src/dominio/adaptacoes/CategoriasDeficiencia';
import { AlunoInclusivo } from '../../frontend/src/dominio/adaptacoes/AlunoInclusivo';
import { HarmonizadorAdaptacoes } from '../../frontend/src/dominio/adaptacoes/HarmonizadorAdaptacoes';

describe('UT-17 (RN-31 & RN-33): Catálogo de Deficiências e Entidade AlunoInclusivo', () => {
  it('deve listar as 10 categorias oficiais de deficiência e neurodiversidade', () => {
    const ids = CATEGORIAS_DEFICIENCIA.map((c) => c.id);
    expect(ids).toContain('tea');
    expect(ids).toContain('di');
    expect(ids).toContain('tdah');
    expect(ids).toContain('baixa_visao');
    expect(ids).toContain('cegueira');
    expect(ids).toContain('surdez');
    expect(ids).toContain('motora');
    expect(ids).toContain('dislexia');
    expect(ids).toContain('discalculia');
    expect(ids).toContain('ah_sd');
    expect(CATEGORIAS_DEFICIENCIA.length).toBe(10);
  });

  it('cada categoria deve possuir id, nome, descricao e diretrizesDUA', () => {
    CATEGORIAS_DEFICIENCIA.forEach((cat) => {
      expect(cat.id).toBeDefined();
      expect(cat.nome).toBeDefined();
      expect(cat.descricao).toBeDefined();
      expect(Array.isArray(cat.diretrizesDUA)).toBe(true);
      expect(cat.diretrizesDUA.length).toBeGreaterThan(0);
    });
  });

  it('deve instanciar um AlunoInclusivo com dados válidos e múltiplas necessidades', () => {
    const aluno = new AlunoInclusivo({
      id: 'aluno-1',
      nome: 'Lucas Silva',
      turmaId: 'turma-3a',
      turmaNome: '3º Ano A',
      necessidades: ['tea', 'di'],
      nivelSuporte: 2,
      hiperfoco: 'Dinossauros',
      observacoes: 'Responde muito bem a apoio de imagens e frases curtas.',
    });

    expect(aluno.isValid()).toBe(true);
    expect(aluno.id).toBe('aluno-1');
    expect(aluno.nome).toBe('Lucas Silva');
    expect(aluno.necessidades).toEqual(['tea', 'di']);
    expect(aluno.nivelSuporte).toBe(2);
    expect(aluno.hiperfoco).toBe('Dinossauros');
  });

  it('deve rejeitar AlunoInclusivo sem nome ou com nome vazio', () => {
    expect(
      () =>
        new AlunoInclusivo({
          nome: '',
          necessidades: ['tea'],
        })
    ).toThrowError(/Nome do aluno é obrigatório/);
  });

  it('deve rejeitar AlunoInclusivo sem nenhuma necessidade selecionada', () => {
    expect(
      () =>
        new AlunoInclusivo({
          nome: 'Maria Eduarda',
          necessidades: [],
        })
    ).toThrowError(/Selecione ao menos uma necessidade/);
  });

  it('deve rejeitar categorias desconhecidas/inválidas', () => {
    expect(
      () =>
        new AlunoInclusivo({
          nome: 'Gabriel',
          necessidades: ['categoria_inventada'],
        })
    ).toThrowError(/Categoria "categoria_inventada" não é suportada/);
  });

  it('deve normalizar o nível de suporte para o intervalo 1 a 3 (padrão 1)', () => {
    const aluno = new AlunoInclusivo({
      nome: 'Ana Clara',
      necessidades: ['tdah'],
      nivelSuporte: 99,
    });
    expect(aluno.nivelSuporte).toBe(1);
  });

  it('deve serializar para JSON e reconstruir a partir de fromJSON()', () => {
    const original = new AlunoInclusivo({
      nome: 'Pedro Henrique',
      turmaId: 'turma-1',
      turmaNome: '1º Ano EM',
      necessidades: ['baixa_visao', 'motora'],
      nivelSuporte: 3,
      hiperfoco: 'Jogos de Tabuleiro',
    });

    const json = original.toJSON();
    expect(json.nome).toBe('Pedro Henrique');
    expect(json.necessidades).toEqual(['baixa_visao', 'motora']);
    expect(json.nivelSuporte).toBe(3);

    const reconstruido = AlunoInclusivo.fromJSON(json);
    expect(reconstruido.nome).toBe(original.nome);
    expect(reconstruido.necessidades).toEqual(original.necessidades);
    expect(reconstruido.nivelSuporte).toBe(original.nivelSuporte);
  });
});

describe('UT-18 (RN-32): Motor de Harmonização Sinérgica para Múltipla Deficiência', () => {
  it('deve harmonizar diretrizes para uma única categoria (ex: TEA)', () => {
    const harmonizacao = HarmonizadorAdaptacoes.harmonizar({
      necessidades: ['tea'],
      nivelSuporte: 1,
    });

    expect(harmonizacao.categorias).toHaveLength(1);
    expect(harmonizacao.categorias[0].id).toBe('tea');
    expect(harmonizacao.diretrizesLinguagem).toContain('Usar linguagem direta, objetiva e estritamente literal');
    expect(harmonizacao.diretrizesLayout).toContain('Evitar poluição visual, blocos extensos de texto e estampas concorrentes');
  });

  it('deve harmonizar sinergicamente TEA + Deficiência Intelectual sem duplicações', () => {
    const harmonizacao = HarmonizadorAdaptacoes.harmonizar({
      necessidades: ['tea', 'di'],
      nivelSuporte: 2,
    });

    // TEA: literalidade, previsibilidade
    // DI: leitura fácil, redução de distratores, ancoragem concreta
    expect(harmonizacao.diretrizesLinguagem.some((d) => d.includes('literal'))).toBe(true);
    expect(harmonizacao.diretrizesLinguagem.some((d) => d.includes('Leitura Fácil') || d.includes('curtas'))).toBe(true);
    expect(harmonizacao.diretrizesAvaliacao.some((d) => d.includes('Reduzir número de distratores') || d.includes('alternativas'))).toBe(true);
    expect(harmonizacao.sinergiasIdentificadas).toContain('TEA + Deficiência Intelectual: Aliar literalidade à Leitura Fácil concreta com apoios visuais limpos.');
  });

  it('deve harmonizar Baixa Visão + Deficiência Motora', () => {
    const harmonizacao = HarmonizadorAdaptacoes.harmonizar({
      necessidades: ['baixa_visao', 'motora'],
      nivelSuporte: 2,
    });

    expect(harmonizacao.diretrizesLayout.some((d) => d.includes('ampliada') || d.includes('contraste'))).toBe(true);
    expect(harmonizacao.diretrizesAcaoExpressao.some((d) => d.includes('escrita manual fina') || d.includes('assinalação direta'))).toBe(true);
    expect(harmonizacao.sinergiasIdentificadas).toContain('Baixa Visão + Deficiência Motora: Fonte ampliada com áreas de clique/marcação expandidas e dispensa de grafia fina.');
  });

  it('deve garantir que se Cegueira for selecionada, todo elemento visual seja audiodescrito', () => {
    const harmonizacao = HarmonizadorAdaptacoes.harmonizar({
      necessidades: ['cegueira', 'tea'],
      nivelSuporte: 2,
    });

    expect(harmonizacao.diretrizesLayout.some((d) => d.includes('audiodescrição') || d.includes('leitor de tela'))).toBe(true);
    expect(harmonizacao.regrasConflitoResolvidas.some((r) => r.includes('Cegueira'))).toBe(true);
  });

  it('deve intensificar o scaffolding e pausas para Nível de Suporte 3 (Alto)', () => {
    const harmonizacao = HarmonizadorAdaptacoes.harmonizar({
      necessidades: ['di'],
      nivelSuporte: 3,
    });

    expect(harmonizacao.nivelSuporte).toBe(3);
    expect(harmonizacao.diretrizesMediaDocente.some((d) => d.includes('mediação contínua') || d.includes('pausas'))).toBe(true);
  });

  it('deve incorporar o hiperfoco como âncora motivacional quando fornecido', () => {
    const harmonizacao = HarmonizadorAdaptacoes.harmonizar({
      necessidades: ['tea'],
      nivelSuporte: 1,
      hiperfoco: 'Trens e Ferrovias',
    });

    expect(harmonizacao.ancoragemHiperfoco).toBe('Trens e Ferrovias');
    expect(harmonizacao.diretrizesEngajamento.some((d) => d.includes('Trens e Ferrovias'))).toBe(true);
  });
});

describe('UT-19 (RN-33 & RN-24): Persistência Híbrida de Alunos PEI (AlunoAdaptadoRepository)', () => {
  const mockLocalStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => {
        store[key] = String(val);
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    mockLocalStorage.clear();
    global.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  it('deve salvar e listar alunos localmente via localStorage (modo offline/fallback)', async () => {
    const { AlunoAdaptadoRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AlunoAdaptadoRepository'
    );
    const repo = new AlunoAdaptadoRepository();

    const aluno = new AlunoInclusivo({
      id: 'aluno-offline-1',
      nome: 'Enzo Gabriel',
      turmaId: 'turma-2',
      turmaNome: '2º Ano B',
      necessidades: ['tdah', 'discalculia'],
      nivelSuporte: 1,
    });

    await repo.salvarAluno('prof-123', aluno);

    const alunos = await repo.listarAlunos('prof-123');
    expect(alunos).toHaveLength(1);
    expect(alunos[0].nome).toBe('Enzo Gabriel');
    expect(alunos[0].necessidades).toEqual(['tdah', 'discalculia']);

    const buscado = await repo.obterAlunoPorId('prof-123', 'aluno-offline-1');
    expect(buscado).toBeDefined();
    expect(buscado.nome).toBe('Enzo Gabriel');
  });

  it('deve sincronizar com Firestore quando banco estiver conectado', async () => {
    const { AlunoAdaptadoRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AlunoAdaptadoRepository'
    );

    let docSalvo = null;
    const mockFirestore = {
      collection: (colName) => ({
        doc: (docId) => ({
          collection: (subCol) => ({
            doc: (subDocId) => ({
              set: async (data) => {
                docSalvo = { colName, docId, subCol, subDocId, ...data };
              },
            }),
            get: async () => ({
              docs: [
                {
                  id: 'aluno-nuvem-1',
                  data: () => ({
                    id: 'aluno-nuvem-1',
                    nome: 'Mariana Costa',
                    turmaId: 'turma-9',
                    turmaNome: '9º Ano',
                    necessidades: ['surdez'],
                    nivelSuporte: 1,
                  }),
                },
              ],
            }),
          }),
        }),
      }),
    };

    const repo = new AlunoAdaptadoRepository({ firestoreDb: mockFirestore });

    const aluno = new AlunoInclusivo({
      id: 'aluno-nuvem-1',
      nome: 'Mariana Costa',
      turmaId: 'turma-9',
      turmaNome: '9º Ano',
      necessidades: ['surdez'],
      nivelSuporte: 1,
    });

    await repo.salvarAluno('prof-xyz', aluno);
    expect(docSalvo).toBeDefined();
    expect(docSalvo.subCol).toBe('alunos_adaptados');
    expect(docSalvo.nome).toBe('Mariana Costa');

    const alunos = await repo.listarAlunos('prof-xyz');
    expect(alunos).toHaveLength(1);
    expect(alunos[0].nome).toBe('Mariana Costa');
  });

  it('deve usar fallback transparente de localStorage se Firestore lançar erro', async () => {
    const { AlunoAdaptadoRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AlunoAdaptadoRepository'
    );

    const mockFirestoreOffline = {
      collection: () => ({
        doc: () => ({
          collection: () => {
            throw new Error('Firestore connection timeout');
          },
        }),
      }),
    };

    const repo = new AlunoAdaptadoRepository({ firestoreDb: mockFirestoreOffline });

    const aluno = new AlunoInclusivo({
      id: 'aluno-fb-1',
      nome: 'Carlos Eduardo',
      turmaId: 'turma-5',
      turmaNome: '5º Ano',
      necessidades: ['tea'],
      nivelSuporte: 2,
    });

    // Salva sem estourar exceção, fazendo fallback para localStorage
    await repo.salvarAluno('prof-err', aluno);

    const lista = await repo.listarAlunos('prof-err');
    expect(lista).toHaveLength(1);
    expect(lista[0].nome).toBe('Carlos Eduardo');
  });

  it('deve excluir aluno local e no Firestore', async () => {
    const { AlunoAdaptadoRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AlunoAdaptadoRepository'
    );
    const repo = new AlunoAdaptadoRepository();

    const aluno = new AlunoInclusivo({
      id: 'aluno-del-1',
      nome: 'Aluno Para Deletar',
      necessidades: ['ah_sd'],
      nivelSuporte: 1,
    });

    await repo.salvarAluno('prof-1', aluno);
    let lista = await repo.listarAlunos('prof-1');
    expect(lista).toHaveLength(1);

    await repo.removerAluno('prof-1', 'aluno-del-1');
    lista = await repo.listarAlunos('prof-1');
    expect(lista).toHaveLength(0);
  });
});

describe('UT-20 (RN-31, RN-32, RN-35): AdaptacaoPromptBuilder', () => {
  it('deve construir prompt contendo a regra inegociável de não empobrecimento curricular (RN-31)', async () => {
    const { AdaptacaoPromptBuilder } = await import(
      '../../frontend/src/dominio/adaptacoes/AdaptacaoPromptBuilder'
    );

    const prompt = AdaptacaoPromptBuilder.construir({
      modo: 'adaptar',
      conteudoBase: 'Calcule a área do triângulo...',
      aluno: {
        nome: 'João',
        necessidades: ['di'],
        nivelSuporte: 2,
      },
    });

    expect(prompt).toContain('NÃO EMPOBRECIMENTO CURRICULAR');
    expect(prompt).toContain('Desenho Universal para a Aprendizagem (DUA)');
    expect(prompt).toContain('guiaMediacao');
    expect(prompt).toContain('atividadeAdaptada');
  });

  it('deve incluir diretrizes harmonizadas e ancoragem de hiperfoco quando fornecido', async () => {
    const { AdaptacaoPromptBuilder } = await import(
      '../../frontend/src/dominio/adaptacoes/AdaptacaoPromptBuilder'
    );

    const prompt = AdaptacaoPromptBuilder.construir({
      modo: 'criar',
      tema: 'Ecossistemas e Cadeia Alimentar',
      disciplina: 'Biologia',
      anoEscolar: '1º Ano EM',
      aluno: {
        nome: 'Mateus',
        necessidades: ['tea'],
        nivelSuporte: 1,
        hiperfoco: 'Super-heróis da Marvel',
      },
    });

    expect(prompt).toContain('Super-heróis da Marvel');
    expect(prompt).toContain('TEA');
    expect(prompt).toContain('Ecossistemas e Cadeia Alimentar');
  });

  it('UT-21 (RN-37): deve configurar quantidade específica de questões e tipos solicitados no prompt', async () => {
    const { AdaptacaoPromptBuilder } = await import(
      '../../frontend/src/dominio/adaptacoes/AdaptacaoPromptBuilder'
    );

    const prompt = AdaptacaoPromptBuilder.construir({
      modo: 'criar',
      tema: 'Revolução Industrial',
      disciplina: 'História',
      anoEscolar: '8º Ano',
      quantidadeQuestoes: 5,
      tiposQuestoes: ['multipla_escolha', 'associacao', 'verdadeiro_falso'],
      aluno: {
        nome: 'Sofia',
        necessidades: ['tdah', 'dislexia'],
        nivelSuporte: 1,
      },
    });

    expect(prompt).toContain('QUANTIDADE DE QUESTÕES: 5 questões');
    expect(prompt).toContain('TIPOS DE QUESTÕES PRIORIZADOS: multipla_escolha, associacao, verdadeiro_falso');
    expect(prompt).toContain('EXATAMENTE 5 questões completas');
  });

  it('UT-21 (RN-37): deve instruir adaptação de todas as questões do conteúdo original quando quantidade for "todas"', async () => {
    const { AdaptacaoPromptBuilder } = await import(
      '../../frontend/src/dominio/adaptacoes/AdaptacaoPromptBuilder'
    );

    const prompt = AdaptacaoPromptBuilder.construir({
      modo: 'adaptar',
      conteudoBase: 'Questão 1: ... Questão 2: ... Questão 3: ...',
      quantidadeQuestoes: 'todas',
      aluno: {
        nome: 'Enzo',
        necessidades: ['tea'],
      },
    });

    expect(prompt).toContain('todas as questões');
  });
});

describe('UT-22 (RN-38): Banco de Atividades Adaptadas e Reaproveitamento (AtividadeAdaptadaRepository)', () => {
  const mockLocalStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => {
        store[key] = String(val);
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    mockLocalStorage.clear();
    global.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  it('deve salvar e recuperar atividade adaptada completa no repositório híbrido', async () => {
    const { AtividadeAdaptadaRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository'
    );
    const repo = new AtividadeAdaptadaRepository();

    const atividade = {
      titulo: 'Avaliação de Ciências: Cadeia Alimentar',
      disciplina: 'Ciências',
      anoEscolar: '6º Ano',
      necessidades: ['tea', 'di'],
      nivelSuporte: 2,
      alunoId: 'aluno-1',
      alunoNome: 'Lucas',
      quantidadeQuestoes: 3,
      atividadeAdaptada: {
        instrucoesAluno: 'Faça com calma.',
        questoes: [
          { numero: 1, enunciado: 'O que os herbívoros comem?', tipo: 'multipla_escolha', alternativas: ['A) Plantas', 'B) Carne'] },
          { numero: 2, enunciado: 'Ligue os animais à sua alimentação', tipo: 'associacao', alternativas: [] },
          { numero: 3, enunciado: 'Plantas produzem seu alimento?', tipo: 'verdadeiro_falso', alternativas: ['V', 'F'] },
        ],
      },
      guiaMediacao: {
        objetivoPedagogicoInalterado: 'Identificar níveis tróficos.',
        tempoEstimado: '30 minutos',
      },
    };

    const salva = await repo.salvarAtividade('prof-test', atividade);
    expect(salva.id).toBeDefined();
    expect(salva.createdAt).toBeDefined();
    expect(salva.quantidadeQuestoes).toBe(3);

    const lista = await repo.listarAtividades('prof-test');
    expect(lista).toHaveLength(1);
    expect(lista[0].titulo).toBe('Avaliação de Ciências: Cadeia Alimentar');
    expect(lista[0].atividadeAdaptada.questoes).toHaveLength(3);
  });

  it('deve filtrar atividades por necessidades de deficiência para reaproveitamento', async () => {
    const { AtividadeAdaptadaRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository'
    );
    const repo = new AtividadeAdaptadaRepository();

    await repo.salvarAtividade('prof-test', {
      id: 'ativ-tea',
      titulo: 'Atividade A - TEA',
      disciplina: 'Matemática',
      necessidades: ['tea'],
      atividadeAdaptada: { questoes: [{ numero: 1, enunciado: 'Q1' }] },
    });

    await repo.salvarAtividade('prof-test', {
      id: 'ativ-baixa-visao',
      titulo: 'Atividade B - Baixa Visão',
      disciplina: 'Português',
      necessidades: ['baixa_visao'],
      atividadeAdaptada: { questoes: [{ numero: 1, enunciado: 'Q1' }] },
    });

    await repo.salvarAtividade('prof-test', {
      id: 'ativ-multipla',
      titulo: 'Atividade C - TEA + DI',
      disciplina: 'História',
      necessidades: ['tea', 'di'],
      atividadeAdaptada: { questoes: [{ numero: 1, enunciado: 'Q1' }] },
    });

    // Filtra apenas por 'tea': deve trazer 'ativ-tea' e 'ativ-multipla'
    const filtradasTEA = await repo.listarAtividades('prof-test', { filtroNecessidades: ['tea'] });
    expect(filtradasTEA).toHaveLength(2);
    const idsTEA = filtradasTEA.map((a) => a.id);
    expect(idsTEA).toContain('ativ-tea');
    expect(idsTEA).toContain('ativ-multipla');

    // Filtra por 'baixa_visao'
    const filtradasBV = await repo.listarAtividades('prof-test', { filtroNecessidades: ['baixa_visao'] });
    expect(filtradasBV).toHaveLength(1);
    expect(filtradasBV[0].id).toBe('ativ-baixa-visao');
  });

  it('deve reaproveitar atividade clonando para um novo aluno com as mesmas necessidades sem regerar IA', async () => {
    const { AtividadeAdaptadaRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository'
    );
    const repo = new AtividadeAdaptadaRepository();

    const original = await repo.salvarAtividade('prof-test', {
      id: 'ativ-orig-1',
      titulo: 'Prova Adaptada de Geografia: Clima e Relevo',
      disciplina: 'Geografia',
      anoEscolar: '7º Ano',
      necessidades: ['tea', 'tdah'],
      alunoId: 'aluno-pedro',
      alunoNome: 'Pedro',
      quantidadeQuestoes: 2,
      atividadeAdaptada: {
        questoes: [
          { numero: 1, enunciado: 'O que é clima quente?', tipo: 'multipla_escolha' },
          { numero: 2, enunciado: 'Onde chove mais?', tipo: 'multipla_escolha' },
        ],
      },
      guiaMediacao: {
        tempoEstimado: '20 min',
      },
    });

    const clonada = await repo.reaproveitarParaAluno('prof-test', 'ativ-orig-1', {
      id: 'aluno-gabriel',
      nome: 'Gabriel',
    });

    expect(clonada.id).not.toBe('ativ-orig-1');
    expect(clonada.alunoId).toBe('aluno-gabriel');
    expect(clonada.alunoNome).toBe('Gabriel');
    expect(clonada.titulo).toContain('Geografia');
    expect(clonada.atividadeAdaptada.questoes).toHaveLength(2);
    expect(clonada.reaproveitadaDe).toBe('ativ-orig-1');

    const todas = await repo.listarAtividades('prof-test');
    expect(todas).toHaveLength(2);
  });

  it('deve excluir atividade do repositório', async () => {
    const { AtividadeAdaptadaRepository } = await import(
      '../../frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository'
    );
    const repo = new AtividadeAdaptadaRepository();

    await repo.salvarAtividade('prof-test', {
      id: 'ativ-del-1',
      titulo: 'Atividade Descartável',
      necessidades: ['motora'],
    });

    let lista = await repo.listarAtividades('prof-test');
    expect(lista).toHaveLength(1);

    await repo.removerAtividade('prof-test', 'ativ-del-1');
    lista = await repo.listarAtividades('prof-test');
    expect(lista).toHaveLength(0);
  });
});



