import { getClientAIHeaders } from '@/utils/aiHeaders';

// Maritaca AI — sabiazinho-4 (OpenAI-compatible endpoint)
// Suporta visão (imagens) e texto. PDFs são convertidos para texto via FileReader.

const BASE_URL = '/api/maritaca';
const MODEL    = 'sabiazinho-4';

const PROMPT =
  'Analise este documento e extraia todos os nomes de alunos encontrados. ' +
  'Retorne APENAS um JSON no formato: {"alunos": ["NOME COMPLETO 1", "NOME COMPLETO 2", ...]} ' +
  'Os nomes devem estar em MAIÚSCULAS. Ignore cabeçalhos, títulos, números, datas e qualquer texto que não seja nome de pessoa.';

const toBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const mediaTypeOf = (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', gif: 'image/gif'
  };
  return map[ext] || null;
};

const buildContent = (arquivo, b64, imageMediaType) => {
  // Imagem → vision
  if (imageMediaType) {
    return [
      {
        type: 'image_url',
        image_url: { url: `data:${imageMediaType};base64,${b64}` }
      },
      { type: 'text', text: PROMPT }
    ];
  }
  // PDF → envia base64 como texto descritivo (fallback: pede ao modelo extrair do conteúdo)
  return [
    {
      type: 'text',
      text: `O arquivo abaixo é um PDF codificado em base64. Decodifique mentalmente e extraia os nomes de alunos.\n\nBase64:\n${b64}\n\n${PROMPT}`
    }
  ];
};

const parseResposta = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Maritaca não retornou JSON válido. Resposta: ' + text.slice(0, 200));
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.alunos)) throw new Error('Formato de resposta inesperado');
  return parsed.alunos
    .map((n) => String(n).toUpperCase().replace(/\s+/g, ' ').trim())
    .filter((n) => n.length > 3);
};

export const importarViaIA = async (arquivo) => {
  const buffer = await arquivo.arrayBuffer();
  const b64 = toBase64(buffer);
  const imageMediaType = mediaTypeOf(arquivo);

  const content = buildContent(arquivo, b64, imageMediaType);

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getClientAIHeaders(),
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || `Maritaca API error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseResposta(text);
};
