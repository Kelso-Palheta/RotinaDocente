import {afterEach,expect,it,vi} from 'vitest';
import {extractTextOnly} from '@/lib/redacao/ai-provider';
import {extractTextFromDocument} from '@/utils/atividades/documentExtractor';
afterEach(()=>vi.unstubAllGlobals());
it('despachante habilita imagens explicitamente e mantém o contrato antigo por padrão', async()=>{
 const file={name:'livro.png',type:'image/png',size:6,arrayBuffer:async()=>new TextEncoder().encode('imagem').buffer};
 const headers={'x-user-ai-key':'teste','x-user-ai-provider':'gemini'};
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({text:'Conteúdo do livro'}))));
 expect((await extractTextFromDocument(file,{allowImages:true,headers})).texto).toBe('Conteúdo do livro');
 await expect(extractTextFromDocument(file)).rejects.toThrow(/Formato de arquivo não suportado/);
});
it('Gemini no modo documento exclui raciocínio do texto transcrito no fallback',async()=>{
 vi.stubGlobal('fetch',vi.fn(async url=>String(url).includes('/chat/completions')
  ? new Response(JSON.stringify({error:{message:'Use API nativa'}}),{status:404})
  : new Response(JSON.stringify({candidates:[{content:{parts:[{thought:true,text:'Vou analisar esta lista.'},{text:'ANA SILVA 123'}]},finishReason:'STOP'}]}))));
 const text=await extractTextOnly('aW1hZ2Vt','image/png',{provider:'gemini',apiKey:'teste',model:'gemini-teste'},{finalidade:'documento'});
 expect(text).toBe('ANA SILVA 123');
});
