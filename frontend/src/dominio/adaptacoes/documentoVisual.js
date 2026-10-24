import { normalizarRespostaGeracao } from "./RespostaGeracaoAdaptada";
import { substituirImagem } from "./qualidadeVisual";
export function criarDocumentoVisual(
  bruto,
  documentoVisualId = crypto.randomUUID(),
) {
  const v = normalizarRespostaGeracao(bruto);
  return {
    ...v,
    versaoVisual: 2,
    documentoVisualId,
    atividadeAdaptada: {
      ...v.atividadeAdaptada,
      questoes: v.atividadeAdaptada.questoes.map((q, i) => ({
        ...q,
        id: `${documentoVisualId}_q_${i + 1}`,
        imagemUrl: undefined,
        visual: undefined,
      })),
    },
  };
}
export function mesclarQuestaoVisual(documento, id, questao) {
  return {
    ...documento,
    atividadeAdaptada: {
      ...documento.atividadeAdaptada,
      questoes: documento.atividadeAdaptada.questoes.map((item) =>
        item.id === id ? questao : item,
      ),
    },
  };
}
export function restaurarVersaoVisual(q, versao) {
  const planoVisual = versao.planoVisual || q.planoVisual;
  const nova = substituirImagem(
    q,
    versao.imagemUrl,
    versao.metadados,
    "restaurada",
  );
  return {
    ...nova,
    planoVisual,
    apoioVisualDescricao: versao.descricao || q.apoioVisualDescricao,
    visual: { ...nova.visual, planoImagem: planoVisual },
  };
}
