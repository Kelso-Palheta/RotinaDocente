import { describe, expect, it } from 'vitest';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';
import { montarConteudo, projetarEstado, validarExperienciaSala, validarConfiguracaoSala } from '@/dominio/aula-gamificada/sala';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

const aluno = { tipo:'aluno', loginKey:'e'.repeat(64) };
const prof = { tipo:'professor', uid:'p1' };
const questoes = Array.from({length:3},(_,i)=>({ id:`q${i}`, revision:1, status:'revisada', tipo:'multipla_escolha', disciplina:'Ciências', anoEscolar:'8º ano', conteudo:'Água', dificuldade:'facil', enunciado:`Qual ação preserva a água? Desafio ${i}.`, explicacao:'Proteger a nascente conserva a água.', alternativas:[{id:'A',texto:'Preservar a mata'},{id:'B',texto:'Descartar lixo no rio'}], respostaCorreta:'A', revisaoAutonomaLiberada:true, turmaIdsRevisaoAutonoma:['t1'] }));
function fixture() {
  const docs = new Map([
    ['professores/p1/turmas/data',{turmas:[{id:'t1',nome:'Turma 1',alunos:[{id:'a1',nome:'Ana'}]}]}],
    [`alunoLogin/${aluno.loginKey}/vinculos/p1`,{professorUid:'p1',turmaId:'t1',alunoId:'a1'}],
    ...questoes.map(q=>[`aulaGamificadaDocentes/p1/questoes/${q.id}`,structuredClone(q)]),
  ]);
  const copy=x=>x==null?null:structuredClone(x);
  const store={get:async p=>copy(docs.get(p)),list:async p=>[...docs].filter(([k])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')).map(([,v])=>copy(v)),transaction:async fn=>{
    let escreveu=false; const writes=new Map();
    const out=await fn({get:p=>{if(escreveu)throw Error('Leitura após escrita');return store.get(p);},list:p=>{if(escreveu)throw Error('Leitura após escrita');return store.list(p);},set:(p,v)=>{escreveu=true;writes.set(p,copy(v));},create:(p,v)=>{escreveu=true;if(docs.has(p))throw Error('Existe');writes.set(p,copy(v));}});
    writes.forEach((v,k)=>docs.set(k,v));return out;
  }};
  let n=0;
  return {docs,solo:new RevisaoAutonomaService({store,agora:()=>1000,gerarId:()=>`resgate_${++n}`}),sala:new AulaGamificadaService({store,agora:()=>1000,gerarId:()=>`id_${++n}`,gerarCodigo:()=> 'RIO123'})};
}
const pedido={professorId:'p1',disciplina:'Ciências',conteudo:'Água',dificuldade:'facil',modalidade:'quiz',experiencia:'resgate',quantidade:3,requestId:'novo'};
const config={titulo:'Resgate',turmaIds:['t1'],questaoIds:['q0','q1','q2'],tempoSegundos:120,modalidade:'quiz',experiencia:'resgate',requestId:'sala'};

describe('contrato Resgate do Rio',()=>{
  it('valida experiência sem ampliar as modalidades e exige três questões distintas',()=>{
    expect(validarExperienciaSala(config)).toBe('resgate');
    expect(()=>validarExperienciaSala({...config,modalidade:'memoria'})).toThrow(/Quiz/);
    expect(()=>validarExperienciaSala({...config,experiencia:'inventada'})).toThrow();
    expect(()=>validarConfiguracaoSala({...config,questaoIds:['q0','q0','q0']},[{id:'t1'}],questoes)).toThrow(/três/);
  });
  it('sala congela experiência e mantém perguntas/regras existentes',async()=>{
    const f=fixture();const r=await f.sala.criarSala(prof,config);
    expect(r).toMatchObject({sala:{experiencia:'resgate'}});
    expect(f.docs.get('aulaGamificadaSalas/RIO123')).toMatchObject({experiencia:'resgate',totalRodadas:3,modalidade:'quiz'});
    await expect(fixture().sala.criarSala(prof,{...config,questaoIds:['q0','q1']})).rejects.toMatchObject({status:422});
  });
  it('projeção pública carrega experiência sem expor gabarito ou outras questões',()=>{
    const estado=projetarEstado({sala:{codigo:'RIO123',titulo:'Rio',modalidade:'quiz',experiencia:'resgate',fase:'pergunta',revelado:false,rodada:1,totalRodadas:3,revision:1},conteudo:montarConteudo(questoes[0],'quiz',{codigo:'RIO123',indice:0}),ator:{tipo:'aluno'},participante:{id:'a1',pontos:0},agora:1000});
    expect(estado.sala.experiencia).toBe('resgate');
    expect(estado.rodada.questao.id).toBe('q0');
    expect(JSON.stringify(estado)).not.toContain('respostaCorreta');
    expect(JSON.stringify(estado)).not.toContain('q1');
  });
  it('solo preserva isolamento e revogação de publicação na retomada',async()=>{
    const f=fixture();const {sessao:s}=await f.solo.criarSessao(aluno,pedido);
    await expect(f.solo.obterSessao({tipo:'aluno',loginKey:'f'.repeat(64)},s.id)).rejects.toMatchObject({status:404});
    f.docs.get(`aulaGamificadaDocentes/p1/questoes/${s.questao.id}`).revisaoAutonomaLiberada=false;
    await expect(f.solo.obterSessao(aluno,s.id)).rejects.toMatchObject({status:403});
  });
  it.each([{experiencia:'inventada'},{modalidade:'memoria'},{modalidade:undefined},{quantidade:2}])('solo rejeita configuração incompatível %j',async override=>{
    await expect(fixture().solo.criarSessao(aluno,{...pedido,...override})).rejects.toMatchObject({status:422});
  });
  it('solo confirma pontos, retoma checkpoint, preserva experiência no histórico e não revela futuro',async()=>{
    const f=fixture();let s=(await f.solo.criarSessao(aluno,pedido)).sessao;
    expect(s).toMatchObject({experiencia:'resgate',indice:0,total:3,estadoJogo:{sala:{experiencia:'resgate'}}});
    expect(JSON.stringify(s)).not.toContain('respostaCorreta');
    const resposta={resposta:{alternativaId:'A'},questaoId:s.questao.id,expectedRevision:s.revision,requestId:'resposta1'};
    const primeira=await f.solo.responder(aluno,s.id,resposta);
    expect(await f.solo.responder(aluno,s.id,resposta)).toEqual(primeira);
    s=primeira.sessao;expect(s).toMatchObject({pontosJogo:1000,acertos:1});
    s=(await f.solo.avancar(aluno,s.id,{expectedRevision:s.revision,requestId:'avanco1'})).sessao;
    expect((await f.solo.obterSessao(aluno,s.id)).sessao).toMatchObject({experiencia:'resgate',indice:1,pontosJogo:1000});
    expect(JSON.stringify(s)).not.toContain('respostaCorreta');
    s=(await f.solo.responder(aluno,s.id,{resposta:{alternativaId:'B'},questaoId:s.questao.id,expectedRevision:s.revision,requestId:'resposta2'})).sessao;
    expect(s).toMatchObject({pontosJogo:1000,erros:1,fase:'feedback'});
    expect((await f.solo.historico(aluno)).sessoes[0]).toMatchObject({experiencia:'resgate',pontosJogo:1000,progresso:2});
    await expect(f.solo.criarSessao(aluno,{...pedido,experiencia:'padrao'})).rejects.toMatchObject({status:409});
    expect([...f.docs.keys()].some(k=>/notas|boletim|diario/.test(k))).toBe(false);
  });
});
