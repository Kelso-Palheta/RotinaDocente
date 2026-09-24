/**
 * Repositório de Persistência Híbrida — Banco de Atividades Adaptadas (RN-38 & RN-24)
 * Camada: src/infraestrutura/adaptacoes/
 * Permite salvar, listar, filtrar por necessidades/deficiência e reaproveitar
 * atividades e provas completas para outros alunos com perfis semelhantes.
 */

export const ATIVIDADES_STORAGE_KEY_BASE = 'rotina_docente_atividades_adaptadas_v1';

export class AtividadeAdaptadaRepository {
  /**
   * @param {Object} [options]
   * @param {Object|null} [options.firestoreDb] Instância do Firestore (Modular ou Clássico/Mock)
   */
  constructor({ firestoreDb = null } = {}) {
    this.firestoreDb = firestoreDb;
    this.storageKeyBase = ATIVIDADES_STORAGE_KEY_BASE;
  }

  /**
   * Retorna a chave de armazenamento isolada por professor
   * @param {string} [userId]
   * @returns {string}
   */
  _getStorageKey(userId) {
    return userId ? `${this.storageKeyBase}_${userId}` : this.storageKeyBase;
  }

  /**
   * Lê lista do localStorage
   * @param {string} [userId]
   * @returns {Array<Object>}
   */
  _lerLocal(userId) {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this._getStorageKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[AtividadeAdaptadaRepository] Falha ao ler localStorage:', err);
      return [];
    }
  }

  /**
   * Grava lista no localStorage
   * @param {string} [userId]
   * @param {Array<Object>} list
   */
  _gravarLocal(userId, list) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this._getStorageKey(userId), JSON.stringify(list));
    } catch (err) {
      console.warn('[AtividadeAdaptadaRepository] Falha ao gravar localStorage:', err);
    }
  }

  /**
   * Salva ou atualiza uma atividade adaptada no repositório
   * @param {string} userId ID do professor
   * @param {Object} atividade Dados da atividade adaptada
   * @returns {Promise<Object>}
   */
  async salvarAtividade(userId, atividade) {
    const rawData = { ...atividade };

    const qtdQuestoes =
      rawData.quantidadeQuestoes ||
      (Array.isArray(rawData.atividadeAdaptada?.questoes)
        ? rawData.atividadeAdaptada.questoes.length
        : 1);

    const atividadeData = {
      ...rawData,
      id: rawData.id || `ativ_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      quantidadeQuestoes: qtdQuestoes,
      necessidades: Array.isArray(rawData.necessidades) ? rawData.necessidades : [],
      updatedAt: new Date().toISOString(),
      createdAt: rawData.createdAt || new Date().toISOString(),
    };

    // 1. Sempre atualiza localmente (Cache / Fallback)
    const localList = this._lerLocal(userId);
    const existingIndex = localList.findIndex((a) => a.id === atividadeData.id);
    if (existingIndex >= 0) {
      localList[existingIndex] = atividadeData;
    } else {
      localList.unshift(atividadeData); // Mais recentes primeiro
    }
    this._gravarLocal(userId, localList);

    // 2. Se conectado à nuvem, sincroniza no Firestore
    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('atividades_adaptadas')
            .doc(atividadeData.id)
            .set(atividadeData, { merge: true });
        } else {
          const { doc, setDoc } = await import('firebase/firestore');
          const docRef = doc(
            this.firestoreDb,
            'professores',
            userId,
            'atividades_adaptadas',
            atividadeData.id
          );
          await setDoc(docRef, atividadeData, { merge: true });
        }
      } catch (err) {
        console.warn(
          '[AtividadeAdaptadaRepository] Falha ao sincronizar com Firestore, operando em fallback:',
          err
        );
      }
    }

    return atividadeData;
  }

  /**
   * Lista todas as atividades adaptadas do professor, com filtros opcionais
   * @param {string} userId
   * @param {Object} [filtros]
   * @param {Array<string>} [filtros.filtroNecessidades] Filtrar por categorias de deficiência
   * @param {string} [filtros.disciplina]
   * @param {string} [filtros.anoEscolar]
   * @returns {Promise<Array<Object>>}
   */
  async listarAtividades(userId, { filtroNecessidades = [], disciplina = '', anoEscolar = '' } = {}) {
    let cloudList = null;

    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const snapshot = await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('atividades_adaptadas')
            .get();

          if (snapshot && Array.isArray(snapshot.docs)) {
            cloudList = snapshot.docs.map((docSnap) =>
              typeof docSnap.data === 'function' ? docSnap.data() : docSnap.data
            );
          }
        } else {
          const { collection, getDocs } = await import('firebase/firestore');
          const colRef = collection(this.firestoreDb, 'professores', userId, 'atividades_adaptadas');
          const snapshot = await getDocs(colRef);
          cloudList = snapshot.docs.map((d) => d.data());
        }
      } catch (err) {
        console.warn(
          '[AtividadeAdaptadaRepository] Erro ao buscar Firestore, recorrendo ao cache local:',
          err
        );
      }
    }

    let todas = [];
    if (cloudList && Array.isArray(cloudList)) {
      this._gravarLocal(userId, cloudList);
      todas = cloudList;
    } else {
      todas = this._lerLocal(userId);
    }

    // Aplica filtros se requisitados
    return todas.filter((item) => {
      if (
        Array.isArray(filtroNecessidades) &&
        filtroNecessidades.length > 0 &&
        !filtroNecessidades.some((nec) => item.necessidades?.includes(nec))
      ) {
        return false;
      }

      if (
        disciplina &&
        item.disciplina &&
        item.disciplina.toLowerCase() !== disciplina.toLowerCase()
      ) {
        return false;
      }

      if (
        anoEscolar &&
        item.anoEscolar &&
        item.anoEscolar.toLowerCase() !== anoEscolar.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Obtém uma atividade específica pelo seu ID
   * @param {string} userId
   * @param {string} atividadeId
   * @returns {Promise<Object|null>}
   */
  async obterAtividadePorId(userId, atividadeId) {
    const todas = await this.listarAtividades(userId);
    return todas.find((a) => a.id === atividadeId) || null;
  }

  /**
   * Reaproveita uma atividade completa para outro estudante (RN-38)
   * Clona toda a estrutura pedagógica adaptada sem necessidade de nova requisição à IA.
   * @param {string} userId
   * @param {string} atividadeId
   * @param {Object} novoAluno
   * @param {string} novoAluno.id
   * @param {string} novoAluno.nome
   * @returns {Promise<Object>}
   */
  async reaproveitarParaAluno(userId, atividadeId, novoAluno) {
    const original = await this.obterAtividadePorId(userId, atividadeId);
    if (!original) {
      throw new Error(`Atividade adaptada de ID "${atividadeId}" não encontrada.`);
    }

    const novaAtividade = {
      ...original,
      id: `ativ_reap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      reaproveitadaDe: atividadeId,
      alunoId: novoAluno.id || '',
      alunoNome: novoAluno.nome || 'Novo Estudante',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.salvarAtividade(userId, novaAtividade);
  }

  /**
   * Remove uma atividade pelo ID
   * @param {string} userId
   * @param {string} atividadeId
   * @returns {Promise<boolean>}
   */
  async removerAtividade(userId, atividadeId) {
    // 1. Remove do cache local
    const localList = this._lerLocal(userId);
    const filtrada = localList.filter((a) => a.id !== atividadeId);
    this._gravarLocal(userId, filtrada);

    // 2. Remove da nuvem
    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const docRef = this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('atividades_adaptadas')
            .doc(atividadeId);

          if (typeof docRef.delete === 'function') {
            await docRef.delete();
          }
        } else {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const docRef = doc(
            this.firestoreDb,
            'professores',
            userId,
            'atividades_adaptadas',
            atividadeId
          );
          await deleteDoc(docRef);
        }
      } catch (err) {
        console.warn('[AtividadeAdaptadaRepository] Erro ao remover do Firestore:', err);
      }
    }

    return true;
  }
}
