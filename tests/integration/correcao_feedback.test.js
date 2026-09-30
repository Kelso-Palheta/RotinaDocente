import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateCorrection } from '../../frontend/src/lib/redacao/ai-provider';
import { callAI } from '../../frontend/src/lib/ai-provider-central';
import { MASTER_ENEM_PROMPT } from '../../frontend/src/lib/redacao/constants';
import { cleanFeedbackText } from '../../frontend/src/lib/redacao/renderFeedback';
import { extractScore } from '../../frontend/src/lib/redacao/scores';

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const USER_CONFIG = { provider: 'openai', apiKey: 'sk-proj-Fake', model: 'gpt-4o-mini' };

describe('IT-12 (RN-49): Feedback de correção — tokens por profundidade, notas garantidas e markdown', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('maxTokens por profundidade (geração sem corte)', () => {
    const run = async (depth) => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(jsonResponse(200, { choices: [{ message: { content: 'Feedback' }, finish_reason: 'stop' }] }));
      globalThis.fetch = mockFetch;

      await generateCorrection({
        text: 'Redação de teste sobre apostas online.',
        studentName: 'Aluno Teste',
        essayTheme: 'Apostas online',
        depth,
        competencies: 'Todas',
        userConfig: USER_CONFIG,
      });

      const [, options] = mockFetch.mock.calls[0];
      return JSON.parse(options.body).max_tokens;
    };

    it('depth basic deve pedir 3000 tokens', async () => {
      expect(await run('basic')).toBe(3000);
    });

    it('depth analyzed deve pedir 6000 tokens', async () => {
      expect(await run('analyzed')).toBe(6000);
    });

    it('depth deep deve pedir 9000 tokens', async () => {
      expect(await run('deep')).toBe(9000);
    });
  });

  describe('MASTER_ENEM_PROMPT — JSON das notas como primeiro bloco da resposta', () => {
    it('a seção de JSON deve vir antes da ETAPA 1 para sobreviver a corte de tokens', () => {
      const jsonIdx = MASTER_ENEM_PROMPT.indexOf('SAÍDA JSON');
      const etapa1Idx = MASTER_ENEM_PROMPT.indexOf('ETAPA 1');
      expect(jsonIdx).toBeGreaterThan(-1);
      expect(etapa1Idx).toBeGreaterThan(-1);
      expect(jsonIdx).toBeLessThan(etapa1Idx);
    });

    it('deve instruir explicitamente a INICIAR a resposta com o bloco JSON', () => {
      expect(MASTER_ENEM_PROMPT).toMatch(/INICIE a sua resposta/i);
    });
  });

  describe('extractScore — notas mesmo com JSON no início do texto', () => {
    it('deve extrair o bloco ```json mesmo quando ele abre a resposta', () => {
      const texto =
        '```json\n{"c1":120,"c2":160,"c3":120,"c4":160,"c5":80,"total":640,"anulada":false}\n```\n' +
        '### Análise da redação\nO aluno apresentou...';
      const scores = extractScore(texto);
      expect(scores).toBeTruthy();
      expect(scores.total).toBe(640);
      expect(scores.items).toHaveLength(5);
      expect(scores.items[0]).toMatchObject({ subject: 'C1', A: 120, fullMark: 200 });
    });

    it('deve continuar extraindo por regex quando o JSON vem truncado sem fechar o fence', () => {
      const texto = 'Feedback parcial... "c1": 80, "c2": 120, "c3": 40, "c4": 160, "c5": 40, "total": 440';
      const scores = extractScore(texto);
      expect(scores).toBeTruthy();
      expect(scores.total).toBe(440);
    });

    it('deve devolver null quando não há nenhuma nota no texto', () => {
      expect(extractScore('Apenas texto livre sem notas.')).toBeNull();
    });
  });

  describe('cleanFeedbackText — remove o JSON e preserva o markdown', () => {
    it('deve remover o bloco ```json no INÍCIO e manter o restante', () => {
      const entrada =
        '```json\n{"c1":120,"c2":160,"c3":120,"c4":160,"c5":80,"total":640,"anulada":false}\n```\n' +
        '### RESUMO DAS NOTAS\n| C1 | 120 |';
      const saida = cleanFeedbackText(entrada);
      expect(saida).not.toMatch(/```json/);
      expect(saida).not.toContain('c1');
      expect(saida).toContain('### RESUMO DAS NOTAS');
      expect(saida).toContain('| C1 | 120 |');
    });

    it('deve continuar removendo o JSON solto no FIM (comportamento legado)', () => {
      const entrada = 'Feedback completo da redação.\n\n{"c1": 120, "c2": 160, "c3": 120, "c4": 160, "c5": 80, "total": 640}';
      const saida = cleanFeedbackText(entrada);
      expect(saida).toBe('Feedback completo da redação.');
    });

    it('deve preservar negrito, listas e headings do markdown', () => {
      const entrada = '### Título\n- **forte**\n- item 2';
      expect(cleanFeedbackText(entrada)).toBe(entrada);
    });
  });

  describe('callAI — detecção de truncamento (finish_reason) com retry automático', () => {
    it('deve repetir com o dobro de tokens quando finish_reason for length', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(200, { choices: [{ message: { content: 'parcial' }, finish_reason: 'length' }] })
        )
        .mockResolvedValueOnce(
          jsonResponse(200, { choices: [{ message: { content: 'Feedback completo' }, finish_reason: 'stop' }] })
        );
      globalThis.fetch = mockFetch;

      const res = await callAI({
        messages: [{ role: 'user', content: 'Corrija' }],
        maxTokens: 4000,
        userConfig: USER_CONFIG,
      });

      expect(res).toBe('Feedback completo');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const firstBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const secondBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(firstBody.max_tokens).toBe(4000);
      expect(secondBody.max_tokens).toBe(8000);
    });

    it('não deve repetir quando a resposta chega completa (finish_reason stop)', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          jsonResponse(200, { choices: [{ message: { content: 'Ok' }, finish_reason: 'stop' }] })
        );
      globalThis.fetch = mockFetch;

      const res = await callAI({
        messages: [{ role: 'user', content: 'Corrija' }],
        maxTokens: 4000,
        userConfig: USER_CONFIG,
      });

      expect(res).toBe('Ok');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('anthropic: deve repetir quando stop_reason for max_tokens', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(200, { content: [{ type: 'text', text: 'parcial' }], stop_reason: 'max_tokens' })
        )
        .mockResolvedValueOnce(
          jsonResponse(200, { content: [{ type: 'text', text: 'Feedback completo' }], stop_reason: 'end_turn' })
        );
      globalThis.fetch = mockFetch;

      const res = await callAI({
        messages: [{ role: 'user', content: 'Corrija' }],
        maxTokens: 4000,
        userConfig: { provider: 'anthropic', apiKey: 'sk-ant-Fake', model: 'claude-3-5-haiku-latest' },
      });

      expect(res).toBe('Feedback completo');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondBody.max_tokens).toBe(8000);
    });
  });
});
