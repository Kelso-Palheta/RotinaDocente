import { expect, it, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/publicar-notas/route';
afterEach(()=>vi.unstubAllGlobals());
const turma={id:'t',nome:'301',alunos:[{id:'a',nome:'Ana Exemplo',dataNascimento:'1503'},{id:'b',nome:'Bruna Exemplo',dataNascimento:'1603'}],bimestres:{1:{atividades:[],notas:{a:{simulado:5}}},2:{atividades:[],notas:{a:{simulado:4}}}},recuperacao:{a:{rec1:5,rec2:7}}};
it('publicar um bimestre usa máscara atômica sem sobrescrever outros períodos e retorna resultados individuais',async()=>{
 const fetchMock=vi.fn(async(url,options)=>options?.method==='PATCH'?{ok:true,json:async()=>({})}:{ok:false,status:404});vi.stubGlobal('fetch',fetchMock);
 const res=await POST(new Request('http://localhost/api/publicar-notas',{method:'POST',headers:{authorization:'Bearer teste'},body:JSON.stringify({userId:'p',turmas:[turma],periodo:1,alvos:[{turmaId:'t',alunoId:'a'}]})}));
 const data=await res.json();expect(data.total).toBe(1);expect(data.resultados).toMatchObject([{turmaId:'t',alunoId:'a',status:'ok'}]);
 const [url,options]=fetchMock.mock.calls.find(([url])=>url.includes('notasAluno/'));
 const mask=new URL(url).searchParams.getAll('updateMask.fieldPaths');
 expect(mask).toContain('bimestres.`1`');expect(mask).not.toContain('bimestres');expect(mask).not.toContain('recuperacao');
 const fields=JSON.parse(options.body).fields;expect(Object.keys(fields.bimestres.mapValue.fields)).toEqual(['1']);
 expect(fields.recuperacao.mapValue.fields).toEqual({rec1:{doubleValue:5}});
});
it('recusa período inválido antes de gravar',async()=>{
 const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
 const res=await POST(new Request('http://localhost/api/publicar-notas',{method:'POST',headers:{authorization:'Bearer teste'},body:JSON.stringify({userId:'p',turmas:[turma],periodo:7})}));
 expect(res.status).toBe(400);expect(fetchMock).not.toHaveBeenCalled();
});
