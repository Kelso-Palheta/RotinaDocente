import { describe, expect, it } from 'vitest';
import { detectarRespostasSimilares, normalizarResposta, semelhancaRespostas } from '../../frontend/src/dominio/atividades/similaridadeRespostas';

const entrega = (alunoId, resposta) => ({
  id: `e-${alunoId}`,
  alunoId,
  turmaId: 't1',
  status: 'corrigido',
  notaFinal: 8,
  respostas: { q1: { tipo: 'discursiva', resposta } },
});

const copia = 'A mitose é um processo de divisão celular que gera duas células filhas idênticas à célula mãe.';
const copiaSemAcento = 'A mitose e um processo de divisao celular, que gera duas celulas filhas identicas a celula mae!';

describe('UT-61 (RN-78): comparação sensível a ordem e tolerante a acento/pontuação', () => {
  it('normaliza acentos, caixa e pontuação', () => {
    expect(normalizarResposta('CÉLULA, mãe!')).toBe('celula mae');
    expect(normalizarResposta('  duas   células  ')).toBe('duas celulas');
  });

  it('reconhece cópia com pontuação e acentuação diferentes', () => {
    expect(semelhancaRespostas(copia, copiaSemAcento)).toBeGreaterThan(0.7);
  });

  it('não trata o mesmo vocabulário em ordem diferente como cópia', () => {
    const original = 'A mitose divide a célula em duas partes iguais durante o processo de reprodução';
    const reordenada = 'O processo de reprodução divide em duas partes iguais a célula durante a mitose';
    expect(semelhancaRespostas(original, reordenada)).toBeLessThan(0.7);
  });

  it('não agrupa respostas diferentes que só compartilham vocabulário técnico', () => {
    const a = 'A célula vegetal possui parede celular e cloroplastos para realizar fotossíntese';
    const b = 'A fotossíntese acontece nos cloroplastos e a parede celular protege a célula vegetal';
    expect(semelhancaRespostas(a, b)).toBeLessThan(0.7);
  });

  it('ignora respostas curtas demais para comparar', () => {
    const resultado = detectarRespostasSimilares([entrega('a', 'Sim.'), entrega('b', 'Sim.')]);
    expect(resultado.grupos).toEqual([]);
  });
});

describe('UT-62 (RN-78): grupos detalhados sem alterar nota', () => {
  const entregas = [entrega('ana', copia), entrega('bruno', copiaSemAcento), entrega('carla', 'A fotossíntese ocorre nos cloroplastos das células vegetais.')];

  it('devolve alunos, trechos e similaridade de cada par', () => {
    const resultado = detectarRespostasSimilares(entregas);
    expect(resultado.grupos).toHaveLength(1);

    const grupo = resultado.grupos[0];
    expect(grupo.alunos.map(a => a.alunoId).sort()).toEqual(['ana', 'bruno']);
    expect(grupo.alunos.find(a => a.alunoId === 'ana').texto).toBe(copia);
    expect(grupo.alunos.every(a => a.entregaId && a.turmaId === 't1')).toBe(true);
    expect(grupo.pares).toHaveLength(1);
    expect(grupo.pares[0].a).toBe('ana');
    expect(grupo.pares[0].b).toBe('bruno');
    expect(grupo.pares[0].similaridade).toBeGreaterThan(0.7);
    expect(grupo.similaridadeMaxima).toBe(grupo.pares[0].similaridade);
  });

  it('mantém clusters e penalizados compatíveis sem tocar nas entregas', () => {
    const antes = JSON.stringify(entregas);
    const resultado = detectarRespostasSimilares(entregas);
    expect(resultado.clusters).toHaveLength(1);
    expect(resultado.clusters[0]).toHaveLength(2);
    expect([...resultado.penalizados].sort()).toEqual(['ana', 'bruno']);
    expect(JSON.stringify(entregas)).toBe(antes);
    expect(entregas.every(e => e.notaFinal === 8)).toBe(true);
  });
});
