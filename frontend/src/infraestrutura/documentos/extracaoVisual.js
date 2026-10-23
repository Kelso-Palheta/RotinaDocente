import { getClientAIHeaders } from '@/utils/aiHeaders';
import { extractTextFromImageVision } from '@/utils/atividades/visionExtractor';

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function requireKey(headers) {
  if (!headers['x-user-ai-key']) {
    throw new Error('AI_KEY_REQUIRED: Conecte sua chave de IA para extrair texto de imagens e páginas escaneadas.');
  }
}

async function transcribe(dataUrl, headers) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error('Imagem inválida para extração.');
  if (match[2].length > 10000000) throw new Error('A imagem excede o limite para extração por IA. Envie uma imagem menor.');
  return extractTextFromImageVision(match[2], { mediaType: match[1], headers, finalidade: 'documento' });
}

async function renderPage(page) {
  const original = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(2, 3000 / Math.max(original.width, original.height)) });
  const canvas = document.createElement('canvas');
  try {
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Pré-analisa páginas antes da visão; preserva a ordem dos PDFs mistos. */
export async function extrairPDFVisual(pdf, options = {}) {
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str || '').join(' ').replace(/\s+/g, ' ').trim();
    pages.push({ page, text, vision: text.length < 50 });
  }
  const visualCount = pages.filter(page => page.vision).length;
  if (visualCount > 10) throw new Error('O PDF excede o limite de 10 páginas para extração por visão. Divida o documento.');
  const headers = options.headers || getClientAIHeaders();
  if (visualCount) requireKey(headers);
  const parts = [];
  for (const item of pages) {
    parts.push(item.vision ? await transcribe(await (options.renderPage || renderPage)(item.page), headers) : item.text);
  }
  return parts.join('\n\n').trim();
}

export async function extrairArquivoPDF(file, options = {}) {
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error('O documento excede o limite de 15MB.');
  if (typeof window === 'undefined') {
    throw new Error('A extração de PDF deve ser realizada no navegador antes do envio ao servidor.');
  }
  const { getPdfjsLib } = await import('@/utils/atividades/pdfExtractor');
  const pdfjs = await getPdfjsLib();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  try {
    return await extrairPDFVisual(pdf, options);
  } finally {
    await pdf.destroy();
  }
}

export async function extrairImagemDocumento(file, options = {}) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error('A imagem excede o limite de 7MB.');
  const ext = file.name?.split('.').pop().toLowerCase();
  const mediaType = IMAGE_TYPES[ext] || (Object.values(IMAGE_TYPES).includes(file.type) ? file.type : null);
  if (!mediaType) throw new Error('Formato de imagem não suportado. Use JPG, PNG ou WebP.');
  const headers = options.headers || getClientAIHeaders();
  requireKey(headers);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('A imagem excede o limite de 7MB.');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return transcribe(`data:${mediaType};base64,${btoa(binary)}`, headers);
}
