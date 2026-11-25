import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('Resgate usa Quiz com experiência, mínimo3 e catálogo legado intacto',async()=>{
 const c={professorId:'p1',turma:'Teste',disciplina:'Ciências',conteudo:'Água',dificuldade:'facil',quantidade:4,tipo:'multipla_escolha',modalidades:['quiz']};
 const fetcher=vi.fn(async(url,init)=>new Response(JSON.stringify(init?.method==='POST'?{error:'Pedido conferido'}:url.endsWith('/catalogo')?{conteudos:[],jogos:[c]}:{sessoes:[]}),{status:init?.method==='POST'?422:200}));vi.stubGlobal('fetch',fetcher);
 render(<RevisaoAutonoma/>);await screen.findByText('Prepare sua aventura');
 fireEvent.change(screen.getByLabelText('Jogo'),{target:{value:'quiz'}});
 fireEvent.click(screen.getByLabelText('Resgate do Rio · investigação 2D'));
 fireEvent.change(screen.getByLabelText('Disciplina'),{target:{value:'Ciências'}});
 fireEvent.change(screen.getByLabelText('Conteúdo'),{target:{value:'Água'}});
 expect(screen.getByLabelText('Quantidade de desafios').value).toBe('3');
 fireEvent.click(screen.getByRole('button',{name:/Começar a jogar/}));await screen.findByText('Pedido conferido');
 const pedido=JSON.parse(fetcher.mock.calls.find(([,i])=>i?.method==='POST')[1].body);
 expect(pedido).toMatchObject({modalidade:'quiz',experiencia:'resgate',quantidade:3});
});
