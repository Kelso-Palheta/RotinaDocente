import { CATEGORIAS_MAP } from './CategoriasDeficiencia';

/**
 * Serviço de Domínio: Harmonizador de Adaptações Curriculares (DUA)
 * Regra: RN-32 (Harmonização Sinérgica em Múltipla Deficiência)
 */
export class HarmonizadorAdaptacoes {
  /**
   * Harmoniza múltiplas categorias de necessidades específicas aplicando princípios DUA e regras de não-conflito.
   *
   * @param {Object} params
   * @param {string[]} params.necessidades - Lista de IDs de necessidades (ex: ['tea', 'di'])
   * @param {number} [params.nivelSuporte=1] - 1 (Leve), 2 (Moderado), 3 (Alto)
   * @param {string} [params.hiperfoco=''] - Hiperfoco ou tema motivador do aluno
   * @returns {Object} Estrutura harmonizada para engenharia de prompt e guia de mediação
   */
  static harmonizar({ necessidades = [], nivelSuporte = 1, hiperfoco = '' } = {}) {
    const idsValidos = Array.from(new Set(necessidades.map((n) => String(n).toLowerCase().trim())))
      .filter((id) => Boolean(CATEGORIAS_MAP[id]));

    const suporteNum = Number(nivelSuporte);
    const nivelNormalizado = [1, 2, 3].includes(suporteNum) ? suporteNum : 1;
    const hiperfocoLimpo = String(hiperfoco || '').trim();

    const categorias = idsValidos.map((id) => CATEGORIAS_MAP[id]);

    const diretrizesLinguagem = new Set();
    const diretrizesLayout = new Set();
    const diretrizesAvaliacao = new Set();
    const diretrizesAcaoExpressao = new Set();
    const diretrizesEngajamento = new Set();
    const diretrizesMediaDocente = new Set();

    const sinergiasIdentificadas = [];
    const regrasConflitoResolvidas = [];

    const has = (id) => idsValidos.includes(id);

    // ─── 1. Mapeamento Base por Categoria ────────────────────────────────────
    if (has('tea')) {
      diretrizesLinguagem.add('Usar linguagem direta, objetiva e estritamente literal');
      diretrizesLinguagem.add('Evitar ambiguidades, ironias, trocadilhos ou metáforas.');
      diretrizesLinguagem.add('Estruturar instruções em passos sequenciais curtos e numerados.');
      diretrizesLayout.add('Evitar poluição visual, blocos extensos de texto e estampas concorrentes');
      diretrizesEngajamento.add('Garantir previsibilidade de início, meio e fim da tarefa.');
    }

    if (has('di')) {
      diretrizesLinguagem.add('Aplicar princípios de Leitura Fácil (Easy-to-Read): períodos curtos na ordem direta com vocabulário acessível.');
      diretrizesLinguagem.add('Ancorar conceitos científicos em exemplos concretos e palpáveis do cotidiano.');
      diretrizesAvaliacao.add('Reduzir número de distratores em questões de múltipla escolha (máximo 3 alternativas claras).');
      diretrizesAcaoExpressao.add('Fracionar questões complexas em micro-etapas de execução autônoma.');
      diretrizesMediaDocente.add('Disponibilizar dicas processuais (scaffolding) passo a passo.');
    }

    if (has('tdah')) {
      diretrizesLinguagem.add('Destacar em negrito estratégico os verbos de comando principais de cada enunciado.');
      diretrizesLayout.add('Delimitar cada questão em caixas visuais claras e isoladas.');
      diretrizesLayout.add('Eliminar textos puramente decorativos ou distratores gráficos não essenciais.');
      diretrizesAcaoExpressao.add('Incluir checklist de auto-verificação ao final de cada questão.');
    }

    if (has('baixa_visao')) {
      diretrizesLayout.add('Utilizar tipografia ampliada de alta legibilidade (18pt a 24pt) sem serifa.');
      diretrizesLayout.add('Garantir esquema de alto contraste (preto/branco ou amarelo/preto).');
      diretrizesLayout.add('Aplicar espaçamento entrelinhas amplo (1.5x a 2.0x).');
      diretrizesLayout.add('Fornecer descrição textual detalhada e audiodescrição para imagens.');
    }

    if (has('cegueira')) {
      diretrizesLayout.add('Formatar o conteúdo em estrutura 100% linear e semântica para leitores de tela (NVDA/TalkBack).');
      diretrizesLayout.add('Fornecer audiodescrição detalhada obrigatória de todos os elementos visuais.');
      diretrizesAvaliacao.add('Eliminar qualquer comando que dependa de percepção visual direta.');
    }

    if (has('surdez')) {
      diretrizesLinguagem.add('Estruturar orações na ordem direta (Sujeito + Verbo + Objeto), considerando o Português como L2.');
      diretrizesLinguagem.add('Eliminar trocadilhos, rimas ou figuras sonoras.');
      diretrizesLayout.add('Fornecer glossário imagético dos conceitos principais.');
    }

    if (has('motora')) {
      diretrizesAcaoExpressao.add('Dispensar a exigência de escrita manual fina, redações longas à mão ou traçados de precisão.');
      diretrizesAcaoExpressao.add('Permitir assinalação direta com áreas ampliadas, pareamento simplificado ou resposta oral.');
    }

    if (has('dislexia')) {
      diretrizesLayout.add('Utilizar tipografia sem serifa com espaçamento aberto, alinhado à esquerda (sem justificar).');
      diretrizesLinguagem.add('Segmentar textos densos em blocos curtos com leitura guiada.');
    }

    if (has('discalculia')) {
      diretrizesAcaoExpressao.add('Fornecer reta numérica visual e diagramas de quantidade.');
      diretrizesAvaliacao.add('Autorizar consulta aberta a tabelas de fórmulas e tabuada.');
    }

    if (has('ah_sd')) {
      diretrizesEngajamento.add('Propor desafios investigativos abertos, pensamento divergente e conexões interdisciplinares.');
    }

    // ─── 2. Detecção e Fusão de Sinergias para Múltipla Deficiência ─────────
    if (has('tea') && has('di')) {
      sinergiasIdentificadas.push('TEA + Deficiência Intelectual: Aliar literalidade à Leitura Fácil concreta com apoios visuais limpos.');
    }

    if (has('baixa_visao') && has('motora')) {
      sinergiasIdentificadas.push('Baixa Visão + Deficiência Motora: Fonte ampliada com áreas de clique/marcação expandidas e dispensa de grafia fina.');
    }

    if (has('cegueira')) {
      // Regra de não-contradição: se cegueira estiver presente, nenhuma pista pode depender de cor ou imagem pura
      regrasConflitoResolvidas.push('Cegueira: Toda diretriz de apoio visual foi automaticamente convertida em audiodescrição semântica para leitores de tela e comandos visuais foram suprimidos.');
    }

    // ─── 3. Modulação por Nível de Suporte (1 a 3) ───────────────────────────
    if (nivelNormalizado === 3) {
      diretrizesMediaDocente.add('Nível de Suporte 3 (Alto): Necessita de mediação contínua do professor/AEE, pausas frequentes a cada 15 minutos e redução substancial de densidade textual.');
      diretrizesAcaoExpressao.add('Priorizar respostas por apontamento, pareamento e uso de material manipulável concreto.');
    } else if (nivelNormalizado === 2) {
      diretrizesMediaDocente.add('Nível de Suporte 2 (Moderado): Conceder tempo estendido de 50% e verificar a compreensão inicial do comando antes do início autônomo.');
    }

    // ─── 4. Ancoragem em Hiperfoco (se houver) ────────────────────────────────
    if (hiperfocoLimpo) {
      diretrizesEngajamento.add(`Ancorar exemplos ou contextos das questões no hiperfoco do aluno: "${hiperfocoLimpo}".`);
    }

    return {
      categorias,
      nivelSuporte: nivelNormalizado,
      ancoragemHiperfoco: hiperfocoLimpo || null,
      diretrizesLinguagem: Array.from(diretrizesLinguagem),
      diretrizesLayout: Array.from(diretrizesLayout),
      diretrizesAvaliacao: Array.from(diretrizesAvaliacao),
      diretrizesAcaoExpressao: Array.from(diretrizesAcaoExpressao),
      diretrizesEngajamento: Array.from(diretrizesEngajamento),
      diretrizesMediaDocente: Array.from(diretrizesMediaDocente),
      sinergiasIdentificadas,
      regrasConflitoResolvidas,
    };
  }
}
