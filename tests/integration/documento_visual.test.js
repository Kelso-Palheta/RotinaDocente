import { afterEach, describe, expect, it, vi } from 'vitest';
import { extrairPDFVisual, extrairImagemDocumento } from '../../frontend/src/infraestrutura/documentos/extracaoVisual';
import { extractTextOnly } from '../../frontend/src/lib/redacao/ai-provider';
const headers = { 'x-user-ai-provider': 'gemini', 'x-user-ai-key': 'teste', 'x-user-ai-model': 'gemini-teste' };
const digital = 'Texto digital da página preservado integralmente, incluindo nomes e números 12345.';
const page = text => ({ getTextContent: async () => ({ items: [{ str: text }] }) });
const pdf = texts => ({ numPages: texts.length, getPage: async i => page(texts[i - 1]) });
const fetchText = text => vi.fn(async () => new Response(JSON.stringify({ text }), { status: 200 }));
afterEach(() => vi.unstubAllGlobals());
describe('RN-40: Documentos visuais', () => {
 it('lê PDF digital sem chave e sem chamada de IA', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  expect(await extrairPDFVisual(pdf([digital, digital]), { headers: {} })).toBe(`${digital}\n\n${digital}`);
  expect(fetch).not.toHaveBeenCalled();
 });
 it('transcreve página escaneada entre páginas digitais, na ordem original', async () => {
  const fetch = fetchText('Página fotografada: ANA SILVA 123'); vi.stubGlobal('fetch', fetch);
  const renderPage = vi.fn(async () => 'data:image/jpeg;base64,aW1hZ2Vt');
  expect(await extrairPDFVisual(pdf([digital, '', digital]), { headers, renderPage }))
   .toBe(`${digital}\n\nPágina fotografada: ANA SILVA 123\n\n${digital}`);
  expect(renderPage).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body).finalidade).toBe('documento');
 });
 it('limita páginas visuais antes de renderizar ou chamar IA', async () => {
  const renderPage = vi.fn(); const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  await expect(extrairPDFVisual(pdf(Array(11).fill('')), { headers, renderPage })).rejects.toThrow(/10 páginas/);
  expect(renderPage).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
 });
 it('sem chave recusa visão antes de renderizar', async () => {
  const renderPage = vi.fn();
  await expect(extrairPDFVisual(pdf(['']), { headers: {}, renderPage })).rejects.toThrow(/AI_KEY_REQUIRED/);
  expect(renderPage).not.toHaveBeenCalled();
 });
 it('envia imagem real com finalidade documento e preserva texto', async () => {
  const fetch = fetchText('Livro: Capítulo 2. Exercício 1.'); vi.stubGlobal('fetch', fetch);
  const file = { name: 'livro.png', type: 'image/png', size: 6, arrayBuffer: async () => new TextEncoder().encode('imagem').buffer };
  expect(await extrairImagemDocumento(file, { headers })).toBe('Livro: Capítulo 2. Exercício 1.');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ imageBase64: 'aW1hZ2Vt', mediaType: 'image/png', finalidade: 'documento' });
 });
 it('recusa imagem grande antes de ler bytes', async () => {
  const arrayBuffer = vi.fn();
  await expect(extrairImagemDocumento({ name: 'foto.jpg', size: 8 * 1024 * 1024, arrayBuffer }, { headers })).rejects.toThrow(/7MB/);
  expect(arrayBuffer).not.toHaveBeenCalled();
 });
 it('propaga erro real da visão', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({error:'Cota excedida'}), {status:429})));
  await expect(extrairPDFVisual(pdf(['']), { headers, renderPage: async () => 'data:image/png;base64,aW1hZ2Vt' })).rejects.toThrow(/Cota excedida/);
 });
 it('recusa imagem ilegível sem inventar texto', async () => {
  vi.stubGlobal('fetch', fetchText(''));
  await expect(extrairPDFVisual(pdf(['']), { headers, renderPage: async () => 'data:image/png;base64,aW1hZ2Vt' })).rejects.toThrow(/ler o texto/);
 });
 it('Gemini distingue documento de redação e mantém modelo BYOK', async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({choices:[{message:{content:'ANA SILVA 123'}}]})));
  vi.stubGlobal('fetch', fetch);
  await extractTextOnly('aW1hZ2Vt', 'image/png', {provider:'gemini',apiKey:'teste',model:'gemini-teste'}, { finalidade:'documento' });
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(payload.model).toBe('gemini-teste');
  const prompt = payload.messages[0].content[0].text;
  expect(prompt).toMatch(/nomes.*números/i);
  expect(prompt).not.toMatch(/redação manuscrita|Ignore a numeração/);
 });
});
