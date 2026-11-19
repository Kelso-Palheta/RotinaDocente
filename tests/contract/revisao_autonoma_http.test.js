import { describe, expect, it, vi } from 'vitest';
import { criarHandlerRevisaoAutonoma } from '@/infraestrutura/revisao-autonoma/httpServidor';
describe('HTTP da revisão autônoma',()=>{
 it('recusa sessão ausente, origem cruzada e corpo excessivo',async()=>{
  const service={criarSessao:vi.fn()};
  const negar=criarHandlerRevisaoAutonoma({service,autenticar:async()=>{throw Object.assign(Error('Não autenticado'),{status:401});}});
  expect((await negar(new Request('https://site.test/api/revisao-autonoma/catalogo'))).status).toBe(401);
  const handler=criarHandlerRevisaoAutonoma({service,autenticar:async()=>({tipo:'aluno',loginKey:'a'.repeat(64)})});
  expect((await handler(new Request('https://site.test/api/revisao-autonoma/sessoes',{method:'POST',headers:{origin:'https://invasor.test','content-type':'application/json'},body:'{}'}))).status).toBe(403);
  expect((await handler(new Request('https://site.test/api/revisao-autonoma/sessoes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({texto:'x'.repeat(20000)})}))).status).toBe(413);
  expect(service.criarSessao).not.toHaveBeenCalled();
 });
 it('atende catálogo com cache privado e não deixa aluno publicar',async()=>{
  const service={catalogo:vi.fn(async()=>({conteudos:[]})),publicar:vi.fn()};
  const handler=criarHandlerRevisaoAutonoma({service,autenticar:async()=>({tipo:'aluno',loginKey:'a'.repeat(64)})});
  const r=await handler(new Request('https://site.test/api/revisao-autonoma/catalogo'));expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toContain('no-store');
  const publicar=await handler(new Request('https://site.test/api/revisao-autonoma/publicar',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}));expect(publicar.status).toBe(403);expect(service.publicar).not.toHaveBeenCalled();
 });
});
