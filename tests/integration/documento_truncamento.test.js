import {afterEach,expect,it,vi} from 'vitest';
import {extractTextOnly} from '@/lib/redacao/ai-provider';
afterEach(()=>vi.unstubAllGlobals());
const config={provider:'gemini',apiKey:'teste',model:'gemini-teste'};
it('não aceita transcrição de documento truncada na API compatível',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({choices:[{message:{content:'ANA SIL'},finish_reason:'length'}]}))));
 await expect(extractTextOnly('aW1hZ2Vt','image/png',config,{finalidade:'documento'})).rejects.toThrow(/incompleta/);
});
it('não aceita transcrição de documento truncada no fallback nativo',async()=>{
 vi.stubGlobal('fetch',vi.fn(async url=>String(url).includes('/chat/completions')
  ? new Response(JSON.stringify({error:{message:'API nativa'}}),{status:404})
  : new Response(JSON.stringify({candidates:[{content:{parts:[{text:'ANA SIL'}]},finishReason:'MAX_TOKENS'}]}))));
 await expect(extractTextOnly('aW1hZ2Vt','image/png',config,{finalidade:'documento'})).rejects.toThrow(/incompleta/);
});
