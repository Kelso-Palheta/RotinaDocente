import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { dadosIguais } from '@/dominio/diario/comparacao';
import { chaveVinculoAtividade } from '@/utils/diario/tokenUtils';
import { eAtividadeRecuperacaoValida } from '@/dominio/atividades/recuperacaoSemestral';
import { aplicarLancamentoRecuperacao, prepararLancamentoRecuperacao } from '@/aplicacao/diario/lancarRecuperacao';

const conflito = () => Object.assign(
  new Error('Conflito: o Diário mudou em outra aba ou dispositivo. Gere a prévia novamente.'),
  { code: 'DIARIO_CONFLITO' }
);

const previaObsoleta = (mensagem) => Object.assign(
  new Error(mensagem || 'A recuperação mudou depois da prévia. Gere a prévia novamente.'),
  { code: 'RECUPERACAO_PREVIA_OBSOLETA' }
);

const limpar = valor => JSON.parse(JSON.stringify(valor));

/**
 * Lançamento de recuperação na persistência canônica do Diário.
 * A transação revalida revisão, conjunto, atividades e entregas: uma prévia
 * obsoleta nunca autoriza gravar nota sobre correção nova.
 */
export class RecuperacaoRepository {
  constructor(userId) {
    if (!userId) throw new Error('Entre na sua conta para lançar a recuperação.');
    this.userId = userId;
  }

  ref() { return doc(db, 'professores', this.userId, 'turmas', 'data'); }

  /**
   * `base` é o snapshot carregado do Diário no momento da prévia.
   * `entregas` não é confiado para gravar: serve apenas de conferência.
   */
  async lancar({ base, conjunto, atividades = [], previa, selecionados, confirmarSubstituicao = [], por = null }) {
    if (!base || !conjunto?.id || !previa?.conjuntoId) throw new Error('Prévia de recuperação incompleta.');
    return runTransaction(db, async tx => {
      const diarioSnap = await tx.get(this.ref());
      if (!diarioSnap.exists()) throw conflito();
      const dados = diarioSnap.data();
      const turmas = Array.isArray(dados.turmas) ? dados.turmas : [];
      if ((dados.revision || 0) !== base.revision || !dadosIguais(turmas, base.turmas || [])) throw conflito();

      const conjuntoSnap = await tx.get(doc(db, 'professores', this.userId, 'conjuntos_recuperacao', conjunto.id));
      if (!conjuntoSnap.exists() || conjuntoSnap.data().professorId !== this.userId) {
        throw previaObsoleta('O conjunto de recuperação não existe mais.');
      }
      const conjuntoAtual = { ...conjuntoSnap.data(), id: conjunto.id };
      if (Number(conjuntoAtual.versao || 1) !== Number(conjunto.versao || 1)) {
        throw previaObsoleta();
      }
      if (conjuntoAtual.estado === 'cancelado') throw previaObsoleta('O conjunto de recuperação foi cancelado.');

      const atividadesAtuais = [];
      for (const atividade of atividades) {
        const snap = await tx.get(doc(db, 'atividades', atividade.id));
        if (!snap.exists()) throw previaObsoleta('Uma atividade da recuperação não existe mais.');
        const atual = { ...snap.data(), id: atividade.id };
        if (!eAtividadeRecuperacaoValida(atual)) throw previaObsoleta('A composição da recuperação mudou.');
        if (atual.conjuntoRecuperacaoId !== conjunto.id
          || String(atual.semestre) !== String(conjuntoAtual.semestre)
          || !atual.turmaIds?.includes(conjuntoAtual.turmaId)
          || atual.professorId !== this.userId) {
          throw previaObsoleta('Uma atividade saiu do conjunto de recuperação.');
        }
        atividadesAtuais.push(atual);
      }

      const entregasAtuais = [];
      for (const aluno of previa.alunos || []) {
        for (const atividade of atividadesAtuais) {
          const novoId = `${atividade.id}__${chaveVinculoAtividade(conjuntoAtual.turmaId, aluno.alunoId)}`;
          const novo = await tx.get(doc(db, 'entregas', novoId));
          if (novo.exists()) { entregasAtuais.push({ ...novo.data(), id: novoId }); continue; }
          const antigoId = `${atividade.id}_${aluno.alunoId}`;
          const antigo = await tx.get(doc(db, 'entregas', antigoId));
          if (antigo.exists() && antigo.data().turmaId === conjuntoAtual.turmaId) {
            entregasAtuais.push({ ...antigo.data(), id: antigoId });
          }
        }
      }

      const recalculada = prepararLancamentoRecuperacao({
        turmas,
        conjunto: conjuntoAtual,
        atividades: atividadesAtuais,
        entregas: entregasAtuais,
      });

      for (const aluno of previa.alunos || []) {
        const atual = recalculada.alunos.find(item => item.alunoId === aluno.alunoId);
        if (!atual || atual.chave !== aluno.chave) throw previaObsoleta();
      }

      const plano = aplicarLancamentoRecuperacao({
        turmas,
        previa: recalculada,
        selecionados,
        confirmarSubstituicao,
        em: new Date().toISOString(),
        por,
      });
      if (!plano.lancados.length) return { ...plano, revision: dados.revision || 0 };

      const revision = (dados.revision || 0) + 1;
      tx.set(this.ref(), {
        turmas: limpar(plano.turmas),
        revision,
        lastUpdated: Date.now(),
        schemaVersion: 2,
      }, { merge: true });
      return { ...plano, revision };
    });
  }
}
