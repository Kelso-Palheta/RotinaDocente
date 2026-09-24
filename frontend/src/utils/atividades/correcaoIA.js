import { getClientAIHeaders } from '@/utils/aiHeaders';

const BASE_URL = '/api/maritaca';
const MODEL = 'sabiazinho-4';

const MAX_TOKENS = { superficial: 512, normal: 2048, profunda: 4096 };

const PROFUNDIDADE_INSTRUCAO = {
  superficial: 'Correção SUPERFICIAL: seja breve. Feedback de 1-2 frases curtas. Apenas 2 critérios essenciais. Foco apenas no acerto/erro principal.',
  normal: 'Correção NORMAL: feedback de 2-4 frases. Liste os critérios de avaliação usados.',
  profunda: 'Correção PROFUNDA: análise detalhada. Feedback extenso de 4-6 frases. 4-5 critérios detalhados. Aponte pontos fortes, fracos e sugestões específicas de melhoria.'
};

async function callAI(content, apiKey, maxTokens = 3500) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getClientAIHeaders(),
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content }] })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || `Maritaca API error ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Maritaca retornou resposta vazia');
  return text;
}

function buildDiscursivaPrompt(questao, resposta, materialTexto, nivel = 'normal') {
  let prompt = `Você é um professor corretor do Ensino Médio. Corrija a resposta do aluno.

ENUNCIADO DA QUESTÃO:
${questao.enunciado}`;

  if (materialTexto?.trim()) {
    prompt += `\n\nMATERIAL DE APOIO (use como referência para correção):\n${materialTexto.slice(0, 6000)}`;
  }

  if (questao.rubrica?.trim()) {
    prompt += `\n\nRUBRICA DE CORREÇÃO:\n${questao.rubrica}`;
  }

  prompt += `\n\nRESPOSTA DO ALUNO:\n${resposta?.trim() || '(aluno não respondeu)'}

NOTA MÁXIMA DESTA QUESTÃO: ${questao.notaMaxima}

INSTRUÇÕES:
- ${PROFUNDIDADE_INSTRUCAO[nivel] || PROFUNDIDADE_INSTRUCAO.normal}
- Atribua uma nota de 0 a ${questao.notaMaxima} (pode usar 1 casa decimal)

