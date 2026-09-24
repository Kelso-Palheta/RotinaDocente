/**
 * Construtor de Prompts Pedagógicos DUA (RN-31, RN-32, RN-35)
 * Camada: src/dominio/adaptacoes/
 */

import { HarmonizadorAdaptacoes } from './HarmonizadorAdaptacoes';

export class AdaptacaoPromptBuilder {
  /**
   * Constrói o prompt pedagógico completo para a IA
   * @param {Object} params
   * @param {'adaptar'|'criar'} params.modo
   * @param {string} [params.conteudoBase]
   * @param {string} [params.tema]
   * @param {string} [params.habilidadeBNCC]
   * @param {string} [params.disciplina]
   * @param {string} [params.anoEscolar]
   * @param {Object} params.aluno
   * @param {string} [params.aluno.nome]
   * @param {Array<string>} params.aluno.necessidades
   * @param {number} [params.aluno.nivelSuporte]
   * @param {string} [params.aluno.hiperfoco]
   * @param {string} [params.aluno.observacoes]
   * @param {Object} [params.configuracoesVisuais]
   * @returns {string} Prompt detalhado
   */
  static construir(params) {
    const {
      modo = 'adaptar',
      conteudoBase = '',
      tema = '',
      habilidadeBNCC = '',
      disciplina = 'Geral',
      anoEscolar = 'Ensino Regular',
      aluno = {},
      configuracoesVisuais = {},
      quantidadeQuestoes = modo === 'criar' ? 5 : 'todas',
      tiposQuestoes = [],
    } = params;

    const necessidades = aluno.necessidades || [];
    const nivelSuporte = aluno.nivelSuporte || 1;
    const hiperfoco = aluno.hiperfoco || '';

    const harmonizacao = HarmonizadorAdaptacoes.harmonizar({
      necessidades,
      nivelSuporte,
      hiperfoco,
    });

    const categoriasNomes = harmonizacao.categorias.map((c) => c.nome).join(', ');

    const textoQuantidadeQuestoes =
      quantidadeQuestoes === 'todas'
        ? 'QUANTIDADE DE QUESTÕES: Adapte todas as questões presentes no conteúdo original da atividade regular, mantendo a sequência.'
        : `QUANTIDADE DE QUESTÕES: ${quantidadeQuestoes} questões completas e sequenciais (avaliação/atividade integral).`;

    const textoTiposQuestoes =
      Array.isArray(tiposQuestoes) && tiposQuestoes.length > 0
        ? `TIPOS DE QUESTÕES PRIORIZADOS: ${tiposQuestoes.join(', ')}.`
        : '';


    return `Você é um Especialista Sênior em Educação Especial Inclusiva, Desenho Universal para a Aprendizagem (DUA) e Planejamento Educacional Individualizado (PEI), com profundo domínio da Lei Brasileira de Inclusão (Lei nº 13.146/2015) e das diretrizes pedagógicas da BNCC.

SUA MISSÃO:
Elaborar ou adaptar uma atividade escolar rigorosamente acessível para o estudante descrito abaixo, mantendo a integridade pedagógica e fornecendo simultaneamente o Guia de Mediação Docente correspondente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PERFIL DO ESTUDANTE E CONTEXTO:
- Nome/Identificação: ${aluno.nome || 'Estudante'}
- Necessidades / Deficiências: ${categoriasNomes || 'Não especificada'} (Códigos: ${necessidades.join(', ')})
- Nível de Suporte (DSM-5/CID-11): Nível ${nivelSuporte} (${nivelSuporte === 1 ? 'Leve / Apoio Inicial' : nivelSuporte === 2 ? 'Moderado / Apoio Substancial' : 'Intenso / Apoio Muito Substancial'})
- Disciplina: ${disciplina}
- Ano/Série Escolar: ${anoEscolar}
${habilidadeBNCC ? `- Habilidade BNCC de Referência: ${habilidadeBNCC}` : ''}
${hiperfoco ? `- Âncora de Interesse / Hiperfoco do Estudante: ${hiperfoco}` : ''}
${aluno.observacoes ? `- Observações Pedagógicas do PEI: ${aluno.observacoes}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. REGRAS INEGOCIÁVEIS DE EDUCAÇÃO INCLUSIVA (GUARDRAILS PEDAGÓGICOS):
- REGRA DE OURO (RN-31: NÃO EMPOBRECIMENTO CURRICULAR):
  O objetivo pedagógico e o conceito cognitivo essencial JAMAIS devem ser rebaixados ou infantilizados.
  Adaptar NÃO é empobrecer nem transformar em tarefinha de colorir descontextualizada.
  A adaptação reside em:
  1) Representação: múltiplos formatos de apresentação, enunciados diretos, apoios visuais com alto contraste;
  2) Ação e Expressão: flexibilização de respostas (múltipla escolha com distratores calibrados, associação, assinalação rápida, transcrição oral);
  3) Engajamento: contextualização motivadora, scaffolding (degraus de aprendizagem com dicas de apoio) e conexão com interesses reais.

