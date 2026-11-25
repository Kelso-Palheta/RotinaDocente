import { falha, hashRequisicao, idRequisicao, segmento } from '@/dominio/aula-gamificada/comum';
import { normalizarPlano, resumoPlano } from '@/dominio/aula-gamificada/planos';
import { validarTipoModalidade } from '@/dominio/aula-gamificada/modalidades';

export const planoPath = (uid, id) => `aulaGamificadaDocentes/${uid}/planos/${id}`;
const indicePath = uid => `aulaGamificadaDocentes/${uid}/planejamento/indice`;
const reqPath = (uid, requestId) => `aulaGamificadaDocentes/${uid}/requisicoes/${hashRequisicao('plano', requestId)}`;
const docente = ator => {
  if (ator?.tipo !== 'professor') throw falha(403, 'Entre com a conta docente para esta ação.');
  return segmento(ator.uid, { campo: 'UID do professor', max: 128 });
};

export class PlanejamentoService {
  constructor({ store, agora, gerarId, lerTurmas }) { Object.assign(this, { store, agora, gerarId, lerTurmas }); }
  async listarPlanos(ator) {
    const uid = docente(ator);
    const indice = await this.store.get(indicePath(uid));
    return { planos: (indice?.planos || []).slice(0, 100).sort((a, b) => b.atualizadoEmMs - a.atualizadoEmMs) };
  }
  async obterPlano(ator, id) {
    const uid = docente(ator);
    const plano = await this.store.get(planoPath(uid, segmento(id, { campo: 'ID do plano', max: 80 })));
    if (!plano) throw falha(404, 'Plano não encontrado nesta conta.');
    return { plano };
  }
  async salvarPlano(ator, body) {
    const uid = docente(ator);
    const requestId = idRequisicao(body?.requestId);
    const dados = normalizarPlano(body?.plano);
    const assinatura = JSON.stringify({ plano: dados, expectedRevision: body.expectedRevision ?? null });
    // Gerado uma vez fora do callback: retries do Firestore mantêm o mesmo ID.
    const id = dados.id || segmento(this.gerarId(), { campo: 'ID do plano', max: 80 });
    return this.store.transaction(async tx => {
      const anterior = await tx.get(reqPath(uid, requestId));
      if (anterior) {
        if (anterior.tipo !== 'plano' || anterior.assinatura !== assinatura) throw falha(409, 'Este pedido já foi usado para outro salvamento.');
        return structuredClone(anterior.resposta);
      }
      const existente = await tx.get(planoPath(uid, id));
      const indice = await tx.get(indicePath(uid));
      if (dados.id && !existente) throw falha(404, 'Plano não encontrado nesta conta.');
      if (!dados.id && existente) throw falha(409, 'Não foi possível reservar o plano. Tente novamente.');
      if (existente && (!Number.isInteger(body.expectedRevision) || body.expectedRevision !== existente.revision)) throw falha(409, 'O plano mudou. Reabra a versão atual antes de salvar.');
      if (!existente && body.expectedRevision != null && body.expectedRevision !== 0) throw falha(409, 'A versão inicial do plano é inválida.');
      const resumos = indice?.planos || [];
      if (!existente && resumos.length >= 100) throw falha(422, 'Limite de 100 planos por professor atingido.');
      const turmas = (await this.lerTurmas(uid, tx)).filter(t => !t.arquivada);
      if (dados.turmaIds.some(id => !turmas.some(t => String(t.id) === id))) throw falha(422, 'Uma das turmas não pertence ao professor.');
      for (const questaoId of dados.questaoIds) {
        const questao = await tx.get(`aulaGamificadaDocentes/${uid}/questoes/${questaoId}`);
        if (!questao) throw falha(404, 'Uma das questões não está no banco do professor.');
        if (questao.status !== 'revisada') throw falha(422, 'Revise as questões antes de vinculá-las ao plano.');
        validarTipoModalidade(dados.modalidade, questao.tipo);
      }
      const agora = this.agora();
      const plano = { ...dados, id, revision: (existente?.revision || 0) + 1, criadoEmMs: existente?.criadoEmMs ?? agora, atualizadoEmMs: agora };
      const resposta = { plano };
      // Todas as leituras precedem as escritas, como exigido pelo Firestore Admin.
      tx.set(planoPath(uid, id), plano);
      tx.set(indicePath(uid), { planos: [resumoPlano(plano), ...resumos.filter(p => p.id !== id)] });
      tx.set(reqPath(uid, requestId), { tipo: 'plano', assinatura, resposta, criadoEmMs: agora });
      return resposta;
    });
  }
}
