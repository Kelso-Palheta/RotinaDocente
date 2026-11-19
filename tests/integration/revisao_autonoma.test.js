import { describe, expect, it } from 'vitest';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';
const ana={tipo:'aluno',loginKey:'a'.repeat(64)},beto={tipo:'aluno',loginKey:'b'.repeat(64)},prof={tipo:'professor',uid:'p1'};
function fixture(){
 const questao={id:'q1',revision:1,status:'revisada',tipo:'multipla_escolha',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Plantas',dificuldade:'facil',enunciado:'Qual gás é absorvido na fotossíntese?',alternativas:[{id:'A',texto:'Gás carbônico'},{id:'B',texto:'Hélio'}],respostaCorreta:'A',explicacao:'O carbono da glicose vem do gás carbônico.'};
 const docs=new Map(Object.entries({
  'professores/p1/turmas/data':{turmas:[{id:'t1',nome:'Turma 1',alunos:[{id:'a1',nome:'Ana'},{id:'b1',nome:'Beto'}]}]},
  [`alunoLogin/${ana.loginKey}/vinculos/p1`]:{professorUid:'p1',turmaId:'t1',alunoId:'a1'},
  [`alunoLogin/${beto.loginKey}/vinculos/p1`]:{professorUid:'p1',turmaId:'t1',alunoId:'b1'},
  'aulaGamificadaDocentes/p1/questoes/q1':questao,
  'aulaGamificadaDocentes/p1/questoes/q2':{...questao,id:'q2',enunciado:'Qual gás fornece carbono para a produção de glicose?'},
 }));const copy=x=>x==null?null:structuredClone(x);
 const store={async get(p){return copy(docs.get(p));},async set(p,v){docs.set(p,copy(v));},async list(p){return [...docs].filter(([k])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')).map(([,v])=>copy(v));},async transaction(fn){let escreveu=false;return fn({get:async p=>{if(escreveu)throw Error('Leitura após escrita');return this.get(p);},list:async p=>{if(escreveu)throw Error('Leitura após escrita');return this.list(p);},set:(p,v)=>{escreveu=true;docs.set(p,copy(v));}});}};
 let n=0;const svc=new RevisaoAutonomaService({store,agora:()=>1000,gerarId:()=>`sessao_${++n}`});
 return {svc,store,docs,async liberar(){for(const id of ['q1','q2'])await svc.publicar(prof,{questaoId:id,expectedRevision:1,turmaIds:['t1']});},config:{professorId:'p1',disciplina:'Ciências',conteudo:'Plantas',dificuldade:'facil',quantidade:2,requestId:'criar1'}};
}
describe('Revisão autônoma — segurança, feedback e histórico',()=>{
 it('não abre o banco privado; só oferece questões revisadas liberadas à matrícula',async()=>{
  const c=fixture();expect((await c.svc.catalogo(ana)).conteudos).toEqual([]);await c.liberar();
  const cat=await c.svc.catalogo(ana);expect(cat.conteudos[0].quantidade).toBe(2);expect(JSON.stringify(cat)).not.toContain('respostaCorreta');
  await expect(c.svc.publicar({tipo:'professor',uid:'intruso'},{questaoId:'q1',expectedRevision:1,turmaIds:['t1']})).rejects.toMatchObject({status:404});
 });
 it('congela conteúdo, não vaza respostas futuras, retoma feedback e não duplica acertos',async()=>{
  const c=fixture();await c.liberar();const {sessao}=await c.svc.criarSessao(ana,c.config);
  expect((await c.svc.criarSessao(ana,c.config)).sessao.id).toBe(sessao.id);expect(sessao.questao.respostaCorreta).toBeUndefined();
  const body={questaoId:sessao.questao.id,expectedRevision:sessao.revision,alternativaId:'B',requestId:'r1'};
  const res=await c.svc.responder(ana,sessao.id,body);expect(res.sessao.feedback.correta).toBe(false);expect(res.sessao.feedback.explicacao).toBeTruthy();
  expect((await c.svc.responder(ana,sessao.id,body)).sessao.erros).toBe(1);
  expect((await c.svc.obterSessao(ana,sessao.id)).sessao.fase).toBe('feedback');
  await expect(c.svc.responder(beto,sessao.id,body)).rejects.toMatchObject({status:404});
  const next=await c.svc.avancar(ana,sessao.id,{expectedRevision:res.sessao.revision,requestId:'av1'});
  expect(next.sessao.feedback).toBeNull();expect(next.sessao.indice).toBe(1);
  const ok=await c.svc.responder(ana,sessao.id,{questaoId:next.sessao.questao.id,expectedRevision:next.sessao.revision,alternativaId:'A',requestId:'r2'});
  await c.svc.avancar(ana,sessao.id,{expectedRevision:ok.sessao.revision,requestId:'av2'});
  const hist=await c.svc.historico(ana);expect(hist.sessoes[0]).toMatchObject({acertos:1,erros:1,fase:'concluida'});
  expect((await c.svc.historico(beto)).sessoes).toEqual([]);
  expect([...c.docs.keys()].some(k=>/diario|notas|avaliacao/.test(k))).toBe(false);
  const reforco=await c.svc.criarSessao(ana,{...c.config,requestId:'reforco1',repetirSessaoId:sessao.id});expect(reforco.sessao.total).toBe(1);
 });
 it('bloqueia vínculo revogado, conteúdo retirado e revisão obsoleta',async()=>{
  const c=fixture();await c.liberar();const {sessao}=await c.svc.criarSessao(ana,c.config);
  await expect(c.svc.avancar(ana,sessao.id,{expectedRevision:0,requestId:'velha'})).rejects.toMatchObject({status:409});
  const q=c.docs.get(`aulaGamificadaDocentes/p1/questoes/${sessao.questao.id}`);q.turmaIdsRevisaoAutonoma=[];
  await expect(c.svc.obterSessao(ana,sessao.id)).rejects.toMatchObject({status:403});
  c.docs.get(`alunoLogin/${ana.loginKey}/vinculos/p1`).revogado=true;
  await expect(c.svc.criarSessao(ana,{...c.config,requestId:'outra'})).rejects.toMatchObject({status:403});
 });
});

it('limita criação abusiva sem bloquear leitura do histórico',async()=>{
 const c=fixture();await c.liberar();c.docs.set(`revisaoAutonomaAlunos/${ana.loginKey}`,{historico:[],criacoesRecentes:Array(30).fill(1000)});
 await expect(c.svc.criarSessao(ana,c.config)).rejects.toMatchObject({status:429});
 expect((await c.svc.historico(ana)).sessoes).toEqual([]);
});
