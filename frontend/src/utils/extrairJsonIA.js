/**
 * Extração robusta de JSON em respostas textuais de IA (RN-44).
 *
 * Cascata de tentativas: parse direto → fatias entre { e } → reparo de
 * aspas escapadas (\") → string JSON aninhada (double-stringified).
 * O parse direto SEMPRE vem primeiro para preservar \" legítimos
 * dentro de valores de um JSON válido.
 */

function candidatos(texto) {
  const lista = [];
  const adicionar = (t) => {
    if (t && !lista.includes(t)) lista.push(t);
  };

  adicionar(texto);

  const fim = texto.lastIndexOf('}');
  if (fim < 0) return lista;

  const primeiro = texto.indexOf('{');
  if (primeiro >= 0 && primeiro < fim) adicionar(texto.slice(primeiro, fim + 1));

  const ultimo = texto.lastIndexOf('{');
  if (ultimo >= 0 && ultimo < fim) adicionar(texto.slice(ultimo, fim + 1));

  return lista;
}

function tentarParse(texto) {
  const variantes = [texto, texto.replace(/\\"/g, '"')];
  const vistos = [];

  for (const variante of variantes) {
    for (const candidato of candidatos(variante)) {
      if (vistos.includes(candidato)) continue;
      vistos.push(candidato);
      try {
        const valor = JSON.parse(candidato);
        if (typeof valor === 'string') {
          // String contendo JSON (double-stringified) → decodifica recursivamente
          return extrairJsonIA(valor);
        }
        return valor;
      } catch {
        // tenta o próximo candidato
      }
    }
  }

  return undefined;
}

export function extrairJsonIA(resposta) {
  const bruto = typeof resposta === 'string' ? resposta.trim() : '';

  let valor = tentarParse(bruto);

  if (valor === undefined && bruto.includes('```')) {
    const semFences = bruto.replace(/```(?:json)?/gi, '').trim();
    valor = tentarParse(semFences);
  }

  if (valor !== undefined) return valor;

  throw new Error('IA não retornou JSON válido. Resposta: ' + bruto.slice(0, 200));
}
