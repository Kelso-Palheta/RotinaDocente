/**
 * Repositório de Persistência Híbrida — Banco de Questões Adaptadas (RN-42 & RN-24)
 * Camada: src/infraestrutura/adaptacoes/
 * Armazena e gerencia itens atômicos para reutilização e composição de provas.
 */

export const QUESTOES_STORAGE_KEY_BASE = 'rotina_docente_questoes_adaptadas_v1';

export class QuestaoAdaptadaRepository {
  /**
   * @param {Object} [options]
   * @param {Object|null} [options.firestoreDb] Instância do Firestore
   */
  constructor({ firestoreDb = null } = {}) {
    this.firestoreDb = firestoreDb;
    this.storageKeyBase = QUESTOES_STORAGE_KEY_BASE;
  }

  _getStorageKey(userId) {
    return userId ? `${this.storageKeyBase}_${userId}` : this.storageKeyBase;
  }

  _lerLocal(userId) {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this._getStorageKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[QuestaoAdaptadaRepository] Falha ao ler localStorage:', err);
      return [];
    }
  }

  _gravarLocal(userId, list) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this._getStorageKey(userId), JSON.stringify(list));
    } catch (err) {
      console.warn('[QuestaoAdaptadaRepository] Falha ao gravar localStorage:', err);
    }
  }

  /**
   * Salva ou atualiza uma questão individual
   * @param {string} userId
   * @param {Object} questao
   * @returns {Promise<Object>}
   */
  async salvarQuestao(userId, questao) {
    const raw = { ...questao };
    const data = JSON.parse(JSON.stringify({
      ...raw,
      id: raw.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      necessidades: Array.isArray(raw.necessidades) ? raw.necessidades : [],
      updatedAt: new Date().toISOString(),
      createdAt: raw.createdAt || new Date().toISOString(),
    }));

    // 1. Atualiza cache local
    const localList = this._lerLocal(userId);
    const existingIndex = localList.findIndex((item) => item.id === data.id);
    if (existingIndex >= 0) {
      localList[existingIndex] = data;
    } else {
      localList.unshift(data); // Mais recentes primeiro
    }
    this._gravarLocal(userId, localList);

    // 2. Sincroniza nuvem se disponível
    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('questoes_adaptadas')
            .doc(data.id)
            .set(data, { merge: true });
        } else {
          const { doc, setDoc } = await import('firebase/firestore');
          const docRef = doc(
            this.firestoreDb,
            'professores',
            userId,
            'questoes_adaptadas',
            data.id
          );
          await setDoc(docRef, data, { merge: true });
        }
      } catch (err) {
        console.warn('[QuestaoAdaptadaRepository] Erro ao sincronizar Firestore:', err);
      }
    }

    return data;
  }

  /**
   * Salva múltiplas questões em lote (ex: geradas pela IA)
   * @param {string} userId
   * @param {Array<Object>} questoes
   * @returns {Promise<Array<Object>>}
   */
  async salvarQuestoesEmLote(userId, questoes = []) {
    if (!Array.isArray(questoes) || questoes.length === 0) return [];
    const salvas = [];
    for (const q of questoes) {
      const salva = await this.salvarQuestao(userId, q);
      salvas.push(salva);
    }
    return salvas;
  }

  /**
   * Lista questões com filtros opcionais
   * @param {string} userId
   * @param {Object} [filtros]
   * @param {Array<string>} [filtros.filtroNecessidades]
   * @param {string} [filtros.disciplina]
   * @param {string} [filtros.anoEscolar]
   * @param {string} [filtros.tipo]
   * @param {string} [filtros.busca]
   * @returns {Promise<Array<Object>>}
   */
  async listarQuestoes(
    userId,
    { filtroNecessidades = [], disciplina = '', anoEscolar = '', tipo = '', busca = '' } = {}
  ) {
    let cloudList = null;

    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const snapshot = await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('questoes_adaptadas')
            .get();

          if (snapshot && Array.isArray(snapshot.docs)) {
            cloudList = snapshot.docs.map((docSnap) =>
              typeof docSnap.data === 'function' ? docSnap.data() : docSnap.data
            );
          }
        } else {
          const { collection, getDocs } = await import('firebase/firestore');
          const colRef = collection(
            this.firestoreDb,
            'professores',
            userId,
            'questoes_adaptadas'
          );
          const snapshot = await getDocs(colRef);
          cloudList = snapshot.docs.map((d) => d.data());
        }
      } catch (err) {
        console.warn('[QuestaoAdaptadaRepository] Fallback para cache local:', err);
      }
    }

    let todas = [];
    if (cloudList && Array.isArray(cloudList)) {
      this._gravarLocal(userId, cloudList);
      todas = cloudList;
    } else {
      todas = this._lerLocal(userId);
    }

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

      if (tipo && item.tipo && item.tipo.toLowerCase() !== tipo.toLowerCase()) {
        return false;
      }

      if (busca && typeof busca === 'string' && busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const texto = `${item.enunciado || ''} ${item.tema || ''} ${item.habilidadeBNCC || ''}`.toLowerCase();
        if (!texto.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Obtém questão por ID
   * @param {string} userId
   * @param {string} questaoId
   * @returns {Promise<Object|null>}
   */
  async obterQuestaoPorId(userId, questaoId) {
    const todas = await this.listarQuestoes(userId);
    return todas.find((q) => q.id === questaoId) || null;
  }

  /**
   * Remove uma questão pelo ID
   * @param {string} userId
   * @param {string} questaoId
   * @returns {Promise<boolean>}
   */
  async removerQuestao(userId, questaoId) {
    const localList = this._lerLocal(userId);
    const filtrada = localList.filter((q) => q.id !== questaoId);
    this._gravarLocal(userId, filtrada);

    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const docRef = this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('questoes_adaptadas')
            .doc(questaoId);
          if (typeof docRef.delete === 'function') {
            await docRef.delete();
          }
        } else {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const docRef = doc(
            this.firestoreDb,
            'professores',
            userId,
            'questoes_adaptadas',
            questaoId
          );
          await deleteDoc(docRef);
        }
      } catch (err) {
        console.warn('[QuestaoAdaptadaRepository] Erro ao deletar Firestore:', err);
      }
    }

    return true;
  }
}