Retorne APENAS JSON válido, sem blocos markdown:
{"nota": 0, "feedback": "...", "criterios": [{"nome": "...", "pontos_obtidos": 0, "pontos_maximos": 0}]}`;

  return prompt.trim();
}

async function corrigirDiscursiva(questao, resposta, materialTexto, apiKey, nivel = 'normal') {
  const content = [{ type: 'text', text: buildDiscursivaPrompt(questao, resposta, materialTexto, nivel) }];

  if (questao.imagens?.length > 0) {
    for (const img of questao.imagens) {
      if (img.url) {
        content.push({ type: 'image_url', image_url: { url: img.url } });
      }
    }
  }

  const maxTokens = MAX_TOKENS[nivel] || 1024;
  const text = await callAI(content, apiKey, maxTokens);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('IA não retornou JSON válido. Resposta: ' + text.slice(0, 200));

  const parsed = JSON.parse(match[0]);
  if (typeof parsed.nota !== 'number') throw new Error('Campo "nota" inválido na resposta da IA');

  return {
    notaObtida: Math.min(Math.max(Number(parsed.nota), 0), questao.notaMaxima),
    feedback: String(parsed.feedback || '').trim(),
    criterios: Array.isArray(parsed.criterios) ? parsed.criterios : []
  };
}

function corrigirObjetiva(questao, resposta) {
  const correto = resposta?.trim().toUpperCase() === questao.gabarito?.toUpperCase();
  return {
    notaObtida: correto ? questao.notaMaxima : 0,
    correto,
    feedback: correto
      ? 'Resposta correta!'
      : `Resposta incorreta. Alternativa correta: ${questao.gabarito}.`
  };
}

async function corrigirMultiQuestao({ questoes, respostas, materialTexto = '', nivelCorrecao = 'normal' }) {
  const apiKey = 'client-side';

  const resultados = {};
  let notaFinal = 0;

  for (const questao of questoes) {
    const resposta = respostas?.[questao.id]?.resposta ?? '';
    const resultado = questao.tipo === 'objetiva'
      ? corrigirObjetiva(questao, resposta)
      : await corrigirDiscursiva(questao, resposta, materialTexto, apiKey, nivelCorrecao);

    resultados[questao.id] = { ...resultado, notaMaxima: questao.notaMaxima };
    notaFinal = Math.round((notaFinal + resultado.notaObtida) * 100) / 100;
  }

  return { resultados, notaFinal, modelo: MODEL };
}

async function corrigirLegacy({ enunciado, gabarito, respostaTexto, notaMaxima, imagens = [], nivelCorrecao = 'normal' }) {
  const apiKey = 'client-side';
  if (!enunciado?.trim()) throw new Error('Enunciado obrigatório');
  if (!gabarito?.trim()) throw new Error('Gabarito obrigatório');

  const questao = { enunciado, rubrica: gabarito, notaMaxima: notaMaxima || 10, imagens };
  const resultado = await corrigirDiscursiva(questao, respostaTexto, '', apiKey, nivelCorrecao);

  return {
    notaIA: resultado.notaObtida,
    notaFinal: resultado.notaObtida,
    feedback: resultado.feedback,
    criterios: resultado.criterios,
    modelo: MODEL
  };
}

export const corrigirAtividade = async (params) => {
  if (params.questoes) return corrigirMultiQuestao(params);
  return corrigirLegacy(params);
};

export async function sugerirRubrica(questao, materialTexto = '') {
  const apiKey = 'client-side';

  let prompt = `Você é um professor experiente do Ensino Médio criando a rubrica de correção para uma questão discursiva.

ENUNCIADO DA QUESTÃO:
${questao.enunciado}`;

  if (materialTexto?.trim()) {
    prompt += `\n\nMATERIAL DE APOIO (use como base dos critérios):\n${materialTexto.slice(0, 4000)}`;
  }

  prompt += `

NOTA MÁXIMA: ${questao.notaMaxima} pontos

Crie de 3 a 5 critérios de avaliação claros e objetivos. A soma deve ser exatamente ${questao.notaMaxima} pontos.

Retorne SOMENTE os critérios, sem introdução, sem markdown. Use exatamente este formato:
X.X pts — Nome: Descrição do que o aluno deve demonstrar para obter estes pontos.

Exemplo:
0.5 pts — Identificação do tema: O aluno identifica corretamente o tema central e demonstra entender o contexto.
0.8 pts — Argumentação: Apresenta ao menos dois argumentos fundamentados no conteúdo estudado.`;

  const rawRubrica = (await callAI([{ type: 'text', text: prompt }], apiKey, 2048)).trim();
  return normalizeRubrica(rawRubrica, questao.notaMaxima);
}

/**
 * Gera questões (discursivas ou objetivas) a partir do material de apoio usando IA.
 * Retorna array de objetos: { tipo, enunciado, rubrica, notaMaxima }
 */
export async function gerarQuestoesComIA({ materialTexto, qtdQuestoes = 3, incluirObjetivas = true, dificuldade = 'medio', incluirTextoApoio = false, tema = '', notaMaxima = 2 }) {
  const apiKey = 'client-side';

  const labelsDificuldade = { facil: 'fácil', medio: 'média', dificil: 'difícil' };
  const instrucoesDificuldade = {
    facil: 'Questão de nível fácil — compreensão básica e memorização de conceitos fundamentais.',
    medio: 'Questão de nível médio — aplicação de conceitos e interpretação com complexidade moderada.',
    dificil: 'Questão de nível difícil — análise crítica, síntese de múltiplos conceitos e raciocínio complexo.'
  };

  if (!materialTexto?.trim()) throw new Error('Carregue um PDF ou cole o material de apoio antes de gerar questões.');
  const prompt = `Você é um professor do Ensino Médio. A partir do conteúdo abaixo${tema.trim() ? `, crie ${qtdQuestoes} questões avaliativas focadas EXCLUSIVAMENTE no tema "${tema.trim()}"` : `, crie ${qtdQuestoes} questões avaliativas`}.

