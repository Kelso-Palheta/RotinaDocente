import * as xlsx from 'xlsx';
import { extractTextFromPDF as extractFromPdfJs } from './pdfExtractor';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * Extrai texto bruto e parágrafos de um arquivo Word (.docx ou .doc)
 * utilizando o parser isomórfico CFB / OpenXML do SheetJS.
 *
 * @param {File|Blob|Buffer|ArrayBuffer} fileOrBuffer
 * @returns {Promise<string>}
 */
export async function extractTextFromDocx(fileOrBuffer) {
  try {
    let bytes;
    if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
      const ab = await fileOrBuffer.arrayBuffer();
      bytes = new Uint8Array(ab);
    } else if (fileOrBuffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(fileOrBuffer);
    } else if (fileOrBuffer instanceof Uint8Array) {
      bytes = fileOrBuffer;
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(fileOrBuffer)) {
      bytes = new Uint8Array(fileOrBuffer.buffer, fileOrBuffer.byteOffset, fileOrBuffer.byteLength);
    } else {
      throw new Error('Formato de entrada para extração de Word inválido.');
    }

    // Leitura via CFB (Compound File Binary Format / Zip)
    const cfb = xlsx.CFB.read(bytes, { type: 'array' });

    // Localizar a parte de documento XML principal
    const entry =
      xlsx.CFB.find(cfb, 'word/document.xml') ||
      xlsx.CFB.find(cfb, 'document.xml') ||
      (cfb.FileIndex &&
        cfb.FileIndex.find((f) => f.name && f.name.toLowerCase().endsWith('document.xml')));

    if (!entry || !entry.content) {
      // Verificar se é formato DOC binário legado (Word 97-2003)
      const docEntry =
        xlsx.CFB.find(cfb, 'WordDocument') ||
        (cfb.FileIndex && cfb.FileIndex.find((f) => f.name === 'WordDocument'));

      if (docEntry && docEntry.content) {
        const rawBytes = new Uint8Array(docEntry.content);
        // Extração de caracteres legíveis do stream binário
        const chars = [];
        for (let i = 0; i < rawBytes.length; i++) {
          const code = rawBytes[i];
          if ((code >= 32 && code <= 126) || code === 10 || code === 13 || (code >= 192 && code <= 255)) {
            chars.push(String.fromCharCode(code));
          } else if (code === 0 && chars.length > 0 && chars[chars.length - 1] !== ' ') {
            chars.push(' ');
          }
        }
        const textDoc = chars.join('').replace(/\s+/g, ' ').trim();
        if (textDoc.length > 20) return textDoc;
      }

      throw new Error('Não foi possível localizar o conteúdo de texto no arquivo Word.');
    }

    // Decodificar conteúdo XML
    let xmlStr = '';
    if (typeof TextDecoder !== 'undefined') {
      xmlStr = new TextDecoder('utf-8').decode(entry.content);
    } else if (typeof Buffer !== 'undefined') {
      xmlStr = Buffer.from(entry.content).toString('utf8');
    } else {
      xmlStr = String.fromCharCode.apply(null, new Uint8Array(entry.content));
    }

    // Normalizar quebras de linha e tabulações dentro de parágrafos
    const normalizedXml = xmlStr
      .replace(/<w:br[^>]*\/>/gi, '\n')
      .replace(/<w:cr[^>]*\/>/gi, '\n')
      .replace(/<w:tab[^>]*\/>/gi, '\t');

    // Separar por parágrafos (<w:p>)
    const paragraphs = normalizedXml.split(/<\/w:p>/gi);
    const resultParagraphs = [];

    for (const p of paragraphs) {
      const textPieces = [];
      const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/gi;
      let match;
      while ((match = textRegex.exec(p)) !== null) {
        textPieces.push(match[1]);
      }
      const paragraphText = textPieces.join('').trim();
      if (paragraphText) {
        resultParagraphs.push(paragraphText);
      }
    }

    const finalResult = resultParagraphs.join('\n\n').trim();
    if (!finalResult) {
      throw new Error('O arquivo Word está vazio ou sem conteúdo textual reconhecível.');
    }

    return finalResult;
  } catch (err) {
    throw new Error(
      `Não foi possível processar o arquivo Word. Verifique se o arquivo não está corrompido ou protegido por senha. (${err.message})`
    );
  }
}

/**
 * Extrai texto de arquivo PDF utilizando pdfjs-dist.
 *
 * @param {File|Blob|Object} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file) {
  try {
    if (typeof window !== 'undefined') {
      return await extractFromPdfJs(file);
    }
    // Fallback para ambientes de teste / headless onde pdfjs-dist no browser não está disponível
    if (file && typeof file.text === 'function') {
      return await file.text();
    }
    return '';
  } catch (err) {
    throw new Error(`Erro ao extrair conteúdo do arquivo PDF: ${err.message}`);
  }
}

/**
 * Despachante unificado para extração de texto de documentos educacionais (PDF, DOCX, DOC, TXT)
 *
 * @param {File|Blob|Object} file - Arquivo selecionado no input ou drag & drop
 * @param {Object} [options] - Opções de configuração
 * @param {number} [options.maxSizeBytes=15728640] - Limite máximo de bytes (padrão 15MB)
 * @returns {Promise<{ texto: string, nomeArquivo: string, tamanhoBytes: number, tipo: string, totalCaracteres: number }>}
 */
export async function extractTextFromDocument(file, options = {}) {
  if (!file) {
    throw new Error('Nenhum arquivo foi fornecido para extração.');
  }

  const maxSizeBytes = options.maxSizeBytes || MAX_FILE_SIZE_BYTES;
  const fileSize = file.size || 0;

  if (fileSize > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(`O arquivo selecionado excede o limite máximo de ${maxMb}MB.`);
  }

  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  let texto = '';
  let tipoDetectado = 'desconhecido';

  // DOCX / DOC
  if (
    fileName.endsWith('.docx') ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    tipoDetectado = 'docx';
    texto = await extractTextFromDocx(file);
  } else if (fileName.endsWith('.doc') || fileType === 'application/msword') {
    tipoDetectado = 'doc';
    texto = await extractTextFromDocx(file);
  }
  // PDF
  else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
    tipoDetectado = 'pdf';
    texto = await extractTextFromPDF(file);
  }
  // Texto simples TXT / MD
  else if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileType.startsWith('text/')
  ) {
    tipoDetectado = 'txt';
    if (typeof file.text === 'function') {
      texto = await file.text();
    } else if (typeof file.arrayBuffer === 'function') {
      const buf = await file.arrayBuffer();
      texto = new TextDecoder('utf-8').decode(buf);
    } else {
      texto = String(file);
    }
  } else {
    throw new Error(
      'Formato de arquivo não suportado. Por favor, envie um documento PDF (.pdf), Word (.docx, .doc) ou texto (.txt).'
    );
  }

  const textoFinal = (texto || '').trim();

  return {
    texto: textoFinal,
    nomeArquivo: file.name || 'documento',
    tamanhoBytes: fileSize,
    tipo: tipoDetectado,
    totalCaracteres: textoFinal.length,
  };
}
