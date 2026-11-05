import {it,expect,vi} from 'vitest';
import {criarHandlerRevisao} from '../../frontend/src/infraestrutura/revisao/httpServidor';
it('conteúdo privado, aprovação com origem e imagem da aula autorizada antes dos bytes',async()=>{
 const service={conteudo:vi.fn(async()=>({conteudo:{id:'aula'}})),aprovarConteudo:vi.fn(async()=>({ok:true})),validarImagemAulaSala:vi.fn(async()=>{})};const ler=vi.fn(async()=>({buffer:Buffer.from('pixels'),mime:'image/png'}));
 const h=criarHandlerRevisao({service,autenticar:async()=>({tipo:'professor',uid:'p'}),autorizarMidia:async()=>({tipo:'aluno'}),emitirCookieMidia:async()=>null,lerImagemConteudo:ler});
 const req=(path,body,origin='http://local')=>h(new Request('http://local/api/revisao/'+path,{method:body?'POST':'GET',headers:{origin},...(body?{body:JSON.stringify(body)}:{})}),{params:Promise.resolve({partes:path.split('/')})});
 expect((await req('conteudos/aula')).status).toBe(200);expect((await req('conteudos/aula/aprovar',{confirmacoes:{}})).status).toBe(200);expect((await req('conteudos/aula/aprovar',{},'https://outro')).status).toBe(403);
 expect((await req('salas/COD12345/conteudos/aula/imagens/i')).status).toBe(200);expect(service.validarImagemAulaSala).toHaveBeenCalled();
 service.validarImagemAulaSala.mockRejectedValueOnce(Object.assign(Error('Negado'),{status:403}));const n=ler.mock.calls.length;expect((await req('salas/COD12345/conteudos/aula/imagens/i')).status).toBe(403);expect(ler.mock.calls.length).toBe(n);
});
