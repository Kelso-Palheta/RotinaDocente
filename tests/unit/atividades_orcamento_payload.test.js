import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/aiHeaders', () => ({
  getClientAIHeaders: () => ({
    'x-user-ai-provider': 'gemini',
    'x-user-ai-key': 'chave-teste',
    'x-user-ai-model': 'gemini-modelo-configurado',
  }),
}));

vi.mock('@/lib/ai-provider-central', () => ({
  extractUserAIConfigFromHeaders: headers => (headers?.get?.('x-user-ai-key')
    ? { provider: headers.get('x-user-ai-provider') || 'gemini', apiKey: headers.get('x-user-ai-key') }
    : null),
  callAIRaw: vi.fn(async () => ({
    ok: true,
    status: 200,
    data: { choices: [{ message: { content: '{"nota":1}' } }] },
  })),
}));

import { LIMITES_PAYLOAD_IA, medirPayload, validarPayloadIA } from '../../frontend/src/dominio/atividades/orcamentoPayloadIA';
import { selecionarImagensCorrecao, truncarResposta } from '../../frontend/src/aplicacao/atividades/orcamentoCorrecao';
import { corrigirAtividade } from '../../frontend/src/utils/atividades/correcaoIA';
import { POST } from '../../frontend/src/app/api/maritaca/route';
import { callAIRaw } from '../../frontend/src/lib/ai-provider-central';

const imagem = (tamanho, mime = 'image/jpeg') => ({
  base64: `data:${mime};base64,${'A'.repeat(tamanho)}`,
});

const requisicao = ({ imagens = [], texto = 'Corrija a resposta.' } = {}) => ({
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: texto },
      ...imagens.map(url => ({ type: 'image_url', image_url: { url } })),
    ],
  }],
  response_format: { type: 'json_object' },
});

