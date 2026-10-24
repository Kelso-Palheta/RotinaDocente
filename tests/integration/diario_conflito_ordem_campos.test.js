import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({data:null,writes:0}));
function ordenar(v){if(Array.isArray(v))return v.map(ordenar);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordenar(v[k])]));return v;}
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({doc:(_db,...p)=>({path:p.join('/')}),getDoc:async()=>({exists:()=>m.data!==null,data:()=>ordenar(m.data)}),runTransaction:async(_db,fn)=>{let gravacao;const result=await fn({get:async()=>({exists:()=>m.data!==null,data:()=>ordenar(m.data)}),set:(_ref,value)=>{gravacao=value;}});if(gravacao){m.data=ordenar(gravacao);m.writes++;}return result;}}));
import {DiarioRepository} from '@/infraestrutura/diario/DiarioRepository';
import {FilaPersistenciaDiario} from '@/aplicacao/diario/FilaPersistenciaDiario';
const turma=()=>({id:'t',nome:'101',bimestres:{3:{atividades:[],notas:{a:{simulado:3}}}}});
function ambiente(){const dados=new Map();const storage={getItem:k=>dados.get(k)||null,setItem:(k,v)=>dados.set(k,v)};const fila=new FilaPersistenciaDiario({userId:'p',repository:new DiarioRepository('p'),storage});return {fila,storage};}
beforeEach(()=>{m.data={turmas:[turma()],revision:1};m.writes=0;});
it('salva nota e registro de publicação após banco reordenar campos, sem alteração externa',async()=>{
 const {fila}=ambiente();await fila.carregar();const notas=fila.turmas.map(t=>({...t,bimestres:{3:{...t.bimestres[3],notas:{a:{simulado:3,atividade:2}}}}}));
 await fila.salvar(notas);
 const publicadas=notas.map(t=>({...t,publicacoes:{3:{em:'2030-01-01',estado:'completa'}}}));
 await expect(fila.salvar(publicadas)).resolves.toEqual(publicadas);expect(fila.estado).toBe('salvo');expect(m.writes).toBe(2);expect(m.data.turmas[0].bimestres[3].notas.a).toEqual({simulado:3,atividade:2});
});
it('cache pendente com base equivalente não vira conflito pela ordem dos campos',async()=>{
 const {fila,storage}=ambiente();storage.setItem(fila.chave,JSON.stringify({turmas:[turma()],pendente:true,base:{turmas:[turma()],revision:1,_existe:true,_origem:null}}));
 await fila.carregar();expect(fila.estado).toBe('pendente');await fila.tentarNovamente();expect(fila.estado).toBe('salvo');
});
it('revalida nuvem e recupera falso conflito antigo sem descartar rascunho de publicação',async()=>{
 const {fila}=ambiente();await fila.carregar();fila.base={turmas:[turma()],revision:1,_existe:true,_origem:null};fila.turmas=[{...turma(),publicacoes:{3:{estado:'completa'}}}];fila.estado='conflito';fila.erro='Conflito anterior';
 await fila.tentarNovamente();expect(fila.estado).toBe('salvo');expect(m.data.turmas[0].publicacoes[3].estado).toBe('completa');
});
it.each(['nota','revision','exclusao'])('mantém bloqueio e rascunho quando há mudança real: %s',async tipo=>{
 const {fila}=ambiente();await fila.carregar();fila.turmas=[{...turma(),publicacoes:{3:{estado:'completa'}}}];fila.estado='conflito';fila.erro='Conflito anterior';
 if(tipo==='nota')m.data.turmas[0].bimestres[3].notas.a.simulado=4;if(tipo==='revision')m.data.revision=2;if(tipo==='exclusao')m.data=null;
 await expect(fila.tentarNovamente()).rejects.toThrow(/conflito/i);expect(fila.estado).toBe('conflito');expect(fila.turmas[0].publicacoes[3].estado).toBe('completa');expect(m.writes).toBe(0);
});
