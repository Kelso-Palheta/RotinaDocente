/**
 * Orçamento de payload do gateway de IA (RN-77).
 *
 * O limite é declarado por campo para que a recusa seja acionável: antes existia
 * um teto único de 50.000 caracteres, insuficiente para qualquer imagem de questão
 * (uma foto de ~40 KB vira ~64 KB em base64).
 */
export const LIMITES_PAYLOAD_IA = Object.freeze({
  totalCaracteres: 4_000_000,
  porImagemCaracteres: 1_600_000,
  maxImagensPorMensagem: 4,
  textoTotalCaracteres: 60_000,
  respostaCorrecaoCaracteres: 20_000,
});

const mega = caracteres => {
  const valor = caracteres / 1_000_000;
  return `${Number.isInteger(valor) ? valor : valor.toFixed(1).replace('.', ',')} MB`;
};
const milhar = caracteres => caracteres.toLocaleString('pt-BR');

export function medirPayload(body) {
  return JSON.stringify(body ?? null).length;
}

function coletarConteudo(body) {
  const imagens = [];
  const textos = [];

  const empilharTexto = valor => {
    if (typeof valor === 'string' && valor) textos.push(valor);
  };

  const lerConteudo = conteudo => {
    if (typeof conteudo === 'string') return empilharTexto(conteudo);
    if (!Array.isArray(conteudo)) return;
    for (const parte of conteudo) {
      if (!parte || typeof parte !== 'object') continue;
      empilharTexto(parte.text);
      const url = parte.image_url?.url || parte.inlineData?.data || parte.inline_data?.data || parte.image;
      if (typeof url === 'string' && url) imagens.push(url);
    }
  };

  for (const mensagem of body.messages || []) lerConteudo(mensagem?.content);
  for (const item of body.contents || []) lerConteudo(item?.parts || item?.content);
  empilharTexto(body.prompt);
  empilharTexto(body.system);

  return { imagens, textos };
}

/**
 * Valida o orçamento antes de qualquer chamada ao provedor.
 * @returns {{ok: true, caracteres: number} | {ok: false, motivo: string, erro: string}}
 */
export function validarPayloadIA(body) {
  const { imagens, textos } = coletarConteudo(body);
  const caracteres = medirPayload(body);

  const textoTotal = textos.reduce((soma, texto) => soma + texto.length, 0);
  if (textoTotal > LIMITES_PAYLOAD_IA.textoTotalCaracteres) {
    return {
      ok: false,
      motivo: 'texto',
      erro: `O texto enviado para a IA tem ${milhar(textoTotal)} caracteres e excede o limite de ${milhar(LIMITES_PAYLOAD_IA.textoTotalCaracteres)}. Reduza o material de apoio ou a resposta.`,
    };
  }

  if (imagens.length > LIMITES_PAYLOAD_IA.maxImagensPorMensagem) {
    return {
      ok: false,
      motivo: 'imagens',
      erro: `A correção enviou ${imagens.length} imagens; o limite é de ${LIMITES_PAYLOAD_IA.maxImagensPorMensagem} imagens por questão. Remova as excedentes e tente novamente.`,
    };
  }

  for (let indice = 0; indice < imagens.length; indice++) {
    if (imagens[indice].length > LIMITES_PAYLOAD_IA.porImagemCaracteres) {
      return {
        ok: false,
        motivo: 'imagem',
        erro: `A imagem ${indice + 1} tem ${mega(imagens[indice].length)} e excede o limite de ${mega(LIMITES_PAYLOAD_IA.porImagemCaracteres)} por imagem. Use um arquivo menor ou corrija a questão sem a imagem.`,
      };
    }
  }

  if (caracteres > LIMITES_PAYLOAD_IA.totalCaracteres) {
    return {
      ok: false,
      motivo: 'total',
      erro: `O payload total de ${mega(caracteres)} excede o limite de ${mega(LIMITES_PAYLOAD_IA.totalCaracteres)}. Reduza as imagens ou o texto e tente novamente.`,
    };
  }

  return { ok: true, caracteres };
}
