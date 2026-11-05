import {it,expect} from 'vitest';
import {cenario,questaoSintetica,confirmar,acao} from '../helpers/revisaoCenario';
import {RevisaoService} from '../../frontend/src/aplicacao/revisao/RevisaoService';
import {FirestoreRevisaoStore} from '../../frontend/src/infraestrutura/revisao/FirestoreStore';
const local=/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST||'');
it.skipIf(!local)('Firestore v2 mantém introdução, CAS e recibo após nova instância sem modificar notas',async()=>{
 const {Firestore}=await import('../../frontend/node_modules/firebase-admin/lib/firestore/index.js');const db=new Firestore({projectId:'demo-revisao-aula-v2'}),outro=new Firestore({projectId:'demo-revisao-aula-v2'});
 let codigo;
 try{
  const c=await cenario(2,new FirestoreRevisaoStore(db));const qid=questaoSintetica(1).id;
  const aula={id:'aula',titulo:'Aula sintética',status:'rascunho',imagens:[],blocos:[{id:'b1',titulo:'Contexto',tipo:'texto',texto:'Introdução'},{id:'b2',titulo:'Síntese',tipo:'texto',texto:'Conceitos'}]};
  const acervoTematico={listarCatalogoTematico:async()=>({trilhas:[],conteudos:[{id:'aula',hashFonte:'b'.repeat(64)}],questoes:[{questaoId:qid,conteudoIds:['aula']}]}),lerConteudoTematico:async()=>({conteudo:aula,hashFonte:'b'.repeat(64)})};
  c.service=new RevisaoService({...c.opcoes,acervoTematico});const outroService=new RevisaoService({...c.opcoes,acervoTematico,store:new FirestoreRevisaoStore(outro)});
  await c.service.aprovar(c.docente,qid,{hashFonte:'a'.repeat(64),confirmacoes:confirmar,ajustes:{}});await c.service.aprovarConteudo(c.docente,'aula',{hashFonte:'b'.repeat(64),confirmacoes:{conteudo:true,imagens:true,cobertura:true}});
  codigo=(await c.service.criar(c.docente,{titulo:'Ensaio v2',turmaIds:['t1'],conteudoIds:['aula'],questaoIds:[qid],quantidadeQuestoes:1,duracaoSegundos:30,duracaoPorQuestao:{[qid]:12}})).sala.codigo;
  await c.service.entrar(c.aluno(0),codigo);await acao(c,codigo,'mostrar_conteudo');let p=await outroService.estado(c.aluno(0),codigo);expect(p.estado.aula.bloco.id).toBe('b1');expect(p.estado.rodada.questao).toBeNull();
  const cmd={acao:'avancar_conteudo',revisao:p.estado.sala.revisao,rodadaId:p.estado.rodada.id};const concorrencia=await Promise.allSettled([c.service.comandar(c.docente,codigo,cmd),outroService.comandar(c.docente,codigo,cmd)]);expect(concorrencia.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(concorrencia.find(r=>r.status==='rejected').reason.status).toBe(409);
  await acao(c,codigo,'abrir_pergunta');p=await outroService.estado(c.aluno(0),codigo);expect(p.estado.rodada.encerraEmMs).toBe(112000);
  const envio=await outroService.responder(c.aluno(0),codigo,{rodadaId:p.estado.rodada.id,alternativa:'B'});expect((await c.service.estado(c.aluno(0),codigo)).envio.reciboId).toBe(envio.envio.reciboId);
 }finally{
  if(codigo)await db.recursiveDelete(db.doc(`revisaoSalas/${codigo}`));await Promise.all(['professores/prof-1','revisaoDocentes/prof-1','alunoLogin/login0','alunoLogin/login1'].map(p=>db.recursiveDelete(db.doc(p))));await Promise.all([db.terminate(),outro.terminate()]);
 }
},30000);
