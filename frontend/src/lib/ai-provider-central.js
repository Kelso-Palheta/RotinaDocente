/**
 * Provider de IA Unificado — Gestão Docente
 *
 * Centraliza toda chamada de IA do projeto.
 * Ativação via variável de ambiente AI_PROVIDER no .env.local:
 *   - "openrouter"  → OpenRouter.ai (modelos gratuitos, padrão)
 *   - "maritaca"    → Maritalk sabiazinho-4 (produção)
 *
 * Compatível com qualquer rota de API que receba { messages, system?, model? }
 */

const PROVIDER_CONFIG = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: () => process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
    apiKey: () => process.env.OPENROUTER_API_KEY,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://gestaodocente.com.br',
      'X-Title': 'Gestão Docente',
    }),
    // OpenRouter não suporta vision com modelos gratuitos — extrai texto antes
    supportsVision: false,
  },
  maritaca: {
    baseUrl: 'https://chat.maritaca.ai/api/v1/chat/completions',
    model: () => process.env.MARITACA_MODEL || 'sabiazinho-4',
    apiKey: () => process.env.MARITACA_API_KEY || process.env.NEXT_PUBLIC_MARITACA_API_KEY,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    supportsVision: true,
  },
};

/**
 * Retorna o nome do provider ativo.
 * @returns {'openrouter' | 'maritaca'}
 */
export function getProviderName() {
  return process.env.AI_PROVIDER || 'openrouter';
}

/**
 * Retorna a configuração do provider ativo.
 */
export function getProvider() {
  const name = getProviderName();
  return PROVIDER_CONFIG[name] || PROVIDER_CONFIG.openrouter;
}

/**
 * Chama a API de IA do provider ativo com o formato padrão OpenAI.
 *
 * @param {Object} opts
 * @param {string} [opts.systemPrompt]     - System prompt (opcional)
 * @param {{ role: string, content: string }[]} opts.messages - Histórico de mensagens
 * @param {number} [opts.temperature]      - Temperatura (padrão: 0.5)
 * @param {number} [opts.maxTokens]        - Max tokens (padrão: 2000)
 * @returns {Promise<string>}              - Texto da resposta do modelo
 */
export async function callAI({ systemPrompt, messages, temperature = 0.5, maxTokens = 2000 }) {
  const provider = getProvider();
  const apiKey = provider.apiKey();

  if (!apiKey) {
    const name = getProviderName();
    const hint =
      name === 'openrouter'
        ? 'Configure OPENROUTER_API_KEY no .env.local — chave gratuita em openrouter.ai/keys'
        : 'Configure MARITACA_API_KEY no .env.local';
    throw new Error(`[AI Provider] Chave não encontrada para "${name}". ${hint}`);
  }

  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const payload = {
    model: provider.model(),
    messages: allMessages,
    temperature,
    max_tokens: maxTokens,
  };

  const res = await fetch(provider.baseUrl, {
    method: 'POST',
    headers: provider.headers(apiKey),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.error?.message || data?.error || JSON.stringify(data);
    throw new Error(`[AI Provider "${getProviderName()}"] ${res.status}: ${errMsg}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('[AI Provider] Resposta vazia do modelo.');

  return content;
}

/**
 * Versão bruta: passa body completo e retorna o objeto data inteiro.
 * Usado pelas rotas que precisam repassar o response completo ao cliente.
 *
 * @param {object} body - Corpo da requisição (model, messages, etc.)
 * @returns {Promise<{ data: object, status: number }>}
 */
export async function callAIRaw(body) {
  const provider = getProvider();
  const apiKey = provider.apiKey();

  if (!apiKey) {
    throw new Error(`[AI Provider] Chave não encontrada para "${getProviderName()}".`);
  }

  // Força o modelo do provider ativo, mesmo que o body já traga um model
  const payload = { ...body, model: provider.model() };

  const res = await fetch(provider.baseUrl, {
    method: 'POST',
    headers: provider.headers(apiKey),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { data, status: res.status, ok: res.ok };
}
