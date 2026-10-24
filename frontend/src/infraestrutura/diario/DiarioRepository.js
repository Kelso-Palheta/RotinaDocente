import { db } from '@/lib/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const limpar = value => JSON.parse(JSON.stringify(value));
const conflito = () => Object.assign(new Error('Conflito: o Diário mudou em outra aba ou dispositivo. Baixe o rascunho e recarregue a nuvem para revisar.'), { code: 'DIARIO_CONFLITO' });

export class DiarioRepository {
  constructor(userId) {
    if (!userId) throw new Error('Entre na sua conta para acessar o Diário.');
    this.userId = userId;
  }
  ref(path = `professores/${this.userId}/turmas/data`) { return doc(db, ...path.split('/')); }
  async carregar() {
    const canonical = await getDoc(this.ref());
    if (canonical.exists()) {
      const data = canonical.data();
      if (!Array.isArray(data.turmas)) throw new Error('Documento do Diário inválido. Seus dados foram preservados.');
      return { turmas: data.turmas, revision: data.revision || 0, _existe: true, _origem: null };
    }
    for (const path of [`users/${this.userId}/turmas/data`, `professores/${this.userId}`]) {
      const snap = await getDoc(this.ref(path));
      if (snap.exists() && Array.isArray(snap.data().turmas) && snap.data().turmas.length) {
        return { turmas: snap.data().turmas, revision: 0, _existe: false, _origem: path };
      }
    }
    return { turmas: [], revision: 0, _existe: false, _origem: null };
  }
  async salvar(base, turmas) {
    if (!base || !Array.isArray(turmas)) throw new Error('Carregue o Diário antes de salvar.');
    const revision = await runTransaction(db, async tx => {
      const snap = await tx.get(this.ref());
      const atual = snap.exists() ? snap.data() : null;
      let comparavel = atual?.turmas || [];
      if (!atual && base._origem) {
        const legado = await tx.get(this.ref(base._origem));
        comparavel = legado.exists() ? legado.data().turmas || [] : [];
      }
      if (Boolean(atual) !== Boolean(base._existe) || (atual?.revision || 0) !== base.revision || !igual(comparavel, base.turmas)) throw conflito();
      const proxima = base.revision + 1;
      tx.set(this.ref(), { turmas: limpar(turmas), revision: proxima, lastUpdated: Date.now(), schemaVersion: 2 }, { merge: true });
      return proxima;
    });
    return { turmas: limpar(turmas), revision, _existe: true, _origem: null };
  }
}
