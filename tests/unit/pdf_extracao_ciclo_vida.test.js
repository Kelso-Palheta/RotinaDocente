import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), vision: vi.fn() }));
vi.mock('@/utils/atividades/pdfExtractor', () => ({ getPdfjsLib: async () => ({ getDocument: mocks.getDocument }) }));
vi.mock('@/utils/atividades/visionExtractor', () => ({ extractTextFromImageVision: mocks.vision }));
import { extrairArquivoPDF } from '@/infraestrutura/documentos/extracaoVisual';
const texto = 'Conteúdo digital de Arte com mais de cinquenta caracteres para extração direta sem IA.';
const file = { size: 100, arrayBuffer: async () => new ArrayBuffer(100) };
let destroy;
beforeEach(() => { vi.stubGlobal('window', {}); vi.clearAllMocks(); destroy = vi.fn(async () => {}); });
afterEach(() => vi.unstubAllGlobals());
function carregar(text = texto) {
  // Contrato PDF.js 6: destroy pertence à tarefa, não a PDFDocumentProxy.
  const pdf = { numPages: 1, getPage: async () => ({ getTextContent: async () => ({ items: [{ str: text }] }) }) };
  mocks.getDocument.mockReturnValue({ promise: Promise.resolve(pdf), destroy });
  return pdf;
}
describe('extração PDF: ciclo de vida da tarefa PDF.js 6', () => {
  it('entrega texto digital e libera worker pela tarefa', async () => {
    carregar();
    await expect(extrairArquivoPDF(file, { headers: {} })).resolves.toBe(texto);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(mocks.vision).not.toHaveBeenCalled();
  });
  it('entrega transcrição de PDF escaneado e libera worker', async () => {
    carregar(''); mocks.vision.mockResolvedValue('Texto transcrito da imagem.');
    await expect(extrairArquivoPDF(file, { headers: { 'x-user-ai-key': 'sintetica' }, renderPage: async () => 'data:image/png;base64,YQ==' })).resolves.toBe('Texto transcrito da imagem.');
    expect(destroy).toHaveBeenCalledTimes(1);
  });
  it('preserva erro de extração sem mascará-lo com destroy inexistente', async () => {
    carregar('');
    await expect(extrairArquivoPDF(file, { headers: {} })).rejects.toThrow('AI_KEY_REQUIRED');
    expect(destroy).toHaveBeenCalledTimes(1);
  });
  it('libera tarefa também quando o carregamento falha', async () => {
    mocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error('PDF inválido')), destroy });
    await expect(extrairArquivoPDF(file, { headers: {} })).rejects.toThrow('PDF inválido');
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
