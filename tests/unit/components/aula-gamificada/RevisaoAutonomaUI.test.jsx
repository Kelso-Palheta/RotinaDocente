import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Plataforma2D } from '@/components/revisao-autonoma/Plataforma2D';
import { PublicacaoRevisao } from '@/components/revisao-autonoma/PublicacaoRevisao';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('plataforma possui controles de toque e acesso pedagógico sem exigir salto',()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
 const abrir=vi.fn();render(<Plataforma2D fase={1} onDesafio={abrir} />);
 expect(screen.getByRole('button',{name:'Mover para a esquerda'})).toBeTruthy();expect(screen.getByRole('button',{name:'Pular'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Ir direto ao desafio/i}));expect(abrir).toHaveBeenCalledOnce();
});
it('liberação exige seleção explícita e não publica rascunhos',()=>{
 render(<PublicacaoRevisao questao={{id:'q1',status:'rascunho',tipo:'multipla_escolha'}} turmas={[{id:'t1',nome:'Turma 1'}]} />);
 expect(screen.queryByRole('button',{name:/Salvar liberação/i})).toBeNull();
});
it('questão aprovada começa sem turma selecionada e não é compartilhada automaticamente',()=>{
 render(<PublicacaoRevisao questao={{id:'q1',revision:1,status:'revisada',tipo:'multipla_escolha'}} turmas={[{id:'t1',nome:'Turma 1'}]} />);
 expect(screen.getByRole('checkbox',{name:'Turma 1'}).checked).toBe(false);
});
