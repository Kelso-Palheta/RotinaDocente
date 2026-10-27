/** Evidência histórica: testes passam ao confirmar defeitos, usando dados fictícios. */
import {it,expect,vi,afterEach} from 'vitest';
import {extractScore} from '@/lib/redacao/scores';
import {generateCorrection} from '@/lib/redacao/ai-provider';
import {extractTextFromPDFDocument} from '@/utils/atividades/visionExtractor';
afterEach(()=>vi.unstubAllGlobals());
it('parser aceita competência fora da escala e total divergente',()=>{
 const r=extractScore('```json\n{"c1":250,"c2":40,"c3":40,"c4":40,"c5":40,"total":999}\n```');
 expect(r.items[0].A).toBe(250);expect(r.total).toBe(999);
 expect(r.items.reduce((s,c)=>s+c.A,0)).toBe(410);
});
it('parser transforma competência ausente em zero',()=>{
 const r=extractScore('```json\n{"c1":160,"total":160}\n```');
 expect(r.items.map(c=>c.A)).toEqual([160,0,0,0,0]);
});
it('JSON solto com anulação e todas as notas zero não produz notas',()=>{
 expect(extractScore('{"c1":0,"c2":0,"c3":0,"c4":0,"c5":0,"total":0,"anulada":true}')).toBeNull();
});
it('correção direta de imagem OpenAI não inclui a imagem na chamada',async()=>{
 const f=vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:'Resposta fictícia'},finish_reason:'stop'}]}),{status:200}));
 vi.stubGlobal('fetch',f);
 await generateCorrection({imageBase64:'SU1BR0VNX1RFU1RF',userConfig:{provider:'openai',apiKey:'chave-ficticia',model:'gpt-4o-mini'}});
 expect(f).toHaveBeenCalled();
 const payload=JSON.parse(f.mock.calls[0][1].body);
 expect(JSON.stringify(payload.messages)).not.toContain('SU1BR0VNX1RFU1RF');
});
it('PDF misto com texto suficiente na primeira página ignora página escaneada',async()=>{
 const f=vi.fn();vi.stubGlobal('fetch',f);
 const render=vi.fn();
 const texto='Texto digital fictício da primeira página. '.repeat(3);
 const pdf={numPages:2,getPage:async i=>({getTextContent:async()=>({items:i===1?[{str:texto}]:[]})})};
 const r=await extractTextFromPDFDocument(pdf,{renderPage:render,headers:{'x-user-ai-key':'ficticia'}});
 expect(r).toBe(texto.trim());expect(render).not.toHaveBeenCalled();expect(f).not.toHaveBeenCalled();
});
