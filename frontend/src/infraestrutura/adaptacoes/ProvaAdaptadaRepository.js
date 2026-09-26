/**
 * Repositório de Persistência Híbrida — Provas e Avaliações Adaptadas (RN-42 & RN-24)
 * Camada: src/infraestrutura/adaptacoes/
 * Persiste provas montadas, seus itens vinculados e metadados do estudante PEI.
 */

export const PROVAS_STORAGE_KEY_BASE = 'rotina_docente_provas_adaptadas_v1';

export class ProvaAdaptadaRepository {
  /**
   * @param {Object} [options]
   * @param {Object|null} [options.firestoreDb]
   */
  constructor({ firestoreDb = null } = {}) {
    this.firestoreDb = firestoreDb;
    this.storageKeyBase = PROVAS_STORAGE_KEY_BASE;
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
      console.warn('[ProvaAdaptadaRepository] Falha ao ler localStorage:', err);
      return [];
    }
  }

  _gravarLocal(userId, list) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this._getStorageKey(userId), JSON.stringify(list));
    } catch (err) {
      console.warn('[ProvaAdaptadaRepository] Falha ao gravar localStorage:', err);
    }
  }

  /**
   * Salva ou atualiza uma prova adaptada
   * @param {string} userId
   * @param {Object} prova
   * @returns {Promise<Object>}
   */
  async salvarProva(userId, prova) {
    const raw = { ...prova };
    const data = JSON.parse(JSON.stringify({
      ...raw,
      id: raw.id || `prova_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      questoes: Array.isArray(raw.questoes) ? raw.questoes : [],
      necessidades: Array.isArray(raw.necessidades) ? raw.necessidades : [],
      updatedAt: new Date().toISOString(),
      createdAt: raw.createdAt || new Date().toISOString(),
    }));

    const localList = this._lerLocal(userId);
    const existingIndex = localList.findIndex((p) => p.id === data.id);
    if (existingIndex >= 0) {
      localList[existingIndex] = data;
    } else {
      localList.unshift(data);
    }
    this._gravarLocal(userId, localList);

    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('provas_adaptadas')
            .doc(data.id)
            .set(data, { merge: true });
        } else {
          const { doc, setDoc } = await import('firebase/firestore');
          const docRef = doc(
            this.firestoreDb,
            'professores',
            userId,
            'provas_adaptadas',
            data.id
          );
          await setDoc(docRef, data, { merge: true });
        }
      } catch (err) {
        console.warn('[ProvaAdaptadaRepository] Erro ao sincronizar Firestore:', err);
      }
    }

    return data;
  }

  /**
   * Lista provas com filtros opcionais
   * @param {string} userId
   * @param {Object} [filtros]
   * @returns {Promise<Array<Object>>}
   */
  async listarProvas(userId, { disciplina = '', alunoId = '' } = {}) {
    let cloudList = null;

    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const snapshot = await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('provas_adaptadas')
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
            'provas_adaptadas'
          );
          const snapshot = await getDocs(colRef);
          cloudList = snapshot.docs.map((d) => d.data());
        }
      } catch (err) {
        console.warn('[ProvaAdaptadaRepository] Fallback para cache local:', err);
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
      if (disciplina && item.disciplina && item.disciplina.toLowerCase() !== disciplina.toLowerCase()) {
        return false;
      }
      if (alunoId && item.alunoId !== alunoId) {
        return false;
      }
      return true;
    });
  }

  /**
   * Obtém prova por ID
   * @param {string} userId
   * @param {string} provaId
   * @returns {Promise<Object|null>}
   */
  async obterProvaPorId(userId, provaId) {
    const todas = await this.listarProvas(userId);
    return todas.find((p) => p.id === provaId) || null;
  }

  /**
   * Remove uma prova por ID
   * @param {string} userId
   * @param {string} provaId
   * @returns {Promise<boolean>}
   */
  async removerProva(userId, provaId) {
    const localList = this._lerLocal(userId);
    const filtrada = localList.filter((p) => p.id !== provaId);
    this._gravarLocal(userId, filtrada);

    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const docRef = this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('provas_adaptadas')
            .doc(provaId);
          if (typeof docRef.delete === 'function') {
            await docRef.delete();
          }
        } else {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const docRef = doc(
            this.firestoreDb,
            'professores',
            userId,
            'provas_adaptadas',
            provaId
          );
          await deleteDoc(docRef);
        }
      } catch (err) {
        console.warn('[ProvaAdaptadaRepository] Erro ao deletar Firestore:', err);
      }
    }

    return true;
  }
}
