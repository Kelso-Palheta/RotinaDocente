/**
 * Contrato compartilhado das conversas dos Agentes Pedagógicos.
 * RN-14: system prompts permanecem exclusivamente no servidor.
 * RN-15: histórico local contém apenas mensagens de usuário e assistente.
 */

export const PAPEIS_MENSAGEM = Object.freeze(['user', 'assistant']);
export const LIMITE_MENSAGENS_API = 50;
export const LIMITE_CARACTERES_MENSAGEM_API = 32_000;
export const LIMITE_BYTES_CORPO_API = 256 * 1024;

function ehObjetoSimples(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * Valida uma mensagem já normalizada para envio à API.
 * Exige exatamente os campos `role` e `content`, sem metadados extras.
 */
export function validarMensagemApi(mensagem) {
  if (!ehObjetoSimples(mensagem)) return false;

  const chaves = Object.keys(mensagem);
  if (chaves.length !== 2 || !chaves.includes('role') || !chaves.includes('content')) {
    return false;
  }

  if (!PAPEIS_MENSAGEM.includes(mensagem.role)) return false;
  if (typeof mensagem.content !== 'string') return false;

  const conteudo = mensagem.content.trim();
  return conteudo.length > 0 && conteudo.length <= LIMITE_CARACTERES_MENSAGEM_API;
}

/**
 * Valida o histórico lido do localStorage e remove campos extras antigos.
 * Um único item inválido invalida o histórico inteiro para evitar mistura de
 * papéis ou conteúdos que possam quebrar a interface.
 */
export function normalizarHistoricoLocal(valor) {
  if (!Array.isArray(valor)) {
    return { valido: false, mensagens: [] };
  }

  const mensagens = [];

  for (const item of valor) {
    if (!ehObjetoSimples(item)) return { valido: false, mensagens: [] };
    if (!PAPEIS_MENSAGEM.includes(item.role)) return { valido: false, mensagens: [] };
    if (typeof item.content !== 'string' || item.content.trim().length === 0) {
      return { valido: false, mensagens: [] };
    }

    mensagens.push({ role: item.role, content: item.content });
  }

  return { valido: true, mensagens };
}
