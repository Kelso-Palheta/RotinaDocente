/**
 * Provedores de Inteligência Artificial Homologados para BYOK
 * RN-27: Suporte aos provedores líderes de mercado e especialistas.
 */

export const AIProviders = {
  gemini: {
    id: 'gemini',
    nome: 'Google Gemini',
    descricao: 'Rápido, econômico e com excelente camada gratuita no Google AI Studio.',
    defaultModel: 'gemini-1.5-flash',
    modelos: [
      { id: 'gemini-2.5-flash', nome: 'Gemini 2.5 Flash (Recomendado - Mais Recente)' },
      { id: 'gemini-1.5-flash', nome: 'Gemini 1.5 Flash (Legado)' },
      { id: 'gemini-2.0-flash', nome: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', nome: 'Gemini 1.5 Pro (Alta Capacidade / Raciocínio)' },
    ],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    keyPrefix: 'AQ',
    keyPlaceholder: 'AQ... (ou AIzaSy...)',
    keyHelpUrl: 'https://aistudio.google.com/app/apikey',
    keyHelpText: 'Obtenha sua chave gratuita no Google AI Studio',
    cor: '#1a73e8',
  },
  openai: {
    id: 'openai',
    nome: 'OpenAI (ChatGPT)',
    descricao: 'Padrão da indústria com alta acurácia e modelos GPT-4o.',
    defaultModel: 'gpt-4o-mini',
    modelos: [
      { id: 'gpt-4o-mini', nome: 'GPT-4o Mini (Recomendado - Custo-benefício)' },
      { id: 'gpt-4o', nome: 'GPT-4o (Alta Precisão)' },
    ],
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-proj-... ou sk-...',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyHelpText: 'Crie uma chave na OpenAI Platform',
    cor: '#10a37f',
  },
  anthropic: {
    id: 'anthropic',
    nome: 'Anthropic (Claude)',
    descricao: 'Excelente capacidade de escrita, nuances pedagógicas e revisão textual.',
    defaultModel: 'claude-3-5-haiku-latest',
    modelos: [
      { id: 'claude-3-5-haiku-latest', nome: 'Claude 3.5 Haiku (Rápido e Preciso)' },
      { id: 'claude-3-5-sonnet-latest', nome: 'Claude 3.5 Sonnet (Referência em Escrita)' },
    ],
    baseUrl: 'https://api.anthropic.com/v1/messages',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-api03-...',
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    keyHelpText: 'Gere sua chave no Anthropic Console',
    cor: '#d97706',
  },
  maritaca: {
    id: 'maritaca',
    nome: 'Maritaca AI (Sabiá)',
    descricao: 'Especialista em Língua Portuguesa, cultura brasileira, BNCC e ENEM.',
    defaultModel: 'sabiazinho-4',
    modelos: [
      { id: 'sabiazinho-4', nome: 'Sabiá-zinho 4 (Recomendado - Ultra Rápido)' },
      { id: 'sabia-3', nome: 'Sabiá 3 (Versão Completa)' },
    ],
    baseUrl: 'https://chat.maritaca.ai/api/v1/chat/completions',
    keyPrefix: '',
    keyPlaceholder: 'Chave de API Maritalk...',
    keyHelpUrl: 'https://chat.maritaca.ai/',
    keyHelpText: 'Obtenha créditos e chaves no portal Maritaca AI',
    cor: '#059669',
  },
  openrouter: {
    id: 'openrouter',
    nome: 'OpenRouter',
    descricao: 'Acesso a dezenas de modelos abertos (Llama, Mistral) e modelos gratuitos.',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    modelos: [
      { id: 'meta-llama/llama-3.1-8b-instruct:free', nome: 'Llama 3.1 8B (Gratuito)' },
      { id: 'openrouter/free', nome: 'OpenRouter Free (Auto - Roteamento Inteligente Gratuito)' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', nome: 'Llama 3.3 70B (Gratuito - Alta Capacidade)' },
    ],
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    keyPrefix: 'sk-or-',
    keyPlaceholder: 'sk-or-v1-...',
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyHelpText: 'Chave unificada em openrouter.ai/keys',
    cor: '#6366f1',
  },
};

export const PROVEDORES_DISPONIVEIS = Object.values(AIProviders);
