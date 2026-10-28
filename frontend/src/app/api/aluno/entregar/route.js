import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { autorizarAtividade, buscarEntregaAutorizada, erroAcesso } from '@/infraestrutura/atividades/acessoAluno';
import { validarRespostasEntrega } from '@/dominio/atividades/acessoAluno';
import { finalidadeDaAtividade, FINALIDADE_RECUPERACAO, conjuntoLiberadoParaResposta, conjuntoTemControleDeMontagem } from '@/dominio/atividades/recuperacaoSemestral';
import { chaveVinculoAtividade } from '@/utils/diario/tokenUtils';
export async function POST(request) {
  try {
    const body = await request.json();
    const db = getAdminDb();
    const entregaId = await db.runTransaction(async tx => {
      const ler = ref => tx.get(ref);
      const { atividade, alunoInfo } = await autorizarAtividade({ db, request, activityId: body.activityId, token: body.token, ler });
      const recuperacao = finalidadeDaAtividade(atividade) === FINALIDADE_RECUPERACAO;
      if (recuperacao) {
        if (body.bimestre != null) throw erroAcesso(403, 'Atividade de recuperação não usa bimestre.');
        if (body.finalidade != null && body.finalidade !== FINALIDADE_RECUPERACAO) throw erroAcesso(403, 'Finalidade divergente do acesso autorizado.');
        if (body.conjuntoRecuperacaoId != null && body.conjuntoRecuperacaoId !== atividade.conjuntoRecuperacaoId) throw erroAcesso(403, 'Conjunto divergente do acesso autorizado.');
        if (body.semestre != null && String(body.semestre) !== String(atividade.semestre)) throw erroAcesso(403, 'Semestre divergente do acesso autorizado.');
      } else if ((body.alunoId != null && body.alunoId !== alunoInfo.alunoId) || (body.turmaId != null && body.turmaId !== alunoInfo.turmaId) || (body.bimestre != null && String(body.bimestre) !== String(atividade.bimestre))) {
        throw erroAcesso(403, 'Turma, aluno ou bimestre divergente do acesso autorizado.');
      }
      const prazo = atividade.dataEntrega?.toDate?.() || new Date(atividade.dataEntrega);
      if (!Number.isFinite(prazo.getTime()) || prazo < new Date()) throw erroAcesso(400, 'Prazo de entrega inválido ou encerrado.');
      let respostas;
      try { respostas = validarRespostasEntrega(atividade, body); } catch (error) { throw erroAcesso(400, error.message); }
      const anterior = await buscarEntregaAutorizada(db, atividade.id, alunoInfo, ler);
      if (anterior) throw erroAcesso(409, 'Entrega já registrada. A resposta e a correção anteriores foram preservadas.');
      const id = `${atividade.id}__${chaveVinculoAtividade(alunoInfo.turmaId, alunoInfo.alunoId)}`;
      const conjuntoRef = recuperacao
        ? db.doc(`professores/${atividade.professorId}/conjuntos_recuperacao/${atividade.conjuntoRecuperacaoId}`)
        : null;
      if (conjuntoRef) {
        const conjuntoSnap = await ler(conjuntoRef);
        if (conjuntoSnap.exists) {
          const conjunto = conjuntoSnap.data();
          if (conjunto.estado === 'cancelado') throw erroAcesso(409, 'Conjunto de recuperação cancelado. A entrega não foi registrada.');
          // Montagem e entrega são separadas: enquanto a distribuição não
          // fecha exatamente 10 pontos, nenhuma parcela aceita resposta. O
          // conjunto legado sem `escalas` é reconhecido explicitamente e
          // mantém o comportamento anterior.
          if (!conjuntoLiberadoParaResposta(conjunto)) {
            throw erroAcesso(409, 'Recuperação em montagem: a distribuição dos 10 pontos ainda não foi concluída. A entrega não foi registrada.');
          }
          if (Array.isArray(conjunto.destinatariosIds) && !conjunto.destinatariosIds.includes(alunoInfo.alunoId)) {
            throw erroAcesso(403, 'Este aluno não é mais destinatário da recuperação.');
          }
          if (conjuntoTemControleDeMontagem(conjunto)) {
            const composicao = new Set([
              ...(Array.isArray(conjunto.atividadeIds) ? conjunto.atividadeIds : []),
              ...Object.keys(conjunto.escalas || {}),
            ].map(String));
            if (composicao.size && !composicao.has(String(atividade.id))) {
              throw erroAcesso(403, 'Atividade fora da composição liberada da recuperação.');
            }
          }
          // O congelamento é gravado na mesma transação da entrega. A criação/
          // edição de parcelas lê este documento na própria transação, então
          // Firestore serializa as duas ordens e a edição nunca atravessa uma
          // entrega já confirmada.
          tx.set(conjuntoRef, {
            congelado: true,
            congeladoEm: FieldValue.serverTimestamp(),
            congeladoPorAtividadeId: atividade.id,
            atualizadoEm: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }
      const contexto = recuperacao
        ? { finalidade: FINALIDADE_RECUPERACAO, conjuntoRecuperacaoId: atividade.conjuntoRecuperacaoId, semestre: String(atividade.semestre) }
        : { bimestre: atividade.bimestre };
      tx.set(db.doc(`entregas/${id}`), { activityId: atividade.id, alunoId: alunoInfo.alunoId, turmaId: alunoInfo.turmaId, professorId: atividade.professorId, ...contexto, ...respostas, status: 'entregue', submittedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return id;
    });
    return NextResponse.json({ success: true, entregaId });
  } catch (error) {
    if (!error.status) console.error('Erro ao registrar entrega:', error);
    return NextResponse.json({ error: error.status ? error.message : 'Erro ao registrar entrega.' }, { status: error.status || 500 });
  }
}
