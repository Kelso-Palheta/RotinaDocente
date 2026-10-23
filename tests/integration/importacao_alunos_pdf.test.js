import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/utils/atividades/documentExtractor', () => ({ extractTextFromDocument: vi.fn(async () => ({texto:'ANA SILVA\nJOAO SOUZA'})) }));
import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';
import { importarViaIA } from '@/utils/diario/importIA';
afterEach(() => vi.unstubAllGlobals());
it('importa alunos usando texto extraído do PDF, sem enviar binário base64 como texto', async () => {
 const file = {name:'lista.pdf',arrayBuffer:vi.fn(async () => new ArrayBuffer(5))};
 const fetch = vi.fn(async () => new Response(JSON.stringify({choices:[{message:{content:'{"alunos":["ANA SILVA","JOAO SOUZA"]}'}}]})));
 vi.stubGlobal('fetch',fetch);
 expect(await importarViaIA(file)).toEqual(['ANA SILVA','JOAO SOUZA']);
 expect(extractTextFromDocument).toHaveBeenCalledWith(file);
 const payload = JSON.parse(fetch.mock.calls[0][1].body);
 expect(JSON.stringify(payload.messages)).toContain('ANA SILVA');
 expect(JSON.stringify(payload.messages)).not.toMatch(/Decodifique mentalmente|Base64:/);
 expect(payload.model).toBeUndefined();
 expect(payload.response_format).toEqual({type:'json_object'});
});
