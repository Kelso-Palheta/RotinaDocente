import {validarEntradaImportacaoAnual,montarPromptAnual,normalizarAnualImportado} from '@/dominio/aula-gamificada/importacaoAnual';
import {ehPlanejamentoAnual,normalizarVinculoAnual,validarConteudosAnuais} from '@/dominio/aula-gamificada/planejamentoAnual';
import { falha, hashRequisicao, idRequisicao, segmento } from '@/dominio/aula-gamificada/comum';
import { normalizarPlano, normalizarOrigemPlano, resumoPlano, abrangenciaDoPlano } from '@/dominio/aula-gamificada/planos';
import { validarTipoModalidade } from '@/dominio/aula-gamificada/modalidades';

export const planoPath = (uid, id) => `aulaGamificadaDocentes/${uid}/planos/${id}`;
const indicePath = uid => `aulaGamificadaDocentes/${uid}/planejamento/indice`;
const reqPath = (uid, requestId) => `aulaGamificadaDocentes/${uid}/requisicoes/${hashRequisicao('plano', requestId)}`;
const docente = ator => {
  if (ator?.tipo !== 'professor') throw falha(403, 'Entre com a conta docente para esta ação.');
  return segmento(ator.uid, { campo: 'UID do professor', max: 128 });
};

export class PlanejamentoService {
  constructor({ store, agora, gerarId, lerTurmas, ia }) { Object.assign(this, { store, agora, gerarId, lerTurmas, ia }); }
  async gerarAnual(ator,body,userConfig) {
    docente(ator);
    if (!userConfig?.apiKey) throw Object.assign(falha(400,'Conecte sua chave de IA para organizar o planejamento anual.'),{code:'AI_KEY_REQUIRED'});
    const entrada=validarEntradaImportacaoAnual(body);
    if (!this.ia?.gerar) throw falha(503,'Organização por IA indisponível. Tente novamente.');
    let json;
    try { json=await this.ia.gerar({...montarPromptAnual(entrada),userConfig}); } catch(e) {
      if(e instanceof SyntaxError||String(e.message||'').startsWith('IA não retornou JSON válido.')) throw falha(422,'A IA retornou uma resposta incompleta ou inválida. Revise o material e tente novamente.');
      throw e;
    }
    return normalizarAnualImportado(json,entrada);
  }
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
      let fonteOrigem = null;
      let origem = existente?.origem ? structuredClone(existente.origem) : null;
      if (origem && origem.finalidade !== 'conteudo' && dados.tipo === 'normal') throw falha(422, 'Uma versão gamificada com origem não pode ser convertida em planejamento regular.');
      if (origem && origem.finalidade === 'conteudo' && dados.abrangencia !== 'conteudo') throw falha(422, 'Um plano de conteúdo derivado não pode ser convertido em planejamento da disciplina.');
      if (existente && dados.origem) {
        if (!existente.origem || JSON.stringify(normalizarOrigemPlano(existente.origem)) !== JSON.stringify(dados.origem)) throw falha(422, 'A origem de uma versão salva não pode ser atribuída ou alterada. Crie outra cópia.');
      } else if (!existente && dados.origem) {
        const fonte = await tx.get(planoPath(uid, dados.origem.planoId));
        fonteOrigem = fonte;
        if (!fonte) throw falha(404, 'Plano de origem não encontrado nesta conta.');
        if (dados.origem.finalidade === 'conteudo') {
          if (abrangenciaDoPlano(fonte) !== 'planejamento') throw falha(422, 'A origem precisa ser um planejamento da disciplina.');
          if (dados.abrangencia !== 'conteudo') throw falha(422, 'O plano derivado precisa ser um plano de conteúdo.');
        } else if (fonte.tipo !== 'normal') {
          throw falha(422, 'A origem precisa ser um planejamento regular.');
        }
        if (fonte.revision !== dados.origem.revision) throw falha(409, 'O planejamento de origem mudou. Reabra a versão atual antes de criar a adaptação.');
        if (dados.origem.etapaIds.some(id => !fonte.etapas.some(e => e.id === id))) throw falha(422, 'Uma das etapas não pertence ao planejamento de origem.');
        const etapaIds = fonte.etapas.filter(e => dados.origem.etapaIds.includes(e.id)).map(e => e.id);
        origem = {
          planoId: dados.origem.planoId, revision: fonte.revision, titulo: fonte.titulo, escala: fonte.escala || 'aula', etapaIds,
          ...(dados.origem.finalidade ? { abrangencia: abrangenciaDoPlano(fonte), finalidade: 'conteudo' } : {}),
        };
      }
      if (existente?.integracaoAnual && ehPlanejamentoAnual(existente) && !ehPlanejamentoAnual(dados)) throw falha(422, 'O anual salvo é a raiz. Crie outro plano para um formato menor.');
      if (dados.vinculoAnual?.planoId === id) throw falha(422, 'Um plano não pode ter a si próprio como base anual.');
      const assinaturaVinculo = v => JSON.stringify(normalizarVinculoAnual(v));
      let vinculoAnual = existente?.vinculoAnual ? structuredClone(existente.vinculoAnual) : null;
      if (vinculoAnual && dados.vinculoAnual && assinaturaVinculo(vinculoAnual) !== assinaturaVinculo(dados.vinculoAnual)) throw falha(422, 'O vínculo anual salvo não pode ser trocado. Crie outro plano para um novo recorte.');
      if (!vinculoAnual && dados.vinculoAnual) {
        const vinculo = dados.vinculoAnual;
        const anual = await tx.get(planoPath(uid, vinculo.planoId));
        if (!anual) throw falha(404, 'Planejamento anual não encontrado nesta conta.');
        if (!ehPlanejamentoAnual(anual)) throw falha(422, 'A base precisa ser um planejamento anual da disciplina.');
        const herdado = fonteOrigem?.vinculoAnual && assinaturaVinculo(fonteOrigem.vinculoAnual) === assinaturaVinculo(vinculo);
        if (!herdado && anual.revision !== vinculo.revision) throw falha(409, 'O planejamento anual mudou. Reabra a versão atual e selecione os conteúdos novamente.');
        if (!herdado) validarConteudosAnuais(anual,vinculo);
        const contextoBase = herdado ? fonteOrigem.vinculoAnual : anual;
        if (dados.disciplina !== contextoBase.disciplina || dados.anoEscolar !== contextoBase.anoEscolar || (contextoBase.anoLetivo != null && dados.anoLetivo !== contextoBase.anoLetivo)) throw falha(422, 'Disciplina, série e ano letivo precisam corresponder ao planejamento anual.');
        vinculoAnual = herdado ? structuredClone(fonteOrigem.vinculoAnual) : {...vinculo,titulo:anual.titulo,disciplina:anual.disciplina,anoEscolar:anual.anoEscolar,...(anual.anoLetivo != null ? {anoLetivo:anual.anoLetivo} : {})};
      }
      const integracaoAnual = existente?.integracaoAnual || dados.integracaoAnual;
      if (integracaoAnual && !ehPlanejamentoAnual(dados) && !vinculoAnual) throw falha(422, 'Selecione os conteúdos do planejamento anual antes de salvar este plano.');
      if (ehPlanejamentoAnual(dados) && vinculoAnual) throw falha(422, 'O planejamento anual é a raiz e não pode derivar de outro anual.');
      if (vinculoAnual && (dados.disciplina !== vinculoAnual.disciplina || dados.anoEscolar !== vinculoAnual.anoEscolar || (vinculoAnual.anoLetivo != null && dados.anoLetivo !== vinculoAnual.anoLetivo))) throw falha(422, 'O contexto do plano precisa manter a disciplina, série e ano do vínculo anual salvo.');
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
      const plano = { ...dados, ...(integracaoAnual ? {integracaoAnual:1} : {}), ...(vinculoAnual ? {vinculoAnual} : {}), ...(origem ? { origem } : {}), id, revision: (existente?.revision || 0) + 1, criadoEmMs: existente?.criadoEmMs ?? agora, atualizadoEmMs: agora };
      const resposta = { plano };
      // Todas as leituras precedem as escritas, como exigido pelo Firestore Admin.
      tx.set(planoPath(uid, id), plano);
      tx.set(indicePath(uid), { planos: [resumoPlano(plano), ...resumos.filter(p => p.id !== id)] });
      tx.set(reqPath(uid, requestId), { tipo: 'plano', assinatura, resposta, criadoEmMs: agora });
      return resposta;
    });
  }
}
