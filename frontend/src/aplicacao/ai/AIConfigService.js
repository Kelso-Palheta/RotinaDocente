import { AIConfig } from '../../dominio/ai/AIConfig';
import { AIConfigRepository } from '../../infraestrutura/ai/AIConfigRepository';

/**
 * Serviço de Aplicação: Casos de Uso de Configuração de IA
 */
export class AIConfigService {
  constructor(repository = null) {
    this.repository = repository || new AIConfigRepository();
  }

  /**
   * Obtém a configuração ativa de IA do professor.
   * @param {string} [userId]
   * @returns {Promise<AIConfig | null>}
   */
  async obterConfiguracao(userId = null) {
    const local = this.repository.carregarLocal();
    if (local && local.isValid()) {
      return local;
    }

    if (userId) {
      const remoto = await this.repository.carregarFirestore(userId);
      if (remoto && remoto.isValid()) {
        return remoto;
      }
    }

    return null;
  }

  /**
   * Salva a configuração de IA do professor.
   * @param {string|null} userId
   * @param {object} dados
   * @returns {Promise<AIConfig>}
   */
  async salvarConfiguracao(userId, dados) {
    const config = new AIConfig(dados);
    if (!config.isValid()) {
      throw new Error('A chave de API informada é inválida ou está em branco.');
    }

    this.repository.salvarLocal(config);

    if (userId) {
      await this.repository.sincronizarFirestore(userId, config);
    }

    return config;
  }

  /**
   * Remove a configuração de IA (desconectar).
   * @param {string|null} userId
   */
  async removerConfiguracao(userId = null) {
    this.repository.limparLocal();
    if (userId) {
      await this.repository.sincronizarFirestore(userId, null);
    }
  }

  /**
   * Testa a conectividade com o provedor via API endpoint.
   * @param {object} config
   * @returns {Promise<{ ok: boolean, message: string, latencyMs?: number }>}
   */
  async testarConexao(config) {
    const res = await fetch('/api/ai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data?.error || 'Falha ao testar conexão com o provedor.');
    }

    return data;
  }
}
