import { extractTextFromDocx as extractDocxNative } from './documentExtractor';

/**
 * Extrator de arquivos Word (.docx)
 * Utiliza o motor isomórfico nativo com fallback para mammoth se disponível.
 *
 * @param {File|Blob|Buffer|ArrayBuffer} file
 * @returns {Promise<string>}
 */
export async function extractTextFromDocx(file) {
  try {
    return await extractDocxNative(file);
  } catch (err) {
    // Fallback: se houver window.mammoth disponível no browser
    if (typeof window !== 'undefined' && window.mammoth) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return result.value || '';
    }
    throw err;
  }
}
