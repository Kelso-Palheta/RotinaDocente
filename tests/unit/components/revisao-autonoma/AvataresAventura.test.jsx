import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SeletorAvatar } from '@/components/revisao-autonoma/SeletorAvatar';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('oferece oito personagens acessíveis com prévias e seleção indicada',()=>{
 const onChange=vi.fn();render(<SeletorAvatar valor="luna" onChange={onChange} />);
 expect(screen.getAllByRole('radio')).toHaveLength(8);
 expect(screen.getByRole('radio',{name:/Luna.*Astronauta/}).checked).toBe(true);
 fireEvent.click(screen.getByRole('radio',{name:/Lia.*Exploradora/}));
 expect(onChange).toHaveBeenCalledWith('lia');
});
it('preparação envia o avatar escolhido e oferece as seis fases disponíveis',async()=>{
 const fetcher=vi.fn(async(url,init)=>new Response(JSON.stringify(init?.method==='POST'?{error:'Pedido conferido'}:url.endsWith('/catalogo')?{conteudos:[{professorId:'p1',turma:'101',disciplina:'Arte',conteudo:'Cores',dificuldade:'facil',quantidade:24}]}:{sessoes:[]}),{status:init?.method==='POST'?422:200}));
 vi.stubGlobal('fetch',fetcher);render(<RevisaoAutonoma />);await screen.findByText('Prepare sua aventura');
 fireEvent.change(screen.getByLabelText('Disciplina'),{target:{value:'Arte'}});fireEvent.change(screen.getByLabelText('Conteúdo'),{target:{value:'Cores'}});
 expect([...screen.getByLabelText('Fases').options].map(o=>o.value)).toContain('6');
 fireEvent.click(screen.getByRole('radio',{name:/Pixel.*Robô/}));
 fireEvent.click(screen.getByRole('button',{name:/Começar a jogar/}));await screen.findByText('Pedido conferido');
 expect(JSON.parse(fetcher.mock.calls.find(([,init])=>init?.method==='POST')[1].body)).toMatchObject({avatarId:'pixel',fases:6,estrelasPorFase:3});
});
it('explica a ausência de estrelas quando só existe uma questão',async()=>{
 vi.stubGlobal('fetch',async url=>new Response(JSON.stringify(url.endsWith('/catalogo')?{conteudos:[{professorId:'p1',turma:'101',disciplina:'Arte',conteudo:'Cores',dificuldade:'facil',quantidade:1}]}:{sessoes:[]})));
 render(<RevisaoAutonoma />);await screen.findByText('Prepare sua aventura');
 fireEvent.change(screen.getByLabelText('Disciplina'),{target:{value:'Arte'}});fireEvent.change(screen.getByLabelText('Conteúdo'),{target:{value:'Cores'}});
 expect(screen.getByText(/sem estrelas-desafio/i)).toBeTruthy();
});