CONTEÚDO:
${materialTexto.slice(0, 8000)}

INSTRUÇÕES:
- Crie ${incluirObjetivas ? 'apenas questões objetivas (múltipla escolha)' : 'apenas questões discursivas'}
- DIFICULDADE: ${instrucoesDificuldade[dificuldade] || instrucoesDificuldade.medio}
- Cada questão deve ter um enunciado claro.
${incluirObjetivas ? '- A questão deve ter 5 alternativas e indicar a letra do gabarito correto. Não precisa de rubrica.' : `- A questão deve incluir a rubrica de correção detalhada. A SOMA de todos os critérios deve ser EXATAMENTE ${notaMaxima} pontos (ex: se notaMaxima=1, distribua entre os critérios somando 1 no total).`}
- Use linguagem adequada ao Ensino Médio
${incluirTextoApoio ? '- Inclua "textoApoio" (introdutório) quando for necessário um texto base' : ''}

REGRAS CRÍTICAS DE FORMATAÇÃO (OBRIGATÓRIO):
1. NUNCA utilize aspas duplas ("") dentro dos valores de texto (enunciado, alternativas, etc). Substitua todas as aspas internas por aspas simples (''). As aspas duplas só podem ser usadas para as chaves e delimitação dos valores no JSON.
2. NUNCA utilize quebras de linha (Enter) reais dentro dos valores de texto. Se precisar quebrar linha no texto da questão, escreva literalmente os caracteres '\\n'.
3. Retorne APENAS um objeto JSON válido, estritamente no formato abaixo, sem nenhum bloco markdown (como \`\`\`json) ou texto antes/depois:

{
  "questoes": [
    {
      "tipo": "${incluirObjetivas ? 'objetiva' : 'discursiva'}",
      "enunciado": "texto do enunciado com aspas simples e sem quebras de linha reais"${incluirTextoApoio ? ',\n      "textoApoio": "texto base opcional com aspas simples"' : ''}${incluirObjetivas ? ',\n      "alternativas": [\n        {"id": "A", "texto": "texto da alternativa A com aspas simples"},\n        {"id": "B", "texto": "texto da alternativa B com aspas simples"},\n        {"id": "C", "texto": "texto da alternativa C com aspas simples"},\n        {"id": "D", "texto": "texto da alternativa D com aspas simples"},\n        {"id": "E", "texto": "texto da alternativa E com aspas simples"}\n      ],\n      "gabarito": "A"' : ',\n      "rubrica": "critério 1: X pts — descrição\\ncritério 2: Y pts — descrição"'}
    }
  ]
}`;

  const text = await callAI([{ type: 'text', text: prompt }], apiKey, 4000);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('IA não retornou JSON válido. Resposta: ' + text.slice(0, 300));

  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.questoes) || parsed.questoes.length === 0) {
    throw new Error('IA não gerou questões válidas');
  }

  return parsed.questoes.map(q => ({
    tipo: q.tipo === 'objetiva' ? 'objetiva' : 'discursiva',
    enunciado: q.enunciado?.trim() || '',
    rubrica: normalizeRubrica(q.rubrica?.trim() || '', notaMaxima),
    notaMaxima,
    alternativas: q.tipo === 'objetiva' ? (q.alternativas || [
      { id: 'A', texto: '' }, { id: 'B', texto: '' }, { id: 'C', texto: '' }, { id: 'D', texto: '' }, { id: 'E', texto: '' }
    ]) : [],
    gabarito: q.tipo === 'objetiva' ? (q.gabarito || 'A') : undefined,
    textoApoio: q.textoApoio?.trim() || ''
  }));
}

