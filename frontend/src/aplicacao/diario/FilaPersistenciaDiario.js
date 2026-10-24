import { registrarAlteracao, desfazerAlteracao } from '@/dominio/diario/evolucao';
import { dadosIguais as igual, basesDiarioIguais } from '@/dominio/diario/comparacao';

/** Fila sequencial independente do ciclo de montagem da página. Nunca descarta o rascunho em erro. */
export class FilaPersistenciaDiario {
  constructor({ userId, repository, storage, onChange = () => {} }) {
    this.userId = userId; this.repository = repository; this.storage = storage; this.onChange = onChange;
    this.chave = `diario:${userId}:v2`; this.turmas = []; this.historico = []; this.estado = 'carregando';
    this.base = null; this.erro = ''; this.fila = Promise.resolve(); this.pendentes = 0; this.geracao = 0; this.tokenCarga = 0;
  }
  emitir() { this.onChange({ turmas: this.turmas, estado: this.estado, erro: [this.erro, this.avisoLocal].filter(Boolean).join(' '), historico: this.historico, carregando: this.estado === 'carregando' }); }
  guardar(pendente = true) {
    try { this.storage?.setItem(this.chave, JSON.stringify({ turmas: this.turmas, base: this.base, historico: this.historico.slice(-20), pendente })); }
    catch { this.avisoLocal = 'Não foi possível guardar o rascunho neste dispositivo. Mantenha a página aberta até salvar na nuvem.'; }
  }
  cancelarCarregamento() { this.tokenCarga++; }
  async carregar({ descartarRascunho = false } = {}) {
    const token = ++this.tokenCarga;
    await this.fila;
    if (token !== this.tokenCarga) return this.turmas;
    let cache = null;
    try { cache = JSON.parse(this.storage?.getItem(this.chave) || 'null'); } catch { /* Cache inválido não substitui nuvem. */ }
    this.estado = 'carregando'; this.emitir();
    try {
      const nuvem = await this.repository.carregar();
      if (token !== this.tokenCarga) return this.turmas;
      this.base = nuvem;
      this.historico = Array.isArray(cache?.historico) ? cache.historico : [];
      if (!descartarRascunho && cache?.pendente && Array.isArray(cache.turmas)) {
        this.turmas = cache.turmas;
        if (!basesDiarioIguais(cache.base, nuvem)) {
          this.base = cache.base; this.estado = 'conflito'; this.erro = 'Conflito: existe um rascunho e a nuvem mudou. Baixe o rascunho antes de recarregar.';
        } else { this.estado = 'pendente'; this.erro = 'Rascunho recuperado. Clique em tentar novamente para salvar.'; }
      } else { this.turmas = nuvem.turmas; this.estado = 'salvo'; this.erro = ''; this.guardar(false); }
      this.emitir(); return this.turmas;
    } catch (error) {
      if (token !== this.tokenCarga) return this.turmas;
      this.turmas = Array.isArray(cache?.turmas) ? cache.turmas : [];
      this.base = cache?.base || null; this.historico = cache?.historico || [];
      this.estado = 'falha'; this.erro = error.message; this.emitir(); throw error;
    }
  }
  salvar(turmas, meta = {}) {
    if (!this.base || this.estado === 'conflito') {
      const error = new Error(this.erro || 'Carregue o Diário antes de editar.');
      const rejected = Promise.reject(error); rejected.catch(() => {}); return rejected;
    }
    const registro = registrarAlteracao(this.turmas, turmas, { autor: this.userId, ...meta });
    if (registro.alteracoes.length || registro.ordemAntes) this.historico = [...this.historico, registro].slice(-20);
    this.geracao++;
    this.turmas = turmas; this.pendentes++; this.estado = 'salvando'; this.erro = ''; this.guardar(); this.emitir();
    const operacao = this.fila.then(async () => {
      if (this.estado === 'falha' || this.estado === 'conflito') throw new Error(this.erro || 'Há uma alteração pendente. Tente novamente.');
      const base = await this.repository.salvar(this.base, turmas);
      this.base = base;
      return turmas;
    }).then(result => {
      this.pendentes--;
      if (!this.pendentes) { this.estado = 'salvo'; this.guardar(false); }
      else this.guardar(true);
      this.emitir(); return result;
    }).catch(error => {
      this.pendentes--; this.estado = error.code === 'DIARIO_CONFLITO' || this.estado === 'conflito' ? 'conflito' : 'falha';
      this.erro = error.message; this.guardar(); this.emitir(); throw error;
    });
    this.fila = operacao.catch(() => {});
    operacao.catch(() => {});
    return operacao;
  }
  salvarConfirmado(turmas, meta = {}) {
    const geracao = ++this.geracao;
    const anteriores = this.turmas;
    this.pendentes++;
    const operacao = this.fila.then(async () => {
      if (!this.base || this.estado === 'conflito') throw new Error(this.erro || 'Carregue o Diário antes de restaurar.');
      this.estado = 'salvando'; this.erro = ''; this.emitir();
      const base = await this.repository.salvar(this.base, turmas);
      const registro = registrarAlteracao(anteriores, turmas, { autor: this.userId, ...meta });
      this.historico = [...this.historico, registro].slice(-20);
      this.base = base;
      // Uma edição posterior já é o rascunho atual e continuará na fila.
      if (this.geracao === geracao) this.turmas = turmas;
      this.pendentes--;
      this.estado = this.pendentes ? 'salvando' : 'salvo';
      this.guardar(this.pendentes > 0); this.emitir();
      return turmas;
    }).catch(error => {
      this.pendentes--;
      this.estado = error.code === 'DIARIO_CONFLITO' ? 'conflito' : 'falha'; this.erro = error.message;
      this.guardar(!igual(this.turmas, this.base?.turmas)); this.emitir(); throw error;
    });
    this.fila = operacao.catch(() => {});
    return operacao;
  }
  async tentarNovamente() {
    await this.fila;
    if (!this.base) throw new Error(this.erro || 'Conflito: recarregue a nuvem.');
    if (this.estado === 'conflito') {
      // Recupera falsos conflitos antigos sem aceitar alterações de outra aba.
      const nuvem = await this.repository.carregar();
      if (!basesDiarioIguais(this.base, nuvem)) throw new Error(this.erro || 'Conflito: a nuvem contém alterações que precisam de revisão.');
      this.base = nuvem; this.estado = 'pendente'; this.erro = '';
    }
    return this.salvar(this.turmas, { origem: 'repeticao', descricao: 'Repetir salvamento pendente' });
  }
  desfazer(registro) {
    const turmas = desfazerAlteracao(this.turmas, registro);
    return this.salvar(turmas, { origem: 'desfazer', descricao: `Desfazer: ${registro.descricao}` });
  }
}
