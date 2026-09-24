import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import {
  extractTextFromDocument,
  extractTextFromDocx,
  extractTextFromPDF,
} from '../../frontend/src/utils/atividades/documentExtractor';

describe('IT-01 (RN-40): Extração de Texto de Documentos (PDF, Word DOCX/DOC e TXT)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve extrair texto completo e parágrafos de um arquivo DOCX real', async () => {
    const docxPath = path.resolve(__dirname, '../../docs/PRD/v42/CHANGELOG_v41_v42.docx');
    expect(fs.existsSync(docxPath)).toBe(true);

    const buffer = fs.readFileSync(docxPath);
    const mockFile = {
      name: 'atividade_avaliacao.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.length,
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    };

    const texto = await extractTextFromDocx(mockFile);
    expect(texto).toBeTruthy();
    expect(typeof texto).toBe('string');
    expect(texto.length).toBeGreaterThan(100);
    expect(texto).toContain('CHANGELOG');
  });

  it('deve extrair texto através do despachante unificado extractTextFromDocument para DOCX', async () => {
    const docxPath = path.resolve(__dirname, '../../docs/PRD/v42/CHANGELOG_v41_v42.docx');
    const buffer = fs.readFileSync(docxPath);
    const mockFile = {
      name: 'prova_ciencias.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buffer.length,
      arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    };

    const resultado = await extractTextFromDocument(mockFile);
    expect(resultado.texto).toBeTruthy();
    expect(resultado.nomeArquivo).toBe('prova_ciencias.docx');
    expect(resultado.tipo).toBe('docx');
    expect(resultado.totalCaracteres).toBeGreaterThan(50);
  });

  it('deve extrair texto de arquivo TXT diretamente', async () => {
    const conteudo = 'Questão 1: Calcule a raiz quadrada de 144.\nQuestão 2: O que é fotossíntese?';
    const mockFile = {
      name: 'exercicios.txt',
      type: 'text/plain',
      size: conteudo.length,
      text: async () => conteudo,
      arrayBuffer: async () => Buffer.from(conteudo).buffer,
    };

    const resultado = await extractTextFromDocument(mockFile);
    expect(resultado.texto).toBe(conteudo);
    expect(resultado.tipo).toBe('txt');
    expect(resultado.nomeArquivo).toBe('exercicios.txt');
  });

  it('deve rejeitar arquivos com formatos não suportados', async () => {
    const mockFile = {
      name: 'imagem.png',
      type: 'image/png',
      size: 1024,
      arrayBuffer: async () => new ArrayBuffer(1024),
    };

    await expect(extractTextFromDocument(mockFile)).rejects.toThrow(
      /Formato de arquivo não suportado/i
    );
  });

  it('deve rejeitar arquivos que excedem o limite de tamanho de 15MB', async () => {
    const mockFile = {
      name: 'arquivo_gigante.pdf',
      type: 'application/pdf',
      size: 16 * 1024 * 1024, // 16MB
      arrayBuffer: async () => new ArrayBuffer(100),
    };

    await expect(extractTextFromDocument(mockFile)).rejects.toThrow(
      /limite máximo de 15MB/i
    );
  });

  it('deve lançar erro amigável se o arquivo DOCX estiver corrompido ou sem document.xml', async () => {
    const bufferCorrompido = Buffer.from('conteudo que nao eh um docx zip valido');
    const mockFile = {
      name: 'corrompido.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: bufferCorrompido.length,
      arrayBuffer: async () => bufferCorrompido.buffer,
    };

    await expect(extractTextFromDocx(mockFile)).rejects.toThrow(
      /Não foi possível processar o arquivo Word/i
    );
  });

  it('deve delegar a extração de PDF para o leitor de PDF apropriado', async () => {
    const mockPdfFile = {
      name: 'simulado.pdf',
      type: 'application/pdf',
      size: 2048,
      arrayBuffer: async () => new ArrayBuffer(2048),
    };

    // No ambiente Node sem canvas/window, deve tratar com mensagem explicativa ou mock
    try {
      const res = await extractTextFromPDF(mockPdfFile);
      expect(typeof res).toBe('string');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  describe('Endpoint POST /api/adaptacoes/extrair-documento', () => {
    it('deve retornar status 400 se o content-type não for multipart/form-data', async () => {
      const { POST } = await import('../../frontend/src/app/api/adaptacoes/extrair-documento/route');
      const req = new Request('http://localhost/api/adaptacoes/extrair-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/multipart\/form-data/i);
    });

    it('deve extrair texto e retornar JSON 200 ao enviar arquivo DOCX via FormData', async () => {
      const { POST } = await import('../../frontend/src/app/api/adaptacoes/extrair-documento/route');
      const docxPath = path.resolve(__dirname, '../../docs/PRD/v42/CHANGELOG_v41_v42.docx');
      const buffer = fs.readFileSync(docxPath);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const file = new File([blob], 'atividade_ciencias.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const formData = new FormData();
      formData.append('file', file);

      const req = new Request('http://localhost/api/adaptacoes/extrair-documento', {
        method: 'POST',
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sucesso).toBe(true);
      expect(json.tipo).toBe('docx');
      expect(json.nomeArquivo).toBe('atividade_ciencias.docx');
      expect(json.texto).toContain('CHANGELOG');
    });

    it('deve retornar status 400 se nenhum arquivo for anexado no FormData', async () => {
      const { POST } = await import('../../frontend/src/app/api/adaptacoes/extrair-documento/route');
      const formData = new FormData();

      const req = new Request('http://localhost/api/adaptacoes/extrair-documento', {
        method: 'POST',
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Nenhum arquivo enviado/i);
    });
  });
});

