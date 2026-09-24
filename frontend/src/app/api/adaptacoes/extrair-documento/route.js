import { NextResponse } from 'next/server';
import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';

/**
 * Endpoint de Extração de Texto de Documentos (PDF, DOCX, DOC, TXT)
 * POST /api/adaptacoes/extrair-documento
 */
export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Requisição inválida. Envie o arquivo via multipart/form-data.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') || formData.get('arquivo') || formData.get('documento');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado no campo file.' },
        { status: 400 }
      );
    }

    const resultado = await extractTextFromDocument(file);

    return NextResponse.json({
      sucesso: true,
      ...resultado,
    });
  } catch (err) {
    console.error('Erro na extração de documento:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao processar o arquivo anexado.' },
      { status: 422 }
    );
  }
}
