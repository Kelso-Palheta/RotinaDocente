import { NextResponse } from 'next/server';
import { callAI, extractUserAIConfigFromHeaders } from '@/lib/ai-provider-central';
import { AdaptacaoPromptBuilder } from '@/dominio/adaptacoes/AdaptacaoPromptBuilder';

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

    const body = await request.json();
    const {
      modo = 'adaptar',
      conteudoBase = '',
      tema = '',
      habilidadeBNCC = '',
      disciplina = 'Geral',
      anoEscolar = 'Ensino Regular',
      aluno = {},
      configuracoesVisuais = {},
    } = body;

    if (!['adaptar', 'criar'].includes(modo)) {
      return NextResponse.json(
        { error: 'Modo inválido. Deve ser "adaptar" ou "criar".' },
        { status: 400 }
      );
    }

    const necessidades = aluno.necessidades || body.necessidades || [];
    if (!Array.isArray(necessidades) || necessidades.length === 0) {
      return NextResponse.json(
        { error: 'Ao menos uma necessidade/deficiência deve ser selecionada.' },
        { status: 400 }
      );
    }

    if (modo === 'adaptar' && !conteudoBase?.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo base da atividade é obrigatório para o modo adaptação.' },
        { status: 400 }
      );
    }

    if (modo === 'criar' && !tema?.trim()) {
      return NextResponse.json(
        { error: 'Tema da atividade é obrigatório para o modo criação.' },
        { status: 400 }
      );
    }

    const alunoCompleto = {
      ...aluno,
      necessidades,
    };

    const prompt = AdaptacaoPromptBuilder.construir({
      modo,
      conteudoBase,
      tema,
      habilidadeBNCC,
      disciplina,
      anoEscolar,
      aluno: alunoCompleto,
      configuracoesVisuais,
    });

    const aiResponseText = await callAI({
      systemPrompt: 'Você é um especialista em DUA (Desenho Universal para a Aprendizagem) e Educação Inclusiva. Responda estritamente em formato JSON válido.',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 4000,
      userConfig,
    });

    // Sanitiza e extrai JSON caso a IA envolva em blocos markdown ```json ... ```
    let cleanJson = aiResponseText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('[/api/adaptacoes/gerar] Falha ao fazer parse do JSON retornado pela IA:', parseErr);
      return NextResponse.json(
        {
          sucesso: true,
          titulo: `Atividade Adaptada: ${disciplina}`,
          disciplina,
          anoEscolar,
          aluno: alunoCompleto,
          atividadeAdaptada: {
            instrucoesAluno: 'Leia com atenção a atividade abaixo:',
            questoes: [
              {
                numero: 1,
                enunciado: cleanJson,
                tipo: 'discursiva_curta',
                alternativas: [],
              },
            ],
          },
          guiaMediacao: {
            objetivoPedagogicoInalterado: 'Desenvolver a habilidade proposta com apoio do mediador.',
            tempoEstimado: '30 minutos.',
            passoAPassoProfessor: ['Acompanhe a leitura e auxilie na compreensão dos enunciados.'],
            antecipacaoComportamental: 'Ofereça pausas se necessário.',
            criteriosAvaliacaoFlexibilizada: 'Aceitar respostas orais ou parciais.',
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(parsedResult, { status: 200 });
  } catch (error) {
    console.error('[/api/adaptacoes/gerar] Erro interno:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar adaptação de atividade.' },
      { status: 500 }
    );
  }
}
