/**
 * Entidade de Domínio — Prova / Avaliação Adaptada (RN-42)
 * Camada: src/dominio/adaptacoes/
 * Agrega questões adaptadas selecionadas do banco, instruções e vínculo a estudante PEI.
 */

import { QuestaoAdaptada } from './QuestaoAdaptada.js';

export class ProvaAdaptada {
  /**
   * @param {Object} dados
   * @param {string} [dados.id]
   * @param {string} [dados.titulo]
   * @param {string} [dados.disciplina]
   * @param {string} [dados.anoEscolar]
   * @param {string} [dados.instrucoes]
   * @param {Array<Object|QuestaoAdaptada>} [dados.questoes]
   * @param {string} [dados.alunoId]
   * @param {string} [dados.alunoNome]
   * @param {Array<string>} [dados.necessidades]
   * @param {number} [dados.nivelSuporte]
   * @param {string} [dados.guiaMediacao]
   * @param {string} [dados.createdAt]
   * @param {string} [dados.updatedAt]
   */
  constructor(dados = {}) {
    this.id = dados.id || `prova_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.titulo = dados.titulo ? String(dados.titulo).trim() : 'Avaliação Adaptada';
    this.disciplina = dados.disciplina ? String(dados.disciplina).trim() : 'Geral';
    this.anoEscolar = dados.anoEscolar ? String(dados.anoEscolar).trim() : '';
    this.instrucoes = dados.instrucoes ? String(dados.instrucoes).trim() : '';

    this.questoes = Array.isArray(dados.questoes)
      ? dados.questoes.map((q) => (q instanceof QuestaoAdaptada ? q : new QuestaoAdaptada(q)))
      : [];

    this.alunoId = dados.alunoId || '';
    this.alunoNome = dados.alunoNome || '';
    this.necessidades = Array.isArray(dados.necessidades) ? [...dados.necessidades] : [];
    this.nivelSuporte = Number(dados.nivelSuporte) || 1;
    this.guiaMediacao = dados.guiaMediacao || '';

    this.createdAt = dados.createdAt || new Date().toISOString();
    this.updatedAt = dados.updatedAt || new Date().toISOString();
  }

  /**
   * Adiciona uma questão à prova
   * @param {Object|QuestaoAdaptada} questao
   */
  adicionarQuestao(questao) {
    const qInst = questao instanceof QuestaoAdaptada ? questao : new QuestaoAdaptada(questao);
    this.questoes.push(qInst);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Remove uma questão da prova pelo ID
   * @param {string} questaoId
   */
  removerQuestao(questaoId) {
    this.questoes = this.questoes.filter((q) => q.id !== questaoId);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Reordena a posição de uma questão na prova
   * @param {number} indexOrigem
   * @param {number} indexDestino
   */
  moverQuestao(indexOrigem, indexDestino) {
    if (
      indexOrigem < 0 ||
      indexOrigem >= this.questoes.length ||
      indexDestino < 0 ||
      indexDestino >= this.questoes.length
    ) {
      return;
    }
    const [removida] = this.questoes.splice(indexOrigem, 1);
    this.questoes.splice(indexDestino, 0, removida);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Atribui um estudante à prova, personalizando as necessidades DUA
   * @param {Object} aluno
   * @param {string} aluno.id
   * @param {string} aluno.nome
   * @param {Array<string>} [aluno.necessidades]
   * @param {number} [aluno.nivelSuporte]
   */
  atribuirAluno(aluno = {}) {
    this.alunoId = aluno.id || '';
    this.alunoNome = aluno.nome || '';
    if (Array.isArray(aluno.necessidades) && aluno.necessidades.length > 0) {
      this.necessidades = [...aluno.necessidades];
    }
    if (aluno.nivelSuporte) {
      this.nivelSuporte = aluno.nivelSuporte;
    }
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      disciplina: this.disciplina,
      anoEscolar: this.anoEscolar,
      instrucoes: this.instrucoes,
      questoes: this.questoes.map((q) => (typeof q.toJSON === 'function' ? q.toJSON() : q)),
      alunoId: this.alunoId,
      alunoNome: this.alunoNome,
      necessidades: this.necessidades,
      nivelSuporte: this.nivelSuporte,
      guiaMediacao: this.guiaMediacao,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
