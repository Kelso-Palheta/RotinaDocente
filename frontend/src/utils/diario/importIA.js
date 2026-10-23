import { getClientAIHeaders } from '@/utils/aiHeaders';
import { extrairJsonIA } from '@/utils/extrairJsonIA';

import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';

const BASE_URL = '/api/maritaca';

const PROMPT =
  'Analise este documento e extraia todos os nomes de alunos encontrados. ' +
  'Retorne APENAS um JSON no formato: {"alunos": ["NOME COMPLETO 1", "NOME COMPLETO 2", ...]} ' +
  'Os nomes devem estar em MAIÚSCULAS. Ignore cabeçalhos, títulos, números, datas e qualquer texto que não seja nome de pessoa.';

const parseResposta = (text) => {
  const parsed = extrairJsonIA(text);
  if (!Array.isArray(parsed.alunos)) throw new Error('Formato de resposta inesperado');
  return parsed.alunos
    .map((n) => String(n).toUpperCase().replace(/\s+/g, ' ').trim())
    .filter((n) => n.length > 3);
};

export const importarViaIA = async (arquivo) => {
  const isImage = /\.(?:jpe?g|png|webp)$/i.test(arquivo.name || '') || arquivo.type?.startsWith('image/');
  const { texto } = isImage
    ? await extractTextFromDocument(arquivo, { allowImages: true })
    : await extractTextFromDocument(arquivo);
  if (!texto?.trim()) throw new Error('Nenhum texto encontrado no arquivo.');
  const content = [{ type: 'text', text: `${PROMPT}\n\nDOCUMENTO:\n${texto}` }];

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getClientAIHeaders(),
    },
    body: JSON.stringify({
      response_format: { type: 'json_object' },
      max_tokens: 4000,
      messages: [{ role: 'user', content }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || err?.error?.error?.message || (typeof err?.error === 'string' ? err.error : null) || `Erro na API de IA ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseResposta(text);
};
