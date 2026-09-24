import { AIConfig } from '../../dominio/ai/AIConfig';

const STORAGE_KEY = 'rotina_docente_user_ai_config';

function getStorage() {
  if (typeof localStorage !== 'undefined') return localStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

/**
 * Repositório de Infraestrutura para Configuração de IA (BYOK)
 * RN-28: Persistência híbrida em LocalStorage com sincronização Firestore.
 */
export class AIConfigRepository {
  constructor(firestoreDb = null) {
    this.db = firestoreDb;
  }

  /**
   * Carrega a configuração do localStorage de forma síncrona.
   * @returns {AIConfig | null}
   */
  carregarLocal() {
    try {
      const storage = getStorage();
      if (!storage) return null;
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return AIConfig.fromJSON(parsed);
    } catch (e) {
      console.warn('[AIConfigRepository] Erro ao ler do localStorage:', e);
      return null;
    }
  }

  /**
   * Salva a configuração no localStorage.
   * @param {AIConfig} config
   */
  salvarLocal(config) {
    if (!config || !(config instanceof AIConfig)) {
      throw new Error('[AIConfigRepository] config deve ser uma instância válida de AIConfig.');
    }
    const storage = getStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(config.toJSON()));
    }
  }

  /**
   * Remove a configuração do localStorage (desconectar chave).
   */
  limparLocal() {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Sincroniza a configuração de IA com o Firestore sob o perfil do professor.
   * @param {string} userId
   * @param {AIConfig | null} config
   */
  async sincronizarFirestore(userId, config) {
    if (!userId) return;
    try {
      const { db } = await import('../../lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');

      const targetDb = this.db || db;
      if (!targetDb) return;

      const userDocRef = doc(targetDb, 'professores', userId);
      await updateDoc(userDocRef, {
        ai_config: config ? config.toJSON() : null,
      });
    } catch (e) {
      console.warn('[AIConfigRepository] Aviso ao sincronizar com Firestore:', e?.message || e);
    }
  }

  /**
   * Carrega a configuração salva no Firestore.
   * @param {string} userId
   * @returns {Promise<AIConfig | null>}
   */
  async carregarFirestore(userId) {
    if (!userId) return null;
    try {
      const { db } = await import('../../lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      const targetDb = this.db || db;
      if (!targetDb) return null;

      const snap = await getDoc(doc(targetDb, 'professores', userId));
      if (snap.exists()) {
        const data = snap.data();
        if (data?.ai_config) {
          const config = AIConfig.fromJSON(data.ai_config);
          if (config && config.isValid()) {
            this.salvarLocal(config);
            return config;
          }
        }
      }
      return null;
    } catch (e) {
      console.warn('[AIConfigRepository] Erro ao carregar do Firestore:', e?.message || e);
      return null;
    }
  }
}
