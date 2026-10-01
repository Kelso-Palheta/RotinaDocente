/**
 * Construtor de Prompts e Utilitários para Imagens Pedagógicas DUA (RN-39)
 * Camada: src/dominio/adaptacoes/
 */

const DIRETRIZES_NECESSIDADES = {
  baixa_visao:
    'alto contraste extremo entre figura e fundo, contornos espessos e bem definidos, sem tons pastéis',
  cegueira:
    'cena simples e descritiva em palavras, composição linear organizada da esquerda para a direita',
  tea: 'fundo organizado e previsível, sem estampas ambíguas ou padrões concorrentes',
  tdah: 'um único objeto central em destaque, distratores visuais eliminados',
  di: 'cena concreta do cotidiano escolar, poucos elementos e ação única',
  surdez: 'elementos visuais autoexplicativos, gestos e expressões legíveis',
  motora: 'objeto grande e isolado, fácil de apontar e identificar',
  dislexia: 'formas geométricas distintas, sem letras ou palavras na imagem',
  discalculia: 'quantidades representadas com objetos contáveis, sem números',
  epilepsia: 'sem padrões xadrez de alto contraste ou riscas finas repetidas',
  ansiedade: 'cena calma e acolhedora, sem elementos ameaçadores',
  toc: 'composição simétrica e limpa, sem detalhes repetitivos excessivos',
  conduta: 'contexto escolar positivo e colaborativo',
  ah_sd: 'objeto central bem delimitado com espaço em branco generoso',
  outras_condicoes: 'composição clara e sem ruídos visuais',
};

export class ImagemPedagogicaBuilder {
  /**
   * Constrói o prompt otimizado para geração de apoio visual acessível
   * @param {Object} params
   * @param {string} params.descricaoApoio Descrição do apoio visual da questão
   * @param {string} [params.disciplina]
   * @param {Array<string>} [params.necessidades]
   * @returns {string} Prompt refinado
   */
  static construirPrompt({ descricaoApoio = '', disciplina = 'Geral', necessidades = [] } = {}) {
    const limpo = descricaoApoio.trim();

    let prompt = `Ilustração didática para material escolar inclusivo (Desenho Universal para a Aprendizagem - DUA).
Objeto central a ilustrar: ${limpo}
Diretrizes visuais obrigatórias:
- Estilo: Ilustração vetorial educativa com traços limpos, nítidos e bem delineados.
- Fundo: fundo claro e neutro, sem ruídos visuais ou estampas concorrentes.
- Acessibilidade: alto contraste entre a figura principal e o fundo, facilitando a identificação imediata por estudantes com baixa visão, TDAH ou TEA.
- Restrição estrita: sem texto, sem caracteres ou palavras escritas dentro da imagem.`;

    const disciplinaLimpa = typeof disciplina === 'string' ? disciplina.trim() : '';
    if (disciplinaLimpa && disciplinaLimpa.toLowerCase() !== 'geral') {
      prompt += `\nDisciplina: ${disciplinaLimpa} — contextualize a cena aos elementos típicos dessa área do conhecimento.`;
    }

    const categorias = (Array.isArray(necessidades) ? necessidades : [])
      .map((n) => (typeof n === 'string' ? n.trim().toLowerCase() : ''))
      .filter((n, i, arr) => n && arr.indexOf(n) === i);

    const diretrizes = categorias
      .map((categoria) => DIRETRIZES_NECESSIDADES[categoria])
      .filter(Boolean);

    if (diretrizes.length > 0) {
      prompt += `\nDiretrizes por necessidade:\n${diretrizes
        .map((d) => `- ${d}`)
        .join('\n')}`;
    }

    return prompt;
  }

  /**
   * Monta o prompt em inglês para o fallback gratuito (Pollinations)
   * @param {Object} [questao]
   * @param {string} [questao.apoioVisualPromptIngles]
   * @param {string} [questao.apoioVisualDescricao]
   * @param {string} [questao.enunciado]
   * @returns {string} Prompt da ilustração
   */
  static montarPromptFallback(questao = null) {
    const {
      apoioVisualPromptIngles = '',
      apoioVisualDescricao = '',
      enunciado = '',
    } = questao || {};

    const texto = [apoioVisualPromptIngles, apoioVisualDescricao, enunciado]
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .find((t) => t);

    const base = texto || 'educational illustration of the main subject of the question';
    return `educational illustration, children style, safe for school, ${base}`;
  }

  /**
   * Monta a URL do serviço gratuito Pollinations a partir de um prompt
   * @param {string} prompt
   * @param {Object} [opcoes]
   * @param {number} [opcoes.width=800]
   * @param {number} [opcoes.height=400]
   * @returns {string} URL da imagem
   */
  static montarUrlPollinations(prompt, { width = 800, height = 400 } = {}) {
    const limpo = typeof prompt === 'string' ? prompt : '';
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      limpo
    )}?width=${width}&height=${height}&nologo=true`;
  }

  /**
   * Monta a URL do serviço novo do Pollinations (exige chave) com o modelo Flux.
   * Retorna null quando não há chave — o chamador deve usar o endpoint legado.
   * @param {string} prompt
   * @param {Object} [opcoes]
   * @param {string} [opcoes.apiKey]
   * @param {number} [opcoes.width=800]
   * @param {number} [opcoes.height=400]
   * @returns {string|null}
   */
  static montarUrlPollinationsFlux(prompt, { apiKey, width = 800, height = 400 } = {}) {
    const chave = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!chave) return null;

    const limpo = typeof prompt === 'string' ? prompt : '';
    return `https://gen.pollinations.ai/image/${encodeURIComponent(
      limpo
    )}?model=flux&width=${width}&height=${height}&nologo=true&key=${encodeURIComponent(chave)}`;
  }

  /**
   * Carrega uma imagem validando o resultado antes de publicar a URL.
   * Rejeita em erro de carregamento ou timeout.
   * @param {string} url
   * @param {Object} [opcoes]
   * @param {() => HTMLImageElement} [opcoes.criarImagem] Fábrica injetável (teste)
   * @param {number} [opcoes.timeoutMs=20000]
   * @returns {Promise<string>} resolve com a URL quando carrega
   */
  static carregarImagemComTimeout(url, { criarImagem, timeoutMs = 20000 } = {}) {
    return new Promise((resolve, reject) => {
      const fabrica = criarImagem || (() => new Image());
      const imagem = fabrica();
      let concluido = false;

      const concluir = (erro) => {
        if (concluido) return;
        concluido = true;
        clearTimeout(temporizador);
        imagem.onload = null;
        imagem.onerror = null;
        if (erro) reject(erro);
        else resolve(url);
      };

      const temporizador = setTimeout(() => {
        concluir(new Error(`Timeout ao carregar a imagem (${timeoutMs}ms).`));
      }, timeoutMs);

      imagem.onload = () => concluir(null);
      imagem.onerror = () => concluir(new Error('Falha ao carregar a imagem.'));
      imagem.src = url;
    });
  }

  /**
   * Formata a string base64 pura em um Data URL válido
   * @param {string} base64
   * @param {string} [mimeType='image/png']
   * @returns {string}
   */
  static formatarDataUrl(base64, mimeType = 'image/png') {
    if (!base64) return '';
    if (base64.startsWith('data:')) return base64;
    return `data:${mimeType};base64,${base64}`;
  }
}
