import { afterEach, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/publicar-notas/route';
afterEach(()=>vi.unstubAllGlobals());
it('publica recuperação somente do aluno correspondente para manter o mesmo total no Portal',async()=>{
 const fetchMock=vi.fn(async(url,options)=> options?.method==='PATCH'?{ok:true,json:async()=>({})}:{ok:false,status:404});
 vi.stubGlobal('fetch',fetchMock);
 const response=await POST(new Request('http://localhost/api/publicar-notas',{method:'POST',headers:{authorization:'Bearer teste','content-type':'application/json'},body:JSON.stringify({userId:'p',turmas:[{id:'t',nome:'301',alunos:[{id:'a',nome:'Ana Exemplo',dataNascimento:'2008-03-15'}],bimestres:{},recuperacao:{a:{rec1:5,rec2:0},outro:{rec1:10}}}]})}));
 expect(await response.json()).toMatchObject({total:1,erros:0});
 const chamada=fetchMock.mock.calls.find(([url])=>url.includes('notasAluno/'));
 const fields=JSON.parse(chamada[1].body).fields;
 expect(fields.recuperacao).toEqual({mapValue:{fields:{rec1:{doubleValue:5},rec2:{doubleValue:0}}}});
});
