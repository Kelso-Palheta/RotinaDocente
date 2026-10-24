import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { autorizarAtividade, buscarEntregaAutorizada, erroAcesso } from '@/infraestrutura/atividades/acessoAluno';
import { atividadePublica, entregaPublica } from '@/dominio/atividades/acessoAluno';
export async function GET(request, { params }) {
  try {
    const { id: activityId } = await params;
    const token = new URL(request.url).searchParams.get('token');
    const db = getAdminDb();
    const { atividade, alunoInfo } = await autorizarAtividade({ db, request, activityId, token, somenteLeitura: true });
    const entrega = await buscarEntregaAutorizada(db, activityId, alunoInfo);
    if (atividade.status === 'arquivada' && !entrega) throw erroAcesso(403, 'Atividade arquivada.');
    return NextResponse.json({ atividade: atividadePublica(atividade), alunoInfo, entrega: entregaPublica(entrega) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (!error.status) console.error('Erro ao carregar atividade:', error);
    return NextResponse.json({ error: error.status ? error.message : 'Erro ao carregar atividade.' }, { status: error.status || 500 });
  }
}
