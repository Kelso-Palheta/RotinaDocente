import React from 'react';
import {render,screen,fireEvent,waitFor,act,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {EditorVisualQuestao} from '@/components/adaptacoes/EditorVisualQuestao';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('descarta imagem atrasada se o enunciado mudou enquanto gerava',async()=>{
 let terminar;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>{terminar=resolve;})));
 const q={id:'q',enunciado:'Cena A',apoioVisualDescricao:'Referência',planoVisual:{descricao:'Cena',tipo:'ilustracao'}};const mudar=vi.fn();const props={onChange:mudar,professorId:'p',temChave:true,getAIHeaders:()=>({})};
 const {rerender}=render(<EditorVisualQuestao {...props} questao={q}/>);fireEvent.click(screen.getByRole('button',{name:'Produzir imagem'}));await waitFor(()=>expect(terminar).toBeDefined());
 rerender(<EditorVisualQuestao {...props} questao={{...q,enunciado:'Cena B'}}/>);
 await act(async()=>terminar({ok:true,json:async()=>({imagemUrl:'data:image/png;base64,eA==',metadados:{width:2048,height:1536}})}));expect(mudar).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent(/mudou/);
});
