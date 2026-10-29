import { describe, expect, it } from 'vitest';
import { formatarDataEntrega } from '@/dominio/atividades/dataEntrega';

const OPCOES = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
const local = new Date('2026-10-27T12:30:00');
const formatado = local.toLocaleString('pt-BR', OPCOES);
const segundos = Math.floor(local.getTime() / 1000);

describe('H81-04 — formatador compartilhado de prazo', () => {
  it('produz o mesmo texto para Date, ISO, Timestamp, segundos e epoch', () => {
    const entradas = [
      local,
      '2026-10-27T12:30:00',
      { toDate: () => local },
      { seconds: segundos },
      { _seconds: segundos },
      local.getTime(),
    ];
    for (const entrada of entradas) {
      expect(formatarDataEntrega(entrada)).toBe(formatado);
    }
  });

  it('mantém epoch zero como data apurada e não como ausência', () => {
    expect(formatarDataEntrega(0)).toBe(new Date(0).toLocaleString('pt-BR', OPCOES));
    expect(formatarDataEntrega(0)).not.toMatch(/não informada/i);
  });

  it('usa o fallback para ausente ou inválido sem inventar a data atual', () => {
    for (const valor of [undefined, null, '', '   ', 'ontem', {}, { seconds: 'x' }, new Date('inválida')]) {
      expect(formatarDataEntrega(valor)).toBe('Data não informada');
      expect(formatarDataEntrega(valor, { vazio: 'data não informada' })).toBe('data não informada');
    }
  });
});
