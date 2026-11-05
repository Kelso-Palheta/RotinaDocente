import {it,expect} from 'vitest';
import {RevisaoService} from '../../frontend/src/aplicacao/revisao/RevisaoService';
import {RevisaoMemoria} from '../helpers/revisaoMemoria';
import * as acervo from '../../frontend/src/infraestrutura/revisao/acervoServidor';
import * as acervoTematico from '../../frontend/src/infraestrutura/revisao/acervoTematicoServidor';
import {criarAcessoRevisao} from '../../frontend/src/infraestrutura/revisao/acessoServidor';
import {criarHandlerRevisao} from '../../frontend/src/infraestrutura/revisao/httpServidor';

it('aula autenticada emite cookie real de mídia que libera arquivos declarados e não libera acesso anônimo',async()=>{
 const service=new RevisaoService({store:new RevisaoMemoria(),acervo,acervoTematico});
 const acesso=criarAcessoRevisao({obterAuth:()=>({verifyIdToken:async token=>{if(token!=='docente-sintetico')throw Error('Inválido');return{uid:'prof-sintetico',auth_time:1};},getUser:async()=>({disabled:false})})});
 const handler=criarHandlerRevisao({service,autenticar:acesso.autenticar,autorizarMidia:acesso.autorizarMidia,emitirCookieMidia:acesso.emitirCookieMidia,lerImagemAcervo:acervo.lerImagemAcervo,lerImagemConteudo:acervoTematico.lerImagemConteudo});
 const get=(path,headers={})=>handler(new Request('https://local.test'+path,{headers}),{params:Promise.resolve({partes:path.split('/').slice(3)})});
 const r=await get('/api/revisao/conteudos/tradicao-academica',{authorization:'Bearer docente-sintetico'});expect(r.status).toBe(200);
 const cookie=r.headers.get('set-cookie');expect(cookie).toContain('revisao_midia=');expect(cookie).toContain('HttpOnly');const corpo=await r.json();expect(corpo.conteudo.imagens.length).toBe(2);
 for(const img of corpo.conteudo.imagens){
  expect(img.url).toMatch(/^\/api\/revisao\/conteudos\/tradicao-academica\/imagens\//);
  expect((await get(img.url)).status).toBe(401);
  const res=await get(img.url,{cookie:cookie.split(';')[0]});expect(res.status).toBe(200);expect(res.headers.get('content-type')).toBe('image/jpeg');expect(res.headers.get('cache-control')).toContain('no-store');const b=new Uint8Array(await res.arrayBuffer());expect([...b.slice(0,3)]).toEqual([255,216,255]);
 }
},15000);
