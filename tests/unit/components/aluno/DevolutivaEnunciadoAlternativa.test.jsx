import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FeedbackView } from '@/app/aluno/atividade/[id]/FeedbackView';

afterEach(cleanup);

const enunciadoLongo =
  'Leia o trecho a seguir e assinale a alternativa que melhor explica por que a água do rio desaparece da superfície ao longo de um dia muito quente, considerando as etapas do ciclo da água.';

const entrega = (resposta = 'B') => ({
  notaFinal: 0,
  status: 'corrigido',
  respostas: { q: { resposta } },
  resultados: { q: { notaObtida: 0, notaMaxima: 10, correto: false, feedback: 'Revise o conteúdo.' } },
});

describe('FeedbackView — enunciado completo', () => {
  it('exibe o enunciado inteiro, sem cortar nem usar reticências', () => {
    render(
      <FeedbackView
        atividade={{ notaMaxima: 10, questoes: [{ id: 'q', tipo: 'multipla_escolha', enunciado: enunciadoLongo }] }}
        entrega={entrega()}
      />
    );

    expect(screen.getByText(enunciadoLongo)).toBeInTheDocument();
    expect(screen.queryByText(/…/)).toBeNull();
  });
});

describe('FeedbackView — texto da alternativa marcada', () => {
  it('mostra o texto da alternativa junto da letra marcada (objetos)', () => {
    render(
      <FeedbackView
        atividade={{
          notaMaxima: 10,
          questoes: [{
            id: 'q',
            tipo: 'multipla_escolha',
            enunciado: 'Questão sintética',
            alternativas: [
              { id: 'A', texto: 'A água sobe em vapor.' },
              { id: 'B', texto: 'A água vira pedra.' },
            ],
          }],
        }}
        entrega={entrega('B')}
      />
    );

    expect(screen.getByText(/marcou:\s*B/)).toBeInTheDocument();
    expect(screen.getByText(/A água vira pedra\./)).toBeInTheDocument();
  });

  it('lê alternativas em texto e no formato antigo { letra, texto }', () => {
    const { rerender } = render(
      <FeedbackView
        atividade={{
          notaMaxima: 10,
          questoes: [{ id: 'q', tipo: 'objetiva', enunciado: 'Questão sintética', alternativas: ['A) A água sobe em vapor.', 'B) A água vira pedra.'] }],
        }}
        entrega={entrega('B')}
      />
    );

    expect(screen.getByText(/A água vira pedra\./)).toBeInTheDocument();

    rerender(
      <FeedbackView
        atividade={{
          notaMaxima: 10,
          questoes: [{ id: 'q', tipo: 'objetiva', enunciado: 'Questão sintética', alternativas: [{ letra: 'B', texto: 'A água vira pedra.' }] }],
        }}
        entrega={entrega('B')}
      />
    );

    expect(screen.getByText(/marcou:\s*B/)).toBeInTheDocument();
    expect(screen.getByText(/A água vira pedra\./)).toBeInTheDocument();
  });

  it('mantém a letra marcada quando a alternativa não está disponível', () => {
    render(
      <FeedbackView
        atividade={{ notaMaxima: 10, questoes: [{ id: 'q', tipo: 'objetiva', enunciado: 'Questão sintética' }] }}
        entrega={entrega('C')}
      />
    );

    expect(screen.getByText(/marcou:\s*C/)).toBeInTheDocument();
  });
});
