import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { JogoNatacao } from '@/components/aula-gamificada/jogos/JogoNatacao';
import { JogoAcertePerde } from '@/components/aula-gamificada/jogos/JogoAcertePerde';
import { FormularioQuestao } from '@/components/aula-gamificada/FormularioQuestao';

afterEach(cleanup);
describe('Natação e Acerte — UI',()=>{
 it('piscina mostra todos os empatados na chegada, sem botões de avanço local',()=>{
   render(<JogoNatacao estado={{ totalTrechos:5, raias:[{id:'a',nome:'Ana',progresso:5},{id:'b',nome:'Beto',progresso:5}],vencedoresIds:['a','b'] }} />);
   expect(screen.getByText('Ana')).toBeTruthy();expect(screen.getByText('Beto')).toBeTruthy();
   expect(screen.getByText(/Chegada compartilhada/i)).toBeTruthy();expect(screen.queryByRole('button',{name:/avançar/i})).toBeNull();
 });
 it('aberta confirma envio e preserva texto quando rede falha',async()=>{
   const enviar=vi.fn().mockRejectedValueOnce(new Error('Falha de rede')).mockResolvedValueOnce({});
   render(<JogoAcertePerde questao={{tipo:'resposta_aberta'}} onEnviar={enviar} />);
   fireEvent.change(screen.getByRole('textbox',{name:/sua resposta/i}),{target:{value:'A luz fornece energia.'}});
   fireEvent.click(screen.getByRole('button',{name:'Enviar resposta'}));await screen.findByText('Falha de rede');
   expect(screen.getByRole('textbox').value).toBe('A luz fornece energia.');
   fireEvent.click(screen.getByRole('button',{name:'Enviar resposta'}));await waitFor(()=>expect(enviar).toHaveBeenCalledTimes(2));
   expect(enviar.mock.calls[0][0]).toEqual({texto:'A luz fornece energia.'});expect(enviar.mock.calls[0][1]).toBe(enviar.mock.calls[1][1]);
 });
 it('resposta aberta bloqueada não permite envio',()=>{
   render(<JogoAcertePerde questao={{tipo:'resposta_aberta'}} bloqueado onEnviar={vi.fn()} />);
   expect(screen.getByRole('textbox').disabled).toBe(true);expect(screen.getByRole('button',{name:'Enviar resposta'}).disabled).toBe(true);
 });
 it('formulário permite editar resposta-modelo sem alternativas',()=>{
   render(<FormularioQuestao tipoPadrao="resposta_aberta" />);
   expect(screen.getByLabelText(/Resposta-modelo/i)).toBeTruthy();expect(screen.queryByText('Alternativa 1')).toBeNull();
 });
});
