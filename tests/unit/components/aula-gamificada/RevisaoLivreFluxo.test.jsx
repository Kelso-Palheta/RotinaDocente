import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';
let fetcher;
const sessao={id:'sess1',revision:1,fase:'jogando',indice:0,total:1,disciplina:'Ciências',conteudo:'Plantas',dificuldade:'facil',acertos:0,erros:0,questao:{id:'q1',enunciado:'Qual gás a planta absorve?',alternativas:[{id:'A',texto:'Gás carbônico'},{id:'B',texto:'Hélio'}]},feedback:null};
const ok=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
beforeEach(()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
 fetcher=vi.fn(async(url)=>url.endsWith('/catalogo')?ok({conteudos:[{professorId:'p1',turma:'Turma 1',disciplina:'Ciências',conteudo:'Plantas',dificuldade:'facil',quantidade:1}]}):url.endsWith('/historico')?ok({sessoes:[]}):ok({sessao}));vi.stubGlobal('fetch',fetcher);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
async function jogar(){
 render(<RevisaoAutonoma />);await screen.findByText('Prepare sua aventura');
 fireEvent.change(screen.getByLabelText('Disciplina'),{target:{value:'Ciências'}});
 const select=screen.getByLabelText('Conteúdo e dificuldade');fireEvent.change(select,{target:{value:select.options[1].value}});
 fireEvent.click(screen.getByRole('button',{name:/Começar a jogar/i}));await screen.findByRole('button',{name:/Ir direto ao desafio/i});
 fireEvent.click(screen.getByRole('button',{name:/Ir direto ao desafio/i}));fireEvent.click(screen.getByRole('radio',{name:'Gás carbônico'}));
}
it('retry preserva mesma resposta/requestId e mostra feedback confirmado',async()=>{
 await jogar();let tentativas=0;
 fetcher.mockImplementation(async(url,init)=>{
  if(url.endsWith('/historico'))return ok({sessoes:[]});
  if(url.endsWith('/responder')){tentativas++;if(tentativas===1)throw Error('Rede indisponível');return ok({sessao:{...sessao,revision:2,fase:'feedback',acertos:1,feedback:{correta:true,alternativaId:'A',respostaCorreta:'A',explicacao:'A planta absorve gás carbônico.'}}});}
  return ok({sessao});
 });
 fireEvent.click(screen.getByRole('button',{name:'Confirmar resposta'}));await screen.findByText('Rede indisponível');
 expect(screen.getByRole('radio',{name:'Gás carbônico'}).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Tentar o mesmo envio novamente'}));await screen.findByText('A planta absorve gás carbônico.');
 const calls=fetcher.mock.calls.filter(([url])=>url.endsWith('/responder'));expect(JSON.parse(calls[0][1].body)).toEqual(JSON.parse(calls[1][1].body));
});
it('sessão expirada limpa desafio e histórico da conta anterior',async()=>{
 await jogar();fetcher.mockResolvedValue(new Response(JSON.stringify({error:'Sessão expirada'}),{status:401}));
 fireEvent.click(screen.getByRole('button',{name:'Confirmar resposta'}));await screen.findByText('Sessão expirada');
 await waitFor(()=>expect(screen.queryByText('Qual gás a planta absorve?')).toBeNull());
});
