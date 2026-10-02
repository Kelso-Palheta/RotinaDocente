/**
 * Teste Unitário — Leitor Imersivo Acessível TTS
 * Referência: specs/RULES.md (RN-53) e specs/TESTS_SPEC.md (UT-27)
 */

import { describe, test, expect } from 'vitest';
import {
  prepararTextoParaLeitura,
  validarTaxaFala,
  ESTADOS_LEITURA
} from '../../frontend/src/dominio/adaptacoes/leitorAcessivel';

describe('UT-27 (RN-53): Leitor Imersivo Acessível com TTS e Limpeza Fonética', () => {
  test('deve higienizar marcações Markdown e HTML produzindo texto limpo para o sintetizador', () => {
    const textoBruto = `
      ### Orientações Pedagógicas
      Olá **estudante**! Veja a tabela abaixo:
      | Item | Detalhe |
      | --- | --- |
      | 1 | Estudo |
      Acesse o [Portal do Aluno](https://exemplo.com) para mais informações.
      <p style="color: red;">Atenção aos prazos!</p>
    `;

    const textoLimpo = prepararTextoParaLeitura(textoBruto);

    // Não deve conter símbolos de markdown
    expect(textoLimpo).not.toContain('###');
    expect(textoLimpo).not.toContain('**');
    expect(textoLimpo).not.toContain('| --- |');
    expect(textoLimpo).not.toContain('<p style');
    expect(textoLimpo).not.toContain('https://exemplo.com');

    // Deve preservar o conteúdo textual relevante
    expect(textoLimpo).toContain('Orientações Pedagógicas');
    expect(textoLimpo).toContain('Olá estudante!');
    expect(textoLimpo).toContain('Portal do Aluno');
    expect(textoLimpo).toContain('Atenção aos prazos!');
  });

  test('deve limitar a taxa de fala aos limites de conforto cognitivo (0.75 a 1.25)', () => {
    expect(validarTaxaFala(1.0)).toBe(1.0);
    expect(validarTaxaFala(0.85)).toBe(0.85);
    expect(validarTaxaFala(1.2)).toBe(1.2);

    // Clamps
    expect(validarTaxaFala(0.5)).toBe(0.75); // Muito lento -> sobe para o mínimo
    expect(validarTaxaFala(2.0)).toBe(1.25); // Muito rápido -> desce para o máximo
    expect(validarTaxaFala('invalido')).toBe(1.0); // Fallback padrão
    expect(validarTaxaFala(null)).toBe(1.0);
  });

  test('deve expor os estados canônicos de controle de áudio', () => {
    expect(ESTADOS_LEITURA.IDLE).toBe('idle');
    expect(ESTADOS_LEITURA.PLAYING).toBe('playing');
    expect(ESTADOS_LEITURA.PAUSED).toBe('paused');
  });

  test('deve tratar entradas nulas ou vazias retornando string vazia', () => {
    expect(prepararTextoParaLeitura('')).toBe('');
    expect(prepararTextoParaLeitura(null)).toBe('');
    expect(prepararTextoParaLeitura(undefined)).toBe('');
  });
});
