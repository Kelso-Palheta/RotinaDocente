/**
 * Utilitários exclusivos da exportação TXT da conversa.
 * Não acessam armazenamento, API ou qualquer dado fora da lista recebida.
 */

export function montarTextoConversa(agente, mensagens) {
  const nome = agente?.name?.trim() || 'Agente Pedagógico';
  const linhas = [`Conversa com ${nome}`];

  for (const mensagem of Array.isArray(mensagens) ? mensagens : []) {
    if (!mensagem || typeof mensagem.content !== 'string') continue;
    if (mensagem.role !== 'user' && mensagem.role !== 'assistant') continue;
    const autor = mensagem.role === 'assistant' ? nome : 'Você';
    linhas.push('', `${autor}:`, mensagem.content);
  }

  return `${linhas.join('\n')}\n`;
}

export function nomeArquivoConversa(agente) {
  const base = (agente?.name || 'agente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `conversa-${base || 'agente'}.txt`;
}

export function baixarConversaTxt(agente, mensagens) {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    throw new Error('Download de arquivo indisponível neste navegador.');
  }

  const conteudo = montarTextoConversa(agente, mensagens);
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = nomeArquivoConversa(agente);
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    if (typeof URL.revokeObjectURL === 'function') {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}