const respostaNota = () => ({
  ok: true,
  json: async () => ({ choices: [{ message: { content: JSON.stringify({ nota: 1, feedback: 'Adequado', criterios: [] }) } }] }),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('UT-56 (RN-77): orçamento de payload do gateway de IA', () => {
  it('aceita imagem realista de questão (~300 KB em base64)', () => {
    const body = requisicao({ imagens: [imagem(300_000).base64] });
    const resultado = validarPayloadIA(body);
    expect(resultado.ok).toBe(true);
    expect(resultado.caracteres).toBe(medirPayload(body));
  });

  it('recusa total acima de 4 MB declarando total e limite', () => {
    const body = requisicao({ imagens: Array.from({ length: 4 }, () => imagem(1_100_000).base64) });
    const resultado = validarPayloadIA(body);
    expect(resultado.ok).toBe(false);
    expect(resultado.erro).toMatch(/total/i);
    expect(resultado.erro).toMatch(/4 MB/);
  });

  it('recusa imagem acima de 1,6 MB nomeando imagem e limite', () => {
    const body = requisicao({ imagens: [imagem(100).base64, imagem(1_700_000).base64] });
    const resultado = validarPayloadIA(body);
    expect(resultado.ok).toBe(false);
    expect(resultado.erro).toMatch(/imagem 2/i);
    expect(resultado.erro).toMatch(/1,6 MB/);
  });

  it('recusa mais de 4 imagens por mensagem', () => {
    const body = requisicao({ imagens: Array.from({ length: 5 }, () => imagem(100).base64) });
    const resultado = validarPayloadIA(body);
    expect(resultado.ok).toBe(false);
    expect(resultado.erro).toMatch(/5 imagens/);
    expect(resultado.erro).toMatch(/4 imagens/);
  });

  it('recusa texto acima de 60.000 caracteres', () => {
    const body = requisicao({ texto: 'x'.repeat(60_001) });
    const resultado = validarPayloadIA(body);
    expect(resultado.ok).toBe(false);
    expect(resultado.erro).toMatch(/texto/i);
    expect(resultado.erro).toMatch(/60\.000/);
  });
});

describe('UT-57 (RN-77): seleção de imagens para correção', () => {
  it('mantém imagem que já cabe e reduz apenas a excedente', async () => {
    const reduzir = vi.fn(async () => imagem(1_000).base64);
    const resultado = await selecionarImagensCorrecao(
      [imagem(100), imagem(900_000)],
      { alvoPorImagem: 700_000, orcamentoCaracteres: 3_000_000, reduzir },
    );
    expect(reduzir).toHaveBeenCalledTimes(1);
    expect(resultado.imagens).toHaveLength(2);
    expect(resultado.imagens[0].url).toBe(imagem(100).base64);
    expect(resultado.imagens[1].url.length).toBe(imagem(1_000).base64.length);
    expect(resultado.omitidas).toBe(0);
    expect(resultado.semImagem).toBe(false);
  });

  it('omite imagem que não cabe nem após redução', async () => {
    const resultado = await selecionarImagensCorrecao(
      [imagem(900_000)],
      { alvoPorImagem: 700_000, orcamentoCaracteres: 3_000_000, reduzir: async () => null },
    );
    expect(resultado.imagens).toHaveLength(0);
    expect(resultado.omitidas).toBe(1);
    expect(resultado.semImagem).toBe(true);
  });

  it('respeita o máximo de 4 imagens por requisição', async () => {
    const resultado = await selecionarImagensCorrecao(
      Array.from({ length: 6 }, () => imagem(100)),
      { orcamentoCaracteres: 3_000_000 },
    );
    expect(resultado.imagens).toHaveLength(LIMITES_PAYLOAD_IA.maxImagensPorMensagem);
    expect(resultado.omitidas).toBe(2);
  });

  it('omite imagens que estouram o orçamento restante do prompt', async () => {
    const resultado = await selecionarImagensCorrecao(
      [imagem(600), imagem(600)],
      { orcamentoCaracteres: 1_000 },
    );
    expect(resultado.imagens).toHaveLength(1);
    expect(resultado.omitidas).toBe(1);
  });
});

describe('UT-58 (RN-77): resposta longa', () => {
  it('trunca em 20.000 caracteres com marcação explícita', () => {
    const { texto, truncada } = truncarResposta('a'.repeat(20_050));
    expect(truncada).toBe(true);
    expect(texto.startsWith('a'.repeat(20_000))).toBe(true);
    expect(texto).toMatch(/truncada/i);
  });

  it('não altera resposta curta', () => {
    expect(truncarResposta('Resposta curta.')).toEqual({ texto: 'Resposta curta.', truncada: false });
  });
});

describe('UT-59 (RN-77): correção com imagem realista e omissão declarada', () => {
  it('conclui correção com imagem de ~300 KB de base64', async () => {
    const fetcher = vi.fn(async () => respostaNota());
    vi.stubGlobal('fetch', fetcher);

    const url = imagem(300_000).base64;
    const resultado = await corrigirAtividade({
      questoes: [{ id: 'q1', tipo: 'discursiva', enunciado: 'Leia o gráfico.', notaMaxima: 2, imagens: [{ base64: url }] }],
      respostas: { q1: { resposta: 'A curva sobe.' } },
    });

    expect(resultado.notaFinal).toBe(1);
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain(url);
    expect(resultado.avisos).toEqual([]);
  });

  it('corrige sem as imagens excedentes e declara a omissão', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaNota()));

    const resultado = await corrigirAtividade({
      questoes: [{
        id: 'q1', tipo: 'discursiva', enunciado: 'Analise as imagens.', notaMaxima: 2,
        imagens: Array.from({ length: 6 }, () => ({ base64: imagem(200).base64 })),
      }],
      respostas: { q1: { resposta: 'Texto.' } },
    });

    expect(resultado.resultados.q1.imagensOmitidas).toBe(2);
    expect(resultado.resultados.q1.semImagem).toBe(false);
    expect(resultado.resultados.q1.avisoCorrecao).toMatch(/2 imagens/i);
    expect(resultado.avisos).toHaveLength(1);
  });
});

describe('UT-60 (RN-77): rota /api/maritaca aceita imagem e recusa excesso', () => {
  const montarRequest = body => new Request('http://localhost/api/maritaca', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-ai-provider': 'gemini', 'x-user-ai-key': 'chave-teste' },
    body: JSON.stringify(body),
  });

  it('aceita imagem de ~300 KB e chama o provedor', async () => {
    const res = await POST(montarRequest(requisicao({ imagens: [imagem(300_000).base64] })));
    expect(res.status).toBe(200);
    expect(callAIRaw).toHaveBeenCalledTimes(1);
  });

  it('recusa imagem de 8 MB com 400 nomeando imagem e limite, sem chamar o provedor', async () => {
    const res = await POST(montarRequest(requisicao({ imagens: [imagem(8_000_000).base64] })));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/imagem 1/i);
    expect(json.error).toMatch(/1,6 MB/);
    expect(callAIRaw).not.toHaveBeenCalled();
  });
});
