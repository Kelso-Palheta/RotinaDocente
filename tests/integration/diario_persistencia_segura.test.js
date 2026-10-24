import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({data:new Map(),failure:false}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({
 doc:(_db,...p)=>({path:p.join('/')}),
 getDoc:async r=>{if(m.failure)throw new Error('offline');return {exists:()=>m.data.has(r.path),data:()=>m.data.get(r.path)};},
 runTransaction:async(_db,fn)=>{if(m.failure)throw new Error('offline');const writes=[];const result=await fn({get:async r=>({exists:()=>m.data.has(r.path),data:()=>m.data.get(r.path)}),set:(r,value)=>writes.push([r.path,value])});writes.forEach(([p,value])=>m.data.set(p,value));return result;}
}));
import { DiarioRepository } from '@/infraestrutura/diario/DiarioRepository';
import { FilaPersistenciaDiario } from '@/aplicacao/diario/FilaPersistenciaDiario';
beforeEach(()=>{m.data.clear();m.failure=false;});
const path='professores/p/turmas/data';
it('vazio canônico prevalece sobre legado e permite persistir exclusão da última turma',async()=>{
 m.data.set(path,{turmas:[],revision:2});m.data.set('users/p/turmas/data',{turmas:[{id:'antiga'}]});
 const repo=new DiarioRepository('p');const base=await repo.carregar();expect(base.turmas).toEqual([]);
 const novo=await repo.salvar(base,[]);expect(novo.revision).toBe(3);expect(m.data.get(path).turmas).toEqual([]);
});
it('transação recusa revisão antiga e gravação externa mesmo sem alterar revisão',async()=>{
 m.data.set(path,{turmas:[{id:'a'}],revision:0});const repo=new DiarioRepository('p');const base=await repo.carregar();
 m.data.set(path,{turmas:[{id:'b'}],revision:0});
 await expect(repo.salvar(base,[])).rejects.toThrow(/conflito|mudou/i);
 expect(m.data.get(path).turmas).toEqual([{id:'b'}]);
});
it('fila salva em ordem, mantém rascunho em falha e repete sem perder vazio',async()=>{
 const cache=new Map();const storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
 const fila=new FilaPersistenciaDiario({userId:'p',repository:new DiarioRepository('p'),storage});
 await fila.carregar();
 await Promise.all([fila.salvar([{id:'a'}]),fila.salvar([])]);
 expect(m.data.get(path).turmas).toEqual([]);
 m.failure=true;await expect(fila.salvar([{id:'rascunho'}])).rejects.toThrow('offline');
 expect(fila.estado).toBe('falha');expect(fila.turmas).toEqual([{id:'rascunho'}]);
 expect([...cache.keys()]).toContain('diario:p:v2');
 m.failure=false;await fila.tentarNovamente();expect(m.data.get(path).turmas).toEqual([{id:'rascunho'}]);
});
it('carregamento com falha não grava nem executa limpeza, cache isolado por conta',async()=>{
 const cache=new Map([['diario:outra:v2',JSON.stringify({turmas:[{id:'segredo'}]})]]);
 const fila=new FilaPersistenciaDiario({userId:'p',repository:new DiarioRepository('p'),storage:{getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)}});
 m.failure=true;await expect(fila.carregar()).rejects.toThrow();expect(fila.turmas).toEqual([]);expect(m.data.size).toBe(0);
});
it('rascunho de versão anterior não sobrescreve nuvem após reconexão',async()=>{
 const storage={getItem:()=>JSON.stringify({turmas:[{id:'local'}],pendente:true,base:{turmas:[],revision:0,_origem:null}}),setItem:vi.fn()};
 m.data.set(path,{turmas:[{id:'nuvem'}],revision:1});
 const fila=new FilaPersistenciaDiario({userId:'p',repository:new DiarioRepository('p'),storage});
 await fila.carregar();expect(fila.estado).toBe('conflito');expect(fila.turmas).toEqual([{id:'local'}]);
 await expect(fila.tentarNovamente()).rejects.toThrow(/conflito|mudou/i);expect(m.data.get(path).turmas[0].id).toBe('nuvem');
});
it('restauração só altera estado após gravação confirmada e conserva original em falha',async()=>{
 const fila=new FilaPersistenciaDiario({userId:'p',repository:new DiarioRepository('p')});
 await fila.carregar();await fila.salvar([{id:'original'}]);
 m.failure=true;
 await expect(fila.salvarConfirmado([{id:'backup'}],{origem:'backup'})).rejects.toThrow('offline');
 expect(fila.turmas).toEqual([{id:'original'}]);
 m.failure=false;await fila.salvarConfirmado([{id:'backup'}],{origem:'backup'});
 expect(fila.turmas).toEqual([{id:'backup'}]);
});
it('resposta de carregamento de página desmontada não sobrescreve cache de edição posterior',async()=>{
 let responder;const storage={getItem:()=>null,setItem:vi.fn()};
 const repository={carregar:()=>new Promise(resolve=>{responder=resolve;})};
 const fila=new FilaPersistenciaDiario({userId:'p',repository,storage});
 const carregar=fila.carregar();await Promise.resolve();
 fila.cancelarCarregamento();
 responder({turmas:[{id:'antiga'}],revision:0,_existe:true});
 await carregar;expect(storage.setItem).not.toHaveBeenCalled();
});
