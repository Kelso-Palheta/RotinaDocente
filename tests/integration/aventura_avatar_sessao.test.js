import { expect, it } from 'vitest';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';
const ator={tipo:'aluno',loginKey:'e'.repeat(64)};
function criar(n=24){
 const q={revision:1,status:'revisada',tipo:'multipla_escolha',disciplina:'Arte',anoEscolar:'1º ano',conteudo:'Cores',dificuldade:'facil',enunciado:'Qual cor é primária?',alternativas:[{id:'A',texto:'Azul'},{id:'B',texto:'Roxo'}],respostaCorreta:'A',explicacao:'Azul é uma cor primária.',revisaoAutonomaLiberada:true,turmaIdsRevisaoAutonoma:['t1']};
 const docs=new Map([['professores/p1/turmas/data',{turmas:[{id:'t1',nome:'101',alunos:[{id:'a1',nome:'Ana'}]}]}],[`alunoLogin/${ator.loginKey}/vinculos/p1`,{professorUid:'p1',turmaId:'t1',alunoId:'a1'}],...Array.from({length:n},(_,i)=>[`aulaGamificadaDocentes/p1/questoes/q${i}`,{...q,id:`q${i}`}])]);
 const copy=x=>x==null?null:structuredClone(x);
 const store={get:async p=>copy(docs.get(p)),list:async p=>[...docs].filter(([k])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')).map(([,v])=>copy(v)),async transaction(fn){let escreveu=false;const w=new Map();const r=await fn({get:p=>{if(escreveu)throw Error('Leitura após escrita');return store.get(p);},list:p=>{if(escreveu)throw Error('Leitura após escrita');return store.list(p);},set:(p,v)=>{escreveu=true;w.set(p,copy(v));}});w.forEach((v,k)=>docs.set(k,v));return r;}};
 const svc=new RevisaoAutonomaService({store,agora:()=>1000,gerarId:()=> 'aventura24'});
 const body={professorId:'p1',disciplina:'Arte',conteudo:'Cores',dificuldade:'facil',fases:6,estrelasPorFase:3,avatarId:'luna',requestId:'iniciar24'};
 return {svc,body,docs};
}
it('cria seis fases com estrelas, preserva avatar/layout na retomada e não vaza gabaritos',async()=>{
 const f=criar();const r=await f.svc.criarSessao(ator,f.body);
 expect(r.sessao).toMatchObject({schema:2,totalFases:6,total:24,avatarId:'luna',layoutVersao:3,estrelasTotal:3});
 expect(r.sessao.eventos.find(e=>e.tipo==='estrela').x).toBeLessThan(900);
 expect(JSON.stringify(r)).not.toContain('respostaCorreta');
 expect((await f.svc.obterSessao(ator,r.sessao.id)).sessao.avatarId).toBe('luna');
 expect((await f.svc.criarSessao(ator,f.body)).sessao.id).toBe(r.sessao.id);
 await expect(f.svc.criarSessao(ator,{...f.body,avatarId:'kai'})).rejects.toMatchObject({status:409});
});
it('recusa avatar inválido, material insuficiente e mais de seis fases sem criar sessão',async()=>{
 for(const patch of [{avatarId:'https://host/avatar.svg'},{fases:7}]){
 const f=criar();await expect(f.svc.criarSessao(ator,{...f.body,...patch})).rejects.toMatchObject({status:422});
 expect([...f.docs.keys()].some(k=>k.includes('/sessoes/'))).toBe(false);
 }
 const f=criar(12);await expect(f.svc.criarSessao(ator,f.body)).rejects.toMatchObject({status:422});
});
it('sessão antiga mantém layout anterior e recebe avatar seguro sem regravar progresso',async()=>{
 const f=criar();const r=await f.svc.criarSessao(ator,{...f.body,fases:3});
 const chave=`revisaoAutonomaAlunos/${ator.loginKey}/sessoes/${r.sessao.id}`;
 const s=f.docs.get(chave);delete s.avatarId;delete s.layoutVersao;
 const antes=structuredClone(s);const lido=await f.svc.obterSessao(ator,s.id);
 expect(lido.sessao.layoutVersao).toBe(2);expect(lido.sessao.avatarId).toBeTruthy();expect(f.docs.get(chave)).toEqual(antes);
});
