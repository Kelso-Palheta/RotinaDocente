/**
 * Entidade de Domínio — Questão Adaptada Individual (RN-42)
 * Camada: src/dominio/adaptacoes/
 * Representa um item atômico pedagógico no Banco de Questões com metadados DUA.
 */

export const TIPOS_QUESTAO_VALIDOS = [
  'multipla_escolha',
  'verdadeiro_falso',
  'associacao',
  'discursiva',
];

export class QuestaoAdaptada {
  /**
   * @param {Object} dados
   * @param {string} [dados.id]
   * @param {string} dados.enunciado
   * @param {string} [dados.tipo]
   * @param {Array<string>} [dados.alternativas]
   * @param {string} [dados.gabarito]
   * @param {string} [dados.apoioVisualDescricao]
   * @param {string} [dados.imagemUrl]
   * @param {string} [dados.scaffolding]
   * @param {string} [dados.disciplina]
   * @param {string} [dados.anoEscolar]
   * @param {string} [dados.tema]
   * @param {string} [dados.habilidadeBNCC]
   * @param {Array<string>} [dados.necessidades]
   * @param {number} [dados.nivelSuporte]
   * @param {string} [dados.origem]
   * @param {string} [dados.createdAt]
   * @param {string} [dados.updatedAt]
   */
  constructor(dados = {}) {
    if (!dados.enunciado || typeof dados.enunciado !== 'string' || !dados.enunciado.trim()) {
      throw new Error('O enunciado da questão adaptada é obrigatório.');
    }

    this.id = dados.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.enunciado = dados.enunciado.trim();

    // Normalização do tipo
    const tipoNormalizado = (dados.tipo || '').toLowerCase();
    this.tipo = TIPOS_QUESTAO_VALIDOS.includes(tipoNormalizado)
      ? tipoNormalizado
      : 'multipla_escolha';

    this.alternativas = Array.isArray(dados.alternativas)
      ? dados.alternativas.map((alt) => String(alt).trim()).filter(Boolean)
      : [];

    this.gabarito = dados.gabarito ? String(dados.gabarito).trim() : '';
    this.apoioVisualDescricao = dados.apoioVisualDescricao ? String(dados.apoioVisualDescricao).trim() : '';
    this.imagemUrl = dados.imagemUrl || '';
    this.scaffolding = dados.scaffolding ? String(dados.scaffolding).trim() : '';

    this.disciplina = dados.disciplina ? String(dados.disciplina).trim() : 'Geral';
    this.anoEscolar = dados.anoEscolar ? String(dados.anoEscolar).trim() : '';
    this.tema = dados.tema ? String(dados.tema).trim() : '';
    this.habilidadeBNCC = dados.habilidadeBNCC ? String(dados.habilidadeBNCC).trim() : '';

    this.necessidades = Array.isArray(dados.necessidades) ? [...dados.necessidades] : [];
    this.nivelSuporte = Number.isInteger(Number(dados.nivelSuporte))
      ? Math.max(1, Math.min(3, Number(dados.nivelSuporte)))
      : 1;

    this.origem = dados.origem || 'manual'; // 'ia' | 'manual'
    this.createdAt = dados.createdAt || new Date().toISOString();
    this.updatedAt = dados.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      enunciado: this.enunciado,
      tipo: this.tipo,
      alternativas: this.alternativas,
      gabarito: this.gabarito,
      apoioVisualDescricao: this.apoioVisualDescricao,
      imagemUrl: this.imagemUrl,
      scaffolding: this.scaffolding,
      disciplina: this.disciplina,
      anoEscolar: this.anoEscolar,
      tema: this.tema,
      habilidadeBNCC: this.habilidadeBNCC,
      necessidades: this.necessidades,
      nivelSuporte: this.nivelSuporte,
      origem: this.origem,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
