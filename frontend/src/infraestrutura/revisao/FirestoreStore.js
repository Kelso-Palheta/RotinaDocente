/** Persistência Admin injetada; não deve ser importada por componentes clientes. */
export class FirestoreRevisaoStore {
  constructor(db) {
    this.db = db;
  }

  consulta(path, filtros = []) {
    if (!Array.isArray(filtros)) throw new TypeError('Filtros devem ser uma lista.');
    return filtros.reduce((query, filtro) => {
      if (!Array.isArray(filtro) || filtro.length !== 3 || typeof filtro[0] !== 'string' || !filtro[0] || filtro[1] !== '==') {
        throw new TypeError('Filtro inválido: esperado [campo, ==, valor].');
      }
      return query.where(...filtro);
    }, this.db.collection(path));
  }

  async get(path) {
    return dadosDocumento(await this.db.doc(path).get());
  }

  async list(path, filtros = []) {
    return dadosLista(await this.consulta(path, filtros).get());
  }

  async set(path, dados) {
    await this.db.doc(path).set(dados);
  }

  transaction(executar) {
    return this.db.runTransaction(async transaction => {
      let escreveu = false;
      const ler = async referencia => {
        if (escreveu) throw new Error('Todas as leituras devem preceder as escritas da transação.');
        return transaction.get(referencia);
      };
      return executar({
        get: async path => dadosDocumento(await ler(this.db.doc(path))),
        list: async (path, filtros = []) => dadosLista(await ler(this.consulta(path, filtros))),
        set: (path, dados) => { escreveu = true; transaction.set(this.db.doc(path), dados); },
        create: (path, dados) => { escreveu = true; transaction.create(this.db.doc(path), dados); },
        delete: path => { escreveu = true; transaction.delete(this.db.doc(path)); },
      });
    });
  }

  listenDoc(path, onNext, onError) {
    return this.db.doc(path).onSnapshot(snapshot => onNext(dadosDocumento(snapshot)), onError);
  }

  listenList(path, filtros = [], onNext, onError) {
    return this.consulta(path, filtros).onSnapshot(snapshot => onNext(dadosLista(snapshot)), onError);
  }
}

function dadosDocumento(snapshot) {
  return snapshot.exists ? snapshot.data() : null;
}

function dadosLista(snapshot) {
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
}
