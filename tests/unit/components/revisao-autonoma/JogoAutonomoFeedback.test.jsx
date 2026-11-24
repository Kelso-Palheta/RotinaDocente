import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { JogoAutonomo } from '@/components/revisao-autonoma/JogoAutonomo';
afterEach(cleanup);
function sessao(modalidade, questao, gabarito, paresCorretos) {
 return { id:'s1',schema:3,modalidade,fase:'feedback',indice:0,total:1,estadoJogo:{ modalidade,fase:'feedback',rodada:{numero:1,revelado:true,questao,gabarito,explicacao:'Aprenda com a resposta.',paresCorretos},eu:{id:'eu',pontos:0,recibo:{resposta:{alternativaId:'B'},pontos:0}},sala:{codigo:'TREINO',modalidade,fase:'feedback'} },feedback:{correta:false,respostaCorreta:gabarito,explicacao:'Aprenda com a resposta.'} };
}
it('mostra a alternativa correta depois do erro no treino objetivo', () => {
 render(<JogoAutonomo sessao={sessao('quiz',{tipo:'multipla_escolha',enunciado:'Qual ação?',alternativas:[{id:'A',texto:'Preservar o museu'},{id:'B',texto:'Destruir o museu'}]},'A')} />);
 expect(within(screen.getByRole('region',{name:'Gabarito do desafio'})).getByText('Preservar o museu')).toBeTruthy();
});
it('mostra a sequência correta da ordenação após resposta', () => {
 render(<JogoAutonomo sessao={sessao('ordenacao',{tipo:'ordenacao',enunciado:'Ordene',itens:[{id:'b',texto:'Preservar'},{id:'a',texto:'Conhecer'}]},['a','b'])} />);
 expect(within(screen.getByRole('region',{name:'Gabarito do desafio'})).getAllByRole('listitem').map(e=>e.textContent)).toEqual(['Conhecer','Preservar']);
});
it.each(['memoria','associacao'])('%s mostra pares corretos para aprendizagem', modalidade => {
 const pares=[{esquerdaId:'a',direitaId:'b',esquerda:{texto:'Museu'},direita:{texto:'Acervo histórico'}}];
 render(<JogoAutonomo sessao={sessao(modalidade,{tipo:'pares',enunciado:'Associe'},[{esquerdaId:'a',direitaId:'b'}],pares)} />);
 const reg=screen.getByRole('region',{name:'Gabarito do desafio'});
 expect(reg.textContent).toContain('Museu');expect(reg.textContent).toContain('Acervo histórico');
});
