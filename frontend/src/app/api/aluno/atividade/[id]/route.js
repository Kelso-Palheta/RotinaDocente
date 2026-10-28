import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { autorizarAtividade, buscarEntregaAutorizada, erroAcesso } from '@/infraestrutura/atividades/acessoAluno';
import { atividadePublica, entregaPublica } from '@/dominio/atividades/acessoAluno';
import { ehAtividadeRecuperacao, conjuntoLiberadoParaResposta } from '@/dominio/atividades/recuperacaoSemestral';
export async function GET(request, { params }) {
  try {
    const { id: activityId } = await params;
    const token = new URL(request.url).searchParams.get('token');
    const db = getAdminDb();
    const { atividade, alunoInfo } = await autorizarAtividade({ db, request, activityId, token, somenteLeitura: true });
    const entrega = await buscarEntregaAutorizada(db, activityId, alunoInfo);
    if (atividade.status === 'arquivada' && !entrega) throw erroAcesso(403, 'Atividade arquivada.');
    if (ehAtividadeRecuperacao(atividade) && atividade.conjuntoRecuperacaoId && !entrega) {
      const conjuntoSnap = await db.doc(`professores/${atividade.professorId}/conjuntos_recuperacao/${atividade.conjuntoRecuperacaoId}`).get();
      if (conjuntoSnap.exists && !conjuntoLiberadoParaResposta(conjuntoSnap.data())) {
        throw erroAcesso(409, 'Recuperação em montagem: a distribuição dos 10 pontos ainda não foi concluída.');
      }
    }
    return NextResponse.json({ atividade: atividadePublica(atividade), alunoInfo, entrega: entregaPublica(entrega) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (!error.status) console.error('Erro ao carregar atividade:', error);
    return NextResponse.json({ error: error.status ? error.message : 'Erro ao carregar atividade.' }, { status: error.status || 500 });
  }
}
