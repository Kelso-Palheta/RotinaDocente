/**
 * Caso de uso da cópia de recuperação entre turmas (RN-82).
 *
 * A persistência continua sendo a transação RN-81 existente. Este módulo só
 * orquestra a leitura da origem/destino, a idempotência do retry e a tradução
 * dos erros para a tela — sem escrever no Diário, entregas ou boletins.
 */

import {
  CODIGOS_COPIA,
  assinaturaConteudoCopia,
  montarAtividadeCopiada,
  validarOrigemCopia,
} from '@/dominio/atividades/copiarRecuperacao';

const erro = (codigo, mensagem) => Object.assign(new Error(mensagem), { code: codigo });

const mesmaLista = (a = [], b = []) => (
  JSON.stringify([...a].map(String).sort()) === JSON.stringify([...b].map(String).sort())
);

function mesmaCopia(existente, { professorId, destino, dados }) {
  if (!existente || existente.professorId !== professorId) return false;
  if (existente.conjuntoRecuperacaoId !== destino.id) return false;
  if (String(existente.semestre) !== String(destino.semestre)) return false;
  if (String(existente.anoLetivo) !== String(destino.anoLetivo)) return false;
  if (!mesmaLista(existente.turmaIds, [destino.turmaId])) return false;
  const destinatariosPedidos = dados?.destinatariosIds ?? destino.destinatariosIds;
  if (!mesmaLista(existente.destinatariosIds, destinatariosPedidos)) return false;

  try {
    const assinaturaExistente = assinaturaConteudoCopia(existente);
    const assinaturaPedida = assinaturaConteudoCopia(dados);
    return assinaturaExistente != null && assinaturaExistente === assinaturaPedida;
  } catch {
    return false;
  }
}

function traduzirErro(error) {
  if (!error) return error;
  if (typeof error.code === 'string' && error.code.startsWith('RECUPERACAO_COPIA_')) return error;

  const mensagem = String(error.message || '');
  if (error.code === 'RECUPERACAO_CONJUNTO_OBSOLETO' || /composição da recuperação mudou/i.test(mensagem)) {
    return erro(CODIGOS_COPIA.DESTINO_OBSOLETO, 'O conjunto de destino mudou. Reabra a seleção e tente novamente.');
  }
  if (/excede o limite de 10|limite de 10 pontos/i.test(mensagem)) {
    return erro(CODIGOS_COPIA.SALDO_INSUFICIENTE, 'A cópia excede os pontos restantes do conjunto de destino.');
  }
  if (/congelad/i.test(mensagem)) {
    return erro(CODIGOS_COPIA.DESTINO_CONGELADO, 'O conjunto de destino já possui entregas e está congelado.');
  }
  if (/cancelad/i.test(mensagem)) {
    return erro(CODIGOS_COPIA.DESTINO_CANCELADO, 'O conjunto de destino está cancelado.');
  }
  if (/destinatári|destinatario/i.test(mensagem)) {
    return erro(CODIGOS_COPIA.DESTINATARIO_INVALIDO, 'Os destinatários da cópia não pertencem ao conjunto de destino.');
  }
  if (/não pertence a este conjunto|nao pertence a este conjunto/i.test(mensagem)) {
    return erro(CODIGOS_COPIA.DESTINO_OBSOLETO, 'O conjunto de destino não corresponde mais a esta atividade.');
  }
  return error;
}

/**
 * Copia uma atividade regular de recuperação para outro conjunto do próprio
 * professor. Dependências são injetadas para manter o boundary testável.
 *
 * @returns {Promise<string>} id da atividade criada (ou da cópia idempotente).
 */
export async function copiarRecuperacaoParaOutraTurma({
  professorId,
  origemId,
  destinoId,
  dados,
  turmaDestino,
  versaoEsperada = null,
  carregarOrigem,
  carregarDestino,
  criarAtividade,
} = {}) {
  if (!professorId) {
    throw erro(CODIGOS_COPIA.OUTRA_CONTA, 'Usuário não autenticado.');
  }

  const origem = await carregarOrigem(origemId);
  if (!origem) {
    throw erro(CODIGOS_COPIA.ORIGEM_INVALIDA, 'Atividade de origem não encontrada.');
  }
  validarOrigemCopia(origem, { professorId });

  const destino = await carregarDestino(professorId, destinoId);
  if (!destino) {
    throw erro(CODIGOS_COPIA.DESTINO_OBSOLETO, 'O conjunto de destino não está mais disponível.');
  }

  const idCopia = typeof dados?.id === 'string' ? dados.id.trim() : '';
  const atividadesDoDestino = Array.isArray(destino.atividadeIds) ? destino.atividadeIds : [];
  const existente = idCopia ? await carregarOrigem(idCopia) : null;

  // Retry idempotente: a resposta pode ter se perdido depois da transação.
  // Só devolve a cópia quando ela é exatamente a mesma revisão pedida.
  if (idCopia && atividadesDoDestino.includes(idCopia)) {
    if (existente && mesmaCopia(existente, { professorId, destino, dados })) return idCopia;
    throw erro(
      CODIGOS_COPIA.ID_INVALIDO,
      'A identificação da cópia já está em uso com outro conteúdo. Reabra o formulário.',
    );
  }

  // Nunca deixar createAtividade cair no caminho de edição de uma atividade
  // preexistente por colisão de identificação.
  if (existente) {
    throw erro(
      CODIGOS_COPIA.ID_INVALIDO,
      'A identificação da cópia já existe. Reabra o formulário para gerar outra.',
    );
  }

  const payload = montarAtividadeCopiada({
    origem,
    destino,
    professorId,
    turmaDestino,
    dados,
    versaoEsperada,
  });

  try {
    await criarAtividade(payload);
  } catch (error) {
    if (idCopia) {
      const gravada = await carregarOrigem(idCopia).catch(() => null);
      if (gravada && mesmaCopia(gravada, { professorId, destino, dados })) return idCopia;
    }
    throw traduzirErro(error);
  }

  return payload.id;
}
