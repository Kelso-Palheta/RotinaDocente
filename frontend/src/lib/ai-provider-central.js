/**
 * Provider de IA Centralizado com BYOK Obrigatório — Gestão Docente
 *
 * RN-27 & RN-29: Cada professor conecta sua própria chave de API.
 * Provedores homologados: Google Gemini, OpenAI, Anthropic, Maritaca AI, OpenRouter.
 * NÃO HÁ CHAVE CENTRAL OU FALLBACK: Chave ausente resulta em erro AI_KEY_REQUIRED.
 */

export const PROVIDER_ENDPOINTS = {
  gemini: {
    id: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-1.5-flash',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    isOpenAICompatible: true,
  },
  openai: {
    id: 'openai',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    isOpenAICompatible: true,
  },
  anthropic: {
    id: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-haiku-latest',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
    isOpenAICompatible: false,
  },
  maritaca: {
    id: 'maritaca',
    baseUrl: 'https://chat.maritaca.ai/api/v1/chat/completions',
    defaultModel: 'sabiazinho-4',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    isOpenAICompatible: true,
  },
  openrouter: {
    id: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://rotinadocente-kelso-palhetas-projects.vercel.app',
      'X-Title': 'Gestao Docente',
    }),
    isOpenAICompatible: true,
  },
};

/**
 * Extrai a configuração de IA do professor a partir dos headers de uma requisição Next.js.
 * @param {Headers|Map|object} headers
 * @returns {{ provider: string, apiKey: string, model?: string } | null}
 */
export function extractUserAIConfigFromHeaders(headers) {
  if (!headers) return null;
  const getHeader = (name) => {
    if (typeof headers.get === 'function') return headers.get(name);
    return headers[name] || headers[name.toLowerCase()];
  };

  const provider = getHeader('x-user-ai-provider');
  const apiKey = getHeader('x-user-ai-key');
  const model = getHeader('x-user-ai-model');

  if (!apiKey) return null;

  return {
    provider: (provider || 'gemini').toLowerCase().trim(),
    apiKey: apiKey.trim(),
    model: model ? model.trim() : null,
  };
}

/**
 * Valida e resolve as credenciais ativas do usuário.
 * RN-29: Rejeita se nenhuma chave for fornecida.
 */
function resolveUserConfig(userConfig) {
  const apiKey = userConfig?.apiKey ? String(userConfig.apiKey).trim() : '';

  if (!apiKey) {
    const error = new Error('AI_KEY_REQUIRED: Você precisa conectar sua chave de IA para utilizar este recurso.');
    error.code = 'AI_KEY_REQUIRED';
    throw error;
  }

  const providerId = (userConfig?.provider || 'gemini').toLowerCase().trim();
  const providerSpec = PROVIDER_ENDPOINTS[providerId] || PROVIDER_ENDPOINTS.gemini;
  const model = userConfig?.model || providerSpec.defaultModel;

  return {
    providerId: providerSpec.id,
    spec: providerSpec,
    apiKey,
    model,
  };
}

/**
 * Consulta a lista de modelos ativos disponíveis para a chave Gemini do professor via ModelService.ListModels.
 * @param {string} apiKey
 * @returns {Promise<string[]>}
 */
export async function fetchAvailableGeminiModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''));
  } catch {
    return [];
  }
}

/**
 * Ordena os modelos disponíveis priorizando os estáveis e filtrando variantes sensíveis a sobrecarga (-high, etc.)
 */
export function prioritizeGeminiModels(available = []) {
  const isHighDemandSensitive = (m) => m.includes('-high');
  const withoutHigh = available.filter((m) => !isHighDemandSensitive(m));
  const candidatePool = withoutHigh.length > 0 ? withoutHigh : available;

  const priorities = [
    (m) => m === 'gemini-3.6-flash' || m === 'models/gemini-3.6-flash',
    (m) => m.includes('3.6-flash') && !m.includes('-high'),
    (m) => m.includes('2.5-flash') && !m.includes('-high'),
    (m) => m.includes('2.0-flash') && !m.includes('-high') && !m.includes('lite'),
    (m) => m.includes('2.0-flash-lite') || m.includes('flash-lite'),
    (m) => m.includes('1.5-flash') && !m.includes('-high'),
    (m) => m.includes('flash') && !m.includes('-high'),
    (m) => m.includes('1.5-pro') || m.includes('2.5-pro'),
    (m) => m.includes('pro') && !m.includes('-high'),
  ];

  const ordered = [];
  for (const matchFn of priorities) {
    const found = candidatePool.find(matchFn);
    if (found && !ordered.includes(found)) {
      ordered.push(found);
    }
  }

  // Adiciona os demais candidatos estáveis
  for (const m of candidatePool) {
    if (!ordered.includes(m)) {
      ordered.push(m);
    }
  }

  // Se houver modelos sensíveis a demanda (-high), coloca no fim apenas como último recurso
  for (const m of available) {
    if (!ordered.includes(m)) {
      ordered.push(m);
    }
  }

  return ordered;
}

