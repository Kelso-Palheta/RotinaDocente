/** Auditoria histórica: confirma defeitos com documentos/serviços fictícios. */
import {it,expect,vi} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const base=new URL('../../../frontend/public/modules/horario-inteligente/',import.meta.url);
const html=readFileSync(new URL('index.html',base),'utf8');
const trecho=(inicio,fim)=>html.slice(html.indexOf(inicio),html.indexOf(fim,html.indexOf(inicio)));
const dom=()=>{const elements={};return{getElementById:id=>elements[id] ||= {value:'Professor A',innerHTML:'',textContent:'',classList:{add(){},remove(){}}}};};
it('recursos locais referenciados no HTML não existem nos caminhos publicados',()=>{
 const paths=[...html.matchAll(/<script src="([^":]+)"/g)].map(m=>m[1]);
 const ausentes=paths.filter(p=>!existsSync(fileURLToPath(new URL(p,base))));
 expect(ausentes).toContain('data_embed.js');expect(ausentes).toContain('js/modules/api-client.js');expect(existsSync(fileURLToPath(new URL('modules/api-client.js',base)))).toBe(true);
});
it('boot substitui grade editada pela demonstração quando versão muda',()=>{
 const atual={meta:{versao_grade:'v1'},slots:[{disc:'Aula editada'}]};const padrao={meta:{versao_grade:'v2'},slots:[{disc:'Demonstração'}]};
 const ctx={state:{schools:{escola_001:{data:atual}},currentSchoolId:'escola_001'},window:{DEFAULT_DATA:padrao},HORARIOS_DEFAULT:{},rebuildAreaMap(){},saveToStorage(){},console:{info(){}}};
 vm.runInNewContext(trecho('function bootSchool()', '// ====== SCHOOL CRUD'),ctx);ctx.bootSchool();
 expect(ctx.state.schools.escola_001.data.slots[0].disc).toBe('Demonstração');
});
it('abrir célula vazia e cancelar deixa aula criada no estado',()=>{
 const grade={slots:[],profs:['Professor A'],salas:['Sala A']};const ctx={currentData:()=>grade,getSlot:()=>null,state:{},document:dom(),HORARIOS:{1:'08:00-08:45'},isPlanningOff:()=>false,isProfBusyElsewhere:()=>false};
 vm.runInNewContext(trecho('function openEdit(', 'function saveEdit()'),ctx);ctx.openEdit('Segunda',1,'101');ctx.closeEdit();
 expect(grade.slots).toHaveLength(1);expect(grade.slots[0].disc).toBe('');
});
it('auditoria local não detecta colisão de sala nem duas aulas da mesma turma com professores distintos',()=>{
 const grade={slots:[{dia:'Segunda',aula:1,turma:'101',prof:'Professor A',sala:'Sala A'},{dia:'Segunda',aula:1,turma:'101',prof:'Professor B',sala:'Sala A'}]};
 const ctx={currentData:()=>grade,isPlanningOff:()=>false};vm.runInNewContext(trecho('function detectConflicts()', '// ====== TOAST'),ctx);
 expect(ctx.detectConflicts()).toHaveLength(0);
});
it('remanejamento sem argumento opcional falha no identificador False',async()=>{
 const f=vi.fn();const ctx={window:{},fetch:f,FormData:class{},module:{exports:{}}};
 vm.runInNewContext(readFileSync(new URL('modules/api-client.js',base),'utf8'),ctx);
 await expect(new ctx.module.exports().remanejarAula({},{})).rejects.toThrow('False is not defined');expect(f).not.toHaveBeenCalled();
});
it('cliente estático não envia autorização JWT',async()=>{
 const f=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({})});const ctx={window:{},fetch:f,FormData:class{},module:{exports:{}}};
 vm.runInNewContext(readFileSync(new URL('modules/api-client.js',base),'utf8'),ctx);
 await new ctx.module.exports().carregarGrade('escola-ficticia');
 expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined();expect(f.mock.calls[0][0]).toContain('/api/v1/grade/carregar/');
});
it('fallback de IA envia contrato diferente do serializer Django',async()=>{
 const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({})});const ctx={window:{},fetch:f};
 vm.runInNewContext(readFileSync(new URL('modules/maritaca-client.js',base),'utf8'),ctx);
 await new ctx.window.MaritacaClient().chat('Pergunta fictícia',{});
 const body=JSON.parse(f.mock.calls[0][1].body);expect(body.userMessage).toBe('Pergunta fictícia');expect(body.mensagem_usuario).toBeUndefined();
});
it('bloqueio de planejamento só pela manhã é ignorado',()=>{
 const ctx={currentData:()=>({planejamento:{Segunda:[{prof:'Professor A',periodo:'manha'}]}})};
 vm.runInNewContext(trecho('function isPlanningOff(', 'function isProfBusyElsewhere('),ctx);
 expect(ctx.isPlanningOff('Professor A','Segunda',1)).toBe(false);
});
