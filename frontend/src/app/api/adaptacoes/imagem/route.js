import { NextResponse } from 'next/server';
import { extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';
import { ImagemPedagogicaBuilder } from '@/dominio/adaptacoes/ImagemPedagogicaBuilder';

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
    const { prompt = '', descricaoApoio = '', disciplina = 'Geral', necessidades = [] } = body;
    const textoBase = prompt || descricaoApoio;

    if (!textoBase?.trim()) {
      return NextResponse.json(
        { error: 'A descrição do apoio visual é obrigatória para gerar a imagem.' },
        { status: 400 }
      );
    }

    const promptRefinado = ImagemPedagogicaBuilder.construirPrompt({
      descricaoApoio: textoBase,
      disciplina,
      necessidades,
    });

    const provider = String(userConfig.provider || 'gemini').toLowerCase().trim();

    // 1. Provedor Google Gemini / AI Studio (Cota Gratuita do AI Studio)
    if (provider === 'gemini') {
      const modelosGemini = [
        'gemini-3.1-flash-image',
        'gemini-2.5-flash-image',
        'imagen-3.0-generate-002',
      ];

      let ultimoErro = null;
      for (const modelo of modelosGemini) {
        try {
          if (modelo.startsWith('imagen-')) {
            // Chamada estilo Predict para Imagen 3
            const urlPredict = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:predict?key=${userConfig.apiKey}`;
            const res = await fetch(urlPredict, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: [{ prompt: promptRefinado }],
                parameters: { sampleCount: 1, aspectRatio: '1:1', outputMimeType: 'image/jpeg' },
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const pred = data.predictions?.[0];
              if (pred?.bytesBase64Encoded) {
                const dataUrl = ImagemPedagogicaBuilder.formatarDataUrl(
                  pred.bytesBase64Encoded,
                  pred.mimeType || 'image/jpeg'
                );
                return NextResponse.json({
                  sucesso: true,
                  imagemUrl: dataUrl,
                  modelo,
                  promptUtilizado: promptRefinado,
                });
              }
            } else {
              const errBody = await res.text();
              ultimoErro = new Error(`Erro ${res.status} [${modelo}]: ${errBody}`);
            }
          } else {
            // Chamada estilo generateContent com responseModalities IMAGE
            const urlGen = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${userConfig.apiKey}`;
            const res = await fetch(urlGen, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: promptRefinado }],
                  },
                ],
                generationConfig: {
                  responseModalities: ['IMAGE'],
                },
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const parts = data.candidates?.[0]?.content?.parts || [];
              const imagePart = parts.find((p) => p.inlineData?.data);

              if (imagePart) {
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                const dataUrl = ImagemPedagogicaBuilder.formatarDataUrl(
                  imagePart.inlineData.data,
                  mimeType
                );
                return NextResponse.json({
                  sucesso: true,
                  imagemUrl: dataUrl,
                  modelo,
                  promptUtilizado: promptRefinado,
                });
              }
            } else {
              const errBody = await res.text();
              ultimoErro = new Error(`Erro ${res.status} [${modelo}]: ${errBody}`);
            }
          }
        } catch (err) {
          ultimoErro = err;
        }
      }

      throw ultimoErro || new Error('Não foi possível gerar a imagem com os modelos Gemini disponíveis.');
    }

    // 2. Provedor OpenAI (DALL-E 3)
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: promptRefinado,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI DALL-E error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error('OpenAI não retornou dados de imagem em base64.');

      const dataUrl = ImagemPedagogicaBuilder.formatarDataUrl(b64, 'image/png');
      return NextResponse.json({
        sucesso: true,
        imagemUrl: dataUrl,
        modelo: 'dall-e-3',
        promptUtilizado: promptRefinado,
      });
    }

    return NextResponse.json(
      {
        error: `O provedor "${provider}" não suporta geração de imagens diretamente. Conecte uma chave do Google Gemini (AI Studio) ou OpenAI.`,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[/api/adaptacoes/imagem] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar ilustração pedagógica.' },
      { status: 500 }
    );
  }
}
