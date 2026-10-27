import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcularEvolucaoCompetencias } from '../../frontend/src/dominio/redacao/diagnosticoEvolucao';
import { filtrarRedacoes, resumoRedacoes } from '../../frontend/src/dominio/redacao/historico';
const mock = vi.hoisted(() => ({ docs: new Map(), writes: [] }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({
 doc: (_, ...parts) => parts.join('/'),
 runTransaction: async (_, callback) => callback({ get: async path => ({ exists: () => mock.docs.has(path), data: () => mock.docs.get(path) }), set: (path, data) => { mock.docs.set(path,data); mock.writes.push(path); } }),
}));
import { salvarRedacao, revisarRedacao, publicarRedacao, arquivarRedacao } from '../../frontend/src/lib/redacao/repositorio';
const scores = [1,2,3,4,5].map(n => ({subject: `C${n}`, A:160,fullMark:200}));
const base = { studentName:'Ana', loginAluno:'ana0101', loginKey:'login-ana', alunoId:'a', turmaId:'t', anoLetivo:2026, bimestre:1, result:'Justificativas', scoreData:scores, totalScore:800 };
beforeEach(() => {mock.docs.clear();mock.writes=[];});
describe('RN73 histórico seguro', () => {
 it('duas redações do mesmo aluno sobrevivem e repetição não duplica', async () => {
  const one=await salvarRedacao('p','r1',base); await salvarRedacao('p','r2',{...base,bimestre:2});
  expect((await salvarRedacao('p','r1',base)).revision).toBe(one.revision);
  expect(mock.docs.size).toBe(2); expect(mock.writes).toHaveLength(2);
  await expect(salvarRedacao('p','r1',{...base,result:'Outro'})).rejects.toThrow(/existe|diferente/i);
 });
 it('revisa manualmente com versão anterior, bloqueia conflito e exige revisão para publicar', async () => {
  let r=await salvarRedacao('p','r',base);
  await expect(publicarRedacao('p','r',r.revision)).rejects.toThrow(/revis/i);
  r=await revisarRedacao('p','r',{scoreData:scores,result:'Devolutiva docente'},r.revision);
  expect(r.status).toBe('revisado'); expect(r.tipoCorrecao).toBe('manual'); expect(r.historico[0].anterior.result).toBe('Justificativas');
  await expect(arquivarRedacao('p','r',true,1)).rejects.toThrow(/conflito/i);
  r=await publicarRedacao('p','r',r.revision); expect(r.status).toBe('publicado');
  r=await arquivarRedacao('p','r',true,r.revision); expect(r.status).toBe('arquivado');
  r=await arquivarRedacao('p','r',false,r.revision); expect(r.status).toBe('revisado');
  expect(mock.writes.some(path=>path.includes('/turmas/'))).toBe(false);
 });
 it('recusa nota inválida e feedback vazio sem gravar', async () => {
  const r=await salvarRedacao('p','r',base);
  await expect(revisarRedacao('p','r',{scoreData:[{subject:'C1',A:250}],result:'x'},r.revision)).rejects.toThrow();
  await expect(revisarRedacao('p','r',{scoreData:scores,result:' '},r.revision)).rejects.toThrow();
  expect(mock.writes).toHaveLength(1);
 });
 it('filtros e métricas compartilham turma, ano, bimestre e aluno sem associar legado por nome', () => {
  const data=[{...base,id:'1',status:'publicado'},{...base,id:'2',turmaId:'outra'},{...base,id:'3',anoLetivo:2025},{...base,id:'4',bimestre:2},{...base,id:'5',status:'arquivado'},{studentName:'Ana',id:'6'}];
  const lista=filtrarRedacoes(data,{turmaId:'t',anoLetivo:'2026',bimestre:'1',search:'ANA'});
  expect(lista.map(r=>r.id)).toEqual(['1']); expect(resumoRedacoes(lista).total).toBe(1);
 });
 it('evolução lê scoreData persistido e exclui parcial e inválida sem criar zeros', () => {
  const result=calcularEvolucaoCompetencias([base,{...base,modo:'parcial',scoreData:scores.slice(0,1)},{...base,totalScore:999},{...base,scoreData:[...scores.slice(0,4),{subject:'C5',A:250}]}]);
  expect(result.totalRedacoes).toBe(1);expect(result.mediaGeralTotal).toBe(800);expect(result.medias.c5).toBe(160);
 });
});
it('publicar preserva vínculo do Diário e recusa outro contexto',async()=>{
 let r=await salvarRedacao('p','r',base);r=await revisarRedacao('p','r',{scoreData:scores,result:'Conferido'},r.revision);
 mock.docs.set('alunoLogin/login-ana',{nome:'Ana',login:'ana0101'});
 const vinculo={professorUid:'p',turmaId:'t',alunoId:'a',modulo:'diario',outroDado:'preservar'};
 mock.docs.set('alunoLogin/login-ana/vinculos/p',vinculo);
 await publicarRedacao('p','r',r.revision);
 expect(mock.docs.get('alunoLogin/login-ana/vinculos/p')).toEqual(vinculo);
 r=await revisarRedacao('p','r',{scoreData:scores,result:'Segunda revisão'},r.revision+1);
 mock.docs.set('alunoLogin/login-ana/vinculos/p',{...vinculo,turmaId:'outra'});
 await expect(publicarRedacao('p','r',r.revision)).rejects.toThrow(/vínculo|contexto/i);
});
it('primeira publicação cria acesso e contexto corretos sem mexer no Diário',async()=>{
 let r=await salvarRedacao('p','r',{...base,loginAluno:'ana0101'});r=await revisarRedacao('p','r',{scoreData:scores,result:'Conferido'},r.revision);
 await publicarRedacao('p','r',r.revision);
 expect(mock.docs.get('alunoLogin/login-ana/vinculos/p')).toMatchObject({alunoId:'a',turmaId:'t',professorUid:'p'});
 expect(mock.docs.get('alunoLogin/login-ana')).toMatchObject({nome:'Ana',login:'ana0101'});
});
it('associação legada explícita preserva ID, versão e registros originais',async()=>{
 const {associarContextoRedacao}=await import('../../frontend/src/lib/redacao/repositorio');
 mock.docs.set('professores/p/correcoes/legado',{id:'legado',studentName:'Ana',result:'Original legado',scoreData:scores,totalScore:800});
 await expect(associarContextoRedacao('p','legado',{alunoId:'a'},0)).rejects.toThrow();
 const r=await associarContextoRedacao('p','legado',{alunoId:'a',turmaId:'t',anoLetivo:2026,bimestre:2,studentName:'Ana',studentClass:'101',loginAluno:'ana0101',loginKey:'login-ana'},0);
 expect(r.id).toBe('legado');expect(r.status).toBe('corrigido');expect(r.historico[0].anterior.result).toBe('Original legado');expect(r.bimestre).toBe(2);
 expect(mock.docs.size).toBe(1);
});
