import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSessionFromRequest } from '@/lib/aluno/session';
import { podeLerRedacao, redacaoPublica } from '@/dominio/redacao/acessoAluno';

const validId = value => typeof value === 'string' && value.length > 0 && value.length <= 512 && !value.includes('/');
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({error:'Não autorizado. Faça login.'},{status:401});
    const professorUid = new URL(request.url).searchParams.get('professorUid');
    if (!validId(id) || !validId(session.loginKey) || (professorUid && !validId(professorUid))) return NextResponse.json({error:'Contexto inválido.'},{status:400});
    const candidates = professorUid ? [professorUid] : [...new Set((session.vinculos || []).map(v=>v.professorUid || v.id).filter(validId))];
    const db = getAdminDb();
    let found = false;
    for (const uid of candidates) {
      const live = await db.doc(`alunoLogin/${session.loginKey}/vinculos/${uid}`).get();
      if (!live.exists || live.data().professorUid !== uid) continue;
      const snap = await db.doc(`professores/${uid}/correcoes/${id}`).get();
      if (!snap.exists) continue;
      found = true;
      const correction = {...snap.data(),id:snap.id};
      if (podeLerRedacao(correction,session,live.data(),uid)) return NextResponse.json({correction:redacaoPublica(correction)});
    }
    return NextResponse.json({error:found || professorUid ? 'Acesso negado a esta redação.' : 'Redação não encontrada.'},{status:found || professorUid ? 403 : 404});
  } catch (error) {
    console.error('[/api/aluno/redacao/[id]] Erro:',error);
    return NextResponse.json({error:'Erro interno ao buscar redação.'},{status:500});
  }
}
