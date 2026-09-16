import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSessionFromRequest } from '@/lib/aluno/session';

export async function GET(request, { params }) {
  try {
    const { id: redacaoId } = await params;
    const session = getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const professorUid = searchParams.get('professorUid');

    const vinculoValido = (session.vinculos || []).some(
      (v) => v.professorUid === professorUid || v.id === professorUid
    );

    if (!vinculoValido && session.vinculos?.length > 0 && professorUid) {
      return NextResponse.json({ error: 'Acesso negado a esta redação.' }, { status: 403 });
    }

    const db = getAdminDb();
    let correction = null;

    if (professorUid) {
      const snap = await db.doc(`professores/${professorUid}/correcoes/${redacaoId}`).get();
      if (snap.exists) {
        correction = { id: snap.id, ...snap.data() };
      }
    }

    if (!correction) {
      for (const v of session.vinculos || []) {
        const pUid = v.professorUid || v.id;
        if (pUid) {
          const snap = await db.doc(`professores/${pUid}/correcoes/${redacaoId}`).get();
          if (snap.exists) {
            correction = { id: snap.id, ...snap.data() };
            break;
          }
        }
      }
    }

    if (!correction) {
      return NextResponse.json({ error: 'Redação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ correction });
  } catch (error) {
    console.error('[/api/aluno/redacao/[id]] Erro:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar redação.' }, { status: 500 });
  }
}