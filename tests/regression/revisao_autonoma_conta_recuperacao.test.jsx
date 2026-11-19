// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';
const conteudo={professorId:'p1',turma:'Turma 1',disciplina:'Ciências',conteudo:'Plantas',dificuldade:'facil',quantidade:1};
const resumo={id:'antiga',disciplina:'Ciências',conteudo:'Histórico privado da Ana',dificuldade:'facil',fase:'jogando',progresso:0,total:1,acertos:0,erros:0,atualizadoEmMs:1000};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
beforeEach(()=>vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null));
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('ao voltar à tela inicial depois de trocar conta, não mantém histórico do aluno anterior',async()=>{
 let conta='ana';
 vi.stubGlobal('fetch',vi.fn(async url=>url.endsWith('/catalogo')?json({conteudos:conta==='ana'?[conteudo]:[]}):json({sessoes:conta==='ana'?[resumo]:[]})));
 render(<RevisaoAutonoma />);await screen.findByText('Ciências · Histórico privado da Ana');
 conta='beto';fireEvent(window,new Event('focus'));
 await waitFor(()=>expect(screen.queryByText('Ciências · Histórico privado da Ana')).toBeNull());
});
it('409 ao iniciar revisão deixa retomar a anterior e mudar a escolha, sem retry infinito',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(url,init)=>init?.method==='POST'?json({error:'Você tem uma revisão em andamento.'},409):url.endsWith('/catalogo')?json({conteudos:[conteudo]}):json({sessoes:[resumo]})));
 render(<RevisaoAutonoma />);await screen.findByText('Prepare sua aventura');
 fireEvent.change(screen.getByLabelText('Disciplina'),{target:{value:'Ciências'}});
 const select=screen.getByLabelText('Conteúdo e dificuldade');fireEvent.change(select,{target:{value:select.options[1].value}});
 fireEvent.click(screen.getByRole('button',{name:/Começar a jogar/i}));await screen.findByText('Você tem uma revisão em andamento.');
 expect(screen.getByRole('button',{name:'Retomar fase'}).disabled).toBe(false);
 expect(screen.getByLabelText(/Quero iniciar outra revisão/).disabled).toBe(false);
});
