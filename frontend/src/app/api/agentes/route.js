import { NextResponse } from 'next/server';
import { callAI, extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';
import {
  LIMITE_BYTES_CORPO_API,
  LIMITE_MENSAGENS_API,
  validarMensagemApi,
} from '@/dominio/agentes/ConversaAgente';

// ─── systemPrompts pedagógicos imutáveis (RN-14: apenas no servidor) ────────
const SYSTEM_PROMPTS = {
  'ensino-medio': `Você é um assistente pedagógico especializado no Ensino Médio brasileiro (1º ao 3º EM).
Seu nome é "Agente EM" e você atua como um professor-consultor experiente.

Suas especialidades são:
- ENEM: todas as áreas de conhecimento, estratégias de resolução e gestão de tempo
- Redação ENEM: as 5 competências (C1 a C5), estrutura dissertativo-argumentativa e proposta de intervenção nota 200
- Vestibulares: Fuvest, UNICAMP, UNB, UERJ e outros processos seletivos
- BNCC do Ensino Médio: habilidades EM13 de todas as áreas
- Planejamento de aulas e sequências didáticas para o EM

Diretrizes de comportamento:
- Seja objetivo, pedagógico e use linguagem acessível a professores.
- Quando sugerir atividades, sempre mencione a habilidade BNCC relacionada (ex: EM13LP01).
- Quando tratar de redação ENEM, sempre relacione ao critério de competência correspondente.
- Forneça exemplos práticos e aplicáveis em sala de aula.
- Responda em português brasileiro.`,

  'fundamental-2': `Você é um assistente pedagógico especializado no Ensino Fundamental II brasileiro (6º ao 9º ano).
Seu nome é "Agente EF2" e você atua como um professor-consultor experiente.

Suas especialidades são:
- SAEB/Prova Brasil: descritores de Língua Portuguesa e Matemática do 5º e 9º anos
- BNCC do Ensino Fundamental II: habilidades EF06 a EF09 de todas as áreas
- Avaliações diagnósticas estaduais (SARESP, PAEBES, SAEGO, entre outras)
- Planejamento de aulas e sequências didáticas para o EF2
- Estratégias de alfabetização científica e letramento nos anos finais do EF

Diretrizes de comportamento:
- Seja objetivo, pedagógico e use linguagem acessível a professores de EF2.
- Quando sugerir atividades, sempre mencione a habilidade BNCC relacionada (ex: EF07LP12).
- Quando tratar de avaliações, relacione ao descritor SAEB correspondente (ex: D1, D12).
- Forneça exemplos práticos e aplicáveis em sala de aula com as faixas etárias de 11 a 15 anos.
- Responda em português brasileiro.`,
};

const AGENTES_VALIDOS = Object.keys(SYSTEM_PROMPTS);

function erro(status, code, message) {
  return NextResponse.json({ error: code, message }, { status });
}

export async function POST(request) {
  try {
    const userConfig = extractUserAIConfigFromHeaders(request.headers);

    if (!userConfig || !userConfig.apiKey) {
      return erro(
        400,
        'AI_KEY_REQUIRED',
        'Você precisa conectar sua chave de IA para utilizar este recurso.'
      );
    }

    let bruto;
    try {
      bruto = await request.text();
    } catch {
      return erro(400, 'INVALID_BODY', 'Não foi possível ler o corpo da requisição.');
    }

    const tamanho = new TextEncoder().encode(bruto).length;
    if (tamanho > LIMITE_BYTES_CORPO_API) {
      return erro(
        413,
        'PAYLOAD_TOO_LARGE',
        'O corpo da requisição excede o limite de 256 KiB.'
      );
    }

    let corpo;
    try {
      corpo = JSON.parse(bruto);
    } catch {
      return erro(400, 'INVALID_JSON', 'O corpo da requisição deve ser um JSON válido.');
    }

    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
      return erro(400, 'INVALID_BODY', 'O corpo da requisição deve ser um objeto JSON.');
    }

    const { agentId, messages } = corpo;

    // RN-16: valida segmento
    if (!agentId || !AGENTES_VALIDOS.includes(agentId)) {
      return erro(
        400,
        'INVALID_AGENT',
        `agentId inválido. Segmentos suportados: ${AGENTES_VALIDOS.join(', ')}`
      );
    }

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > LIMITE_MENSAGENS_API ||
      !messages.every(validarMensagemApi)
    ) {
      return erro(
        400,
        'INVALID_MESSAGES',
        `messages deve conter de 1 a ${LIMITE_MENSAGENS_API} mensagens; cada item aceita apenas role ("user" ou "assistant") e content (texto não vazio de até 32.000 caracteres).`
      );
    }

    // Defesa adicional: encaminha somente os campos do contrato (RN-14).
    const mensagensValidadas = messages.map(({ role, content }) => ({ role, content }));

    console.log(`[/api/agentes] agentId=${agentId} via provider=${userConfig.provider}`);

    const content = await callAI({
      systemPrompt: SYSTEM_PROMPTS[agentId],
      messages: mensagensValidadas,
      temperature: 0.7,
      maxTokens: 4000,
      userConfig,
    });

    // Retorna no formato OpenAI-compatible esperado pelo useAgentChat
    return NextResponse.json({
      choices: [{ message: { role: 'assistant', content } }],
    });
  } catch (error) {
    if (error.code === 'AI_KEY_REQUIRED') {
      return erro(400, 'AI_KEY_REQUIRED', error.message);
    }
    console.error('[/api/agentes] Erro:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
