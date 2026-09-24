/**
 * Repositório de Persistência Híbrida — Perfis de Alunos PEI (RN-33 & RN-24)
 * Camada: src/infraestrutura/adaptacoes/
 * Suporta Firestore (subcoleção 'professores/{userId}/alunos_adaptados')
 * com fallback transparente e cache em LocalStorage.
 */

export const ALUNOS_STORAGE_KEY_BASE = 'rotina_docente_alunos_adaptados_v1';

export class AlunoAdaptadoRepository {
  /**
   * @param {Object} [options]
   * @param {Object|null} [options.firestoreDb] Instância do Firestore (Modular ou Clássico/Mock)
   */
  constructor({ firestoreDb = null } = {}) {
    this.firestoreDb = firestoreDb;
    this.storageKeyBase = ALUNOS_STORAGE_KEY_BASE;
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
      console.warn('[AlunoAdaptadoRepository] Falha ao ler localStorage:', err);
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
      console.warn('[AlunoAdaptadoRepository] Falha ao gravar localStorage:', err);
    }
  }

  /**
   * Salva ou atualiza um aluno (Híbrido: Local + Cloud)
   * @param {string} userId ID do professor
   * @param {Object|import('../../dominio/adaptacoes/AlunoInclusivo').AlunoInclusivo} aluno
   * @returns {Promise<Object>}
   */
  async salvarAluno(userId, aluno) {
    const rawData = typeof aluno?.toJSON === 'function' ? aluno.toJSON() : { ...aluno };

    const alunoData = {
      ...rawData,
      id: rawData.id || `aluno_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      updatedAt: new Date().toISOString(),
      createdAt: rawData.createdAt || new Date().toISOString(),
    };

    // 1. Sempre atualiza localmente (Cache / Fallback)
    const localList = this._lerLocal(userId);
    const existingIndex = localList.findIndex((a) => a.id === alunoData.id);
    if (existingIndex >= 0) {
      localList[existingIndex] = alunoData;
    } else {
      localList.push(alunoData);
    }
    this._gravarLocal(userId, localList);

    // 2. Se conectado à nuvem, sincroniza no Firestore
    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          // Interface encadeada clássica ou mock de testes
          await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('alunos_adaptados')
            .doc(alunoData.id)
            .set(alunoData, { merge: true });
        } else {
          // Modular SDK (firebase/firestore)
          const { doc, setDoc } = await import('firebase/firestore');
          const docRef = doc(this.firestoreDb, 'professores', userId, 'alunos_adaptados', alunoData.id);
          await setDoc(docRef, alunoData, { merge: true });
        }
      } catch (err) {
        console.warn('[AlunoAdaptadoRepository] Falha ao sincronizar com Firestore, operando em fallback:', err);
      }
    }

    return alunoData;
  }

  /**
   * Lista todos os alunos cadastrados pelo professor
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async listarAlunos(userId) {
    let cloudList = null;

    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const snapshot = await this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('alunos_adaptados')
            .get();

          if (snapshot && Array.isArray(snapshot.docs)) {
            cloudList = snapshot.docs.map((docSnap) =>
              typeof docSnap.data === 'function' ? docSnap.data() : docSnap.data
            );
          }
        } else {
          const { collection, getDocs } = await import('firebase/firestore');
          const colRef = collection(this.firestoreDb, 'professores', userId, 'alunos_adaptados');
          const snapshot = await getDocs(colRef);
          cloudList = snapshot.docs.map((d) => d.data());
        }
      } catch (err) {
        console.warn('[AlunoAdaptadoRepository] Erro ao buscar Firestore, recorrendo ao cache local:', err);
      }
    }

    if (cloudList && Array.isArray(cloudList)) {
      // Sincroniza cache local com o dado mais fresco
      this._gravarLocal(userId, cloudList);
      return cloudList;
    }

    // Fallback: LocalStorage
    return this._lerLocal(userId);
  }

  /**
   * Obtém um aluno específico pelo seu ID
   * @param {string} userId
   * @param {string} alunoId
   * @returns {Promise<Object|null>}
   */
  async obterAlunoPorId(userId, alunoId) {
    const todos = await this.listarAlunos(userId);
    return todos.find((a) => a.id === alunoId) || null;
  }

  /**
   * Remove um aluno pelo ID
   * @param {string} userId
   * @param {string} alunoId
   * @returns {Promise<boolean>}
   */
  async removerAluno(userId, alunoId) {
    // 1. Remove do localStorage
    const localList = this._lerLocal(userId);
    const filtrada = localList.filter((a) => a.id !== alunoId);
    this._gravarLocal(userId, filtrada);

    // 2. Remove do Firestore se conectado
    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const docRef = this.firestoreDb
            .collection('professores')
            .doc(userId)
            .collection('alunos_adaptados')
            .doc(alunoId);

          if (typeof docRef.delete === 'function') {
            await docRef.delete();
          }
        } else {
          const { doc, deleteDoc } = await import('firebase/firestore');
          const docRef = doc(this.firestoreDb, 'professores', userId, 'alunos_adaptados', alunoId);
          await deleteDoc(docRef);
        }
      } catch (err) {
        console.warn('[AlunoAdaptadoRepository] Erro ao remover do Firestore:', err);
      }
    }

    return true;
  }
}
