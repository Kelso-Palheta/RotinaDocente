import { getClientAIHeaders } from '@/utils/aiHeaders';

/**
 * RN-47: Transcrição de redação manuscrita via modelo de visão (rota /api/extrair).
 * O Tesseract.js (OCR de texto impresso) não é usado aqui — ele não lê caligrafia.
 */

export function getMediaTypeFromDataUrl(dataUrl) {
  const match = /^data:([^;,]+)/i.exec(String(dataUrl || ''));
  return match ? match[1] : 'image/jpeg';
}

/**
 * Envia a imagem da redação para a rota /api/extrair e devolve o texto transcrito.
 * @param {string} imageBase64 Imagem sem o prefixo `data:...;base64,`.
 * @param {{ mediaType?: string, headers?: Record<string,string> }} [options]
 * @returns {Promise<string>} Texto transcrito, sem espaços nas bordas.
 */
export async function extractTextFromImageVision(imageBase64, options = {}) {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('Nenhuma imagem de redação foi selecionada para extração.');
  }

  const headers = options.headers || getClientAIHeaders();
  if (!headers['x-user-ai-key']) {
    throw new Error(
      'AI_KEY_REQUIRED: Conecte sua chave de IA nas configurações para transcrever a redação manuscrita.'
    );
  }

  const res = await fetch('/api/extrair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      imageBase64,
      mediaType: options.mediaType || 'image/jpeg',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Não foi possível extrair o texto desta imagem.');
  }

  const text = String(data.text || '').trim();
  if (!text) {
    throw new Error(
      'Não foi possível ler o texto da imagem. Tente uma foto mais nítida, bem iluminada e sem sombras.'
    );
  }
  return text;
}

const MAX_VISION_PAGES = 10;

async function renderPageToDataUrl(page) {
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Processa um documento PDF já carregado (RN-47):
 * 1. Tenta a camada de texto digital (PDF gerado no computador) — sem IA;
 * 2. Se escaneado/manuscrito (texto insuficiente), renderiza cada página e
 *    transcreve pela visão de IA, uma chamada por página.
 * @param {{ numPages: number, getPage: (i:number)=>Promise<any> }} pdf
 * @param {{ headers?: Record<string,string>, maxPages?: number, renderPage?: (page:any)=>Promise<string> }} [options]
 * @returns {Promise<string>}
 */
export async function extractTextFromPDFDocument(pdf, options = {}) {
  const textParts = [];
  let totalChars = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) {
      textParts.push(text);
      totalChars += text.length;
    }
  }

  if (totalChars >= 50) return textParts.join('\n\n');

  const maxPages = options.maxPages ?? MAX_VISION_PAGES;
  if (pdf.numPages > maxPages) {
    throw new Error(
      `PDF escaneado com ${pdf.numPages} páginas excede o limite de ${maxPages} páginas para transcrição por IA. Envie apenas as páginas da redação.`
    );
  }

  const headers = options.headers || getClientAIHeaders();
  if (!headers['x-user-ai-key']) {
    throw new Error(
      'AI_KEY_REQUIRED: Conecte sua chave de IA nas configurações para transcrever a redação manuscrita.'
    );
  }

  const renderPage = options.renderPage || renderPageToDataUrl;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    pages.push(await renderPage(await pdf.getPage(i)));
  }

  const transcricoes = [];
  for (const dataUrl of pages) {
    const base64 = String(dataUrl).split(',')[1] || '';
    transcricoes.push(
      await extractTextFromImageVision(base64, {
        mediaType: getMediaTypeFromDataUrl(dataUrl),
        headers,
      })
    );
  }

  const texto = transcricoes.join('\n\n').trim();
  if (!texto) {
    throw new Error(
      'Não foi possível ler o texto do PDF. Tente um arquivo mais nítido, bem iluminado e sem sombras.'
    );
  }
  return texto;
}

/**
 * Carrega um arquivo PDF e delega para extractTextFromPDFDocument.
 * @param {File|{arrayBuffer:()=>Promise<ArrayBuffer>}} file
 * @param {Parameters<typeof extractTextFromPDFDocument>[1]} [options]
 */
export async function extractTextFromPDFWithVision(file, options = {}) {
  const { getPdfjsLib } = await import('./pdfExtractor');
  const pdfjsLib = await getPdfjsLib();
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  return extractTextFromPDFDocument(pdf, options);
}
