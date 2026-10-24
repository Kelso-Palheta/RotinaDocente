import React from 'react';
import {render,screen,fireEvent,waitFor,act,cleanup,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {PainelMontadorProvas} from '@/components/adaptacoes/PainelMontadorProvas';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('concluir imagem depois de reordenar preserva a ordem mais recente da prova',async()=>{
 let terminar,atual;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>{terminar=resolve;})));
 const qs=[1,2].map(n=>({id:`q${n}`,numero:n,enunciado:`Questão sintética ${n}`,apoioVisualDescricao:'Figura',planoVisual:{tipo:'ilustracao',descricao:'Cena'}}));
 function Prova(){const [p,set]=React.useState({id:'prova-a',questoes:qs});atual=p;return <><button onClick={()=>set(v=>({...v,questoes:[...v.questoes].reverse()}))}>Reordenar para teste</button><PainelMontadorProvas prova={p} onAtualizarProva={set} configVisual={{professorId:'p',temChave:true,getAIHeaders:()=>({})}}/></>;}
 render(<Prova/>);fireEvent.click(within(screen.getByRole('region',{name:'Imagem da questão 1'})).getByRole('button',{name:'Produzir imagem'}));await waitFor(()=>expect(terminar).toBeDefined());
 fireEvent.click(screen.getByRole('button',{name:'Reordenar para teste'}));await act(async()=>{terminar({ok:true,json:async()=>({imagemUrl:'data:image/png;base64,eA==',metadados:{width:2048,height:1536}})});});
 expect(atual.questoes.map(q=>q.id)).toEqual(['q2','q1']);expect(atual.questoes[1].imagemUrl).toBeDefined();
});
