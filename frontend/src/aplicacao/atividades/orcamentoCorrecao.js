import { LIMITES_PAYLOAD_IA } from '@/dominio/atividades/orcamentoPayloadIA';

/**
 * Orçamento da correção (RN-77): margem sob o teto do servidor para caber
 * envelope JSON, texto do prompt e variação de codificação.
 */
export const ORCAMENTO_CORRECAO = Object.freeze({
  alvoTotalCaracteres: 3_400_000,
  alvoPorImagemCaracteres: 700_000,
  maxImagens: LIMITES_PAYLOAD_IA.maxImagensPorMensagem,
});

/** Corta a resposta apenas no prompt; a entrega original não é alterada. */
export function truncarResposta(resposta, limite = LIMITES_PAYLOAD_IA.respostaCorrecaoCaracteres) {
  const texto = typeof resposta === 'string' ? resposta : '';
  if (texto.length <= limite) return { texto, truncada: false };
  return {
    texto: `${texto.slice(0, limite)}\n\n[resposta truncada para correção: ${texto.length - limite} caracteres omitidos]`,
    truncada: true,
  };
}

const urlDaImagem = imagem => {
  if (typeof imagem === 'string') return imagem;
  return imagem?.url || imagem?.base64 || '';
};

/**
 * Seleciona as imagens que cabem no orçamento, reduzindo antes de desistir.
 * A redução é injetada para manter a regra testável fora do navegador.
 */
export async function selecionarImagensCorrecao(imagens = [], {
  alvoPorImagem = ORCAMENTO_CORRECAO.alvoPorImagemCaracteres,
  orcamentoCaracteres = ORCAMENTO_CORRECAO.alvoTotalCaracteres,
  maxImagens = ORCAMENTO_CORRECAO.maxImagens,
  reduzir = null,
} = {}) {
  const selecionadas = [];
  let omitidas = 0;
  let caracteres = 0;

  for (const imagem of imagens || []) {
    const original = urlDaImagem(imagem);
    if (!original) continue;

    if (selecionadas.length >= maxImagens) {
      omitidas++;
      continue;
    }

    let url = original;
    if (url.length > alvoPorImagem) {
      if (typeof reduzir !== 'function') {
        omitidas++;
        continue;
      }
      let reduzida = null;
      try {
        reduzida = await reduzir(url, alvoPorImagem);
      } catch {
        reduzida = null;
      }
      if (!reduzida || reduzida.length > alvoPorImagem) {
        omitidas++;
        continue;
      }
      url = reduzida;
    }

    if (caracteres + url.length > orcamentoCaracteres) {
      omitidas++;
      continue;
    }

    caracteres += url.length;
    selecionadas.push({ url });
  }

  return {
    imagens: selecionadas,
    omitidas,
    semImagem: selecionadas.length === 0,
    caracteres,
  };
}
