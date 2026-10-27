import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, it, expect } from 'vitest';
import { FeedbackView } from '@/app/aluno/atividade/[id]/FeedbackView';

afterEach(cleanup);

const atividade = (tipo) => ({ notaMaxima: 10, questoes: [{ id: 'q', tipo, enunciado: 'Questão sintética' }] });
const entrega = (correto, resposta = 'B') => ({
  notaFinal: correto ? 10 : 0,
  status: 'corrigido',
  respostas: { q: { resposta } },
  resultados: { q: { notaObtida: correto ? 10 : 0, notaMaxima: 10, correto, feedback: 'Revise o conteúdo.' } },
});

it.each(['objetiva', 'multipla_escolha', 'Múltipla Escolha'])('UT-46 %s mostra resposta marcada e indicador de erro', (tipo) => {
  render(<FeedbackView atividade={atividade(tipo)} entrega={entrega(false, 'B')} />);
  expect(screen.getByText(/marcou:\s*B/)).toBeInTheDocument();
  expect(screen.getByText(/Incorreta/)).toBeInTheDocument();
});

it('UT-46 múltipla escolha correta é identificada', () => {
  render(<FeedbackView atividade={atividade('multipla_escolha')} entrega={entrega(true, 'C')} />);
  expect(screen.getByText(/marcou:\s*C/)).toBeInTheDocument();
  expect(screen.getByText(/Correta/)).toBeInTheDocument();
});

it('UT-46 discursiva continua exibindo a resposta do aluno', () => {
  render(
    <FeedbackView
      atividade={{ notaMaxima: 10, questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Questão aberta' }] }}
      entrega={{ notaFinal: 6, status: 'corrigido', respostas: { q: { resposta: 'Minha tese' } }, resultados: { q: { notaObtida: 6, notaMaxima: 10, correto: false } } }}
    />
  );
  expect(screen.getByText('Sua resposta')).toBeInTheDocument();
  expect(screen.getByText('Minha tese')).toBeInTheDocument();
});
