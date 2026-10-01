import { NextResponse } from 'next/server';
import { ImagemPedagogicaBuilder } from '@/dominio/adaptacoes/ImagemPedagogicaBuilder';

// A geração de imagens pode levar dezenas de segundos (RN-39).
export const maxDuration = 60;

const LIMITE_PROMPT = 4000;
const TIMEOUT_FETCH_MS = 50000;

function contentTypeDe(res) {
  return String(res.headers?.get?.('content-type') || '').toLowerCase();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json(
        { error: 'O prompt da ilustração é obrigatório.' },
        { status: 400 }
      );
    }
    if (prompt.length > LIMITE_PROMPT) {
      return NextResponse.json(
        { error: `O prompt excede o limite de ${LIMITE_PROMPT} caracteres.` },
        { status: 400 }
      );
    }

    const apiKey = process.env.POLLINATIONS_API_KEY;
    const opcoes = { width: 800, height: 400 };

    // 1. Serviço novo (modelo Flux) com a chave própria do projeto
    const urlFlux = ImagemPedagogicaBuilder.montarUrlPollinationsFlux(prompt, {
      apiKey,
      ...opcoes,
    });

    if (urlFlux) {
      try {
        const res = await fetch(urlFlux, { signal: AbortSignal.timeout(TIMEOUT_FETCH_MS) });
        const contentType = contentTypeDe(res);
        if (res.ok && contentType.startsWith('image/')) {
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length > 0) {
            const mimeType = contentType.split(';')[0] || 'image/jpeg';
            return NextResponse.json({
              sucesso: true,
              imagemUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
              servico: 'flux',
            });
          }
        }
        console.warn(
          `[/api/adaptacoes/imagem-fallback] Flux indisponível (${res.status} ${contentType}). Tentando legado.`
        );
      } catch (fluxErr) {
        console.warn('[/api/adaptacoes/imagem-fallback] Erro no Flux:', fluxErr?.message);
      }
    }

    // 2. Endpoint legado (sem chave — modelo degradado), validado antes de publicar
    const urlLegado = ImagemPedagogicaBuilder.montarUrlPollinations(prompt, opcoes);
    try {
      const res = await fetch(urlLegado, { signal: AbortSignal.timeout(TIMEOUT_FETCH_MS) });
      const contentType = contentTypeDe(res);
      if (res.ok && contentType.startsWith('image/')) {
        return NextResponse.json({
          sucesso: true,
          imagemUrl: urlLegado,
          servico: 'legado',
        });
      }
      console.warn(
        `[/api/adaptacoes/imagem-fallback] Legado indisponível (${res.status} ${contentType}).`
      );
    } catch (legadoErr) {
      console.warn('[/api/adaptacoes/imagem-fallback] Erro no legado:', legadoErr?.message);
    }

    return NextResponse.json(
      { error: 'Não foi possível gerar a ilustração no momento. Tente novamente em instantes.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[/api/adaptacoes/imagem-fallback] Erro:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao gerar a ilustração.' },
      { status: 500 }
    );
  }
}
