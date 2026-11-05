import { describe, expect, it } from 'vitest';
import {
  TOKENS_REVISAO_VIBRANTE,
  PARES_CONTRASTE_TEXTO,
  calcularLuminancia,
  calcularTaxaContraste,
} from '../../frontend/src/components/revisao/RevisaoTema.jsx';

describe('Auditoria de Acessibilidade Visual e Contraste (WCAG AA / 4.5:1)', () => {
  it('exporta os tokens da paleta vibrante (Festival de Arte + Game Show)', () => {
    expect(TOKENS_REVISAO_VIBRANTE.palco).toBe('#25104A');
    expect(TOKENS_REVISAO_VIBRANTE.destaque).toBe('#6334E3');
    expect(TOKENS_REVISAO_VIBRANTE.leitura).toBe('#FFFDF7');
    expect(TOKENS_REVISAO_VIBRANTE.textoEscuro).toBe('#25104A');
    expect(TOKENS_REVISAO_VIBRANTE.acentos.amarelo).toBe('#FFE14D');
    expect(TOKENS_REVISAO_VIBRANTE.acentos.ciano).toBe('#00DDEB');
    expect(TOKENS_REVISAO_VIBRANTE.acentos.coral).toBe('#FF4F9B');
    expect(TOKENS_REVISAO_VIBRANTE.acentos.lima).toBe('#B7F247');
    expect(TOKENS_REVISAO_VIBRANTE.acentos.laranja).toBe('#FF8A3D');
  });

  it('funções de luminância e contraste seguem a especificação WCAG 2.1', () => {
    // Branco absoluto vs Preto absoluto deve ser 21:1
    expect(calcularTaxaContraste('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    // Mesma cor deve ser 1:1
    expect(calcularTaxaContraste('#25104A', '#25104A')).toBeCloseTo(1, 1);
  });

  it('todos os pares semânticos de texto cumprem o limiar WCAG AA de pelo menos 4.5:1', () => {
    expect(PARES_CONTRASTE_TEXTO.length).toBeGreaterThan(0);

    for (const par of PARES_CONTRASTE_TEXTO) {
      const taxa = calcularTaxaContraste(par.fundo, par.texto);
      expect(
        taxa,
        `Falha de contraste no par "${par.nome}": fundo ${par.fundo} com texto ${par.texto} resultou em ${taxa.toFixed(2)}:1 (mínimo 4.5:1 exigido)`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('garante que texto sobre acentos claros (amarelo, ciano e lima) nunca utilize branco pequeno', () => {
    const acentosClaros = [
      { nome: 'amarelo', hex: TOENS_OU_HEX(TOKENS_REVISAO_VIBRANTE.acentos.amarelo) },
      { nome: 'ciano', hex: TOENS_OU_HEX(TOKENS_REVISAO_VIBRANTE.acentos.ciano) },
      { nome: 'lima', hex: TOENS_OU_HEX(TOKENS_REVISAO_VIBRANTE.acentos.lima) },
    ];

    for (const item of acentosClaros) {
      // Texto com branco (#FFFFFF ou #FFFDF7) falharia miseravelmente nesses acentos
      const taxaComBranco = calcularTaxaContraste(item.hex, '#FFFFFF');
      expect(
        taxaComBranco,
        `Branco sobre ${item.nome} (${item.hex}) não atinge 4.5:1, comprovando que deve ser escuro`
      ).toBeLessThan(4.5);

      // Texto com textoEscuro (#25104A) deve passar com folga (>= 4.5:1)
      const taxaComEscuro = calcularTaxaContraste(item.hex, TOKENS_REVISAO_VIBRANTE.textoEscuro);
      expect(taxaComEscuro).toBeGreaterThanOrEqual(4.5);
    }
  });
});

function TOENS_OU_HEX(val) {
  return val;
}
