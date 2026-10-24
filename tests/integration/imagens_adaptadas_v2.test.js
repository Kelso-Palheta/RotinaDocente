import { describe, it, expect, vi, afterEach } from 'vitest';
import sharp from '../../frontend/node_modules/sharp/lib/index.js';
import { POST } from '../../frontend/src/app/api/adaptacoes/imagem/route.js';
const verificar = async (request) => (await import('../../frontend/src/app/api/adaptacoes/verificar-imagem/route.js')).POST(request);

const base = { versaoVisual: 2, modoVisual: 'criar', enunciado: 'Conte três maçãs.', descricaoApoio: 'Três maçãs.', planoVisual: { descricao: 'Três maçãs', elementosObrigatorios: 'exatamente três maçãs', restricoes: 'sem extras', larguraCm: 10 } };
const req = (body, provider = 'gemini', key = 'secreta') => new Request('http://localhost/api/adaptacoes/imagem', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-ai-provider': provider, ...(key ? { 'x-user-ai-key': key } : {}) }, body: JSON.stringify(body) });
const png = async (width = 1500) => `data:image/png;base64,${(await sharp({ create: { width, height: width, channels: 3, background: 'white' } }).png().toBuffer()).toString('base64')}`;
const resposta = (image) => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: image.split(',')[1] } }] } }] }) });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('RN-72 API imagem v2', () => {
  it('gera com Gemini, resolução explícita, hash e revisão pendente', async () => {
    const fetchMock = vi.fn().mockResolvedValue(resposta(await png())); vi.stubGlobal('fetch', fetchMock);
    const res = await POST(req(base)); const json = await res.json();
    expect(res.status).toBe(200); expect(json.status).toBe('pendente'); expect(json.metadados).toMatchObject({ width: 1500, height: 1500, mime: 'image/png' }); expect(json.metadados.sha256).toMatch(/^[a-f0-9]{64}$/);
    const [url, options] = fetchMock.mock.calls[0]; expect(url).toContain('generativelanguage.googleapis.com'); expect(url).not.toContain('secreta'); expect(options.headers['x-goog-api-key']).toBe('secreta'); expect(options.signal).toBeTruthy();
    const payload = JSON.parse(options.body); expect(payload.generationConfig.imageConfig).toMatchObject({ imageSize: '2K', aspectRatio: '1:1' }); expect(payload.contents[0].parts[0].text).toContain('exatamente três maçãs');
  });
  it('adapta enviando pixels originais', async () => {
    const image = await png(); const fetchMock = vi.fn().mockResolvedValue(resposta(image)); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(req({ ...base, modoVisual: 'adaptar', referenciaOriginal: image }))).status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts).toContainEqual({ inlineData: { mimeType: 'image/png', data: image.split(',')[1] } });
  });
  it('mantém sem gerar e exige original para adaptar', async () => {
    const image = await png(); const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(req({ ...base, modoVisual: 'manter', referenciaOriginal: image }))).status).toBe(200); expect(fetchMock).not.toHaveBeenCalled();
    expect((await POST(req({ ...base, modoVisual: 'adaptar' }))).status).toBe(400);
  });
  it('recusa PNG inválido e resultado pequeno', async () => {
    for (const image of ['data:image/png;base64,aW52YWxpZA==', await png(1)]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(image)));
      expect((await POST(req(base))).status).toBe(422);
    }
  });
  it('exige chave e Gemini, sem fallback nem vazamento de erro', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'segredo secreta' }); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(req(base, 'gemini', ''))).status).toBe(400); expect((await POST(req(base, 'openai'))).status).toBe(400);
    const res = await POST(req(base)); expect(res.status).toBe(502); expect(JSON.stringify(await res.json())).not.toMatch(/segredo|secreta/); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('verifica pixels com parecer auxiliar sem aprovação', async () => {
    const image = await png(); const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ problemas: ['Há quatro maçãs'], descricaoObservada: 'Quatro maçãs.', parecer: 'revisar' }) } }] }) }); vi.stubGlobal('fetch', fetchMock);
    const res = await verificar(req({ ...base, imagemUrl: image })); const json = await res.json(); expect(res.status).toBe(200); expect(json).toMatchObject({ parecer: 'revisar', status: 'pendente', problemas: ['Há quatro maçãs'] }); expect(json.aprovado).not.toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[1].content).toContainEqual({ type: 'image_url', image_url: { url: image } });
  });
  it('recusa parecer sem estrutura', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'Tudo ótimo!' } }] }) }));
    expect((await verificar(req({ ...base, imagemUrl: await png() }))).status).toBe(502);
  });
  it('encerra verificação que excede o orçamento de tempo', async () => {
    const image = await png();
    const fetchMock = vi.fn(() => new Promise(() => {})); vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    try {
      const pending = verificar(req({ ...base, imagemUrl: image }));
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
      await vi.advanceTimersByTimeAsync(60000);
      expect((await pending).status).toBe(504);
    } finally { vi.useRealTimers(); }
  });
  it('rejeita original remoto sem buscá-lo e formato MIME falso', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(req({ ...base, modoVisual: 'adaptar', referenciaOriginal: 'http://127.0.0.1/admin' }))).status).toBe(422);
    expect((await POST(req({ ...base, modoVisual: 'adaptar', referenciaOriginal: (await png()).replace('image/png', 'image/jpeg') }))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