/**
 * Executa chamada nativa à API do Google Gemini com fallback resiliente para 503, 429 e 404
 */
async function executeGeminiNativeCall({
  apiKey,
  initialModel,
  geminiContents,
  systemInstructionText,
  temperature = 0.5,
  maxOutputTokens = 4096,
  userConfig = null,
}) {
  let activeModel = initialModel;
  // Se o modelo configurado for uma variante -high propensa a 503, normaliza imediatamente
  if (activeModel && activeModel.includes('-high')) {
    activeModel = 'gemini-3.6-flash';
  }

  const buildPayload = () => {
    const p = {
      contents: geminiContents.length > 0 ? geminiContents : [{ role: 'user', parts: [{ text: 'Olá' }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    };
    if (systemInstructionText) {
      p.systemInstruction = {
        parts: [{ text: systemInstructionText }],
      };
    }
    return p;
  };

  const tryCall = async (modelName) => {
    const cleanModelName = modelName.replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const d = await r.json();
      return { res: r, data: d, model: cleanModelName };
    } catch (fetchErr) {
      return { res: { ok: false, status: 500 }, data: { error: { message: fetchErr.message } }, model: cleanModelName };
    }
  };

  let attempt = await tryCall(activeModel);

  // Se o modelo falhar por 404 (obsoleto/não encontrado), 503 (alta demanda/sem capacidade) ou 429 (limite de quota)
  const isRetriableError =
    !attempt.res.ok &&
    (attempt.res.status === 404 ||
      attempt.res.status === 503 ||
      attempt.res.status === 429 ||
      attempt.data?.error?.code === 404 ||
      attempt.data?.error?.code === 503 ||
      attempt.data?.error?.code === 429);

  if (isRetriableError) {
    const errMsg = attempt.data?.error?.message || '';
    console.warn(`[GEMINI AI] Modelo "${activeModel}" retornou status ${attempt.res.status}: ${errMsg}. Iniciando cascata de fallback resiliente...`);

    // 1. Verifica se a própria API recomendou um modelo na mensagem de erro
    const suggestedMatch = errMsg.match(/models\/(gemini-[\w.-]+)/);
    const suggestedModel = suggestedMatch ? suggestedMatch[1] : null;

    // 2. Consulta modelos disponíveis na chave
    const rawAvailable = await fetchAvailableGeminiModels(apiKey);
    const prioritized = prioritizeGeminiModels(rawAvailable);

    // Monta lista de fallback ordenada evitando variantes -high
    const candidates = [];
    if (suggestedModel && suggestedModel !== activeModel && !suggestedModel.includes('-high')) {
      candidates.push(suggestedModel);
    }
    for (const cand of prioritized) {
      if (cand !== activeModel && !candidates.includes(cand)) {
        candidates.push(cand);
      }
    }

    // Tenta cada candidato em cascata até obter sucesso 200
    for (const candidate of candidates) {
      console.log(`[GEMINI AI] Tentando modelo alternativo: ${candidate}`);
      const nextAttempt = await tryCall(candidate);
      if (nextAttempt.res.ok) {
        attempt = nextAttempt;
        activeModel = candidate;
        if (userConfig && typeof userConfig === 'object') {
          userConfig.activeModel = activeModel;
        }
        break;
      } else {
        console.warn(`[GEMINI AI] Modelo "${candidate}" falhou com status ${nextAttempt.res.status}: ${nextAttempt.data?.error?.message || ''}`);
      }
    }
  }

  return attempt;
}

/**
 * Executa chamada de IA com prompt de sistema e mensagens utilizando a chave BYOK do professor.
 *
 * @param {Object} opts
 * @param {string} [opts.systemPrompt]
 * @param {{ role: string, content: string }[]} opts.messages
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @param {{ provider: string, apiKey: string, model?: string }} [opts.userConfig]
 * @returns {Promise<string>}
 */
export async function callAI({
  systemPrompt,
  messages,
  temperature = 0.5,
  maxTokens = 2000,
  userConfig = null,
}) {
  const resolved = resolveUserConfig(userConfig);
  const { spec, apiKey, model } = resolved;

  if (spec.id === 'anthropic') {
    // Formatação específica para Anthropic Messages API
    const anthropicMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const payload = {
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt || undefined,
      messages: anthropicMessages,
    };

    const res = await fetch(spec.baseUrl, {
      method: 'POST',
      headers: spec.headers(apiKey),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data);
      throw new Error(`[Anthropic AI] ${res.status}: ${errMsg}`);
    }

    const text = data?.content?.find((c) => c.type === 'text')?.text || data?.content?.[0]?.text;
    if (!text) throw new Error('[Anthropic AI] Resposta vazia do modelo.');
    return text;
  }

  // Provedores padrão OpenAI-compatible (Gemini, OpenAI, Maritaca, OpenRouter)
  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const payload = {
    model,
    messages: allMessages,
    temperature,
    max_tokens: maxTokens,
  };

  const res = await fetch(spec.baseUrl, {
    method: 'POST',
    headers: spec.headers(apiKey),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    if (spec.id === 'gemini') {
      try {
        const geminiContents = messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content || '' }],
          }));

        const effectiveMaxTokens = Math.max((maxTokens || 2000) * 2, 4096);

        const attempt = await executeGeminiNativeCall({
          apiKey,
          initialModel: model,
          geminiContents,
          systemInstructionText: systemPrompt,
          temperature,
          maxOutputTokens: effectiveMaxTokens,
          userConfig,
        });

        if (attempt.res.ok) {
          const parts = attempt.data?.candidates?.[0]?.content?.parts || [];
          const answerParts = parts.filter((p) => !p.thought);
          const partsToUse = answerParts.length > 0 ? answerParts : parts;
          const text = partsToUse.map((p) => p.text || '').join('').trim();
          if (text) return text;
        } else {
          const nativeErr = attempt.data?.error?.message || JSON.stringify(attempt.data);
          if (attempt.res.status === 503) {
            throw new Error(`[GEMINI AI] Os servidores do Google estão temporariamente sobrecarregados (503). Por favor, aguarde alguns instantes e tente novamente.`);
          }
          throw new Error(`[GEMINI AI] ${attempt.res.status}: ${nativeErr}`);
        }
      } catch (nativeError) {
        throw nativeError;
      }
    }

    const errMsg = data?.error?.message || data?.error || JSON.stringify(data);
    throw new Error(`[${spec.id.toUpperCase()} AI] ${res.status}: ${errMsg}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`[${spec.id.toUpperCase()} AI] Resposta vazia do modelo.`);

  return content;
}

/**
 * Versão bruta com suporte a BYOK: repassa o corpo da requisição e normaliza o retorno.
 * @param {object} body
 * @param {{ provider: string, apiKey: string, model?: string }} [userConfig]
 * @returns {Promise<{ data: object, status: number, ok: boolean }>}
 */
export async function callAIRaw(body, userConfig = null) {
  const resolved = resolveUserConfig(userConfig);
  const { spec, apiKey, model } = resolved;

  if (spec.id === 'anthropic') {
    const systemMsg = body.messages?.find((m) => m.role === 'system')?.content;
    const userMsgs = (body.messages || [])
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));

    const payload = {
      model,
      max_tokens: body.max_tokens || 2048,
      temperature: body.temperature ?? 0.5,
      system: systemMsg || undefined,
      messages: userMsgs.length > 0 ? userMsgs : [{ role: 'user', content: body.prompt || '' }],
    };

    const res = await fetch(spec.baseUrl, {
      method: 'POST',
      headers: spec.headers(apiKey),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { data, status: res.status, ok: false };
    }

    const text = data?.content?.find((c) => c.type === 'text')?.text || data?.content?.[0]?.text || '';
    // Converte para formato OpenAI para manter compatibilidade com todos os clientes
    const normalizedData = {
      id: data.id,
      model,
      choices: [{ message: { role: 'assistant', content: text } }],
      usage: data.usage,
    };

    return { data: normalizedData, status: res.status, ok: true };
  }

  // OpenAI Compatible
  const payload = {
    ...body,
    model: body.model || model,
  };

  const res = await fetch(spec.baseUrl, {
    method: 'POST',
    headers: spec.headers(apiKey),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok && spec.id === 'gemini') {
    try {
      const msgs = body.messages || [];
      const systemMsg = msgs.find((m) => m.role === 'system')?.content;
      const geminiContents = msgs
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
        }));

      const requestedMax = body.max_tokens || 2048;
      const effectiveMax = Math.max(requestedMax * 2, 4096);

      const attempt = await executeGeminiNativeCall({
        apiKey,
        initialModel: payload.model || model,
        geminiContents,
        systemInstructionText: systemMsg,
        temperature: body.temperature ?? 0.5,
        maxOutputTokens: effectiveMax,
        userConfig,
      });

      if (attempt.res.ok) {
        const parts = attempt.data?.candidates?.[0]?.content?.parts || [];
        const answerParts = parts.filter((p) => !p.thought);
        const partsToUse = answerParts.length > 0 ? answerParts : parts;
        const text = partsToUse.map((p) => p.text || '').join('').trim();
        const normalizedData = {
          id: `gemini-${Date.now()}`,
          model: attempt.model,
          choices: [{ message: { role: 'assistant', content: text } }],
          usage: attempt.data?.usageMetadata,
        };
        return { data: normalizedData, status: attempt.res.status, ok: true };
      }
    } catch {
      // continua para retornar o erro original
    }
  }

  return { data, status: res.status, ok: res.ok };
}

/**
 * Retorna o provedor em uso ou fallback.
 */
export function getProviderName(userConfig = null) {
  return userConfig?.provider || 'gemini';
}
