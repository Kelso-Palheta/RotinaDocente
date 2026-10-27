import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { validarNotasRegistro as validarNotas } from '@/dominio/redacao/validacaoRegistro';
import { dadosIguais } from '@/dominio/diario/comparacao';

const limpar = value => JSON.parse(JSON.stringify(value));
const identidade = (uid,id) => {
  if (![uid,id].every(v=>typeof v==='string' && v && v.length<=200 && !v.includes('/'))) throw new Error('Identificação da redação inválida.');
  return doc(db,'professores',uid,'correcoes',id);
};
export async function salvarRedacao(uid,id,data) {
  const ref=identidade(uid,id);
  const totalScore=validarNotas(data);
  const content=limpar({...data,totalScore,userId:uid,id,schemaVersion:2,status:'corrigido'});
  return runTransaction(db,async tx=> {
    const snap=await tx.get(ref);
    if(snap.exists()) {
      const atual=snap.data();
      const initial=atual.criacaoOriginal;
      if (initial && dadosIguais(initial,content)) return {...atual,id};
      throw new Error('Já existe uma redação diferente com esse identificador. Recarregue o histórico.');
    }
    const result={...content,revision:1,createdAt:data.createdAt || new Date().toISOString(),updatedAt:new Date().toISOString(),criacaoOriginal:content,historico:[]};
    tx.set(ref,result);return result;
  });
}
async function alterar(uid,id,revision,acao,transform) {
  const ref=identidade(uid,id);
  return runTransaction(db,async tx=> {
    const snap=await tx.get(ref);if(!snap.exists()) throw new Error('Redação não encontrada.');
    const atual=snap.data();if((atual.revision || 0)!==(revision || 0)) throw new Error('Conflito: a redação mudou em outra aba. Recarregue antes de revisar.');
    const patch=await transform(atual,tx);const data=new Date().toISOString();
    const anterior=limpar({...atual});delete anterior.historico;delete anterior.criacaoOriginal;
    const result=limpar({...atual,...patch,id,userId:uid,schemaVersion:2,revision:(atual.revision || 0)+1,updatedAt:data,
      historico:[...(atual.historico || []),{acao,autor:uid,data,anterior}]});
    tx.set(ref,result);return result;
  });
}
export async function revisarRedacao(uid,id,patch,revision) {
  return alterar(uid,id,revision,'revisar',atual=> {
    if(atual.status==='arquivado') throw new Error('Restaure a redação antes de revisar.');
    if(!String(patch.result || '').trim()) throw new Error('Informe a devolutiva da revisão.');
    const dados={...atual,scoreData:patch.scoreData,result:patch.result,modo:patch.modo || atual.modo || 'completa',anulada:patch.anulada ?? atual.anulada ?? false,motivoAnulacao:patch.motivoAnulacao ?? atual.motivoAnulacao ?? ''};
    delete dados.totalScore;
    const totalScore=validarNotas(dados);
    return {scoreData:dados.scoreData,result:dados.result,modo:dados.modo,anulada:dados.anulada,motivoAnulacao:dados.motivoAnulacao,totalScore,status:'revisado',publicado:false,tipoCorrecao:'manual',revisadoPor:uid,revisadoEm:new Date().toISOString()};
  });
}
export async function publicarRedacao(uid,id,revision) {
  return alterar(uid,id,revision,'publicar',async (atual,tx)=> {
    if(atual.status!=='revisado') throw new Error('Revise a redação antes de publicar.');
    validarNotas(atual);
    if(!atual.alunoId || !atual.turmaId || !atual.loginKey) throw new Error('Associe aluno, turma e acesso antes de publicar.');
    const baseRef=doc(db,'alunoLogin',atual.loginKey);
    const vinculoRef=doc(db,'alunoLogin',atual.loginKey,'vinculos',uid);
    const [base,vinculo]=await Promise.all([tx.get(baseRef),tx.get(vinculoRef)]);
    const normalizar=value=>String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
    if(base.exists() && (normalizar(base.data().nome)!==normalizar(atual.studentName) || (atual.loginAluno && base.data().login!==atual.loginAluno))) throw new Error('O acesso pertence a outra identidade. Confira o login antes de publicar.');
    if(vinculo.exists() && (vinculo.data().turmaId!==atual.turmaId || vinculo.data().alunoId!==atual.alunoId || (vinculo.data().professorUid && vinculo.data().professorUid!==uid))) throw new Error('O vínculo de acesso possui outro contexto. Confira o Diário antes de publicar.');
    if(!base.exists() && !atual.loginAluno) throw new Error('Login do aluno ausente. Confirme o acesso antes de publicar.');
    if(!base.exists()) tx.set(baseRef,{nome:atual.studentName,login:atual.loginAluno});
    if(!vinculo.exists()) tx.set(vinculoRef,{professorUid:uid,alunoId:atual.alunoId,turmaId:atual.turmaId,turmaNome:atual.studentClass || atual.turmaId,anoLetivo:atual.anoLetivo || null,modulo:'redacao',nomeProfessor:atual.nomeProfessor || 'Professor'});
    return {status:'publicado',publicado:true,publicadoEm:new Date().toISOString(),publicadoPor:uid};
  });
}
export async function arquivarRedacao(uid,id,arquivar,revision) {
  return alterar(uid,id,revision,arquivar?'arquivar':'restaurar',atual=>({status:arquivar?'arquivado':atual.revisadoPor?'revisado':'corrigido',arquivado:Boolean(arquivar),publicado:false}));
}

/** Associação explícita de um registro próprio, mantendo ID e versão original. */
export async function associarContextoRedacao(uid,id,contexto,revision) {
  const {alunoId,turmaId,anoLetivo,bimestre,studentName,studentClass,loginAluno,loginKey}=contexto || {};
  if(!alunoId || !turmaId || !Number.isInteger(Number(anoLetivo)) || Number(anoLetivo)<2000 || Number(anoLetivo)>2200 || ![1,2,3,4].includes(Number(bimestre)) || !studentName || !studentClass || !loginAluno || !loginKey) throw new Error('Selecione turma, aluno, ano, bimestre e acesso válidos para associar.');
  return alterar(uid,id,revision,'associar contexto',atual=>{
    if(atual.status==='arquivado') throw new Error('Restaure a redação antes de associar.');
    return {alunoId,turmaId,anoLetivo:Number(anoLetivo),bimestre:Number(bimestre),studentName,studentClass,loginAluno,loginKey,status:'corrigido',publicado:false,contextoConfirmadoPor:uid,contextoConfirmadoEm:new Date().toISOString()};
  });
}
