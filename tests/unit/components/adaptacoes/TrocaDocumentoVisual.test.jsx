import React from 'react';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {VisualizadorAtividadeAdaptada} from '@/components/adaptacoes/VisualizadorAtividadeAdaptada';
vi.mock('@/lib/auth-context',()=>({useOptionalAuth:()=>({user:{uid:'p'}})}));
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({temChave:true,getAIHeaders:()=>({})})}));
vi.mock('@/lib/firebase-atividades',()=>({createAtividade:vi.fn(),createTokensForAtividade:vi.fn()}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('conclusão atrasada da atividade anterior não substitui documento novo',async()=>{
 let terminar;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>{terminar=resolve;})));
 const criar=id=>({documentoVisualId:id,titulo:id,atividadeAdaptada:{questoes:[{id:'q1',enunciado:id,apoioVisualDescricao:'Figura',planoVisual:{descricao:'Cena',tipo:'ilustracao'}}]}});
 const alterar=vi.fn();const {rerender}=render(<VisualizadorAtividadeAdaptada resultado={criar('A')} onAtualizarResultado={alterar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Produzir imagem'}));await waitFor(()=>expect(terminar).toBeDefined());
 rerender(<VisualizadorAtividadeAdaptada resultado={criar('B')} onAtualizarResultado={alterar}/>);
 terminar({ok:true,json:async()=>({imagemUrl:'data:image/png;base64,eA==',metadados:{width:2048,height:1536}})});
 await waitFor(()=>expect(screen.getByText('B',{selector:'h1'})).toBeInTheDocument());
 expect(alterar).not.toHaveBeenCalled();
});
