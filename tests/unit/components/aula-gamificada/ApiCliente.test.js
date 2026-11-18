import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buscarCatalogo,
  gerarQuestoesIA,
  salvarQuestao,
  revisarQuestao,
  criarSala,
  entrarSala,
  obterEstadoSala,
  enviarComandoSala,
  enviarRespostaSala,
  gerarRequestId,
} from '@/components/aula-gamificada/api';

const mocks = vi.hoisted(() => ({
  getClientAIHeaders: vi.fn(),
}));

vi.mock('@/utils/aiHeaders', () => ({
  getClientAIHeaders: mocks.getClientAIHeaders,
}));

function respostaJson(dados, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => dados,
  };
}

describe('Aula Gamificada — cliente HTTP congelado (api.js)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('envia Bearer docente e NÃO envia headers BYOK em GET /catalogo e mutações de banco/sala', async () => {
    mocks.getClientAIHeaders.mockReturnValue({
      'x-user-ai-provider': 'gemini',
      'x-user-ai-key': 'segredo-nao-vazar',
      'x-user-ai-model': 'gemini-2.5-flash',
    });

    const fetcher = vi.fn(async () => respostaJson({ modalidades: [], turmas: [], questoes: [], salas: [] }));
    const obterToken = async () => 'token-docente-123';

    await buscarCatalogo({ obterToken, fetcher });
    await salvarQuestao({
      questao: { disciplina: 'Biologia', tipo: 'multipla_escolha', enunciado: 'Teste' },
      requestId: 'req-1',
      obterToken,
      fetcher,
    });
    await revisarQuestao({
      id: 'q1',
      expectedRevision: 1,
      requestId: 'req-2',
      obterToken,
      fetcher,
    });
    await criarSala({
      configuracao: { titulo: 'Revisão', modalidade: 'quiz', turmaIds: ['t1'], questaoIds: ['q1'], tempoSegundos: 45 },
      requestId: 'req-3',
      obterToken,
      fetcher,
    });
    await enviarComandoSala({
      codigo: 'BIO2026',
      acao: 'iniciar',
      expectedRevision: 1,
      rodada: 1,
      requestId: 'req-4',
      obterToken,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(5);
    for (const [url, init] of fetcher.mock.calls) {
      expect(url).toMatch(/^\/api\/aula-gamificada\//);
      expect(init.headers.Authorization).toBe('Bearer token-docente-123');
      expect(init.headers['x-user-ai-key']).toBeUndefined();
      expect(init.headers['x-user-ai-provider']).toBeUndefined();
      expect(init.credentials).toBe('same-origin');
      expect(init.cache).toBe('no-store');
    }
  });

  it('envia headers BYOK SOMENTE em POST /gerar junto com Bearer docente', async () => {
    mocks.getClientAIHeaders.mockReturnValue({
      'x-user-ai-provider': 'gemini',
      'x-user-ai-key': 'chave-byok-docente',
      'x-user-ai-model': 'gemini-2.5-flash',
    });

    const fetcher = vi.fn(async () => respostaJson({ questoes: [{ enunciado: 'Gerada' }] }));
    const payload = {
      disciplina: 'Física',
      anoEscolar: '1º ano EM',
      conteudo: 'Cinemática',
      tipo: 'multipla_escolha',
      fonte: 'tema',
      quantidades: { facil: 1, medio: 1, dificil: 0 },
    };

    const res = await gerarQuestoesIA({
      entrada: payload,
      obterToken: async () => 'token-docente',
      fetcher,
    });

    expect(res.questoes).toHaveLength(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('/api/aula-gamificada/gerar');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer token-docente');
    expect(init.headers['x-user-ai-provider']).toBe('gemini');
    expect(init.headers['x-user-ai-key']).toBe('chave-byok-docente');
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it('rotas discentes usam sessão same-origin sem Bearer, sem BYOK e sem uid no corpo', async () => {
    mocks.getClientAIHeaders.mockReturnValue({ 'x-user-ai-key': 'nao-enviar' });
    const fetcher = vi.fn(async (url) => {
      if (url.endsWith('/entrar')) return respostaJson({ estado: { codigo: 'MAT10', fase: 'espera', revision: 1 } });
      if (url.endsWith('/estado')) return respostaJson({ estado: { codigo: 'MAT10', fase: 'pergunta', revision: 2 } });
      return respostaJson({ recibo: { rodada: 1, status: 'confirmado' } });
    });

    await entrarSala({ codigo: 'MAT10', requestId: 'req-entrar', fetcher });
    await obterEstadoSala({ codigo: 'MAT10', fetcher });
    await enviarRespostaSala({
      codigo: 'MAT10',
      rodada: 1,
      requestId: 'req-resp',
      resposta: { alternativaId: 'alt-a' },
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    for (const [, init] of fetcher.mock.calls) {
      expect(init.headers.Authorization).toBeUndefined();
      expect(init.headers['x-user-ai-key']).toBeUndefined();
      expect(init.credentials).toBe('same-origin');
    }
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ requestId: 'req-entrar' });
    expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({
      rodada: 1,
      requestId: 'req-resp',
      resposta: { alternativaId: 'alt-a' },
    });
  });

  it('propaga erro estruturado {error, message} e status HTTP sem perder contexto', async () => {
    const fetcher = vi.fn(async () =>
      respostaJson({ error: 'VERSION_CONFLICT', message: 'A questão foi alterada em outra aba.' }, 409)
    );

    await expect(
      salvarQuestao({
        questao: { id: 'q1', enunciado: 'Editada' },
        expectedRevision: 2,
        requestId: 'req-edit',
        obterToken: async () => 'tok',
        fetcher,
      })
    ).rejects.toMatchObject({
      status: 409,
      code: 'VERSION_CONFLICT',
      message: 'A questão foi alterada em outra aba.',
    });
  });

  it('gera requestId único e não vazio', () => {
    const a = gerarRequestId('resp');
    const b = gerarRequestId('resp');
    expect(a).toMatch(/^resp_/);
    expect(a).not.toBe(b);
  });
});
