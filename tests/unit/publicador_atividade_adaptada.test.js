import { describe, it, expect } from 'vitest';
import {
  converterAdaptadaParaAtividadeOnline,
  filtrarAtividadesParaAluno,
  normalizarAlternativasQuestao,
} from '../../frontend/src/dominio/adaptacoes/publicadorAtividadeOnline';

describe('UT-33: Publicação Online de Atividades Adaptadas (RN-59)', () => {
  const adaptacaoMock = {
    titulo: 'Avaliação Adaptada de Literatura - Trovadorismo',
    disciplina: 'Língua Portuguesa',
    anoEscolar: '1º Ano EM',
    aluno: {
      id: 'aluno-pei-1',
      nome: 'Gabriel Medina',
      necessidades: ['tea', 'tdah'],
    },
    atividadeAdaptada: {
      instrucoesAluno: 'Leia cada questão com calma. Você pode ouvir o enunciado ou pedir dicas ao mediador.',
      questoes: [
        {
          numero: 1,
          enunciado: 'Sobre as cantigas de amor do Trovadorismo, assinale a alternativa correta:',
          alternativas: [
            'A) O eu lírico é sempre masculino e expressa sofrimento amoroso (coita).',
            'B) O ambiente retratado é a vida camponesa sem nobreza.',
            'C) Não havia distinção entre cantigas de amigo e cantigas de amor.',
            'D) A mulher amada é tratada como inferior ao cavaleiro.',
          ],
          gabarito: 'A',
          apoioVisualDescricao: 'Ilustração medieval de um cavaleiro dedicando versos a uma dama na corte.',
          imagemUrl: 'https://exemplo.com/imagem_trovadorismo.png',
          scaffolding: 'Lembre-se: nas cantigas de amor, o cavaleiro serve à sua senhora (vassalagem amorosa).',
        },
        {
          numero: 2,
          enunciado: 'Explique com suas palavras a principal diferença entre cantiga de amor e cantiga de amigo.',
          alternativas: [],
          gabarito: 'Na cantiga de amor o eu lírico é masculino; na de amigo o eu lírico é feminino.',
          apoioVisualDescricao: 'Quadro comparativo esquemático entre trovador e camponesa.',
          scaffolding: 'Pense em quem está falando na poesia: um homem nobre ou uma mulher do povo?',
        },
      ],
    },
  };

  it('deve converter com sucesso uma atividade adaptada para o formato canônico de atividade online', () => {
    const atividadeOnline = converterAdaptadaParaAtividadeOnline({
      adaptacao: adaptacaoMock,
      turmaId: 'turma-1a',
      alunoId: 'aluno-pei-1',
      professorId: 'prof-123',
      bimestre: 1,
      prazoEntrega: '2026-04-15T23:59:00Z',
    });

    expect(atividadeOnline.titulo).toBe('Avaliação Adaptada de Literatura - Trovadorismo');
    expect(atividadeOnline.disciplina).toBe('Língua Portuguesa');
    expect(atividadeOnline.turmaIds).toContain('turma-1a');
    expect(atividadeOnline.professorId).toBe('prof-123');
    expect(atividadeOnline.bimestre).toBe(1);
    expect(atividadeOnline.tipoAtividade).toBe('adaptada');
    expect(atividadeOnline.alunoExclusivoId).toBe('aluno-pei-1');
    expect(atividadeOnline.dataEntrega).toBe('2026-04-15T23:59:00Z');

    // Validação das questões convertidas
    expect(atividadeOnline.questoes.length).toBe(2);

    const q1 = atividadeOnline.questoes[0];
    expect(q1.numero).toBe(1);
    expect(q1.tipo).toBe('multipla_escolha');
    expect(q1.alternativas.length).toBe(4);
    expect(q1.alternativas[0]).toEqual({
      id: 'A',
      texto: 'O eu lírico é sempre masculino e expressa sofrimento amoroso (coita).',
    });
    expect(q1.apoioVisualDescricao).toContain('Ilustração medieval');
    expect(q1.imagens[0].url).toBe('https://exemplo.com/imagem_trovadorismo.png');
    expect(q1.scaffolding).toContain('vassalagem amorosa');
    expect(q1.gabarito).toBe('A');

    const q2 = atividadeOnline.questoes[1];
    expect(q2.numero).toBe(2);
    expect(q2.tipo).toBe('discursiva');
    expect(q2.scaffolding).toBeDefined();
  });

  it('deve normalizar alternativas textuais ("A) Texto") para objetos padronizados { id, texto }', () => {
    const altsBrutas = [
      'A) Primeira alternativa',
      'B - Segunda alternativa',
      'C) Terceira alternativa',
    ];

    const altsNormalizadas = normalizarAlternativasQuestao(altsBrutas);

    expect(altsNormalizadas).toEqual([
      { id: 'A', texto: 'Primeira alternativa' },
      { id: 'B', texto: 'Segunda alternativa' },
      { id: 'C', texto: 'Terceira alternativa' },
    ]);
  });

  it('deve filtrar atividades garantindo que atividades exclusivas só apareçam para o respectivo aluno', () => {
    const listaAtividades = [
      { id: 'atv-geral', titulo: 'Simulado Geral da Turma', alunoExclusivoId: null },
      { id: 'atv-adaptada-gabriel', titulo: 'Atividade Adaptada Gabriel', alunoExclusivoId: 'aluno-pei-1' },
      { id: 'atv-adaptada-lucas', titulo: 'Atividade Adaptada Lucas', alunoExclusivoId: 'aluno-pei-2' },
    ];

    // Para um aluno regular (aluno-3)
    const atvsAlunoRegular = filtrarAtividadesParaAluno(listaAtividades, 'aluno-3');
    expect(atvsAlunoRegular.length).toBe(1);
    expect(atvsAlunoRegular[0].id).toBe('atv-geral');

    // Para Gabriel (aluno-pei-1)
    const atvsGabriel = filtrarAtividadesParaAluno(listaAtividades, 'aluno-pei-1');
    expect(atvsGabriel.length).toBe(2);
    expect(atvsGabriel.map((a) => a.id)).toContain('atv-geral');
    expect(atvsGabriel.map((a) => a.id)).toContain('atv-adaptada-gabriel');
    expect(atvsGabriel.map((a) => a.id)).not.toContain('atv-adaptada-lucas');
  });

  it('deve rejeitar conversão sem os parâmetros obrigatórios mínimos', () => {
    expect(() =>
      converterAdaptadaParaAtividadeOnline({
        adaptacao: null,
        turmaId: 't1',
        alunoId: 'a1',
        professorId: 'p1',
      })
    ).toThrow(/adaptação/i);

    expect(() =>
      converterAdaptadaParaAtividadeOnline({
        adaptacao: adaptacaoMock,
        turmaId: '',
        alunoId: 'a1',
        professorId: 'p1',
      })
    ).toThrow(/turma/i);

    expect(() =>
      converterAdaptadaParaAtividadeOnline({
        adaptacao: adaptacaoMock,
        turmaId: 't1',
        alunoId: '',
        professorId: 'p1',
      })
    ).toThrow(/aluno/i);
  });
});
