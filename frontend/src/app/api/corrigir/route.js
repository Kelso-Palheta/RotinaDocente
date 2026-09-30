import { NextResponse } from 'next/server';
import { generateCorrection } from '@/lib/redacao/ai-provider';
import { extractScore } from '@/lib/redacao/scores';
import { extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { gerarLoginKey } from '@/utils/diario/loginAluno';
import { vincularAlunoProfessor } from '@/lib/firebase-aluno';

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

    const body = await request.json();

    const {
      text, imageBase64, studentName, studentClass,
      essayTheme, depth, competencies, userId,
      loginAluno, loginKey, motivatorText
    } = body;

    // 1. Validação de tamanho máximo de payload (DoS protection)
    if (text && typeof text === 'string' && text.length > 25000) {
      return NextResponse.json({ error: 'Texto da redação excede o limite máximo permitido (25.000 caracteres).' }, { status: 400 });
    }

    if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.length > 10000000) {
      return NextResponse.json({ error: 'Imagem excede o limite máximo de 8MB.' }, { status: 400 });
    }

    if (!text && !imageBase64) {
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

    const scores = result ? extractScore(result) : null;

    return NextResponse.json({ result, scores, login: loginAluno });
  } catch (error) {
    console.error('ERRO NA API DE CORREÇÃO:', error);
    return NextResponse.json(
      { error: `Não foi possível realizar a correção. ${error.message || ''}` },
      { status: 500 }
    );
  }
}
