import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../frontend/src/app/api/adaptacoes/gerar/route';

describe('IT-05 (RN-31, RN-32, RN-35): Endpoint de Geração de Atividades Adaptadas (/api/adaptacoes/gerar)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar status 400 com AI_KEY_REQUIRED quando headers BYOK não forem informados', async () => {
    const req = new Request('http://localhost/api/adaptacoes/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modo: 'adaptar',
        conteudoBase: 'Texto da atividade original',
        necessidades: ['tea'],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('AI_KEY_REQUIRED');
  });

  it('deve retornar status 400 se nenhuma necessidade de deficiência for fornecida', async () => {
    const req = new Request('http://localhost/api/adaptacoes/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-ai-provider': 'openai',
        'x-user-ai-key': 'sk-fake-key',
      },
      body: JSON.stringify({
        modo: 'adaptar',
        conteudoBase: 'Exercício de matemática',
        necessidades: [],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/necessidade/i);
  });

  it('deve retornar status 400 se modo for inválido', async () => {
    const req = new Request('http://localhost/api/adaptacoes/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-ai-provider': 'openai',
        'x-user-ai-key': 'sk-fake-key',
      },
      body: JSON.stringify({
        modo: 'modo_invalido',
        necessidades: ['tea'],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toMatch(/modo/i);
  });

  it('deve gerar atividade adaptada e guia de mediação docente com sucesso', async () => {
    const mockIAOutput = JSON.stringify({
      sucesso: true,
      titulo: 'Atividade Adaptada: Fotossíntese e Energia Solar',
      disciplina: 'Ciências',
      anoEscolar: '7º Ano',
      aluno: {
        nome: 'Lucas',
        necessidades: ['tea', 'di'],
      },
      diretrizesHarmonizadas: [
        'Linguagem direta e literal',
        'Apoios visuais limpos',
      ],
      atividadeAdaptada: {
        instrucoesAluno: 'Leia cada questão com calma. Peça ajuda ao professor se tiver dúvidas.',
        questoes: [
          {
            numero: 1,
            enunciado: 'As plantas produzem o seu próprio alimento através de qual processo natural?',
            tipo: 'multipla_escolha',
            apoioVisualDescricao: 'Ilustração esquemática do sol iluminando uma folha verde com gotas de água.',
            alternativas: [
              'A) Fotossíntese',
              'B) Respiração',
              'C) Hibernação',
            ],
            dicaScaffolding: 'Lembre-se da palavra que começa com "Foto", que significa luz.',
          },
        ],
      },
      guiaMediacao: {
        objetivoPedagogicoInalterado: 'Compreender o processo fundamental de transformação da energia solar em energia química pelas plantas (EF07CI07).',
        tempoEstimado: '30 a 40 minutos com pausas planejadas.',
        passoAPassoProfessor: [
          'Apresente o esquema visual antes de ler a questão.',
          'Permita o uso de apontamento direto caso o aluno prefira não escrever.',
        ],
        antecipacaoComportamental: 'Se houver sobrecarga sensorial, faça uma pausa de 3 minutos.',
        criteriosAvaliacaoFlexibilizada: 'Valorizar a identificação do conceito chave, oralmente ou assinalando a alternativa.',
      },
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: mockIAOutput } }],
      }),
    });

    const req = new Request('http://localhost/api/adaptacoes/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-ai-provider': 'gemini',
        'x-user-ai-key': 'fake-gemini-key',
      },
      body: JSON.stringify({
        modo: 'adaptar',
        conteudoBase: 'Exercício sobre fotossíntese...',
        disciplina: 'Ciências',
        anoEscolar: '7º Ano',
        aluno: {
          nome: 'Lucas',
          necessidades: ['tea', 'di'],
          nivelSuporte: 2,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.sucesso).toBe(true);
    expect(data.atividadeAdaptada).toBeDefined();
    expect(data.atividadeAdaptada.questoes.length).toBeGreaterThan(0);
    expect(data.guiaMediacao).toBeDefined();
    expect(data.guiaMediacao.objetivoPedagogicoInalterado).toBeDefined();

    globalThis.fetch = originalFetch;
  });
});
