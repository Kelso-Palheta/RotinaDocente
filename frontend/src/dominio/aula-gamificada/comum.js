/**
 * Utilidades puras do módulo Aula Gamificada.
 * Sem dependências de Firebase, React ou rede.
 */

export const falha = (status, message) =>
  Object.assign(new Error(message), { status, publica: true });

export function textoObrigatorio(valor, campo, { max = 4000 } = {}) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto) throw falha(422, `Informe ${campo}.`);
  if (texto.length > max) throw falha(422, `${campo} excede o limite de ${max} caracteres.`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(texto))
    throw falha(422, `${campo} contém caracteres inválidos.`);
  return texto;
}

export function textoOpcional(valor, campo, { max = 4000 } = {}) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor !== 'string') throw falha(422, `${campo} deve ser texto.`);
  const texto = valor.trim();
  if (texto.length > max) throw falha(422, `${campo} excede o limite de ${max} caracteres.`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(texto))
    throw falha(422, `${campo} contém caracteres inválidos.`);
  return texto;
}

export function segmento(valor, { campo = 'Identificador', max = 180 } = {}) {
  if (
    typeof valor !== 'string' ||
    !valor.length ||
    valor.length > max ||
    /[/\\\u0000-\u001f]/.test(valor) ||
    valor === '.' ||
    valor === '..'
  )
    throw falha(400, `${campo} inválido.`);
  return valor;
}

export function codigoSala(valor) {
  if (typeof valor !== 'string' || !/^[A-Z0-9]{4,12}$/.test(valor))
    throw falha(400, 'Informe o código exibido pelo professor.');
  return valor;
}

export function idRequisicao(valor) {
  if (
    typeof valor !== 'string' ||
    !valor.trim() ||
    valor.length > 200 ||
    /[\u0000-\u001f]/.test(valor)
  )
    throw falha(422, 'requestId inválido.');
  return valor.trim();
}

export function normalizarId(valor, campo = 'ID') {
  const id = segmento(String(valor ?? '').trim(), { campo, max: 60 });
  return /^[a-z]$/i.test(id) ? id.toUpperCase() : id;
}

export function ehObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

export function listaObrigatoria(valor, campo, { min = 1, max = 50 } = {}) {
  if (!Array.isArray(valor)) throw falha(422, `${campo} deve ser uma lista.`);
  if (valor.length < min) throw falha(422, `${campo} precisa de pelo menos ${min} item(ns).`);
  if (valor.length > max) throw falha(422, `${campo} excede o limite de ${max} itens.`);
  return valor;
}

export function inteiroFaixa(valor, campo, { min, max } = {}) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || (min !== undefined && numero < min) || (max !== undefined && numero > max))
    throw falha(422, `${campo} deve ser um número inteiro entre ${min} e ${max}.`);
  return numero;
}

export function hashEstavel(texto) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < texto.length; i += 1) {
    const codigo = texto.charCodeAt(i);
    h1 ^= codigo;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + codigo) >>> 0;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function hashRequisicao(tipo, ...partes) {
  return hashEstavel([tipo, ...partes.map((p) => String(p ?? ''))].join('|'));
}

function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function geradorPseudoaleatorio(inicial) {
  let estado = inicial >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Embaralhamento determinístico: mesma semente, mesma ordem. */
export function embaralhar(itens, sementeTexto = '') {
  const copia = [...itens];
  const aleatorio = geradorPseudoaleatorio(semente(sementeTexto));
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Texto vindo da IA: remove blocos ativos e marcação real, mantendo conteúdo útil.
 * Só remove o que tem forma de tag HTML (`<letra ...>`); desigualdades como
 * `x < 2 e y > 3` permanecem intactas. A interface continua renderizando como
 * texto, nunca como HTML.
 */
export function limparTextoIA(valor) {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(
      /<(script|style|iframe|object|embed|svg|math|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      ' ',
    )
    // Tag HTML começa com letra após `<` ou `</`; `< 2` não é tag.
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*)?\s*\/?>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

let contadorPadrao = 0;
export function idPadrao() {
  contadorPadrao += 1;
  return `q-${Date.now().toString(36)}-${contadorPadrao.toString(36)}`;
}
