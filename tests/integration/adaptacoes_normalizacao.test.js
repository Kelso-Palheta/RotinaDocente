import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../frontend/src/app/api/adaptacoes/gerar/route';

describe('IT-11 (RN-48): Normalização da resposta bruta da IA em POST /api/adaptacoes/gerar', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const montarRequest = (corpoExtra = {}) =>
    new Request('http://localhost/api/adaptacoes/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-ai-provider': 'gemini',
        'x-user-ai-key': 'fake-gemini-key',
      },
      body: JSON.stringify({
        modo: 'adaptar',
        conteudoBase: 'Exercício de matemática sobre frações.',
        disciplina: 'Matemática',
        anoEscolar: '5º Ano',
        necessidades: ['tea'],
        aluno: { nome: 'Ana', necessidades: ['tea'] },
        ...corpoExtra,
      }),
    });

  const mockarRespostaIA = (conteudo) => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: conteudo } }] }),
    });
  };

  it('normaliza nulls e tipos inválidos antes de responder (200 + estrutura coerente)', async () => {
    mockarRespostaIA(
      JSON.stringify({
        sucesso: true,
        titulo: 'Frações Adaptadas',
        disciplina: 'Matemática',
        anoEscolar: '5º Ano',
        diretrizesHarmonizadas: null,
        atividadeAdaptada: {
          instrucoesAluno: 'Leia com atenção.',
          questoes: {
            1: { numero: 1, enunciado: 'Q1', tipo: 'discursiva_curta', alternativas: 'A) um' },
          },
        },
        guiaMediacao: null,
        aluno: null,
      })
    );

    const res = await POST(montarRequest());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.diretrizesHarmonizadas)).toBe(true);
    expect(Array.isArray(data.guiaMediacao.passoAPassoProfessor)).toBe(true);
    expect(Array.isArray(data.atividadeAdaptada.questoes)).toBe(true);
    expect(data.atividadeAdaptada.questoes).toHaveLength(1);
    expect(Array.isArray(data.atividadeAdaptada.questoes[0].alternativas)).toBe(true);
    expect(Array.isArray(data.aluno.necessidades)).toBe(true);
    expect(typeof data.titulo).toBe('string');
  });

  it('preserva a forma feliz canônica sem corromper', async () => {
    const canonica = {
      sucesso: true,
      titulo: 'Frações Adaptadas',
      disciplina: 'Matemática',
      anoEscolar: '5º Ano',
      aluno: { nome: 'Ana', necessidades: ['tea'] },
      diretrizesHarmonizadas: ['Linguagem direta'],
      atividadeAdaptada: {
        instrucoesAluno: 'Leia com atenção.',
        questoes: [
          {
            numero: 1,
            enunciado: 'Qual é 1/2 de 8?',
            tipo: 'multipla_escolha',
            alternativas: ['A) 2', 'B) 4', 'C) 6'],
          },
        ],
      },
      guiaMediacao: {
        objetivoPedagogicoInalterado: 'Comparar frações.',
        tempoEstimado: '30 minutos.',
        passoAPassoProfessor: ['Apoie o cálculo.'],
        antecipacaoComportamental: 'Ofereça pausas.',
        criteriosAvaliacaoFlexibilizada: 'Aceitar resposta oral.',
      },
    };
    mockarRespostaIA(JSON.stringify(canonica));

    const res = await POST(montarRequest());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.titulo).toBe(canonica.titulo);
    expect(data.atividadeAdaptada.questoes).toHaveLength(1);
    expect(data.atividadeAdaptada.questoes[0].alternativas).toEqual(
      canonica.atividadeAdaptada.questoes[0].alternativas
    );
    expect(data.diretrizesHarmonizadas).toEqual(canonica.diretrizesHarmonizadas);
    expect(data.guiaMediacao.passoAPassoProfessor).toEqual(
      canonica.guiaMediacao.passoAPassoProfessor
    );
    expect(data.aluno).toEqual(canonica.aluno);
  });
});
