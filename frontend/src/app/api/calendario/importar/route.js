import { NextResponse } from 'next/server';
import { callAI, extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';

const SYSTEM_PROMPT = `Você é um especialista em planejamento pedagógico e currículo escolar brasileiro (BNCC).
O usuário enviará um plano de curso ou ementa (frequentemente contendo capítulos e vários subtópicos).
Sua missão é estruturar esse texto em uma lista cronológica de tópicos GRANULARES de aula.

MUITO IMPORTANTE: NÃO agrupe todo o conteúdo de um capítulo em um único tópico genérico.
Você DEVE quebrar os capítulos em subtópicos menores e específicos (ex: cada "bullet point" ou subtema deve virar um item independente na lista). O professor precisa de itens granulares para distribuir nas aulas semanais.

Retorne EXCLUSIVAMENTE um objeto JSON com a propriedade "topicos", que é um array de objetos.
Cada objeto do array DEVE ter:
- "ordem": número inteiro (1, 2, 3...) refletindo a sequência de ensino.
- "titulo": string (máximo 80 caracteres) resumindo especificamente esse subtema/tópico.
- "descricao": string detalhando o conteúdo do subtema (você pode incluir o nome do Capítulo maior aqui para dar contexto).
- "duracaoEstimadaAulas": número inteiro (normalmente 1). Como você foi bem granular, a maioria dos subtópicos levará 1 aula, no máximo 2.

Não retorne markdown, crases ou qualquer texto adicional, apenas o JSON válido puro.`;

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

    const { text, disciplina, anoLetivo } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Você precisa enviar o texto do planejamento para importar.' },
        { status: 400 }
      );
    }

    const prompt = `Contexto: Disciplina ${disciplina || 'Geral'} - Ano ${anoLetivo || 'Não informado'}\n\nTexto do Planejamento:\n${text}`;

    const responseContent = await callAI({
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      maxTokens: 4000,
      userConfig,
    });

    // Limpeza de crases caso o modelo ignore a instrução de não usar markdown
    const jsonString = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.topicos || !Array.isArray(parsedData.topicos)) {
      throw new Error("A IA não retornou o formato JSON esperado.");
    }

    return NextResponse.json({ topicos: parsedData.topicos });

  } catch (error) {
    if (error.code === 'AI_KEY_REQUIRED') {
      return NextResponse.json(
        { error: 'AI_KEY_REQUIRED', message: error.message },
        { status: 400 }
      );
    }
    console.error('ERRO NA IMPORTAÇÃO DE PLANEJAMENTO:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Não foi possível estruturar o planejamento com a IA.' },
      { status: 500 }
    );
  }
}
