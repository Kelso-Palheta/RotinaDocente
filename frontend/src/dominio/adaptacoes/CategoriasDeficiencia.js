/**
 * Catálogo Oficial de Deficiências e Neurodiversidades para Adaptação Curricular (DUA)
 * Regras: RN-31, RN-32, RN-36
 */

export const CATEGORIAS_DEFICIENCIA = [
  {
    id: 'tea',
    nome: 'Transtorno do Espectro Autista (TEA)',
    tag: 'TEA',
    icone: 'Sparkles',
    descricao: 'Previsibilidade, instruções literais, redução de sobrecarga sensorial e apoio visual.',
    diretrizesDUA: [
      'Usar linguagem direta, objetiva e estritamente literal, evitando metáforas e ambiguidades.',
      'Estruturar enunciados em passos sequenciais curtos e numerados.',
      'Fornecer apoio pictográfico/visual (ícones ou ilustrações conceituais).',
      'Evitar poluição visual, blocos extensos de texto e estampas concorrentes.',
      'Permitir ancoragem temática em hiperfoco do aluno quando aplicável.',
    ],
  },
  {
    id: 'di',
    nome: 'Deficiência Intelectual (DI)',
    tag: 'DI',
    icone: 'Brain',
    descricao: 'Leitura fácil, conceitos ancorados no concreto, fracionamento de etapas e redução de distratores.',
    diretrizesDUA: [
      'Aplicar princípios de Leitura Fácil (Easy-to-Read): períodos curtos na ordem direta.',
      'Ancorar conceitos científicos em situações práticas e concretas do cotidiano.',
      'Reduzir número de distratores em questões de múltipla escolha (máximo 3 alternativas).',
      'Incluir caixas de dicas processuais (scaffolding) destacadas.',
      'Fracionar questões complexas em micro-etapas de execução autônoma.',
    ],
  },
  {
    id: 'tdah',
    nome: 'TDAH (Desatenção / Hiperatividade)',
    tag: 'TDAH',
    icone: 'Zap',
    descricao: 'Destaque tipográfico seletivo, eliminação de distratores visuais e blocos de tarefas delimitados.',
    diretrizesDUA: [
      'Destacar em negrito estratégico as palavras de comando principais de cada enunciado.',
      'Delimitar cada questão em caixas visuais claras e isoladas.',
      'Eliminar textos puramente decorativos ou distratores gráficos não essenciais.',
      'Incluir pequeno checklist de auto-verificação ao final de cada etapa.',
      'Indicar tempo estimado sugerido para cada bloco de questão.',
    ],
  },
  {
    id: 'baixa_visao',
    nome: 'Deficiência Visual (Baixa Visão)',
    tag: 'Baixa Visão',
    icone: 'Eye',
    descricao: 'Tipografia ampliada (18pt a 24pt), alto contraste, espaçamento generoso e audiodescrição.',
    diretrizesDUA: [
      'Utilizar tipografia ampliada de alta legibilidade (18pt a 24pt) sem serifa.',
      'Garantir esquema de alto contraste (preto/branco ou amarelo/preto).',
      'Aplicar espaçamento entrelinhas amplo (1.5x a 2.0x) e margens desobstruídas.',
      'Fornecer descrição textual detalhada e audiodescrição para imagens, mapas e esquemas.',
    ],
  },
  {
    id: 'cegueira',
    nome: 'Deficiência Visual (Cegueira)',
    tag: 'Cegueira',
    icone: 'EyeOff',
    descricao: 'Acessibilidade total por leitores de tela, audiodescrição e comandos independentes de visão.',
    diretrizesDUA: [
      'Formatar o conteúdo em estrutura 100% linear e semântica para leitores de tela (NVDA/TalkBack).',
      'Fornecer audiodescrição detalhada obrigatória de todos os elementos visuais.',
      'Eliminar qualquer comando que dependa de percepção visual direta (ex: "observe a cor").',
      'Possibilitar transcrição tátil/Braille de fórmulas e esquemas lógicos.',
    ],
  },
  {
    id: 'surdez',
    nome: 'Deficiência Auditiva / Surdez',
    tag: 'Surdez / DA',
    icone: 'VolumeX',
    descricao: 'Português como segunda língua (L2), estrutura sintática direta e ancoragem imagética.',
    diretrizesDUA: [
      'Estruturar orações na ordem direta (Sujeito + Verbo + Objeto), evitando orações intercaladas.',
      'Eliminar trocadilhos, rimas ou figuras de linguagem fonéticas.',
      'Fornecer glossário imagético ou de termos-chave para termos científicos complexos.',
      'Apoiar enunciados conceituais com imagens de referência direta.',
    ],
  },
  {
    id: 'motora',
    nome: 'Deficiência Física / Motora',
    tag: 'Física / Motora',
    icone: 'Hand',
    descricao: 'Dispensa de grafia manual fina, áreas de clique ampliadas e opções de resposta flexíveis.',
    diretrizesDUA: [
      'Dispensar a exigência de escrita manual longa ou desenhos de precisão milimétrica.',
      'Permitir assinalação direta, pareamento simplificado ou resposta oral/assistiva.',
      'Expandir áreas de clique, caixas de marcação e campos de digitação.',
      'Conceder flexibilidade de tempo para preenchimento de respostas.',
    ],
  },
  {
    id: 'dislexia',
    nome: 'Dislexia / Transtorno de Leitura',
    tag: 'Dislexia',
    icone: 'BookOpen',
    descricao: 'Fontes com espaçamento aberto, alinhamento à esquerda, contraste suave e suporte auditivo.',
    diretrizesDUA: [
      'Utilizar tipografia sem serifa com tracking/espaçamento aberto e sem justificar (alinhado à esquerda).',
      'Evitar fundos estroboscópicos brilhantes (preferir tons suaves/sépia).',
      'Segmentar parágrafos longos em tópicos objetivos de leitura rápida.',
      'Possibilitar leitura guiada ou áudio de apoio do enunciado.',
    ],
  },
  {
    id: 'discalculia',
    nome: 'Discalculia / Transtorno da Matemática',
    tag: 'Discalculia',
    icone: 'Calculator',
    descricao: 'Apoio visual de reta numérica, tabela de consulta autorizada e eliminação de pegadinhas.',
    diretrizesDUA: [
      'Fornecer reta numérica visual e diagramas de quantidades em problemas matemáticos.',
      'Autorizar e disponibilizar tabelas de fórmulas, tabuada e conversão de unidades para consulta.',
      'Eliminar pegadinhas numéricas, focando na aplicação do raciocínio lógico.',
      'Estruturar enunciados passo a passo com uma operação matemática por etapa.',
    ],
  },
  {
    id: 'ah_sd',
    nome: 'Altas Habilidades / Superdotação',
    tag: 'AH/SD',
    icone: 'Lightbulb',
    descricao: 'Enriquecimento curricular, problemas abertos de múltiplos desfechos e pensamento divergente.',
    diretrizesDUA: [
      'Propor questões abertas de alta complexidade e pensamento crítico divergente.',
      'Estimular investigação autônoma, pesquisa interdisciplinar e proposição de hipóteses.',
      'Conectar o conteúdo a problemas reais e aplicações tecnológicas contemporâneas.',
      'Oferecer desafios de aprofundamento além do escopo básico da questão regular.',
    ],
  },
];

export const CATEGORIAS_MAP = CATEGORIAS_DEFICIENCIA.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});

export function obterCategoriaDeficiencia(id) {
  return CATEGORIAS_MAP[id] || null;
}
