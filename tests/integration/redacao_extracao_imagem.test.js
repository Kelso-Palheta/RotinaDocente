import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../frontend/src/lib/redacao/ai-provider', () => ({
  extractTextOnly: vi.fn(async () => 'É um problema quase invisível na atualidade.'),
}));

import {
  extractTextFromImageVision,
  extractTextFromPDFDocument,
  getMediaTypeFromDataUrl,
} from '../../frontend/src/utils/atividades/visionExtractor';
import { extractTextOnly } from '../../frontend/src/lib/redacao/ai-provider';

const AI_HEADERS = {
  'x-user-ai-provider': 'gemini',
  'x-user-ai-key': 'AIzaSyFakeKeyParaTeste',
  'x-user-ai-model': 'gemini-1.5-flash',
};

const ORIGINAL_FETCH = globalThis.fetch;

describe('IT-09 (RN-47): Transcrição de redação manuscrita via visão de IA', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    vi.unstubAllGlobals();
  });

  describe('getMediaTypeFromDataUrl', () => {
    it('deve derivar o media type do data URL', () => {
      expect(getMediaTypeFromDataUrl('data:image/png;base64,iVBORw0')).toBe('image/png');
      expect(getMediaTypeFromDataUrl('data:image/webp;base64,UklGR')).toBe('image/webp');
    });

    it('deve retornar image/jpeg como padrão quando o data URL é inválido', () => {
      expect(getMediaTypeFromDataUrl('')).toBe('image/jpeg');
      expect(getMediaTypeFromDataUrl(null)).toBe('image/jpeg');
      expect(getMediaTypeFromDataUrl('sem-data-url')).toBe('image/jpeg');
    });
  });

  describe('extractTextFromImageVision (cliente → POST /api/extrair)', () => {
    it('deve enviar a imagem em base64 com os headers BYOK e retornar o texto transcrito', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: '  Transcrição fiel da redação manuscrita.  ' }),
      });
      globalThis.fetch = mockFetch;

      const texto = await extractTextFromImageVision('aW1hZ2VtYW51c2NyaXRh', {
        mediaType: 'image/jpeg',
        headers: AI_HEADERS,
      });

      expect(texto).toBe('Transcrição fiel da redação manuscrita.');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('/api/extrair');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['x-user-ai-provider']).toBe('gemini');
      expect(options.headers['x-user-ai-key']).toBe('AIzaSyFakeKeyParaTeste');

      const body = JSON.parse(options.body);
      expect(body.imageBase64).toBe('aW1hZ2VtYW51c2NyaXRh');
      expect(body.mediaType).toBe('image/jpeg');
    });

    it('deve usar a chave BYOK do professor persistida no localStorage quando nenhum header for informado', async () => {
      vi.stubGlobal('localStorage', {
        getItem: (key) =>
          key === 'rotina_docente_user_ai_config'
            ? JSON.stringify({
                provider: 'openai',
                apiKey: 'sk-proj-FakeKeyLocalStorage',
                model: 'gpt-4o',
              })
            : null,
        setItem: () => {},
        removeItem: () => {},
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: 'Texto transcrito pela visão.' }),
      });
      globalThis.fetch = mockFetch;

      const texto = await extractTextFromImageVision('Zm90b2RlZm9saGE=');

      expect(texto).toBe('Texto transcrito pela visão.');
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['x-user-ai-provider']).toBe('openai');
      expect(options.headers['x-user-ai-key']).toBe('sk-proj-FakeKeyLocalStorage');
      expect(options.headers['x-user-ai-model']).toBe('gpt-4o');
      expect(JSON.parse(options.body).mediaType).toBe('image/jpeg');
    });

    it('deve recusar a extração com AI_KEY_REQUIRED e não chamar a rota quando não há chave configurada', async () => {
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;

      await expect(
        extractTextFromImageVision('aW1hZ2VtYW51c2NyaXRh', { headers: {} })
      ).rejects.toThrowError(/AI_KEY_REQUIRED/);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve propagar o erro da rota quando a extração falha', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'O modelo de visão retornou um erro.' }),
      });
      globalThis.fetch = mockFetch;

      await expect(
        extractTextFromImageVision('aW1hZ2VtYW51c2NyaXRh', { headers: AI_HEADERS })
      ).rejects.toThrowError(/O modelo de visão retornou um erro\./);
    });

    it('deve falhar com mensagem orientativa quando a rota retorna texto vazio', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: '   ' }),
      });
      globalThis.fetch = mockFetch;

      await expect(
        extractTextFromImageVision('aW1hZ2VtYW51c2NyaXRh', { headers: AI_HEADERS })
      ).rejects.toThrowError(/não foi possível ler o texto/i);
    });
  });

  describe('Rota POST /api/extrair', () => {
    it('deve retornar 400 AI_KEY_REQUIRED quando a requisição não traz a chave do professor', async () => {
      const { POST } = await import('../../frontend/src/app/api/extrair/route');

      const req = new Request('http://localhost/api/extrair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'aW1hZ2VtYW51c2NyaXRh' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('AI_KEY_REQUIRED');
    });

    it('deve retornar 400 quando a imagem em base64 não é informada', async () => {
      const { POST } = await import('../../frontend/src/app/api/extrair/route');

      const req = new Request('http://localhost/api/extrair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AI_HEADERS },
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(String(json.error)).toMatch(/base64/i);
    });

    it('deve transcrever a imagem com a visão e devolver o texto com 200', async () => {
      extractTextOnly.mockResolvedValueOnce('Linha 1 da redação manuscrita.');

      const { POST } = await import('../../frontend/src/app/api/extrair/route');

      const req = new Request('http://localhost/api/extrair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AI_HEADERS },
        body: JSON.stringify({ imageBase64: 'aW1hZ2VtYW51c2NyaXRh', mediaType: 'image/png' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.text).toBe('Linha 1 da redação manuscrita.');

      expect(extractTextOnly).toHaveBeenCalledTimes(1);
      const [base64, mediaType, userConfig] = extractTextOnly.mock.calls[0];
      expect(base64).toBe('aW1hZ2VtYW51c2NyaXRh');
      expect(mediaType).toBe('image/png');
      expect(userConfig).toMatchObject({
        provider: 'gemini',
        apiKey: 'AIzaSyFakeKeyParaTeste',
        model: 'gemini-1.5-flash',
      });
    });

    it('deve devolver 400 com AI_KEY_REQUIRED quando extractTextOnly sinaliza chave ausente', async () => {
      extractTextOnly.mockRejectedValueOnce(
        new Error('AI_KEY_REQUIRED: Você precisa conectar sua chave de IA.')
      );

      const { POST } = await import('../../frontend/src/app/api/extrair/route');

      const req = new Request('http://localhost/api/extrair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AI_HEADERS },
        body: JSON.stringify({ imageBase64: 'aW1hZ2VtYW51c2NyaXRh' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('AI_KEY_REQUIRED');
    });
  });

  describe('extractTextFromPDFDocument (PDF de redação)', () => {
    const makePdf = (pages) => ({
      numPages: pages.length,
      getPage: async (index) => pages[index - 1],
    });

    const digitalPage = (str) => ({
      getTextContent: async () => ({ items: [{ str }] }),
    });

    const scannedPage = {
      getTextContent: async () => ({ items: [] }),
    };

    it('deve usar a camada de texto digital sem acionar a visão de IA', async () => {
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;

      const pdf = makePdf([
        digitalPage('Redação digital sobre o tema das apostas online na atualidade.'),
        digitalPage('Segunda página digital com conteúdo extra.'),
      ]);

      const texto = await extractTextFromPDFDocument(pdf, { headers: AI_HEADERS });

      expect(texto).toContain('apostas online');
      expect(texto).toContain('Segunda página digital');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve renderizar e transcrever cada página pela visão quando o PDF não tem camada de texto', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ text: 'Transcrição da página 1.' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ text: 'Transcrição da página 2.' }),
        });
      globalThis.fetch = mockFetch;

      const renderPage = vi.fn(async () => 'data:image/jpeg;base64,cGFnZQ==');
      const pdf = makePdf([scannedPage, scannedPage]);

      const texto = await extractTextFromPDFDocument(pdf, {
        headers: AI_HEADERS,
        renderPage,
      });

      expect(renderPage).toHaveBeenCalledTimes(2);
      expect(texto).toBe('Transcrição da página 1.\n\nTranscrição da página 2.');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['x-user-ai-key']).toBe('AIzaSyFakeKeyParaTeste');
      const body = JSON.parse(options.body);
      expect(body.imageBase64).toBe('cGFnZQ==');
      expect(body.mediaType).toBe('image/jpeg');
    });

    it('deve recusar PDF escaneado sem chave de IA (AI_KEY_REQUIRED) antes de renderizar', async () => {
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;
      const renderPage = vi.fn(async () => 'data:image/jpeg;base64,cGFnZQ==');
      const pdf = makePdf([scannedPage]);

      await expect(
        extractTextFromPDFDocument(pdf, { headers: {}, renderPage })
      ).rejects.toThrowError(/AI_KEY_REQUIRED/);

      expect(renderPage).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve rejeitar PDF escaneado acima do limite de páginas antes de gastar chamadas de IA', async () => {
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;
      const renderPage = vi.fn(async () => 'data:image/jpeg;base64,cGFnZQ==');
      const pdf = makePdf(Array.from({ length: 11 }, () => scannedPage));

      await expect(
        extractTextFromPDFDocument(pdf, { headers: AI_HEADERS, renderPage })
      ).rejects.toThrowError(/limite de 10 páginas/i);

      expect(renderPage).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve falhar com mensagem orientativa quando nenhuma página escaneada retorna texto', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: '   ' }),
      });
      globalThis.fetch = mockFetch;
      const renderPage = vi.fn(async () => 'data:image/jpeg;base64,cGFnZQ==');
      const pdf = makePdf([scannedPage]);

      await expect(
        extractTextFromPDFDocument(pdf, { headers: AI_HEADERS, renderPage })
      ).rejects.toThrowError(/não foi possível ler/i);
    });
  });
});
