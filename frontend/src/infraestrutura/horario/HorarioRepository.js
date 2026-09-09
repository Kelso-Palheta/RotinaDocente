/**
 * Repositório de Persistência Híbrida — Módulo Horário Escolar (RN-24)
 * Camada: src/infraestrutura/horario/
 * Suporta Firestore (autenticado) com fallback transparente para localStorage.
 */

import { SAMPLE_SCHEDULE } from '../../dominio/horario/entidades';

export const LOCAL_STORAGE_KEY = 'meu_horario_escolar_data_v1';

export class HorarioRepository {
  constructor({ firestoreDb = null } = {}) {
    this.firestoreDb = firestoreDb;
    this.storageKey = LOCAL_STORAGE_KEY;
  }

  /**
   * Obtém estado padrão inicial caso não exista nada salvo
   */
  getEstadoInicial() {
    return {
      teacherName: 'Prof. Usuário',
      schoolName: 'Minha Escola',
      shift: 'manha',
      showSaturday: false,
      theme: 'light',
      customSlots: null,
      schedule: SAMPLE_SCHEDULE,
    };
  }

  /**
   * Salva a grade no Firestore e/ou LocalStorage (RN-24)
   */
  async salvarGrade(userId, state) {
    const payload = {
      teacherName: state.teacherName || 'Prof. Usuário',
      schoolName: state.schoolName || '',
      shift: state.shift || 'manha',
      showSaturday: Boolean(state.showSaturday),
      theme: state.theme || 'light',
      customSlots: state.customSlots || null,
      schedule: state.schedule || {},
      updatedAt: new Date().toISOString(),
    };

    // 1. Sempre salva localmente no localStorage como cache / fallback
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
      } catch (err) {
        console.warn('[HorarioRepository] Falha ao salvar no localStorage:', err);
      }
    }

    // 2. Se autenticado e Firestore configurado, tenta salvar na nuvem
    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          // Compatibilidade com interface clássica ou mock
          await this.firestoreDb.collection('horario_escolar').doc(userId).set(payload, { merge: true });
        } else {
          // Modular SDK (firebase/firestore)
          const { doc, setDoc } = await import('firebase/firestore');
          const docRef = doc(this.firestoreDb, 'horario_escolar', userId);
          await setDoc(docRef, payload, { merge: true });
        }
      } catch (err) {
        console.warn('[HorarioRepository] Falha ao sincronizar Firestore, operando em fallback:', err);
      }
    }

    return payload;
  }

  /**
   * Carrega a grade horária do Firestore ou LocalStorage (RN-24)
   */
  async carregarGrade(userId) {
    let cloudData = null;

    // 1. Se autenticado e com Firestore disponível, tenta buscar da nuvem
    if (userId && this.firestoreDb) {
      try {
        if (typeof this.firestoreDb.collection === 'function') {
          const docSnap = await this.firestoreDb.collection('horario_escolar').doc(userId).get();
          if (docSnap && typeof docSnap.data === 'function') {
            cloudData = docSnap.data();
          } else if (docSnap && docSnap.exists) {
            cloudData = docSnap.data;
          }
        } else {
          const { doc, getDoc } = await import('firebase/firestore');
          const docRef = doc(this.firestoreDb, 'horario_escolar', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            cloudData = docSnap.data();
          }
        }
      } catch (err) {
        console.warn('[HorarioRepository] Erro ao carregar do Firestore, recorrendo ao localStorage:', err);
      }
    }

    if (cloudData && typeof cloudData === 'object') {
      // Atualiza cache local com o dado mais recente da nuvem
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(cloudData));
        } catch {
          // ignore
        }
      }
      return cloudData;
    }

    // 2. Fallback: Lê do localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const localRaw = localStorage.getItem(this.storageKey);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[HorarioRepository] Erro ao ler do localStorage:', err);
      }
    }

    // 3. Fallback final: Retorna estado padrão demonstrativo
    return this.getEstadoInicial();
  }
}
