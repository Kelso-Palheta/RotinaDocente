import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/utils/atividades/documentExtractor',()=>({extractTextFromDocument:vi.fn(async()=>({texto:'ANA LUCIA 7,5\nBRUNO SOUZA 8,0'}))}));
vi.mock('@/utils/aiHeaders',()=>({getClientAIHeaders:vi.fn(()=>({'x-user-ai-provider':'gemini','x-user-ai-key':'teste','x-user-ai-model':'gemini-teste'}))}));
import { extrairNotasSimulado } from '@/utils/diario/importarSimuladoIA';
import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';
import { getClientAIHeaders } from '@/utils/aiHeaders';
const file={name:'notas.pdf',type:'application/pdf'};
const response=content=>new Response(JSON.stringify({choices:[{message:{content}}]}));
beforeEach(()=>{vi.clearAllMocks();});
afterEach(()=>vi.unstubAllGlobals());
it('extrai documento real, usa Gemini BYOK e pede apenas nome/nota de simulado do bimestre',async()=>{
 const fetch=vi.fn(async()=>response('{"notas":[{"nome":"ANA LUCIA","nota":"7,5","alunoId":"inventado"}]}'));vi.stubGlobal('fetch',fetch);
 expect(await extrairNotasSimulado([file],{bimestre:3})).toEqual([{nome:'ANA LUCIA',nota:'7,5'}]);
 expect(extractTextFromDocument).toHaveBeenCalledWith(file,{allowImages:true});
 const payload=JSON.parse(fetch.mock.calls[0][1].body);
 expect(payload.model).toBeUndefined();expect(payload.response_format).toEqual({type:'json_object'});
 expect(payload.messages[0].content).toMatch(/simulado/i);expect(payload.messages[0].content).toContain('3º bimestre');
 expect(payload.messages[0].content).toContain('ANA LUCIA 7,5');
 expect(fetch.mock.calls[0][1].headers['x-user-ai-key']).toBe('teste');
});
it('consolida múltiplos arquivos sem aplicar notas durante extração',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>response('{"notas":[{"nome":"ANA LUCIA","nota":5}]}')));
 expect(await extrairNotasSimulado([file,{name:'foto.png',type:'image/png'}],{bimestre:3})).toHaveLength(2);
});
it('recusa ausência de chave antes de extrair o arquivo',async()=>{
 vi.mocked(getClientAIHeaders).mockReturnValueOnce({});
 await expect(extrairNotasSimulado([file],{bimestre:3})).rejects.toThrow(/AI_KEY_REQUIRED/);
 expect(extractTextFromDocument).not.toHaveBeenCalled();
});
it('recusa formato de resposta inesperado',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>response('{"alunos":[]}')));
 await expect(extrairNotasSimulado([file],{bimestre:3})).rejects.toThrow(/notas/i);
});
it('propaga erro real do gateway sem retornar lote parcial',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({error:{error:{message:'Cota excedida'}}}),{status:429})));
 await expect(extrairNotasSimulado([file],{bimestre:3})).rejects.toThrow(/Cota excedida/);
});
