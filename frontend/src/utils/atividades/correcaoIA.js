import { getClientAIHeaders } from '@/utils/aiHeaders';
import { extrairJsonIA } from '@/utils/extrairJsonIA';
import { medirPayload } from '@/dominio/atividades/orcamentoPayloadIA';
import { ORCAMENTO_CORRECAO, selecionarImagensCorrecao, truncarResposta } from '@/aplicacao/atividades/orcamentoCorrecao';
import { reduzirImagemParaCorrecao } from '@/utils/atividades/imagemCorrecao';

const BASE_URL = '/api/maritaca';

const MAX_TOKENS = { superficial: 512, normal: 2048, profunda: 4096 };

const PROFUNDIDADE_INSTRUCAO = {
  superficial: 'Correção SUPERFICIAL: seja breve. Feedback de 1-2 frases curtas. Apenas 2 critérios essenciais. Foco apenas no acerto/erro principal.',
  normal: 'Correção NORMAL: feedback de 2-4 frases. Liste os critérios de avaliação usados.',
  profunda: 'Correção PROFUNDA: análise detalhada. Feedback extenso de 4-6 frases. 4-5 critérios detalhados. Aponte pontos fortes, fracos e sugestões específicas de melhoria.'
};

async function callAI(content, apiKey, maxTokens = 3500, jsonMode = false) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getClientAIHeaders(),
    },
    body: JSON.stringify({ max_tokens: maxTokens, messages: [{ role: 'user', content }],
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}) })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.error?.message || err?.error?.error?.message || (typeof err?.error === 'string' ? err.error : null) || `Erro na API de IA (${res.status})`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('IA retornou resposta vazia');
  return { text, modelo: data.model || getClientAIHeaders()['x-user-ai-model'] || null };
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
  const { texto: respostaSegura, truncada: respostaTruncada } = truncarResposta(resposta);
  const prompt = buildDiscursivaPrompt(questao, respostaSegura, materialTexto, nivel);

  // Orçamento do prompt antes das imagens: o que sobra é o teto da cópia enviada.
  const caracteresDoPrompt = medirPayload({ messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }] });
  const disponivel = Math.max(0, ORCAMENTO_CORRECAO.alvoTotalCaracteres - caracteresDoPrompt);
  const selecao = await selecionarImagensCorrecao(questao.imagens || [], {
    orcamentoCaracteres: disponivel,
    reduzir: url => reduzirImagemParaCorrecao(url),
  });

  const content = [{ type: 'text', text: prompt }];
  for (const imagem of selecao.imagens) {
    content.push({ type: 'image_url', image_url: { url: imagem.url } });
  }

  const avisos = [];
  if (selecao.omitidas > 0) {
    avisos.push(`Corrigido sem ${selecao.omitidas} ${selecao.omitidas === 1 ? 'imagem' : 'imagens'} da questão (arquivo acima do limite de envio). Revise manualmente.`);
  }
  if (respostaTruncada) {
    avisos.push('A resposta do aluno foi truncada no envio para a IA; confira a correção manualmente.');
  }

  const maxTokens = MAX_TOKENS[nivel] || 1024;
  const { text, modelo } = await callAI(content, apiKey, maxTokens, true);
  const parsed = extrairJsonIA(text);
  if (typeof parsed.nota !== 'number') throw new Error('Campo "nota" inválido na resposta da IA');

  return {
    notaObtida: Math.min(Math.max(Number(parsed.nota), 0), questao.notaMaxima),
    feedback: String(parsed.feedback || '').trim(),
    criterios: Array.isArray(parsed.criterios) ? parsed.criterios : [],
    modelo,
    imagensOmitidas: selecao.omitidas,
    semImagem: (questao.imagens?.length || 0) > 0 && selecao.semImagem,
    respostaTruncada,
    ...(avisos.length ? { avisoCorrecao: avisos.join(' ') } : {}),
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
  const avisos = [];
  let notaFinal = 0;
  const modelos = new Set();

  for (const [indice, questao] of questoes.entries()) {
    const resposta = respostas?.[questao.id]?.resposta ?? '';
    const resultado = questao.tipo === 'objetiva'
      ? corrigirObjetiva(questao, resposta)
      : await corrigirDiscursiva(questao, resposta, materialTexto, apiKey, nivelCorrecao);

    resultados[questao.id] = { ...resultado, notaMaxima: questao.notaMaxima };
    if (resultado.avisoCorrecao) avisos.push(`Questão ${indice + 1}: ${resultado.avisoCorrecao}`);
    if (resultado.modelo) modelos.add(resultado.modelo);
    notaFinal = Math.round((notaFinal + resultado.notaObtida) * 100) / 100;
  }

  return { resultados, notaFinal, modelo: [...modelos].join(', ') || null, avisos };
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
    modelo: resultado.modelo,
    ...(resultado.avisoCorrecao ? { avisoCorrecao: resultado.avisoCorrecao } : {}),
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
Critério X: [valor] pts — [Descrição]

Exemplo:
Critério 1: 0.5 pts — Identificação do tema: O aluno identifica corretamente o tema central e demonstra entender o contexto.
Critério 2: 0.8 pts — Argumentação: Apresenta ao menos dois argumentos fundamentados no conteúdo estudado.`;

  const rawRubrica = (await callAI([{ type: 'text', text: prompt }], apiKey, 2048)).text.trim();
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

  const { text } = await callAI([{ type: 'text', text: prompt }], apiKey, 4000, true);
  const parsed = extrairJsonIA(text);
  if (!Array.isArray(parsed.questoes) || parsed.questoes.length === 0) {
    throw new Error('IA não gerou questões válidas');
  }

  for (const q of parsed.questoes) {
    if (typeof q.enunciado !== 'string' || !q.enunciado.trim()) throw new Error('IA gerou questão sem enunciado válido.');
    if (incluirObjetivas) {
      if (!Array.isArray(q.alternativas) || q.alternativas.filter(a => typeof a.texto === 'string' && a.texto.trim()).length < 2 || !q.alternativas.some(a => a.id === q.gabarito && a.texto?.trim())) throw new Error('IA gerou gabarito ou alternativas inválidas. Gere novamente.');
      if (new Set(q.alternativas.map(a => a.id)).size !== q.alternativas.length) throw new Error('IA gerou alternativas duplicadas.');
    } else if (typeof q.rubrica !== 'string' || !q.rubrica.trim()) throw new Error('IA gerou questão sem critérios de correção.');
    q.tipo = incluirObjetivas ? 'objetiva' : 'discursiva';
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
 */
function normalizeRubrica(rubrica, notaMaxima) {
  if (!rubrica || !Number.isFinite(Number(notaMaxima)) || Number(notaMaxima) <= 0) return rubrica;
  const linhas = rubrica.split(/\\n|\n/);
  const regex = /^(.*?)(\d+(?:[.,]\d+)?)\s*(?:pts?|pontos?)\s*([—\-–:]?)(.*)$/i;
  const itens = linhas.map((linha, index) => {
    const match = linha.match(regex);
    return match ? { index, match, pontos: Number(match[2].replace(',', '.')) } : null;
  }).filter(Boolean);
  const soma = itens.reduce((s, item) => s + item.pontos, 0);
  if (!soma) return rubrica;
  const totalCentavos = Math.round(Number(notaMaxima) * 100);
  for (const item of itens) { item.exato = item.pontos * totalCentavos / soma; item.centavos = Math.floor(item.exato); }
  let resto = totalCentavos - itens.reduce((s, item) => s + item.centavos, 0);
  const ordem = [...itens].sort((a,b) => (b.exato - b.centavos) - (a.exato - a.centavos) || a.index - b.index);
  for (const item of ordem) { if (resto-- <= 0) break; item.centavos++; }
  for (const item of itens) linhas[item.index] = `${item.match[1]}${String(item.centavos / 100).replace('.', ',')} pts — ${item.match[4].trim()}`;
  return linhas.join('\\n');
}


export { detectarRespostasSimilares } from '@/dominio/atividades/similaridadeRespostas';
