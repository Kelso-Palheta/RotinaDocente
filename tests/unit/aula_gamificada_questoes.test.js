import { describe, expect, it } from 'vitest';
import {
  normalizarQuestao,
  validarQuestao,
  validarParaRevisao,
  questaoPublica,
} from '@/dominio/aula-gamificada/questoes';

const base = {
  disciplina: 'Arte',
  anoEscolar: '1º ano do Ensino Médio',
  conteudo: 'Ciclo da água',
  dificuldade: 'facil',
  enunciado: 'Qual etapa transforma vapor em gotas?',
  explicacao: 'A condensação transforma o vapor em gotas.',
  justificativaDificuldade: 'Vocabulário direto e uma única etapa.',
};

const gerador = () => {
  let n = 0;
  return () => `id-${++n}`;
};

const capturar = (fn) => {
  try {
    fn();
  } catch (erro) {
    return erro;
  }
  return null;
};

const multipla = (extra = {}) => ({
  ...base,
  tipo: 'multipla_escolha',
  alternativas: [
    { id: 'A', texto: 'Evaporação' },
    { id: 'B', texto: 'Condensação' },
    { id: 'C', texto: 'Precipitação' },
  ],
  respostaCorreta: 'B',
  ...extra,
});

const pares = (extra = {}) => ({
  ...base,
  tipo: 'pares',
  enunciado: 'Relacione cada conceito à sua definição.',
  pares: [
    { id: 'p1', esquerda: { id: 'e1', texto: 'Evaporação' }, direita: { id: 'd1', texto: 'Água sobe em vapor' } },
    { id: 'p2', esquerda: { id: 'e2', texto: 'Condensação' }, direita: { id: 'd2', texto: 'Vapor vira gotas' } },
  ],
  respostaCorreta: [
    { esquerdaId: 'e1', direitaId: 'd1' },
    { esquerdaId: 'e2', direitaId: 'd2' },
  ],
  ...extra,
});

const ordenacao = (extra = {}) => ({
  ...base,
  tipo: 'ordenacao',
  enunciado: 'Ordene as etapas do ciclo da água.',
  itens: [
    { id: 'i1', texto: 'Evaporação' },
    { id: 'i2', texto: 'Condensação' },
    { id: 'i3', texto: 'Precipitação' },
  ],
  respostaCorreta: ['i1', 'i2', 'i3'],
  ...extra,
});

describe('questões — múltipla escolha', () => {
  it('normaliza uma questão completa como rascunho', () => {
    const q = normalizarQuestao(multipla(), { gerarId: gerador(), professorId: 'prof-1' });

    expect(q.id).toBe('id-1');
    expect(q.revision).toBe(1);
    expect(q.status).toBe('rascunho');
    expect(q.tipo).toBe('multipla_escolha');
    expect(q.respostaCorreta).toBe('B');
    expect(q.professorId).toBe('prof-1');
    expect(q.pares).toBeNull();
    expect(q.itens).toBeNull();
    expect(() => validarQuestao(q)).not.toThrow();
  });

  it('rejeita gabarito que não existe nas alternativas', () => {
    const erro = capturar(() => normalizarQuestao(multipla({ respostaCorreta: 'Z' })));

    expect(erro?.status).toBe(422);
    expect(erro?.message).toMatch(/gabarito/i);
  });

  it('rejeita alternativas repetidas e quantidade insuficiente', () => {
    expect(
      capturar(() =>
        normalizarQuestao(
          multipla({
            alternativas: [
              { id: 'A', texto: 'Uma' },
              { id: 'A', texto: 'Outra' },
            ],
            respostaCorreta: 'A',
          }),
        ),
      )?.status,
    ).toBe(422);

    expect(
      capturar(() =>
        normalizarQuestao(
          multipla({ alternativas: [{ id: 'A', texto: 'Única' }], respostaCorreta: 'A' }),
        ),
      )?.status,
    ).toBe(422);
  });

  it('rejeita dificuldade desconhecida', () => {
    const erro = capturar(() => normalizarQuestao(multipla({ dificuldade: 'impossivel' })));

    expect(erro?.status).toBe(422);
    expect(erro?.message).toMatch(/dificuldade/i);
  });
});

