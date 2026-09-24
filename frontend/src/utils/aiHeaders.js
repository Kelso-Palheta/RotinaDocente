import { AIConfigRepository } from '@/infraestrutura/ai/AIConfigRepository';

const repo = new AIConfigRepository();

/**
 * Retorna os headers canônicos da chave pessoal de IA do professor
 * para serem enviados em requisições aos endpoints internos de IA.
 */
export function getClientAIHeaders() {
  const config = repo.carregarLocal();
  if (!config || !config.isValid()) {
    return {};
  }
  return {
    'x-user-ai-provider': config.provider,
    'x-user-ai-key': config.apiKey,
    'x-user-ai-model': config.model,
  };
}

/**
 * Verifica localmente de forma síncrona se o professor possui chave de IA configurada.
 */
export function hasUserAIKey() {
  const config = repo.carregarLocal();
  return Boolean(config && config.isValid());
}
