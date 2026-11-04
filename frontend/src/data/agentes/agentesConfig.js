/**
 * Configuração dos Agentes Pedagógicos — MVP
 * RN-13: modelo exclusivo sabiazinho-4
 * RN-14: identidade pedagógica (systemPrompts ficam APENAS no servidor /api/agentes)
 * RN-16: dois segmentos suportados no MVP
 */

/** @type {'sabiazinho-4'} */
export const MODELO_AGENTE = 'sabiazinho-4';

/**
 * @typedef {Object} AgenteConfig
 * @property {string} id           - Identificador único do agente (usado na API e localStorage)
 * @property {string} name         - Nome exibido na interface
 * @property {string} segmento     - Segmento escolar atendido
 * @property {string} descricao    - Descrição curta das especialidades
 * @property {string} cor          - Cor primária do agente (CSS var ou hex)
 * @property {string} corTexto     - Cor do texto sobre o fundo do agente
 * @property {string[]} promptChips - Sugestões de perguntas rápidas contextuais
 */

/** @type {AgenteConfig[]} */
export const AGENTES_CONFIG = [
  {
    id: 'ensino-medio',
    name: 'Agente EM',
    segmento: 'Ensino Médio — 1º ao 3º EM',
    descricao: 'Especialista em ENEM, vestibulares, habilidades BNCC-EM e competências de Redação (C1–C5).',
    cor: '#0f766e',
    corTexto: '#ffffff',
    promptChips: [
      'Como estruturar uma proposta de intervenção (C5) nota 200?',
      'Quais habilidades EM13LP são mais cobradas no ENEM?',
      'Monte um plano de revisão de Matemática para o ENEM.',
      'Como explicar funções de 2º grau de forma visual?',
      'Sugira uma atividade de redação argumentativa para o 3º EM.',
    ],
  },
  {
    id: 'fundamental-2',
    name: 'Agente EF2',
    segmento: 'Ensino Fundamental II — 6º ao 9º ano',
    descricao: 'Especialista em descritores SAEB, habilidades BNCC-EF2 e avaliações diagnósticas estaduais.',
    cor: '#123c3a',
    corTexto: '#ffffff',
    promptChips: [
      'Quais descritores do SAEB de Matemática são mais cobrados no 9º ano?',
      'Monte uma sequência didática de frações para o 6º ano.',
      'Como abordar gêneros textuais argumentativos no 8º ano?',
      'Sugira estratégias para melhorar a leitura interpretativa no 7º ano.',
      'Quais habilidades EF09MA devo priorizar antes da Prova Brasil?',
    ],
  },
];

/**
 * Busca um agente pelo id.
 * @param {string} id
 * @returns {AgenteConfig | undefined}
 */
export function getAgenteById(id) {
  return AGENTES_CONFIG.find((a) => a.id === id);
}
