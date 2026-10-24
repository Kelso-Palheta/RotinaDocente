import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EditorVisualQuestao } from '@/components/adaptacoes/EditorVisualQuestao';
import { VisualizadorAtividadeAdaptada } from '@/components/adaptacoes/VisualizadorAtividadeAdaptada';
vi.mock('@/lib/auth-context',()=>({useOptionalAuth:()=>({user:{uid:'professor'}})}));
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({temChave:true,getAIHeaders:()=>({})})}));
vi.mock('@/lib/firebase-atividades',()=>({createAtividade:vi.fn(),createTokensForAtividade:vi.fn()}));
const URL='data:image/png;base64,bm92YQ==';
const q={id:'q1',numero:1,enunciado:'Observe a figura.',apoioVisualDescricao:'Descrição revisada',planoVisual:{tipo:'ilustracao',descricao:'Cena didática',larguraCm:10}};
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('nova imagem permanece pendente e chega ao callback de salvar da atividade',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({imagemUrl:URL,metadados:{width:2048,height:1536,mime:'image/png'},modelo:'gemini-3.1-flash-image'})})));
 const salvar=vi.fn();render(<VisualizadorAtividadeAdaptada resultado={{titulo:'Teste',aluno:{nome:'Sintético'},atividadeAdaptada:{questoes:[q]}}} onSalvarNoBanco={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Produzir imagem'}));
 await waitFor(()=>expect(screen.getByRole('img',{name:'Descrição revisada'})).toHaveAttribute('src',URL));
 expect(screen.getByText('Pendente de revisão')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Salvar Prova/Atividade'}));
 await waitFor(()=>expect(salvar).toHaveBeenCalled());
 expect(salvar.mock.calls[0][0].atividadeAdaptada.questoes[0].imagemUrl).toBe(URL);
});
it('regeração substitui imagem visível e guarda anterior; revisão explícita',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({imagemUrl:URL,metadados:{width:2048,height:1536,mime:'image/png'}})})));
 let atual;const Componente=()=>{const [v,set]=React.useState({...q,imagemUrl:'https://example.invalid/antiga.png',visual:{metadados:{width:2048,height:1536}}});atual=v;return <EditorVisualQuestao questao={v} onChange={set} professorId="p" getAIHeaders={()=>({})} temChave/>;};
 render(<Componente/>);fireEvent.click(screen.getByRole('button',{name:'Produzir imagem'}));
 await waitFor(()=>expect(atual.imagemUrl).toBe(URL));expect(atual.visual.historico[0].imagemUrl).toContain('antiga');
 fireEvent.click(screen.getByLabelText('Conferi a figura, os dados e a descrição.'));fireEvent.click(screen.getByRole('button',{name:'Aprovar esta versão'}));
 expect(screen.getByText('Versão aprovada')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Descrição acessível da imagem final'),{target:{value:'Outra descrição'}});
 expect(screen.getByText('Pendente de revisão')).toBeInTheDocument();
});
it('falha de geração não troca provedor nem apaga imagem anterior',async()=>{
 const fetch=vi.fn(async()=>({ok:false,json:async()=>({error:'Cota indisponível'})}));vi.stubGlobal('fetch',fetch);
 render(<EditorVisualQuestao questao={{...q,imagemUrl:'https://example.invalid/anterior.png'}} onChange={vi.fn()} professorId="p" temChave getAIHeaders={()=>({})}/>);
 fireEvent.click(screen.getByRole('button',{name:'Produzir imagem'}));expect(await screen.findByText('Cota indisponível')).toBeInTheDocument();expect(fetch).toHaveBeenCalledTimes(1);
});
