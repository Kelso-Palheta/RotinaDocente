import {it,expect,vi,afterEach} from 'vitest';
import {generateCorrection} from '@/lib/redacao/ai-provider';
afterEach(()=>vi.unstubAllGlobals());
it('RN73 imagem direta passa por transcrição no provedor escolhido antes da correção',async()=>{
 const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({choices:[{message:{content:'Texto manuscrito fiel'},finish_reason:'stop'}]}))).mockResolvedValueOnce(new Response(JSON.stringify({choices:[{message:{content:'Feedback'},finish_reason:'stop'}]})));
 vi.stubGlobal('fetch',fetchMock);
 await generateCorrection({imageBase64:'cGl4ZWxz',userConfig:{provider:'openai',apiKey:'fake',model:'gpt-4o-mini'}});
 expect(fetchMock).toHaveBeenCalledTimes(2);
 const imageRequest=JSON.parse(fetchMock.mock.calls[0][1].body);expect(imageRequest.messages[0].content[1].image_url.url).toContain('cGl4ZWxz');
 const correction=JSON.parse(fetchMock.mock.calls[1][1].body);expect(JSON.stringify(correction.messages)).toContain('Texto manuscrito fiel');
 expect(fetchMock.mock.calls.every(([url])=>url.startsWith('https://api.openai.com/'))).toBe(true);
});
it('RN73 texto junto da imagem também preserva o conteúdo visual',async()=>{
 const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({choices:[{message:{content:'Conteúdo visual'},finish_reason:'stop'}]}))).mockResolvedValueOnce(new Response(JSON.stringify({choices:[{message:{content:'Feedback'},finish_reason:'stop'}]})));vi.stubGlobal('fetch',fetchMock);
 await generateCorrection({text:'Trecho digitado',imageBase64:'cGl4ZWxz',userConfig:{provider:'openai',apiKey:'fake',model:'gpt-4o-mini'}});
 expect(fetchMock).toHaveBeenCalledTimes(2);expect(JSON.stringify(JSON.parse(fetchMock.mock.calls[1][1].body).messages)).toContain('Conteúdo visual');
});
