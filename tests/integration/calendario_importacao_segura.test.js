import {POST} from '@/app/api/calendario/importar/route';
const ai=vi.hoisted(()=>({callAIRaw:vi.fn(),extractUserAIConfigFromHeaders:vi.fn(()=>({apiKey:'test',provider:'gemini'}))}));
vi.mock('@/lib/ai-provider-central',()=>ai);
const request=(body)=>({headers:new Headers(),json:async()=>body});
beforeEach(()=>vi.clearAllMocks());
it('valida tópicos e não aceita objetos inválidos como sucesso',async()=>{
 ai.callAIRaw.mockResolvedValue({ok:true,data:{choices:[{message:{content:JSON.stringify({topicos:[{titulo:'',duracaoEstimadaAulas:-1}]})}}]}});
 const res=await POST(request({text:'Plano'}));
 expect(res.status).toBe(422);
});
it('aceita JSON com explicação/fence, normaliza ordem e preserva duração',async()=>{
 ai.callAIRaw.mockResolvedValue({ok:true,data:{choices:[{message:{content:'Segue a extração:\n```json\n'+JSON.stringify({topicos:[{titulo:'História',descricao:'Contexto',ordem:99,duracaoEstimadaAulas:3}]})+'\n```'}}]}});
 const res=await POST(request({text:'Plano',anoLetivo:2027}));
 expect(res.status).toBe(200);
 expect((await res.json()).topicos).toEqual([{titulo:'História',descricao:'Contexto',ordem:1,duracaoEstimadaAulas:3}]);
 expect(ai.callAIRaw.mock.calls[0][0].response_format).toEqual({type:'json_object'});
});
it('texto vazio é rejeitado antes de chamar IA',async()=>{
 const res=await POST(request({text:'   '}));expect(res.status).toBe(400);expect(ai.callAIRaw).not.toHaveBeenCalled();
});