- HARMONIZAÇÃO SINÉRGICA DE DIRETRIZES (RN-32):
  * Diretrizes de Linguagem:
${harmonizacao.diretrizesLinguagem.map((d) => `    - ${d}`).join('\n')}
  * Diretrizes de Layout e Apresentação:
${harmonizacao.diretrizesLayout.map((d) => `    - ${d}`).join('\n')}
  * Diretrizes de Ação e Expressão:
${harmonizacao.diretrizesAcaoExpressao.map((d) => `    - ${d}`).join('\n')}
  * Diretrizes de Engajamento:
${harmonizacao.diretrizesEngajamento.map((d) => `    - ${d}`).join('\n')}
${
  harmonizacao.sinergiasIdentificadas.length > 0
    ? `  * Sinergias Especiais Identificadas:\n${harmonizacao.sinergiasIdentificadas.map((s) => `    - ${s}`).join('\n')}\n`
    : ''
}
${
  harmonizacao.regrasConflitoResolvidas.length > 0
    ? `  * Resolução de Conflitos DUA:\n${harmonizacao.regrasConflitoResolvidas.map((r) => `    - ${r}`).join('\n')}\n`
    : ''
}

- GUIA DE MEDIAÇÃO DOCENTE OBRIGATÓRIO (RN-35):
  Para cada atividade, forneça ao professor orientações claras sobre:
  1) O objetivo pedagógico inalterado da atividade;
  2) O tempo estimado sugerido e momentos de pausa/descompressão;
  3) O passo a passo de aplicação para o professor/mediador;
  4) Estratégias de antecipação comportamental e sensorial;
  5) Critérios flexibilizados de avaliação (evidências de aprendizagem além da escrita convencional).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. MATÉRIA-PRIMA DA ATIVIDADE E COMPOSIÇÃO:
- ${textoQuantidadeQuestoes}
${textoTiposQuestoes ? `- ${textoTiposQuestoes}` : ''}
${
  modo === 'adaptar'
    ? `MODO ADAPTAÇÃO: Adapte o seguinte conteúdo/atividade original enviado pelo professor:\n"""\n${conteudoBase}\n"""`
    : `MODO CRIAÇÃO DO ZERO: Crie uma atividade original com o seguinte tema e diretrizes:\nTema: ${tema}\nDisciplina: ${disciplina}\nAno: ${anoEscolar}`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. FORMATO DE SAÍDA ESTRITAMENTE JSON:
Responda APENAS com um objeto JSON válido (sem texto introdutório nem marcações fora do bloco json).
IMPORTANTE SOBRE AS QUESTÕES (RN-37):
No array "questoes", gere ${quantidadeQuestoes === 'todas' ? 'todas as questões adaptadas a partir do conteúdo original' : `EXATAMENTE ${quantidadeQuestoes} questões completas e sequenciais (numeradas de 1 a ${quantidadeQuestoes})`}.
Não interrompa a resposta na metade e complete toda a estrutura JSON.

Formato esperado:
{
  "sucesso": true,
  "titulo": "Título claro e convidativo da atividade",
  "disciplina": "${disciplina}",
  "anoEscolar": "${anoEscolar}",
  "aluno": {
    "nome": "${aluno.nome || 'Estudante'}",
    "necessidades": ${JSON.stringify(necessidades)}
  },
  "diretrizesHarmonizadas": [
    "Resumo em tópicos das principais adaptações aplicadas nesta atividade"
  ],
  "atividadeAdaptada": {
    "instrucoesAluno": "Instruções acolhedoras, simples e diretas em 1ª ou 2ª pessoa para o estudante",
    "questoes": [
      {
        "numero": 1,
        "enunciado": "Enunciado claro, sem ambiguidade, formatado em frases curtas",
        "tipo": "multipla_escolha | associacao | verdadeiro_falso | discursiva_curta",
        "apoioVisualDescricao": "Descrição detalhada de imagem, esquema ou audiodescrição recomendada para apoio à questão",
        "alternativas": [
          "A) ...",
          "B) ...",
          "C) ..."
        ],
        "dicaScaffolding": "Dica pedagógica sutil para ajudar o estudante caso hesite na resposta"
      }
    ]
  },

  "guiaMediacao": {
    "objetivoPedagogicoInalterado": "Habilidade ou conceito central que o aluno está desenvolvendo",
    "tempoEstimado": "Ex: 25 a 35 minutos com pausa após a questão 2",
    "passoAPassoProfessor": [
      "Passo 1...",
      "Passo 2..."
    ],
    "antecipacaoComportamental": "Recomendações para evitar frustração, ansiedade ou sobrecarga",
    "criteriosAvaliacaoFlexibilizada": "Como avaliar a apropriação do conceito mesmo com respostas orais, gestuais ou parciais"
  }
}
`;
  }
}
