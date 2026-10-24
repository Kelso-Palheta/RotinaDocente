import { describe, it, expect } from 'vitest';
import { migrarCriteriosTurmas, validarCriterios, lerNumeroNota, prepararColagemSimulado } from '@/dominio/diario/criterios';
import { calcTotal } from '@/utils/diario/calculos';

describe('RN-68 critérios preservados e lançamento estrito', () => {
  it('preenche ausências, preserva personalização e é idempotente', () => {
    const original = [{ id: 't', bimestres: { '1': { config: { simuladoMaxLanca: 10, simuladoMaxFinal: 7, atividadesMaxFinal: 3, mediaAprovacao: 6 }, notas: { a: { simulado: 8 } } } } }];
    const migradas = migrarCriteriosTurmas(original);
    expect(migradas[0].bimestres['1'].config).toMatchObject({ simuladoMaxLanca: 10, simuladoMaxFinal: 7, atividadesMaxFinal: 3, mediaAprovacao: 6, mediaRecuperacao: 4.99 });
    expect(migradas[0].bimestres['1'].config.versaoCriterios).toBe(1);
    expect(original[0].bimestres['1'].config.mediaRecuperacao).toBeUndefined();
    expect(migrarCriteriosTurmas(migradas)).toEqual(migradas);
  });
  it.each(['2abc', '1.2.3', 'Infinity', '1e2', ' ', NaN])('rejeita entrada parcial/não finita %s', entrada => {
    expect(() => lerNumeroNota(entrada, 0, 5)).toThrow();
  });
  it('preserva vazio e zero; aceita vírgula; rejeita acima da escala sem truncar', () => {
    expect(lerNumeroNota('', 0, 5)).toBe('');
    expect(lerNumeroNota('0', 0, 5)).toBe(0);
    expect(lerNumeroNota('4,25', 0, 5)).toBe(4.25);
    expect(() => lerNumeroNota('5,1', 0, 5)).toThrow(/entre/);
  });
  it('rejeita escala zero, pesos nulos e limites inconsistentes', () => {
    expect(() => validarCriterios({ simuladoMaxLanca: 0 })).toThrow();
    expect(() => validarCriterios({ simuladoMaxFinal: 0, atividadesMaxFinal: 0 })).toThrow();
    expect(() => validarCriterios({ mediaAprovacao: 11 })).toThrow();
    expect(() => validarCriterios({ mediaAprovacao: 5, mediaRecuperacao: 6 })).toThrow();
    expect(validarCriterios({ simuladoMaxLanca: '10', simuladoMaxFinal: '7', atividadesMaxFinal: '3', mediaAprovacao: '6' }).simuladoMaxFinal).toBe(7);
  });
  it('cálculo legado inválido não produz NaN ou infinito', () => {
    expect(Number.isFinite(calcTotal(4, [{ id: 'a', max: Infinity }], { a: Infinity }, { simuladoMaxLanca: 0 }))).toBe(true);
  });
  it('colagem usa nomes completos, nunca posição ou ordem alfabética', () => {
    expect(prepararColagemSimulado('Bia Santos\t4,5\nAna Lima;3')).toEqual([{ nome: 'Bia Santos', nota: '4,5' }, { nome: 'Ana Lima', nota: '3' }]);
    expect(() => prepararColagemSimulado('4,5\n3')).toThrow(/nome/i);
  });
});
