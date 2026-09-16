import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSessionFromRequest } from '@/lib/aluno/session';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const professorUid = searchParams.get('professorUid');
    const turmaId = searchParams.get('turmaId');
    const alunoId = searchParams.get('alunoId');

    const vinculoValido = (session.vinculos || []).some(
      (v) =>
        v.professorUid === professorUid ||
        v.turmaId === turmaId ||
        v.id === professorUid
    );

    if (!vinculoValido && session.vinculos?.length > 0) {
      return NextResponse.json(
        { error: 'Acesso negado aos dados desta turma.' },
        { status: 403 }
      );
    }

    const db = getAdminDb();

    const recordId = `${professorUid}_${turmaId}_${alunoId}`;
    let notasData = null;
    try {
      const notasSnap = await db.doc(`notasAluno/${recordId}`).get();
      if (notasSnap.exists) {
        notasData = notasSnap.data();
      }
    } catch (e) {
      console.warn('Erro ao buscar notas:', e.message);
    }

    let atividades = [];
    try {
      const snap = await db.collection('atividades')
        .where('professorId', '==', professorUid)
        .where('turmas', 'array-contains', turmaId)
        .get();
      atividades = snap.docs.map((d) => {
        const data = d.data();
        delete data.gabarito;
        if (Array.isArray(data.questoes)) {
          data.questoes = data.questoes.map(({ gabarito: _g, rubrica: _r, ...rest }) => rest);
        }
        return { id: d.id, ...data };
      });
    } catch (e) {
      console.warn('Erro ao buscar atividades:', e.message);
    }

    let entregas = [];
    try {
      const snap = await db.collection('entregas')
        .where('alunoId', '==', alunoId)
        .get();
      entregas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Erro ao buscar entregas:', e.message);
    }

    let redacao = null;
    try {
      const redacaoSnap = await db.doc(`professores/${professorUid}/correcoes/${session.loginKey}`).get();
      if (redacaoSnap.exists) {
        redacao = { id: redacaoSnap.id, ...redacaoSnap.data() };
      }
    } catch (e) {
      console.warn('Erro ao buscar redação:', e.message);
    }

    return NextResponse.json({
      success: true,
      aluno: {
        nome: session.nome,
        login: session.login,
        loginKey: session.loginKey,
      },
      notas: notasData || {},
      atividades,
      entregas,
      redacao,
    });
  } catch (error) {
    console.error('[/api/aluno/boletim] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar o boletim do aluno.' },
      { status: 500 }
    );
  }
}