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
      'HTTP-Referer': 'https://gestaodocente.com.br',
      'X-Title': 'Gestão Docente',
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
  return { data, status: res.status, ok: res.ok };
}

/**
 * Retorna o provedor em uso ou fallback.
 */
export function getProviderName(userConfig = null) {
  return userConfig?.provider || 'gemini';
}