/**
 * Reescala os valores de pontuação de uma rubrica de texto para que somem exatamente `notaMaxima`.
 * Preserva o texto descritivo de cada critério.
 * Ex: "0.6 pts — Critério A\n0.4 pts — Critério B" com notaMaxima=1 → permanece igual.
 *     "4 pts — Critério A\n6 pts — Critério B" com notaMaxima=1 → "0.40 pts — Critério A\n0.60 pts — Critério B"
 */
function normalizeRubrica(rubrica, notaMaxima) {
  if (!rubrica || !notaMaxima) return rubrica;

  // Regex que captura o número de pontos no início de cada linha
  // Suporta formatos: "2 pts —", "0.5 pts —", "critério 1: 3 pts —", etc.
  const lineRegex = /^(.*?)(\d+(?:[.,]\d+)?)\s*pts?\s*[—\-–]/i;

  const lines = rubrica.split(/\\n|\n/);
  const valores = [];

  for (const line of lines) {
    const m = line.match(lineRegex);
    if (m) {
      valores.push(parseFloat(m[2].replace(',', '.')));
    } else {
      valores.push(null);
    }
  }

  const soma = valores.reduce((s, v) => s + (v ?? 0), 0);
  if (soma === 0) return rubrica; // nada a normalizar

  const fator = notaMaxima / soma;

  return lines.map((line, i) => {
    if (valores[i] === null) return line;
    const novoValor = Math.round(valores[i] * fator * 100) / 100;
    // substitui apenas o número de pontos, preservando o restante da linha
    return line.replace(lineRegex, (_, prefix, _val, ...rest) => {
      const suffixMatch = line.match(/(\d+(?:[.,]\d+)?)\s*pts?\s*[—\-–](.*)/i);
      const suffix = suffixMatch ? suffixMatch[2] : '';
      return `${prefix}${novoValor} pts —${suffix}`;
    });
  }).join('\\n');
}


export function detectarRespostasSimilares(entregas) {
  const discursivas = entregas.filter(e => {
    const texto = e.respostaTexto || Object.values(e.respostas || {})
      .map(r => r.resposta || '')
      .filter(Boolean)
      .join(' ');
    return texto.trim().length > 20;
  });

  if (discursivas.length < 2) return { clusters: [], penalizados: new Set() };

  const parent = {};
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; };

  discursivas.forEach(e => { parent[e.alunoId] = e.alunoId; });

  for (let i = 0; i < discursivas.length; i++) {
    for (let j = i + 1; j < discursivas.length; j++) {
      const a = discursivas[i];
      const b = discursivas[j];

      const textoA = (a.respostaTexto || Object.values(a.respostas || {}).map(r => r.resposta || '').filter(Boolean).join(' ')).toLowerCase();
      const textoB = (b.respostaTexto || Object.values(b.respostas || {}).map(r => r.resposta || '').filter(Boolean).join(' ')).toLowerCase();

      const wordsA = new Set(textoA.split(/\s+/).filter(w => w.length > 2));
      const wordsB = new Set(textoB.split(/\s+/).filter(w => w.length > 2));
      if (wordsA.size < 3 || wordsB.size < 3) continue;

      const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
      const unionSet = wordsA.size + wordsB.size - intersection;
      const similarity = unionSet > 0 ? intersection / unionSet : 0;

      if (similarity > 0.7) {
        union(a.alunoId, b.alunoId);
      }
    }
  }

  const grupos = {};
  discursivas.forEach(e => {
    const root = find(e.alunoId);
    (grupos[root] = grupos[root] || []).push(e);
  });

  const clusters = Object.values(grupos).filter(g => g.length >= 2);
  const penalizados = new Set();
  clusters.forEach(g => g.forEach(e => penalizados.add(e.alunoId)));

  return { clusters, penalizados };
}
