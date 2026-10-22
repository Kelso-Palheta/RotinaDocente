import { describe, expect, it } from 'vitest';
import { estiloNotaBimestral } from '../../frontend/src/utils/diario/coresNota';

describe('RN-18: Cores padronizadas do total bimestral', () => {
  it.each([[0, 'red'], [4.99, 'red'], [5, 'blue'], [7, 'blue'], [7.99, 'blue'], [8, 'green'], [10, 'green']])
    ('nota %s usa %s', (nota, cor) => expect(estiloNotaBimestral(nota)).toContain(`text-${cor}-600`));
  it.each([null, undefined, '', NaN])('sem nota (%s) usa neutro', nota => {
    expect(estiloNotaBimestral(nota)).toBe('text-slate-400');
  });
  it('respeita aprovação configurada sem antecipar excelência', () => {
    expect(estiloNotaBimestral(5.9, { mediaAprovacao: 6 })).toContain('text-red-600');
    expect(estiloNotaBimestral(6, { mediaAprovacao: 6 })).toContain('text-blue-600');
    expect(estiloNotaBimestral(8, { mediaAprovacao: 6 })).toContain('text-green-600');
  });
});
