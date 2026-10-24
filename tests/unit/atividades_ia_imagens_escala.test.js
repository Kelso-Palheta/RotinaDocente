import {expect,it,vi,afterEach} from 'vitest';
vi.mock('@/utils/aiHeaders',()=>({getClientAIHeaders:()=>({'x-user-ai-provider':'gemini','x-user-ai-key':'teste'})}));
import {corrigirAtividade,gerarQuestoesComIA} from '@/utils/atividades/correcaoIA';
afterEach(()=>vi.unstubAllGlobals());
it('encaminha imagem base64 anexada à questão discursiva',async()=>{
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({nota:1,feedback:'Adequado',criterios:[]})}}]})}));vi.stubGlobal('fetch',fetcher);
 await corrigirAtividade({questoes:[{id:'q',tipo:'discursiva',enunciado:'Leia',notaMaxima:2,imagens:[{base64:'data:image/png;base64,YQ=='}]}],respostas:{q:{resposta:'Texto'}}});
 const body=JSON.parse(fetcher.mock.calls[0][1].body);expect(JSON.stringify(body)).toContain('data:image/png;base64,YQ==');
});
it('recusa questão IA objetiva sem gabarito válido antes de incorporar',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({questoes:[{tipo:'objetiva',enunciado:'Qual?',gabarito:'A',alternativas:[{id:'B',texto:'Um'},{id:'C',texto:'Dois'}]}]})}}]})})));
 await expect(gerarQuestoesComIA({materialTexto:'Conteúdo',notaMaxima:1})).rejects.toThrow(/gabarito/i);
});
it('distribui arredondamento da rubrica sem perder pontos nem duplicar descrições',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({questoes:[{tipo:'discursiva',enunciado:'Explique',rubrica:'Critério 1: 1 pts — Ideia\nCritério 2: 1 pts — Clareza\nCritério 3: 1 pts — Exemplo'}]})}}]})})));
 const [q]=await gerarQuestoesComIA({materialTexto:'Conteúdo',notaMaxima:1,incluirObjetivas:false});
 const pontos=[...q.rubrica.matchAll(/(\d+(?:[.,]\d+)?)\s*pts/g)].map(m=>Number(m[1].replace(',','.')));
 expect(Math.round(pontos.reduce((s,p)=>s+p,0)*100)).toBe(100);expect(q.rubrica.match(/Ideia/g)).toHaveLength(1);
});
