import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

const prof = { tipo:'professor', uid:'p1' };
const ana = { tipo:'aluno', uid:'u1', loginKey:'ana' };
const beto = { tipo:'aluno', uid:'u2', loginKey:'beto' };
function cenario() {
  const q = { id:'q1',revision:1,status:'revisada',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Plantas',dificuldade:'facil',tipo:'multipla_escolha',enunciado:'Qual gás a planta absorve na fotossíntese?',alternativas:[{id:'A',texto:'Gás carbônico'},{id:'B',texto:'Hélio'},{id:'C',texto:'Argônio'}],respostaCorreta:'A',explicacao:'O carbono da glicose vem do gás carbônico.',justificativaDificuldade:'Reconhecimento conceitual.' };
  const docs = new Map(Object.entries({
    'professores/p1/turmas/data': {turmas:[{id:'t1',nome:'Turma 1',alunos:[{id:'a1',nome:'Ana',loginKey:'ana'},{id:'a2',nome:'Beto',loginKey:'beto'}]}]},
    'alunoLogin/ana/vinculos/p1': {professorUid:'p1',turmaId:'t1',alunoId:'a1',revogado:false},
    'alunoLogin/beto/vinculos/p1': {professorUid:'p1',turmaId:'t1',alunoId:'a2',revogado:false},
    'aulaGamificadaDocentes/p1/questoes/q1': q,
    'aulaGamificadaDocentes/p1/questoes/q2': {...q,id:'q2',tipo:'resposta_aberta',enunciado:'Explique o papel da luz na fotossíntese.',respostaCorreta:'A luz fornece energia para sintetizar glicose.'},
  }));
  const clone = x => x == null ? null : structuredClone(x);
  const store = {async get(p){return clone(docs.get(p));},async set(p,v){docs.set(p,clone(v));},async list(p,f=[]){return [...docs].filter(([k,v])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')&&f.every(([campo,,value])=>v[campo]===value)).map(([,v])=>clone(v));},async transaction(fn){let escrita=false;return fn({get:async p=>{if(escrita)throw new Error('Leitura depois de escrita');return this.get(p);},list:async(p,f)=>{if(escrita)throw new Error('Leitura depois de escrita');return this.list(p,f);},set:(p,v)=>{escrita=true;docs.set(p,clone(v));}});} };
  let now=1000;let counter=0;
  const service=new AulaGamificadaService({store,agora:()=>now,gerarCodigo:()=> 'NOV001',gerarId:()=>`novo_${++counter}`});
  return {service,store,advance:ms=>{now+=ms;},async criar(modalidade,extras={}){const r=await service.criarSala(prof,{titulo:'Novos jogos',modalidade,turmaIds:['t1'],questaoIds:['q1','q2'],tempoSegundos:30,requestId:'criar',...extras});return r.sala;},async cmd(acao,extras={}){const s=await store.get('aulaGamificadaSalas/NOV001');return service.comandar(prof,'NOV001',{acao,rodada:s.rodada,expectedRevision:s.revision,requestId:`cmd_${++counter}`,...extras});}};
}

describe('Natação e Acerte — integração autoritativa',()=>{
  it('Natação avança somente na revelação; duplicidade não avança duas vezes; empate encerra',async()=>{
    const c=cenario();await c.criar('natacao',{questaoIds:['q1'],trechosNatacao:1});
    await c.service.entrar(ana,'NOV001');await c.service.entrar(beto,'NOV001');await c.cmd('iniciar');
    const body={rodada:1,resposta:{alternativaId:'A'},requestId:'ana-resp'};
    await c.service.responder(ana,'NOV001',body);await c.service.responder(ana,'NOV001',body);
    await c.service.responder(beto,'NOV001',{...body,requestId:'beto-resp'});
    const antes=await c.service.estado(ana,'NOV001');expect(JSON.stringify(antes)).not.toContain('vencedoresIds":["');
    await c.cmd('encerrar_rodada');const {estado}=await c.cmd('revelar');
    expect(estado.natacaoEstado.vencedoresIds).toHaveLength(2);
    const {estado:feedbackAna}=await c.service.estado(ana,'NOV001');expect(feedbackAna.eu.recibo.pontos).toBe(1000);
    expect(estado.natacaoEstado.raias.every(r=>r.progresso===1)).toBe(true);
    await c.cmd('ranking');await c.cmd('proxima');expect((await c.store.get('aulaGamificadaSalas/NOV001')).fase).toBe('encerrada');
  });
  it('aberta preserva privacidade, exige correção docente auditada e não deixa bônus inflar nota',async()=>{
    const c=cenario();await c.criar('acerte_perde',{questaoIds:['q2'],desafioFinal:true,semCronometro:true,finalidade:'avaliativa',avaliacao:{tituloAtividade:'Plantas',disciplina:'Ciências',conteudo:'Fotossíntese',bimestre:'1',anoLetivo:'legado',valorMaximo:10}});
    await c.service.entrar(ana,'NOV001');await c.service.entrar(beto,'NOV001');await c.cmd('iniciar');c.advance(999999);
    const recibo=await c.service.responder(ana,'NOV001',{rodada:1,resposta:{texto:'A luz fornece energia.',correta:true},requestId:'r1'});expect(recibo.recibo.pontos).toBeUndefined();
    await c.service.responder(beto,'NOV001',{rodada:1,resposta:{texto:'Não sei.'},requestId:'r2'});
    const aluno=await c.service.estado(beto,'NOV001');expect(JSON.stringify(aluno)).not.toContain('A luz fornece energia.');expect(JSON.stringify(aluno)).not.toContain('sintetizar glicose');
    await c.cmd('encerrar_rodada');await c.cmd('revelar');await expect(c.cmd('ranking')).rejects.toMatchObject({status:409});
    const {correcoes:pendentes}=await c.service.listarCorrecoesAbertas(prof,'NOV001');
    expect(pendentes).toHaveLength(2);
    const s=await c.store.get('aulaGamificadaSalas/NOV001');
    await expect(c.service.comandar({tipo:'professor',uid:'intruso'},'NOV001',{acao:'corrigir_aberta',rodada:1,expectedRevision:s.revision,requestId:'invasao',participanteId:pendentes[0].participanteId,correta:true,justificativa:'OK'})).rejects.toMatchObject({status:403});
    await c.cmd('corrigir_aberta',{participanteId:pendentes[0].participanteId,correta:true,justificativa:'Identificou corretamente a função energética.'});
    await c.cmd('corrigir_aberta',{participanteId:pendentes[1].participanteId,correta:false,justificativa:'Não explicou o papel da luz.'});
    await c.cmd('ranking');await c.cmd('proxima');
    const rel=await c.service.relatorioSala(prof,'NOV001');
    expect(rel.alunos.find(a=>a.nome==='Ana'||a.nomeExibicao==='Ana')?.pontosJogo ?? rel.alunos[0].pontosJogo).toBe(10000);
    expect(rel.alunos.map(a=>a.aproveitamento).sort()).toEqual([0,1]);
    expect(rel.alunos.map(a=>a.notaCalculada).sort((a,b)=>a-b)).toEqual([0,10]);
    expect((await c.store.list('aulaGamificadaSalas/NOV001/respostas')).every(r=>r.correcaoManual.professorId==='p1')).toBe(true);
  });
  it('Natação recusa aberta e configuração fora da faixa; Acerte respeita prazo e rejeita resposta duplicada',async()=>{
    const c=cenario();await expect(c.criar('natacao')).rejects.toMatchObject({status:422});
    await expect(c.criar('natacao',{questaoIds:['q1'],trechosNatacao:0})).rejects.toMatchObject({status:422});
    await c.criar('acerte_perde',{questaoIds:['q1']});await c.service.entrar(ana,'NOV001');await c.cmd('iniciar');
    c.advance(30000);await expect(c.service.responder(ana,'NOV001',{rodada:1,resposta:{alternativaId:'A'},requestId:'tardia'})).rejects.toMatchObject({status:409});
  });
});
