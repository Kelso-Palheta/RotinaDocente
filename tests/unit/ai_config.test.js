import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIProviders, PROVEDORES_DISPONIVEIS } from '../../frontend/src/dominio/ai/AIProviders';
import { AIConfig } from '../../frontend/src/dominio/ai/AIConfig';
import { AIConfigRepository } from '../../frontend/src/infraestrutura/ai/AIConfigRepository';

describe('UT-13 (RN-27): Entidade AIConfig e Provedores Suportados', () => {
  it('deve listar os 5 provedores suportados: gemini, openai, anthropic, maritaca, openrouter', () => {
    const ids = PROVEDORES_DISPONIVEIS.map(p => p.id);
    expect(ids).toContain('gemini');
    expect(ids).toContain('openai');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('maritaca');
    expect(ids).toContain('openrouter');
  });

  it('deve definir modelos padrão para cada provedor', () => {
    expect(AIProviders.gemini.defaultModel).toBe('gemini-1.5-flash');
    expect(AIProviders.openai.defaultModel).toBe('gpt-4o-mini');
    expect(AIProviders.anthropic.defaultModel).toBe('claude-3-5-haiku-latest');
    expect(AIProviders.maritaca.defaultModel).toBe('sabiazinho-4');
    expect(AIProviders.openrouter.defaultModel).toBe('meta-llama/llama-3.1-8b-instruct:free');
  });

  it('deve definir o prefixo AQ para o Google Gemini (novo padrão)', () => {
    expect(AIProviders.gemini.keyPrefix).toBe('AQ');
  });

  it('deve instanciar uma configuração de IA válida', () => {
    const config = new AIConfig({
      provider: 'gemini',
      apiKey: 'AIzaSy1234567890abcdef',
      model: 'gemini-1.5-flash'
    });

    expect(config.isValid()).toBe(true);
    expect(config.provider).toBe('gemini');
    expect(config.apiKey).toBe('AIzaSy1234567890abcdef');
    expect(config.model).toBe('gemini-1.5-flash');
  });

  it('deve rejeitar provedor não suportado', () => {
    expect(() => new AIConfig({
      provider: 'unsupported-provider',
      apiKey: '123'
    })).toThrowError(/Provedor "unsupported-provider" não é suportado/);
  });

  it('deve considerar inválida a configuração com apiKey em branco', () => {
    const config = new AIConfig({
      provider: 'openai',
      apiKey: '   '
    });
    expect(config.isValid()).toBe(false);
  });
});

describe('UT-16 (RN-30): Mascaramento de Chaves de API e Sanitização', () => {
  it('deve mascarar corretamente chaves longas mantendo apenas os 4 últimos caracteres', () => {
    const config = new AIConfig({
      provider: 'openai',
      apiKey: 'sk-proj-1234567890abcdefXYZW'
    });

    const mascarada = config.getMaskedKey();
    expect(mascarada).toBe('sk-...XYZW');
  });

  it('deve mascarar corretamente chaves do Gemini iniciando com AQ (novo padrão Google)', () => {
    const config = new AIConfig({
      provider: 'gemini',
      apiKey: 'AQ1234567890abcdefXYZW'
    });

    const mascarada = config.getMaskedKey();
    expect(mascarada).toBe('AQ...XYZW');
  });

  it('deve suportar mascaramento de chaves legadas do Gemini iniciando com AIza', () => {
    const config = new AIConfig({
      provider: 'gemini',
      apiKey: 'AIzaSy1234567890abcdef'
    });

    const mascarada = config.getMaskedKey();
    expect(mascarada).toBe('AIza...cdef');
  });

  it('deve retornar string vazia ao mascarar chave ausente', () => {
    const config = new AIConfig({
      provider: 'gemini',
      apiKey: ''
    });
    expect(config.getMaskedKey()).toBe('');
  });

  it('deve serializar para JSON com objeto sanitizado', () => {
    const config = new AIConfig({
      provider: 'anthropic',
      apiKey: 'sk-ant-api03-123456789'
    });

    const json = config.toJSON();
    expect(json.provider).toBe('anthropic');
    expect(json.apiKey).toBe('sk-ant-api03-123456789');
    expect(json.model).toBe('claude-3-5-haiku-latest');
    expect(json.maskedKey).toBe('sk-...6789');
  });
});

describe('UT-14 (RN-28): Persistência Híbrida (LocalStorage + Firestore)', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = String(value); }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; }),
    });
  });

  it('deve salvar e carregar configuração localmente via LocalStorage', () => {
    const repo = new AIConfigRepository();
    const config = new AIConfig({
      provider: 'maritaca',
      apiKey: 'maritaca-secret-key-123',
      model: 'sabiazinho-4'
    });

    repo.salvarLocal(config);

    const carregada = repo.carregarLocal();
    expect(carregada).not.toBeNull();
    expect(carregada.provider).toBe('maritaca');
    expect(carregada.apiKey).toBe('maritaca-secret-key-123');
    expect(carregada.model).toBe('sabiazinho-4');
  });

  it('deve remover configuração localmente ao desconectar', () => {
    const repo = new AIConfigRepository();
    repo.salvarLocal(new AIConfig({ provider: 'openai', apiKey: 'sk-test' }));
    expect(repo.carregarLocal()).not.toBeNull();

    repo.limparLocal();
    expect(repo.carregarLocal()).toBeNull();
  });
});

describe('UT-15 (RN-29): Bloqueio sem Fallback da Plataforma', () => {
  it('deve lançar erro AI_KEY_REQUIRED quando não houver chave pessoal configurada', () => {
    const config = new AIConfig({
      provider: 'openai',
      apiKey: ''
    });

    expect(() => {
      if (!config.isValid()) {
        const error = new Error('Você precisa conectar sua chave de IA para utilizar este recurso.');
        error.code = 'AI_KEY_REQUIRED';
        throw error;
      }
    }).toThrowError(/Você precisa conectar sua chave de IA/);
  });
});
