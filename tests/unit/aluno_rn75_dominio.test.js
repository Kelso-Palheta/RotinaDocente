import { describe, it, expect } from 'vitest';
import { interpretarDataEntrega } from '@/dominio/atividades/dataEntrega';
import { ehQuestaoObjetiva } from '@/dominio/atividades/devolutivaAluno';
import { INSTRUCAO_ACESSO, EXEMPLO_ACESSO, NOTA_COLISAO } from '@/dominio/aluno/instrucaoAcesso';

const local = new Date('2026-10-27T12:30:00');
const segundos = Math.floor(local.getTime() / 1000);

describe('UT-44 — data serializada da entrega', () => {
  it('aceita Date, Timestamp, segundos, milissegundos e texto ISO', () => {
    expect(interpretarDataEntrega(local)?.getTime()).toBe(local.getTime());
    expect(interpretarDataEntrega({ toDate: () => local })?.getTime()).toBe(local.getTime());
    expect(interpretarDataEntrega({ seconds: segundos })?.getTime()).toBe(segundos * 1000);
    expect(interpretarDataEntrega({ _seconds: segundos })?.getTime()).toBe(segundos * 1000);
    expect(interpretarDataEntrega(local.getTime())?.getTime()).toBe(local.getTime());
    expect(interpretarDataEntrega('2026-10-27T12:30:00')?.getTime()).toBe(local.getTime());
  });

  it('não inventa data quando o valor está ausente ou inválido', () => {
    const antes = Date.now();
    for (const valor of [undefined, null, '', '   ', 'ontem', {}, { seconds: 'x' }, { toDate: () => { throw new Error('boom'); } }, new Date('inválida'), true, NaN]) {
      const resultado = interpretarDataEntrega(valor);
      expect(resultado).toBeNull();
    }
    expect(Date.now()).toBeGreaterThanOrEqual(antes);
  });

  it('aceita epoch zero sem confundir com ausência', () => {
    expect(interpretarDataEntrega(0)?.getTime()).toBe(0);
    expect(interpretarDataEntrega({ seconds: 0 })?.getTime()).toBe(0);
  });
});

describe('UT-46 — tipo objetivo normalizado', () => {
  it('reconhece objetiva e múltipla escolha em grafias diferentes', () => {
    for (const tipo of ['objetiva', 'multipla_escolha', 'multipla-escolha', 'Múltipla Escolha', 'MULTIPLA ESCOLHA']) {
      expect(ehQuestaoObjetiva(tipo)).toBe(true);
    }
  });

  it('não classifica discursiva nem valor ausente como objetiva', () => {
    for (const tipo of ['discursiva', 'aberta', '', undefined, null]) {
      expect(ehQuestaoObjetiva(tipo)).toBe(false);
    }
  });
});

describe('UT-49 — instrução de acesso coerente com o login', () => {
  it('usa primeiro nome + DDMM e cita o segundo nome apenas como exceção', () => {
    expect(INSTRUCAO_ACESSO).toMatch(/primeiro nome/i);
    expect(INSTRUCAO_ACESSO).toMatch(/DDMM/);
    expect(INSTRUCAO_ACESSO).not.toMatch(/2 primeiros nomes/i);
    expect(EXEMPLO_ACESSO).toContain('maria1503');
    expect(NOTA_COLISAO).toMatch(/segundo nome/i);
    expect(NOTA_COLISAO).toMatch(/mesmo nome|colis/i);
  });
});
