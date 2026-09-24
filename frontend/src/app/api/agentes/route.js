import { NextResponse } from 'next/server';
import { callAI, extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';

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

export async function POST(request) {
  try {
    const userConfig = extractUserAIConfigFromHeaders(request.headers);

    if (!userConfig || !userConfig.apiKey) {
      return NextResponse.json(
        {
          error: 'AI_KEY_REQUIRED',
          message: 'Você precisa conectar sua chave de IA para utilizar este recurso.',
        },
        { status: 400 }
      );
    }

    const { agentId, messages } = await request.json();

    // RN-16: valida segmento
    if (!agentId || !AGENTES_VALIDOS.includes(agentId)) {
      return NextResponse.json(
        { error: `agentId inválido. Segmentos suportados: ${AGENTES_VALIDOS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages deve ser um array não-vazio.' }, { status: 400 });
    }

    console.log(`[/api/agentes] agentId=${agentId} via provider=${userConfig.provider}`);

    const content = await callAI({
      systemPrompt: SYSTEM_PROMPTS[agentId],
      messages,
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
      return NextResponse.json(
        { error: 'AI_KEY_REQUIRED', message: error.message },
        { status: 400 }
      );
    }
    console.error('[/api/agentes] Erro:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
