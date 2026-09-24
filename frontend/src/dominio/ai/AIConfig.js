import { AIProviders } from './AIProviders';

/**
 * Entidade de Domínio: Configuração de IA do Usuário (BYOK)
 * Regras: RN-27, RN-28, RN-29, RN-30
 */
export class AIConfig {
  constructor({ provider = 'gemini', apiKey = '', model = null, updatedAt = null } = {}) {
    const providerLower = String(provider).toLowerCase().trim();
    if (!AIProviders[providerLower]) {
      throw new Error(`Provedor "${provider}" não é suportado. Opções válidas: ${Object.keys(AIProviders).join(', ')}`);
    }

    this.provider = providerLower;
    this.apiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    this.model = model || AIProviders[providerLower].defaultModel;
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Verifica se a configuração possui os dados mínimos necessários para ser utilizada.
   */
  isValid() {
    return Boolean(this.provider && this.apiKey.length > 5);
  }

  /**
   * RN-30: Mascara a chave de API para exibição segura na interface.
   * Exemplo: 'sk-proj-1234567890abcdefXYZW' -> 'sk-...XYZW'
   * Exemplo: 'AIzaSy1234567890abcdef' -> 'AIza...cdef'
   */
  getMaskedKey() {
    if (!this.apiKey) return '';
    const clean = this.apiKey.trim();
    if (clean.length <= 8) return '••••••••';

    let prefix = 'sk-...';
    if (clean.startsWith('AIza')) {
      prefix = 'AIza...';
    } else {
      prefix = 'sk-...';
    }

    const suffix = clean.slice(-4);
    return `${prefix}${suffix}`;
  }

  /**
   * Retorna objeto sanitizado para persistência ou transmissão.
   */
  toJSON() {
    return {
      provider: this.provider,
      apiKey: this.apiKey,
      model: this.model,
      maskedKey: this.getMaskedKey(),
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Cria uma instância a partir de um objeto bruto ou JSON.
   */
  static fromJSON(json) {
    if (!json || typeof json !== 'object') return null;
    try {
      return new AIConfig({
        provider: json.provider,
        apiKey: json.apiKey,
        model: json.model,
        updatedAt: json.updatedAt,
      });
    } catch {
      return null;
    }
  }
}
