/**
 * Teste Unitário — Telemetria Local de Consumo de IA & BYOK
 * Referência: specs/RULES.md (RN-55) e specs/TESTS_SPEC.md (UT-29)
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  registrarConsumoIA,
  obterResumoConsumoIA,
  limparTelemetriaIA,
  CHAVE_STORAGE_TELEMETRIA
} from '../../frontend/src/dominio/ai/telemetriaConsumo';

describe('UT-29 (RN-55): Telemetria Local de IA e Estimativa de Tokens', () => {
  let fakeStorage;

  beforeEach(() => {
    const store = new Map();
    fakeStorage = {
      getItem: (key) => store.get(key) || null,
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear()
    };
  });

  test('deve registrar chamadas incrementais e acumular tokens por provedor e módulo', () => {
    // Chamada 1: Gemini no módulo de redação
    registrarConsumoIA({
      provedor: 'gemini',
      modulo: 'redacao',
      tokensEstimados: 1200
    }, fakeStorage);

    // Chamada 2: Gemini novamente no módulo de redação
    registrarConsumoIA({
      provedor: 'gemini',
      modulo: 'redacao',
      tokensEstimados: 800
    }, fakeStorage);

    // Chamada 3: OpenAI no módulo de adaptações
    registrarConsumoIA({
      provedor: 'openai',
      modulo: 'adaptacoes',
      tokensEstimados: 1500
    }, fakeStorage);

    const resumo = obterResumoConsumoIA(fakeStorage);

    expect(resumo.totalGeralChamadas).toBe(3);
    expect(resumo.totalGeralTokens).toBe(3500);

    expect(resumo.porProvedor.gemini).toEqual({
      totalChamadas: 2,
      tokensEstimados: 2000
    });

    expect(resumo.porProvedor.openai).toEqual({
      totalChamadas: 1,
      tokensEstimados: 1500
    });

    expect(resumo.porModulo.redacao).toEqual({
      totalChamadas: 2,
      tokensEstimados: 2000
    });

    expect(resumo.porModulo.adaptacoes).toEqual({
      totalChamadas: 1,
      tokensEstimados: 1500
    });
  });

  test('deve limpar telemetria quando solicitado', () => {
    registrarConsumoIA({ provedor: 'anthropic', modulo: 'agentes', tokensEstimados: 500 }, fakeStorage);
    expect(obterResumoConsumoIA(fakeStorage).totalGeralChamadas).toBe(1);

    limparTelemetriaIA(fakeStorage);

    const limpo = obterResumoConsumoIA(fakeStorage);
    expect(limpo.totalGeralChamadas).toBe(0);
    expect(limpo.totalGeralTokens).toBe(0);
    expect(limpo.porProvedor).toEqual({});
    expect(limpo.porModulo).toEqual({});
  });

  test('deve ser resiliente contra dados corrompidos no storage', () => {
    fakeStorage.setItem(CHAVE_STORAGE_TELEMETRIA, 'JSON_INVALIDO_###');

    const resumo = obterResumoConsumoIA(fakeStorage);
    expect(resumo.totalGeralChamadas).toBe(0);
    expect(resumo.totalGeralTokens).toBe(0);

    // Deve conseguir registrar normalmente após dado corrompido
    registrarConsumoIA({ provedor: 'maritaca', modulo: 'redacao', tokensEstimados: 600 }, fakeStorage);
    expect(obterResumoConsumoIA(fakeStorage).totalGeralChamadas).toBe(1);
  });
});
