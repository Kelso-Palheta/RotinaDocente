import {act,renderHook,waitFor} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({carregar:vi.fn(),salvar:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p'}})}));
vi.mock('@/infraestrutura/calendario/CalendarioRepository',()=>({CalendarioRepository:class{carregar(...args){return m.carregar(...args)} salvar(...args){return m.salvar(...args)}}}));
import {useCalendarioPedagogico} from '@/hooks/calendario/useCalendarioPedagogico';
it('descarta resposta da turma anterior quando termina após a atual',async()=>{
 let resolver;m.carregar.mockImplementation(t=>t==='t1'?new Promise(r=>resolver=r):Promise.resolve({turmaId:'t2',anoLetivo:2026,aulas:[]}));
 const {result,rerender}=renderHook(({t})=>useCalendarioPedagogico(2026,t),{initialProps:{t:'t1'}});
 rerender({t:'t2'});await waitFor(()=>expect(result.current.estado?.turmaId).toBe('t2'));
 await act(async()=>resolver({turmaId:'t1',aulas:[]}));expect(result.current.estado.turmaId).toBe('t2');
});
