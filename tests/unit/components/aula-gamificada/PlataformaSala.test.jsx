import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';
import { validarConfiguracaoSala } from '@/dominio/aula-gamificada/sala';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('plataforma em sala exige modalidade Quiz', () => {
  const config = { titulo:'Treino', modalidade:'memoria', experiencia:'plataforma', turmaIds:['t1'], questaoIds:['q1'], tempoSegundos:60 };
  expect(() => validarConfiguracaoSala(config,[{id:'t1'}],[{id:'q1'}])).toThrow(/plataforma.*Quiz/i);
});
it('percurso libera a pergunta ao chegar ao portal; rodada seguinte começa outro percurso', () => {
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
  const estado = { codigo:'SALA01', modalidade:'quiz', experiencia:'plataforma', fase:'pergunta', rodada:1, totalRodadas:2, revision:1, questao:{id:'q1', tipo:'multipla_escolha', enunciado:'Qual atitude preserva a memória?', alternativas:[{id:'A',texto:'Preservar o museu'},{id:'B',texto:'Destruir o museu'}]} };
  const { rerender } = render(<SalaAlunoView estado={estado} onResponder={vi.fn()} />);
  expect(screen.queryByRole('button',{ name:/Preservar o museu/ })).toBeNull();
  fireEvent.click(screen.getByRole('button',{ name:/Ir direto ao desafio/ }));
  expect(screen.getByRole('button',{ name:/Preservar o museu/ })).toBeTruthy();
  rerender(<SalaAlunoView estado={{...estado, rodada:2, questao:{...estado.questao,id:'q2'}}} onResponder={vi.fn()} />);
  expect(screen.queryByRole('button',{ name:/Preservar o museu/ })).toBeNull();
});
