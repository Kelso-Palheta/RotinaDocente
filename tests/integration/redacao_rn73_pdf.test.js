import {it,expect,vi,afterEach} from 'vitest';
import {extractTextFromPDFDocument} from '@/utils/atividades/visionExtractor';
afterEach(()=>vi.unstubAllGlobals());
it('RN73 PDF misto preserva ordem e texto digital, transcrevendo só páginas sem texto',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({text:'Página escaneada'})})));
 const digital={getTextContent:async()=>({items:[{str:'Texto digital de uma redação com mais de cinquenta caracteres.'}]})};const scan={getTextContent:async()=>({items:[]})};
 const renderPage=vi.fn(async()=> 'data:image/png;base64,cGFnZQ==');
 const text=await extractTextFromPDFDocument({numPages:3,getPage:async(i)=>[digital,scan,digital][i-1]},{headers:{'x-user-ai-key':'fake'},renderPage});
 expect(text).toBe('Texto digital de uma redação com mais de cinquenta caracteres.\n\nPágina escaneada\n\nTexto digital de uma redação com mais de cinquenta caracteres.');expect(renderPage).toHaveBeenCalledTimes(1);
});
