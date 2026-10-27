/**
 * Repositório de Persistência Híbrida — Módulo Horário Escolar (RN-24 / RN-76)
 * Camada: src/infraestrutura/horario/
 *
 * - Firestore (autenticado) com cache local por conta.
 * - A chave base guarda a grade completa apenas do usuário anônimo; para
 *   conta autenticada registra somente um índice sem aulas.
 * - Toda falha é reportada em `persistencia`, nunca escondida como sucesso.
 */

export const LOCAL_STORAGE_KEY = 'meu_horario_escolar_data_v1';

const temSchedule = (valor) =>
  Boolean(valor) && typeof valor === 'object' && Boolean(valor.schedule) && typeof valor.schedule === 'object';

export class HorarioRepository {
  constructor({ firestoreDb = null } = {}) {
    this.firestoreDb = firestoreDb;
    this.storageKey = LOCAL_STORAGE_KEY;
  }

  /** Chave do cache local de uma conta; a chave base é do modo anônimo. */
  chaveConta(userId) {
    return userId ? `${LOCAL_STORAGE_KEY}:${userId}` : LOCAL_STORAGE_KEY;
  }

  lerLocal(chave) {
    if (typeof localStorage === 'undefined') return null;
    try {
      const bruto = localStorage.getItem(chave);
      if (!bruto) return null;
      const dados = JSON.parse(bruto);
      return dados && typeof dados === 'object' ? dados : null;
    } catch (err) {
      console.warn('[HorarioRepository] Erro ao ler do localStorage:', err);
      return null;
    }
  }

  gravarLocal(chave, valor) {
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (err) {
      console.warn('[HorarioRepository] Falha ao salvar no localStorage:', err);
      return false;
    }
  }

  /**
   * Estado inicial sem aulas. Nenhuma grade de demonstração é apresentada
   * como agenda real (RN-76).
   */
  getEstadoInicial() {
    return {
      teacherName: 'Prof. Usuário',
      schoolName: 'Minha Escola',
      shift: 'manha',
      showSaturday: false,
      theme: 'light',
      customSlots: null,
      schedule: {},
    };
  }

  /** Índice sem aulas: permite localizar a conta sem vazar a grade. */
  gravarIndiceConta(userId) {
    if (!userId) return;
    this.gravarLocal(this.storageKey, {
      conta: userId,
      chave: this.chaveConta(userId),
      atualizadoEm: new Date().toISOString(),
    });
  }

  async salvarNaNuvem(userId, payload) {
    if (typeof this.firestoreDb.collection === 'function') {
      // Compatibilidade com interface clássica ou mock
      await this.firestoreDb.collection('horario_escolar').doc(userId).set(payload, { merge: true });
      return;
    }
    // Modular SDK (firebase/firestore)
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(this.firestoreDb, 'horario_escolar', userId), payload, { merge: true });
  }

  /**
   * Salva a grade no LocalStorage e no Firestore, informando onde de fato gravou.
   * O payload continua no retorno por compatibilidade com a RN-24.
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

    const persistencia = { local: 'falha', nuvem: 'nao_aplicavel', estado: 'falha' };

    const localOk = this.gravarLocal(this.chaveConta(userId), payload);
    persistencia.local = localOk ? 'ok' : 'falha';
    if (localOk && userId) this.gravarIndiceConta(userId);

    if (userId && this.firestoreDb) {
      try {
        await this.salvarNaNuvem(userId, payload);
        persistencia.nuvem = 'ok';
      } catch (err) {
        persistencia.nuvem = 'falha';
        console.warn('[HorarioRepository] Falha ao sincronizar Firestore:', err);
      }
    }

    if (persistencia.nuvem === 'ok') {
      persistencia.estado = 'nuvem';
    } else if (!userId) {
      persistencia.estado = persistencia.local === 'ok' ? 'local' : 'falha';
    } else {
      persistencia.estado = persistencia.local === 'ok' ? 'pendente' : 'falha';
    }

    return { ...payload, persistencia };
  }

  async lerDaNuvem(userId, somenteReal) {
    if (typeof this.firestoreDb.collection === 'function') {
      const docSnap = await this.firestoreDb.collection('horario_escolar').doc(userId).get();
      if (docSnap && typeof docSnap.data === 'function') return docSnap.data();
      if (docSnap && docSnap.exists) return docSnap.data;
      return null;
    }
    const { doc, getDoc, getDocFromServer } = await import('firebase/firestore');
    const docRef = doc(this.firestoreDb, 'horario_escolar', userId);
    const docSnap = await (somenteReal ? getDocFromServer(docRef) : getDoc(docRef));
    return docSnap.exists() ? docSnap.data() : null;
  }

  /**
   * Carrega a grade horária do Firestore ou do cache local da própria conta.
   * `persistencia.origem` informa `nuvem`, `local` ou `padrao`.
   */
  async carregarGrade(userId, { somenteReal = false } = {}) {
    if (somenteReal && !userId) return null;

    let cloudData = null;
    if (userId && this.firestoreDb) {
      try {
        cloudData = await this.lerDaNuvem(userId, somenteReal);
      } catch (err) {
        if (somenteReal) throw err;
        console.warn('[HorarioRepository] Erro ao carregar do Firestore, recorrendo ao cache local:', err);
      }
    }

    if (cloudData && typeof cloudData === 'object') {
      if (!somenteReal) {
        // Mantém o cache da própria conta atualizado; nunca grava grade na chave base.
        this.gravarLocal(this.chaveConta(userId), cloudData);
        this.gravarIndiceConta(userId);
      }
      return { ...cloudData, persistencia: { origem: 'nuvem' } };
    }

    if (somenteReal) return null;

    const local = this.lerLocal(this.chaveConta(userId));
    if (temSchedule(local)) {
      return { ...local, persistencia: { origem: 'local' } };
    }

    return { ...this.getEstadoInicial(), persistencia: { origem: 'padrao' } };
  }

  /**
   * Rascunho gravado antes do isolamento por conta vive na chave base.
   * É apenas detectado; a migração exige confirmação explícita.
   */
  detectarCacheLegado() {
    const base = this.lerLocal(this.storageKey);
    if (!temSchedule(base)) return { disponivel: false, aulas: 0, atualizadoEm: null };
    const aulas = Object.keys(base.schedule).length;
    if (aulas === 0) return { disponivel: false, aulas: 0, atualizadoEm: null };
    return { disponivel: true, aulas, atualizadoEm: base.updatedAt || null };
  }

  /** Copia o rascunho legado para a conta somente quando `aceitar` é verdadeiro. */
  migrarCacheLegado(userId, aceitar = false) {
    if (!userId || !aceitar) return null;
    const base = this.lerLocal(this.storageKey);
    if (!temSchedule(base)) return null;

    const payload = { ...base, updatedAt: new Date().toISOString() };
    if (!this.gravarLocal(this.chaveConta(userId), payload)) return null;
    this.gravarIndiceConta(userId);
    return payload;
  }

  /** Retira a oferta de migração sem apagar a grade já salva da conta. */
  descartarCacheLegado(userId) {
    if (typeof localStorage === 'undefined') return;
    try {
      if (userId) {
        this.gravarIndiceConta(userId);
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch (err) {
      console.warn('[HorarioRepository] Falha ao descartar rascunho legado:', err);
    }
  }
}
