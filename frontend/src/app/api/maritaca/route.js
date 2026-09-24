import { NextResponse } from 'next/server';
import { callAIRaw, extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';

/**
 * Gateway de IA unificado (BYOK Obrigatório).
 * RN-27 & RN-29: Requer obrigatoriamente a chave de IA do professor.
 */
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

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    // Validação de limite de tamanho total do payload (DoS protection)
    const jsonStr = JSON.stringify(body);
    if (jsonStr.length > 50000) {
      return NextResponse.json({ error: 'Payload excede o limite máximo permitido (50KB).' }, { status: 400 });
    }

    // Valida se possui messages ou prompt
    if (!body.messages && !body.prompt && !body.contents) {
      return NextResponse.json({ error: 'Formato de requisição de IA inválido (messages ou prompt obrigatório).' }, { status: 400 });
    }

    const { data, status, ok } = await callAIRaw(body, userConfig);

    if (!ok) {
      console.error(`[/api/maritaca → ${userConfig.provider}] Erro ${status}:`, data);
      return NextResponse.json({ error: data }, { status });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error.code === 'AI_KEY_REQUIRED') {
      return NextResponse.json(
        { error: 'AI_KEY_REQUIRED', message: error.message },
        { status: 400 }
      );
    }
    console.error('[/api/maritaca] Erro inesperado:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
