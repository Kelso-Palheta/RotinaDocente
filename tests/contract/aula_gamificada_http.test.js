import { beforeEach, describe, expect, it, vi } from 'vitest';
import { criarHandlerAulaGamificada } from '@/infraestrutura/aula-gamificada/httpServidor';

const professor = { tipo: 'professor', uid: 'prof-1' };
const aluno = { tipo: 'aluno', loginKey: 'a'.repeat(64) };

const requisicao = (caminho, { metodo = 'GET', headers = {}, body } = {}) =>
  new Request(`http://localhost/api/aula-gamificada${caminho}`, {
    method: metodo,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const contexto = (partes) => ({ params: Promise.resolve({ partes }) });

describe('contrato HTTP /api/aula-gamificada', () => {
  let service;
  let handler;

  beforeEach(() => {
    service = {
      catalogo: vi.fn(async () => ({ modalidades: [], turmas: [], questoes: [], salas: [] })),
      gerar: vi.fn(async (ator, body, userConfig) => ({ questoes: [{ id: 'q1', userConfig }] })),
      salvarQuestao: vi.fn(async (ator, body) => ({ questao: { id: 'q1', ...body.questao } })),
      revisarQuestao: vi.fn(async () => ({ questao: { id: 'q1', status: 'revisada' } })),
      criarSala: vi.fn(async () => ({ sala: { codigo: 'ABC123', revision: 1 } })),
      entrar: vi.fn(async () => ({ estado: { sala: { codigo: 'ABC123' } } })),
      estado: vi.fn(async () => ({ estado: { sala: { codigo: 'ABC123' } } })),
      comandar: vi.fn(async () => ({ estado: { sala: { codigo: 'ABC123' } } })),
      responder: vi.fn(async () => ({ recibo: { status: 'confirmado' } })),
    };
    const autenticar = async (request) => {
      if (request.headers.get('authorization') === 'Bearer prof') return professor;
      if (request.headers.get('cookie')?.includes('aluno_session=ok')) return aluno;
      throw Object.assign(new Error('Sessão inválida ou expirada.'), { status: 401 });
    };
    handler = criarHandlerAulaGamificada({ service, autenticar });
  });

  it('GET /catalogo devolve o catálogo do docente com cabeçalhos privados', async () => {
    const resposta = await handler(
      requisicao('/catalogo', { headers: { authorization: 'Bearer prof' } }),
      contexto(['catalogo']),
    );

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ modalidades: [], turmas: [], questoes: [], salas: [] });
    expect(resposta.headers.get('cache-control')).toBe('private, no-store');
    expect(resposta.headers.get('x-content-type-options')).toBe('nosniff');
    expect(service.catalogo).toHaveBeenCalledWith(professor);
  });

  it('nega catálogo ao aluno com JSON {error, message}', async () => {
    const resposta = await handler(
      requisicao('/catalogo', { headers: { cookie: 'aluno_session=ok' } }),
      contexto(['catalogo']),
    );
    const corpo = await resposta.json();

    expect(resposta.status).toBe(403);
    expect(corpo.error).toBeTruthy();
    expect(corpo.message).toBeTruthy();
  });

  it('POST /gerar encaminha a configuração BYOK sem devolver a chave', async () => {
    const resposta = await handler(
      requisicao('/gerar', {
        metodo: 'POST',
        headers: {
          authorization: 'Bearer prof',
          'x-user-ai-provider': 'openai',
          'x-user-ai-key': 'sk-teste-secreto',
          'x-user-ai-model': 'gpt-sintetico',
          origin: 'http://localhost',
        },
        body: { disciplina: 'Arte', tipo: 'multipla_escolha' },
      }),
      contexto(['gerar']),
    );

    expect(resposta.status).toBe(200);
    expect(service.gerar).toHaveBeenCalledWith(
      professor,
      { disciplina: 'Arte', tipo: 'multipla_escolha' },
      { provider: 'openai', apiKey: 'sk-teste-secreto', model: 'gpt-sintetico' },
    );
    expect(await resposta.text()).not.toContain('sk-teste-secreto');
  });

  it('mapeia erro público do serviço para {error, message}', async () => {
    service.gerar.mockRejectedValue(
      Object.assign(new Error('Conecte sua chave de IA para gerar questões.'), { status: 400, publica: true }),
    );
    const resposta = await handler(
      requisicao('/gerar', {
        metodo: 'POST',
        headers: { authorization: 'Bearer prof', origin: 'http://localhost' },
        body: { disciplina: 'Arte' },
      }),
      contexto(['gerar']),
    );
    const corpo = await resposta.json();

    expect(resposta.status).toBe(400);
    expect(corpo.error).toMatch(/chave de IA/);
    expect(corpo.message).toMatch(/chave de IA/);
  });

  it('aceita criação de questão, revisão, sala, entrada, estado, comando e resposta', async () => {
    const auth = { authorization: 'Bearer prof', origin: 'http://localhost' };

    const criada = await handler(
      requisicao('/questoes', { metodo: 'POST', headers: auth, body: { questao: { tipo: 'multipla_escolha' }, requestId: 'r1' } }),
      contexto(['questoes']),
    );
    expect(criada.status).toBe(200);
    expect(service.salvarQuestao).toHaveBeenCalledWith(professor, {
      questao: { tipo: 'multipla_escolha' },
      requestId: 'r1',
    });

    const revisada = await handler(
      requisicao('/questoes/q1/revisar', { metodo: 'POST', headers: auth, body: { expectedRevision: 1, requestId: 'r2' } }),
      contexto(['questoes', 'q1', 'revisar']),
    );
    expect(revisada.status).toBe(200);
    expect(service.revisarQuestao).toHaveBeenCalledWith(professor, 'q1', { expectedRevision: 1, requestId: 'r2' });

    const sala = await handler(
      requisicao('/salas', { metodo: 'POST', headers: auth, body: { titulo: 'Sala', requestId: 'r3' } }),
      contexto(['salas']),
    );
    expect(sala.status).toBe(200);
    expect(service.criarSala).toHaveBeenCalledWith(professor, { titulo: 'Sala', requestId: 'r3' });

    const entrada = await handler(
      requisicao('/salas/ABC123/entrar', {
        metodo: 'POST',
        headers: { cookie: 'aluno_session=ok', origin: 'http://localhost' },
        body: { requestId: 'r4' },
      }),
      contexto(['salas', 'ABC123', 'entrar']),
    );
    expect(entrada.status).toBe(200);
    expect(service.entrar).toHaveBeenCalledWith(aluno, 'ABC123', { requestId: 'r4' });

    const estado = await handler(
      requisicao('/salas/ABC123/estado', { headers: { cookie: 'aluno_session=ok' } }),
      contexto(['salas', 'ABC123', 'estado']),
    );
    expect(estado.status).toBe(200);
    expect(service.estado).toHaveBeenCalledWith(aluno, 'ABC123');

    const comando = await handler(
      requisicao('/salas/ABC123/comandos', { metodo: 'POST', headers: auth, body: { acao: 'iniciar', requestId: 'r5' } }),
      contexto(['salas', 'ABC123', 'comandos']),
    );
    expect(comando.status).toBe(200);
    expect(service.comandar).toHaveBeenCalledWith(professor, 'ABC123', { acao: 'iniciar', requestId: 'r5' });

    const respostaAluno = await handler(
      requisicao('/salas/ABC123/respostas', {
        metodo: 'POST',
        headers: { cookie: 'aluno_session=ok', origin: 'http://localhost' },
        body: { rodada: 1, requestId: 'r6', resposta: { alternativaId: 'B' } },
      }),
      contexto(['salas', 'ABC123', 'respostas']),
    );
    expect(respostaAluno.status).toBe(200);
    expect(await respostaAluno.json()).toEqual({ recibo: { status: 'confirmado' } });
  });

  it('nega comando ao aluno e exige origem em POST', async () => {
    const semOrigem = await handler(
      requisicao('/salas/ABC123/comandos', {
        metodo: 'POST',
        headers: { authorization: 'Bearer prof' },
        body: { acao: 'iniciar' },
      }),
      contexto(['salas', 'ABC123', 'comandos']),
    );
    expect(semOrigem.status).toBe(403);

    const origemErrada = await handler(
      requisicao('/salas/ABC123/comandos', {
        metodo: 'POST',
        headers: { authorization: 'Bearer prof', origin: 'https://outro.example' },
        body: { acao: 'iniciar' },
      }),
      contexto(['salas', 'ABC123', 'comandos']),
    );
    expect(origemErrada.status).toBe(403);

    const alunoComandando = await handler(
      requisicao('/salas/ABC123/comandos', {
        metodo: 'POST',
        headers: { cookie: 'aluno_session=ok', origin: 'http://localhost' },
        body: { acao: 'iniciar' },
      }),
      contexto(['salas', 'ABC123', 'comandos']),
    );
    expect(alunoComandando.status).toBe(403);
    expect(service.comandar).not.toHaveBeenCalled();
  });

  it('devolve 404 para rota desconhecida, 405 para método inválido e 401 sem sessão', async () => {
    const desconhecida = await handler(
      requisicao('/desconhecida', { headers: { authorization: 'Bearer prof' } }),
      contexto(['desconhecida']),
    );
    expect(desconhecida.status).toBe(404);

    const metodo = await handler(
      requisicao('/catalogo', { metodo: 'PUT', headers: { authorization: 'Bearer prof' } }),
      contexto(['catalogo']),
    );
    expect(metodo.status).toBe(405);

    const semSessao = await handler(requisicao('/catalogo'), contexto(['catalogo']));
    expect(semSessao.status).toBe(401);
  });

  it('rejeita JSON inválido e corpo grande com status adequado', async () => {
    const invalido = await handler(
      new Request('http://localhost/api/aula-gamificada/questoes', {
        method: 'POST',
        headers: { authorization: 'Bearer prof', origin: 'http://localhost', 'content-type': 'application/json' },
        body: '{',
      }),
      contexto(['questoes']),
    );
    expect(invalido.status).toBe(400);

    const grande = await handler(
      requisicao('/gerar', {
        metodo: 'POST',
        headers: { authorization: 'Bearer prof', origin: 'http://localhost' },
        body: { textoMaterial: 'x'.repeat(600_000) },
      }),
      contexto(['gerar']),
    );
    expect(grande.status).toBe(413);
  });
});
