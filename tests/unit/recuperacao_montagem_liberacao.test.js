import { describe, expect, it } from 'vitest';
import {
  CENTESIMOS_TOTAL,
  conjuntoLiberadoParaResposta,
  conjuntoTemControleDeMontagem,
  totalDistribuidoDoConjunto,
} from '../../frontend/src/dominio/atividades/recuperacaoSemestral';

describe('REV3-R81-02: contrato de montagem e liberação da recuperação', () => {
  it('reconhece conjunto legado pela ausência explícita de escalas', () => {
    expect(conjuntoTemControleDeMontagem({ estado: 'rascunho' })).toBe(false);
    expect(conjuntoTemControleDeMontagem({ escalas: {} })).toBe(true);
    // Legado continua podendo receber entrega mesmo sem o mapa novo.
    expect(conjuntoLiberadoParaResposta({ estado: 'rascunho' })).toBe(true);
  });

  it('não libera conjunto novo enquanto a distribuição está incompleta', () => {
    const conjunto = { estado: 'rascunho', escalas: { r1: 4 }, atividadeIds: ['r1'] };
    expect(totalDistribuidoDoConjunto(conjunto)).toBe(400);
    expect(totalDistribuidoDoConjunto(conjunto)).toBeLessThan(CENTESIMOS_TOTAL);
    expect(conjuntoLiberadoParaResposta(conjunto)).toBe(false);
  });

  it('libera quando estado e soma persistida fecham exatamente dez pontos', () => {
    expect(conjuntoLiberadoParaResposta({
      estado: 'pronto',
      escalas: { r1: 4, r2: 3, r3: 3 },
    })).toBe(true);
  });

  it('não libera estado pronto com soma diferente de dez ou escala inválida', () => {
    expect(conjuntoLiberadoParaResposta({ estado: 'pronto', escalas: { r1: 4, r2: 6.01 } })).toBe(false);
    expect(conjuntoLiberadoParaResposta({ estado: 'pronto', escalas: { r1: 4 } })).toBe(false);
    expect(conjuntoLiberadoParaResposta({ estado: 'pronto', escalas: { r1: 'x' } })).toBe(false);
  });

  it('trata liberação explícita e cancelamento sem ambiguidade', () => {
    expect(conjuntoLiberadoParaResposta({ estado: 'rascunho', escalas: { r1: 4 }, liberado: true })).toBe(true);
    expect(conjuntoLiberadoParaResposta({ estado: 'cancelado', escalas: { r1: 4, r2: 6 }, liberado: true })).toBe(false);
    expect(conjuntoLiberadoParaResposta(null)).toBe(false);
  });

  it('soma centésimos persistidos sem erro de ponto flutuante', () => {
    expect(totalDistribuidoDoConjunto({ escalas: { r1: 3.33, r2: 3.33, r3: 3.34 } })).toBe(1000);
    expect(() => totalDistribuidoDoConjunto({ escalas: { r1: 4.001 } })).toThrow(/duas casas/i);
  });
});
