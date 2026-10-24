import {expect,it,vi} from 'vitest';
vi.mock('@/lib/ai-provider-central',()=>({extractUserAIConfigFromHeaders:()=>({provider:'gemini',apiKey:'fake'}),callAI:vi.fn()}));
import {callAI} from '@/lib/ai-provider-central';
import {POST} from '@/app/api/adaptacoes/gerar/route';
const request=()=>new Request('http://localhost/api/adaptacoes/gerar',{method:'POST',body:JSON.stringify({versaoVisual:2,modo:'criar',tema:'Ciências',quantidadeQuestoes:1,aluno:{necessidades:['tea']}})});
it('v2 não transforma resposta inválida da IA em atividade bem-sucedida',async()=>{
 callAI.mockResolvedValue('Resposta interrompida sem JSON');const r=await POST(request());expect(r.status).toBe(502);expect((await r.json()).sucesso).not.toBe(true);
});
it('v2 rejeita objetiva sem gabarito ou guia incompleto',async()=>{
 callAI.mockResolvedValue(JSON.stringify({sucesso:true,atividadeAdaptada:{questoes:[{enunciado:'Qual?',tipo:'multipla_escolha',alternativas:['A) Uma','B) Duas']}]}}));expect((await POST(request())).status).toBe(502);
});
