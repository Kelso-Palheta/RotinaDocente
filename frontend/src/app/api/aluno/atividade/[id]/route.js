import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { decodeToken } from '@/utils/diario/tokenUtils';

export async function GET(request, { params }) {
  try {
    const { id: activityId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token de acesso não fornecido.' }, { status: 401 });
    }

    const decoded = decodeToken(token);
    if (!decoded || decoded.activityId !== activityId) {
      return NextResponse.json({ error: 'Token de acesso inválido ou expirado.' }, { status: 403 });
    }

    const { alunoId } = decoded;
    const db = getAdminDb();

    const atvSnap = await db.doc(`atividades/${activityId}`).get();
    if (!atvSnap.exists) {
      return NextResponse.json({ error: 'Atividade não encontrada.' }, { status: 404 });
    }

    const atvData = { ...atvSnap.data(), id: atvSnap.id };
    delete atvData.gabarito;
    if (Array.isArray(atvData.questoes)) {
      atvData.questoes = atvData.questoes.map(({ gabarito: _g, rubrica: _r, ...rest }) => rest);
    }

    const entregaId = `${activityId}_${alunoId}`;
    const entregaSnap = await db.doc(`entregas/${entregaId}`).get();
    const entrega = entregaSnap.exists ? { ...entregaSnap.data(), id: entregaSnap.id } : null;

    let alunoInfo = null;
    try {
      const tokenDoc = await db.doc(`atividades/${activityId}/tokens/${alunoId}`).get();
      if (tokenDoc.exists) {
        alunoInfo = tokenDoc.data();
      }
    } catch {}

    return NextResponse.json({
      atividade: atvData,
      entrega,
      alunoInfo,
    });
  } catch (error) {
    console.error('[/api/aluno/atividade/[id]] Erro:', error);
    return NextResponse.json({ error: 'Erro ao carregar atividade.' }, { status: 500 });
  }
}