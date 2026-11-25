import { describe,it,expect } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { criarHandlerAulaGamificada } from '@/infraestrutura/aula-gamificada/httpServidor';
const prof={tipo:'professor',uid:'p1'};
const planoBase={titulo:'Investigando a água',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Analisar evidências',duracaoMinutos:50,modalidade:'quiz',experiencia:'resgate',turmaIds:['t1'],questaoIds:['q0','q1','q2'],etapas:[{id:'inicio',titulo:'Abertura',minutos:5,tipo:'introducao',orientacao:'Apresentar o problema.'},{id:'missao',titulo:'Investigar',minutos:35,tipo:'jogo',orientacao:'Comparar evidências.'},{id:'fim',titulo:'Síntese',minutos:10,tipo:'fechamento',orientacao:'Rever hipóteses.'}]};
function fixture(){
 const questoes=Array.from({length:3},(_,i)=>({id:`q${i}`,revision:1,status:'revisada',tipo:'multipla_escolha',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',dificuldade:'facil',enunciado:'Qual ação preserva a água?',explicacao:'Preservar a mata protege a nascente.',alternativas:[{id:'A',texto:'Preservar a mata'},{id:'B',texto:'Descartar lixo'}],respostaCorreta:'A'}));
 const docs=new Map([['professores/p1/turmas/data',{turmas:[{id:'t1',nome:'Turma 1',alunos:[{id:'a1',nome:'Ana'}]}]}],...questoes.map(q=>[`aulaGamificadaDocentes/p1/questoes/${q.id}`,q])]);
 const copy=x=>x==null?null:structuredClone(x);
 const store={get:async p=>copy(docs.get(p)),list:async p=>[...docs].filter(([k])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')).map(([,v])=>copy(v)),transaction:async fn=>{let escreveu=false;const writes=new Map();const out=await fn({get:p=>{if(escreveu)throw Error('Leitura após escrita');return store.get(p);},list:p=>{if(escreveu)throw Error('Leitura após escrita');return store.list(p);},set:(p,v)=>{escreveu=true;writes.set(p,copy(v));}});writes.forEach((v,k)=>docs.set(k,v));return out;}};
 let n=0;return {docs,store,service:new AulaGamificadaService({store,agora:()=>1000,gerarId:()=>`plano_${++n}`,gerarCodigo:()=> 'PLAN123'})};
}
const salvar=(s,plano=planoBase,requestId='novo',expectedRevision)=>s.salvarPlano(prof,{plano,requestId,expectedRevision});
describe('planejamento privado vinculado à partida',()=>{
 it('persiste, lista, reabre e distribui questões sem depender de estado local',async()=>{const {service,store}=fixture();const {plano}=await salvar(service);expect(plano.revision).toBe(1);const outro=new AulaGamificadaService({store});expect((await outro.obterPlano(prof,plano.id)).plano).toEqual(plano);expect((await service.listarPlanos(prof)).planos).toHaveLength(1);expect(plano.etapas[1].questaoIds).toEqual(planoBase.questaoIds);});
 it('repete pedido sem duplicar, rejeita reutilização com corpo diferente e revisão antiga',async()=>{const {service}=fixture();const a=await salvar(service);expect(await salvar(service)).toEqual(a);await expect(salvar(service,{...planoBase,titulo:'Outro'})).rejects.toMatchObject({status:409});const b=await salvar(service,{...a.plano,titulo:'Atualizado'},'edicao',1);expect(b.plano.revision).toBe(2);await expect(salvar(service,a.plano,'velho',1)).rejects.toMatchObject({status:409});});
 it('isola professores, impede aluno e IDs de caminho',async()=>{const {service}=fixture();const {plano}=await salvar(service);await expect(service.obterPlano({tipo:'professor',uid:'p2'},plano.id)).rejects.toMatchObject({status:404});expect((await service.listarPlanos({tipo:'professor',uid:'p2'})).planos).toEqual([]);await expect(service.salvarPlano({tipo:'aluno'},{})).rejects.toMatchObject({status:403});await expect(service.obterPlano(prof,'../p2')).rejects.toMatchObject({status:400});});
 it('rejeita duração, etapas, questões e turmas inválidas; permite rascunho vazio',async()=>{const {service}=fixture();for(const extra of [{duracaoMinutos:60},{etapas:[]},{questaoIds:['q_alheia']},{turmaIds:['t_alheia']},{modalidade:'memoria',experiencia:'resgate'}])await expect(salvar(service,{...planoBase,...extra})).rejects.toHaveProperty('status');expect((await salvar(service,{...planoBase,turmaIds:[],questaoIds:[]})).plano.questaoIds).toEqual([]);});
 it('não permite criar escolhendo id novo arbitrário',async()=>{const {service}=fixture();await expect(salvar(service,{...planoBase,id:'arbitrario'})).rejects.toMatchObject({status:404});});
 it('cria sala com snapshot imutável e não aceita configuração forjada ou revisão antiga',async()=>{const {service,docs}=fixture();const {plano}=await salvar(service);const config={titulo:'Aula',modalidade:'quiz',experiencia:'resgate',turmaIds:['t1'],questaoIds:plano.questaoIds,tempoSegundos:120,planoId:plano.id,planoRevision:1,requestId:'sala'};await expect(service.criarSala(prof,{...config,questaoIds:['q2','q1','q0']})).rejects.toMatchObject({status:409});const {sala}=await service.criarSala(prof,{...config,plano:{titulo:'FORJADO'}});expect(sala.plano.titulo).toBe(plano.titulo);expect(sala.plano.etapas[1].questaoIds).toEqual(plano.questaoIds);await salvar(service,{...plano,titulo:'Mudou depois'},'edita',1);expect(docs.get('aulaGamificadaSalas/PLAN123').plano.titulo).toBe(plano.titulo);await expect(service.criarSala(prof,{...config,requestId:'outra'})).rejects.toMatchObject({status:409});expect((await service.estado(prof,'PLAN123')).estado.plano.titulo).toBe(plano.titulo);});
 it('HTTP exige sessão docente, origem e retorna no-store',async()=>{const {service}=fixture();const handler=criarHandlerAulaGamificada({service,autenticar:async()=>prof});const req=new Request('https://site.test/api/aula-gamificada/planos',{method:'POST',headers:{origin:'https://site.test','Content-Type':'application/json'},body:JSON.stringify({plano:planoBase,requestId:'http'})});const r=await handler(req,{params:{partes:['planos']}});expect(r.status).toBe(200);expect(r.headers.get('Cache-Control')).toContain('no-store');const bad=criarHandlerAulaGamificada({service,autenticar:async()=>({tipo:'aluno'})});expect((await bad(new Request('https://site.test/api/aula-gamificada/planos'),{params:{partes:['planos']}})).status).toBe(403);});
});

it('limite100 bloqueia novos planos e permite editar os existentes',async()=>{
 const {service,docs}=fixture();const {plano}=await salvar(service);
 docs.set('aulaGamificadaDocentes/p1/planejamento/indice',{planos:[{id:plano.id},...Array.from({length:99},(_,i)=>({id:`existente_${i}`}))]});
 await expect(salvar(service,planoBase,'acima')).rejects.toMatchObject({status:422});
 expect((await salvar(service,{...plano,titulo:'Editado no limite'},'edit_limite',1)).plano.revision).toBe(2);
 expect((await service.listarPlanos(prof)).planos).toHaveLength(100);
});
it('snapshot docente não é entregue ao aluno nem permite referenciar plano alheio',async()=>{
 const {service,docs}=fixture();const {plano}=await salvar(service);
 const config={titulo:'Aula',modalidade:'quiz',experiencia:'resgate',turmaIds:['t1'],questaoIds:plano.questaoIds,tempoSegundos:120,planoId:plano.id,planoRevision:1,requestId:'sala'};
 docs.set('aulaGamificadaDocentes/p2/planos/privado',{...plano,id:'privado'});
 await expect(service.criarSala(prof,{...config,planoId:'privado'})).rejects.toMatchObject({status:404});
 const {sala}=await service.criarSala(prof,config);
 const estado=await service.projetar(sala,{ator:{tipo:'aluno'},participanteId:'t1:a1'});
 expect(estado).not.toHaveProperty('plano');expect(estado.sala).not.toHaveProperty('plano');
 expect(docs.get('aulaGamificadaDocentes/p1/salas/PLAN123').plano).toEqual(sala.plano);
});
it('rejeita especificamente tempos, etapas e tipos incompatíveis',async()=>{
 for(const extra of [{duracaoMinutos:60},{etapas:[]},{etapas:planoBase.etapas.map(e=>({...e,tipo:'inventado'}))},{modalidade:'memoria',experiencia:'resgate'},{questaoIds:['q0','q0']}]) {
  const {service}=fixture();await expect(salvar(service,{...planoBase,...extra})).rejects.toMatchObject({status:422});
 }
});
it('HTTP não aceita gravação de origem diferente',async()=>{
 const {service}=fixture();const handler=criarHandlerAulaGamificada({service,autenticar:async()=>prof});
 const request=new Request('https://site.test/api/aula-gamificada/planos',{method:'POST',headers:{origin:'https://outro.test','Content-Type':'application/json'},body:JSON.stringify({plano:planoBase,requestId:'origem'})});
 expect((await handler(request,{params:{partes:['planos']}})).status).toBe(403);expect((await service.listarPlanos(prof)).planos).toEqual([]);
});
