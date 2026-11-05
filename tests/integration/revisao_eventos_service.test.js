import {it,expect,vi} from 'vitest';
import {cenario,salaPronta,acao} from '../helpers/revisaoCenario';
it('confirma pelo recibo próprio sem depender da resposta HTTP e libera assinaturas',async()=>{
 const c=await cenario();const codigo=await salaPronta(c);await c.service.entrar(c.aluno(0),codigo);await acao(c,codigo,'mostrar_conteudo');await acao(c,codigo,'abrir_pergunta');
 const pacotes=[];const assinatura=await c.service.assinar(c.aluno(0),codigo,p=>pacotes.push(p),e=>{throw e;});
 try{
  await vi.waitFor(()=>expect(pacotes.length).toBeGreaterThan(0));const rodadaId=pacotes.at(-1).estado.rodada.id;
  await c.service.responder(c.aluno(0),codigo,{rodadaId,alternativa:'B'});
  await vi.waitFor(()=>expect(pacotes.some(p=>p.envio.status==='confirmado')).toBe(true));
  expect(JSON.stringify(pacotes)).not.toContain('Comentário sintético');expect(pacotes.at(-1).envio).not.toHaveProperty('pontos');
 }finally{assinatura.fechar();}
 expect(c.store.listeners.size).toBe(0);
});
