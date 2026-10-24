import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { autorizarAtividade, buscarEntregaAutorizada, erroAcesso } from '@/infraestrutura/atividades/acessoAluno';
import { validarRespostasEntrega } from '@/dominio/atividades/acessoAluno';
import { chaveVinculoAtividade } from '@/utils/diario/tokenUtils';
export async function POST(request) {
  try {
    const body = await request.json();
    const db = getAdminDb();
    const entregaId = await db.runTransaction(async tx => {
      const ler = ref => tx.get(ref);
      const { atividade, alunoInfo } = await autorizarAtividade({ db, request, activityId: body.activityId, token: body.token, ler });
      if ((body.alunoId != null && body.alunoId !== alunoInfo.alunoId) || (body.turmaId != null && body.turmaId !== alunoInfo.turmaId) || (body.bimestre != null && String(body.bimestre) !== String(atividade.bimestre))) throw erroAcesso(403, 'Turma, aluno ou bimestre divergente do acesso autorizado.');
      const prazo = atividade.dataEntrega?.toDate?.() || new Date(atividade.dataEntrega);
      if (!Number.isFinite(prazo.getTime()) || prazo < new Date()) throw erroAcesso(400, 'Prazo de entrega inválido ou encerrado.');
      let respostas;
      try { respostas = validarRespostasEntrega(atividade, body); } catch (error) { throw erroAcesso(400, error.message); }
      const anterior = await buscarEntregaAutorizada(db, atividade.id, alunoInfo, ler);
      if (anterior) throw erroAcesso(409, 'Entrega já registrada. A resposta e a correção anteriores foram preservadas.');
      const id = `${atividade.id}__${chaveVinculoAtividade(alunoInfo.turmaId, alunoInfo.alunoId)}`;
      tx.set(db.doc(`entregas/${id}`), { activityId: atividade.id, alunoId: alunoInfo.alunoId, turmaId: alunoInfo.turmaId, bimestre: atividade.bimestre, professorId: atividade.professorId, ...respostas, status: 'entregue', submittedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return id;
    });
    return NextResponse.json({ success: true, entregaId });
  } catch (error) {
    if (!error.status) console.error('Erro ao registrar entrega:', error);
    return NextResponse.json({ error: error.status ? error.message : 'Erro ao registrar entrega.' }, { status: error.status || 500 });
  }
}
