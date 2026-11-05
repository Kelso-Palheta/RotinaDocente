import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {IntegracaoPreparacao} from '@/components/revisao/IntegracaoPreparacao';
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({push:vi.fn()})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('carrega conferência da aula, exige três checks e envia hash, sem confundir aprovação de questão',async()=>{
 const cat={trilhas:[{id:'tr',titulo:'Trilha'}],conteudos:[{id:'a',titulo:'Aula',trilhaId:'tr',apta:false}],questoes:[],turmas:[],salas:[]};
 const aula={id:'a',titulo:'Aula completa',objetivos:[{id:'o',descricao:'Objetivo'}],blocos:[{id:'b',titulo:'Contexto',tipo:'texto',texto:'Explicação completa'}],imagens:[],fontes:[{titulo:'Fonte',url:'https://www.metmuseum.org/'}]};
 const fetcher=vi.fn(async url=>({ok:true,json:async()=>url.endsWith('/catalogo')?cat:{conteudo:aula,hashFonte:'versao'}}));vi.stubGlobal('fetch',fetcher);
 render(<IntegracaoPreparacao obterToken={async()=> 'token'}/>);
 fireEvent.click(await screen.findByRole('button',{name:/inspecionar conteúdo/i}));
 const aprovar=await screen.findByRole('button',{name:/aprovar conteúdo da aula/i});expect(aprovar).toBeDisabled();
 screen.getAllByRole('checkbox').forEach(c=>fireEvent.click(c));fireEvent.click(aprovar);
 await waitFor(()=>expect(fetcher.mock.calls.some(([url])=>url.endsWith('/conteudos/a/aprovar'))).toBe(true));
 const [,opts]=fetcher.mock.calls.find(([url])=>url.endsWith('/conteudos/a/aprovar'));expect(JSON.parse(opts.body)).toEqual({hashFonte:'versao',confirmacoes:{conteudo:true,imagens:true,cobertura:true}});
});
