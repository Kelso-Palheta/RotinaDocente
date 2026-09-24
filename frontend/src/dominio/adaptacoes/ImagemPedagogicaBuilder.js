/**
 * Construtor de Prompts e Utilitários para Imagens Pedagógicas DUA (RN-39)
 * Camada: src/dominio/adaptacoes/
 */

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

    return `Ilustração didática para material escolar inclusivo (Desenho Universal para a Aprendizagem - DUA).
Objeto central a ilustrar: ${limpo}
Diretrizes visuais obrigatórias:
- Estilo: Ilustração vetorial educativa com traços limpos, nítidos e bem delineados.
- Fundo: fundo claro e neutro, sem ruídos visuais ou estampas concorrentes.
- Acessibilidade: alto contraste entre a figura principal e o fundo, facilitando a identificação imediata por estudantes com baixa visão, TDAH ou TEA.
- Restrição estrita: sem texto, sem caracteres ou palavras escritas dentro da imagem.`;
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
