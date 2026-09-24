import { NextResponse } from 'next/server';
import { extractTextOnly } from '@/lib/redacao/ai-provider';
import { extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';

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

    const { imageBase64, mediaType } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Você precisa enviar uma imagem válida em base64 para extração.' },
        { status: 400 }
      );
    }

    // Trava estrita de segurança: limite de 8MB em base64 (DoS protection)
    if (imageBase64.length > 10000000) {
      return NextResponse.json(
        { error: 'A imagem excede o limite máximo permitido de 8MB.' },
        { status: 400 }
      );
    }

    const cleanMediaType = mediaType ? String(mediaType).slice(0, 50) : 'image/jpeg';
    const text = await extractTextOnly(imageBase64, cleanMediaType, userConfig);

    return NextResponse.json({ text });
  } catch (error) {
    if (error.code === 'AI_KEY_REQUIRED') {
      return NextResponse.json(
        { error: 'AI_KEY_REQUIRED', message: error.message },
        { status: 400 }
      );
    }
    console.error('ERRO NA EXTRAÇÃO DE TEXTO:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Não foi possível extrair o texto desta imagem.' },
      { status: 500 }
    );
  }
}
