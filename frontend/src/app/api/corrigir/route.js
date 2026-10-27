import { NextResponse } from 'next/server';
import { generateCorrection } from '@/lib/redacao/ai-provider';
import { extractScore } from '@/lib/redacao/scores';
import { extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const userConfig = extractUserAIConfigFromHeaders(request.headers);

    if (!userConfig || !userConfig.apiKey) {
      return NextResponse.json(
        {
          error: 'AI_KEY_REQUIRED',
          message: 'Você precisa conectar sua chave de IA para utilizar este recurso.',
        },
        { status: 400 }
      );
    }

    let body;
    try { body = await request.json(); } catch { return NextResponse.json({error:'Corpo JSON inválido.'},{status:400}); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({error:'Dados da redação inválidos.'},{status:400});

    const {
      text, imageBase64, studentName, studentClass,
      essayTheme, depth, competencies,
      loginAluno, motivatorText
    } = body;

    const strings = {text,imageBase64,motivatorText,studentName,studentClass,essayTheme};
    if (Object.values(strings).some(value => value !== undefined && value !== null && typeof value !== 'string')) return NextResponse.json({error:'Texto, imagem e identificação devem ser textos.'},{status:400});
    if ((motivatorText?.length || 0) > 25000) return NextResponse.json({error:'Texto motivador excede o limite de 25.000 caracteres.'},{status:400});
    if (depth !== undefined && !['basic','analyzed','deep'].includes(depth)) return NextResponse.json({error:'Profundidade de avaliação inválida.'},{status:400});
    if (competencies !== undefined) {
      const parts = Array.isArray(competencies) ? competencies : typeof competencies === 'string' ? competencies.split(/[,;\s]+/).filter(Boolean) : [];
      if (!parts.length || !parts.every(value => typeof value === 'string' && /^(c[1-5]|[1-5]|todas|completa)$/i.test(value))) return NextResponse.json({error:'Selecione competências válidas de C1 a C5.'},{status:400});
    }

    // 1. Validação de tamanho máximo de payload (DoS protection)
    if (text && typeof text === 'string' && text.length > 25000) {
      return NextResponse.json({ error: 'Texto da redação excede o limite máximo permitido (25.000 caracteres).' }, { status: 400 });
    }

    if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.length > 10000000) {
      return NextResponse.json({ error: 'Imagem excede o limite máximo de 8MB.' }, { status: 400 });
    }

    if (!text?.trim() && !imageBase64?.trim()) {
      return NextResponse.json(
        { error: 'Você precisa enviar um texto ou uma imagem da redação.' },
        { status: 400 }
      );
    }

    // Sanitização de strings
    const cleanStudentName = studentName ? String(studentName).slice(0, 100) : 'Aluno';
    const cleanStudentClass = studentClass ? String(studentClass).slice(0, 50) : 'N/A';
    const cleanTheme = essayTheme ? String(essayTheme).slice(0, 500) : 'Tema Livre';

    const result = await generateCorrection({
      text, imageBase64, studentName: cleanStudentName, studentClass: cleanStudentClass,
      essayTheme: cleanTheme, depth, competencies, motivatorText, userConfig
    });

    const scores = result ? extractScore(result, { competencies }) : null;

    if (!scores) return NextResponse.json({error:'INVALID_ENEM_SCORES', message:'A IA retornou notas incompletas ou inconsistentes. Revise a avaliação antes de salvar.',result}, {status:422});
    return NextResponse.json({ result, scores, login: loginAluno });
  } catch (error) {
    console.error('ERRO NA API DE CORREÇÃO:', error);
    return NextResponse.json(
      { error: `Não foi possível realizar a correção. ${error.message || ''}` },
      { status: 500 }
    );
  }
}
