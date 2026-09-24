import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai-provider-central';

export async function POST(request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { provider, apiKey, model } = body || {};

    if (!provider || !apiKey) {
      return NextResponse.json(
        { ok: false, error: 'Provedor e chave de API são obrigatórios para o teste.' },
        { status: 400 }
      );
    }

    const userCfg = {
      provider,
      apiKey,
      model,
    };

    // Ping rápido para testar validade e saldo
    const response = await callAI({
      messages: [{ role: 'user', content: 'Olá. Responda apenas "OK".' }],
      maxTokens: 100,
      temperature: 0.1,
      userConfig: userCfg,
    });

    const latencyMs = Date.now() - startTime;
    const finalModel = userCfg.activeModel || model;

    return NextResponse.json({
      ok: true,
      provider,
      model: finalModel,
      latencyMs,
      message: 'Conexão estabelecida com sucesso!',
      raw: response || 'OK',
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error('[/api/ai/test] Erro ao testar chave de IA:', error.message);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Chave de API inválida ou sem saldo no provedor.',
        latencyMs,
      },
      { status: 400 }
    );
  }
}