describe('questões — pares', () => {
  it('gera IDs públicos novos, distintos e sem relação inferível', () => {
    const q = normalizarQuestao(pares(), {
      gerarId: gerador(),
      professorId: 'prof-1',
      novosIdsPares: true,
    });

    const esquerda = q.pares.map((p) => p.esquerda.id);
    const direita = q.pares.map((p) => p.direita.id);
    const todos = [...esquerda, ...direita];

    expect(new Set(todos).size).toBe(todos.length);
    expect(todos).not.toContain('e1');
    expect(todos).not.toContain('d1');
    expect(q.respostaCorreta).toHaveLength(2);
    for (const par of q.respostaCorreta) {
      expect(esquerda).toContain(par.esquerdaId);
      expect(direita).toContain(par.direitaId);
    }
    expect(q.respostaCorreta).not.toEqual([
      { esquerdaId: 'e1', direitaId: 'd1' },
      { esquerdaId: 'e2', direitaId: 'd2' },
    ]);
  });

  it('aceita textos simples e deriva o gabarito da própria lista de pares', () => {
    const q = normalizarQuestao(
      {
        ...base,
        tipo: 'pares',
        pares: [
          { esquerda: 'Evaporação', direita: 'Água sobe em vapor' },
          { esquerda: 'Condensação', direita: 'Vapor vira gotas' },
        ],
      },
      { gerarId: gerador() },
    );

    expect(q.pares).toHaveLength(2);
    expect(q.respostaCorreta).toHaveLength(2);
    expect(q.respostaCorreta[0].esquerdaId).toBe(q.pares[0].esquerda.id);
    expect(q.respostaCorreta[0].direitaId).toBe(q.pares[0].direita.id);
  });

  it('não publica gabarito, explicação nem a tabela privada de associação', () => {
    const q = normalizarQuestao(pares(), { gerarId: gerador(), novosIdsPares: true });
    const publica = questaoPublica(q, 'memoria', { seed: 'sala:0:q1' });

    expect(publica.cartas).toHaveLength(4);
    expect(publica).not.toHaveProperty('respostaCorreta');
    expect(publica).not.toHaveProperty('pares');
    expect(publica).not.toHaveProperty('explicacao');
    expect(JSON.stringify(publica)).not.toContain('esquerdaId');
    expect(JSON.stringify(publica)).not.toContain('d1');
  });

  it('mantém a mesma ordem pública para a mesma semente e outra para semente diferente', () => {
    const q = normalizarQuestao(pares(), { gerarId: gerador(), novosIdsPares: true });
    const a = questaoPublica(q, 'memoria', { seed: 'sala:0:q1' });
    const b = questaoPublica(q, 'memoria', { seed: 'sala:0:q1' });
    const c = questaoPublica(q, 'memoria', { seed: 'sala:0:q2' });

    expect(a.cartas).toEqual(b.cartas);
    expect(a.cartas).not.toEqual(c.cartas);
  });
});

describe('questões — ordenação', () => {
  it('deriva a ordem correta da lista de itens quando o gabarito não é enviado', () => {
    const q = normalizarQuestao({ ...ordenacao(), respostaCorreta: undefined }, { gerarId: gerador() });

    expect(q.respostaCorreta).toEqual(['i1', 'i2', 'i3']);
    expect(() => validarQuestao(q)).not.toThrow();
  });

  it('rejeita ordem que não é permutação dos itens', () => {
    const erro = capturar(() =>
      normalizarQuestao(ordenacao({ respostaCorreta: ['i1', 'i1', 'i3'] }), { gerarId: gerador() }),
    );

    expect(erro?.status).toBe(422);
    expect(erro?.message).toMatch(/ordem/i);
  });
});

describe('questões — revisão', () => {
  it('exige explicação pedagógica para liberar a questão', () => {
    const q = normalizarQuestao(multipla({ explicacao: '' }), { gerarId: gerador() });

    expect(() => validarQuestao(q)).not.toThrow();
    const erro = capturar(() => validarParaRevisao(q));
    expect(erro?.status).toBe(422);
    expect(erro?.message).toMatch(/explica/i);
  });

  it('aceita uma questão completa para revisão', () => {
    const q = normalizarQuestao(multipla(), { gerarId: gerador() });

    expect(() => validarParaRevisao(q)).not.toThrow();
  });
});
