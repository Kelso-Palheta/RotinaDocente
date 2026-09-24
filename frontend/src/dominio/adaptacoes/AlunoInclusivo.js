import { CATEGORIAS_MAP } from './CategoriasDeficiencia';

/**
 * Entidade de Domínio: Aluno Inclusivo (Perfil PEI / PDI Rápido)
 * Regras: RN-31, RN-32, RN-33
 */
export class AlunoInclusivo {
  constructor({
    id = null,
    nome = '',
    turmaId = '',
    turmaNome = '',
    necessidades = [],
    nivelSuporte = 1,
    hiperfoco = '',
    observacoes = '',
    createdAt = null,
    updatedAt = null,
  } = {}) {
    const nomeLimpo = String(nome || '').trim();
    if (!nomeLimpo || nomeLimpo.length < 2) {
      throw new Error('Nome do aluno é obrigatório (mínimo de 2 caracteres).');
    }

    if (!Array.isArray(necessidades) || necessidades.length === 0) {
      throw new Error('Selecione ao menos uma necessidade de deficiência ou neurodiversidade.');
    }

    // Valida cada categoria contra o catálogo oficial
    const necessidadesValidas = necessidades.map((n) => String(n).toLowerCase().trim());
    for (const nec of necessidadesValidas) {
      if (!CATEGORIAS_MAP[nec]) {
        throw new Error(`Categoria "${nec}" não é suportada. Verifique as categorias oficiais de DUA.`);
      }
    }

    // Normaliza nível de suporte para [1, 2, 3]
    const suporteNum = Number(nivelSuporte);
    const nivelNormalizado = [1, 2, 3].includes(suporteNum) ? suporteNum : 1;

    this.id = id || `aluno_adapt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.nome = nomeLimpo;
    this.turmaId = String(turmaId || '').trim();
    this.turmaNome = String(turmaNome || '').trim();
    this.necessidades = Array.from(new Set(necessidadesValidas));
    this.nivelSuporte = nivelNormalizado;
    this.hiperfoco = String(hiperfoco || '').trim();
    this.observacoes = String(observacoes || '').trim();
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Verifica se os dados do aluno atendem aos requisitos mínimos de persistência.
   */
  isValid() {
    return Boolean(this.nome.length >= 2 && this.necessidades.length > 0);
  }

  /**
   * Serializa para objeto plano pronto para Firestore ou LocalStorage.
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      turmaId: this.turmaId,
      turmaNome: this.turmaNome,
      necessidades: [...this.necessidades],
      nivelSuporte: this.nivelSuporte,
      hiperfoco: this.hiperfoco,
      observacoes: this.observacoes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Reconstrói a entidade a partir de JSON ou objeto cru.
   */
  static fromJSON(json) {
    if (!json || typeof json !== 'object') return null;
    return new AlunoInclusivo(json);
  }
}
