import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSessionFromRequest } from '@/lib/aluno/session';
import { atividadePublica, entregaPublica } from '@/dominio/atividades/acessoAluno';
import { chaveVinculoAtividade } from '@/utils/diario/tokenUtils';

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

    if (![professorUid, turmaId, alunoId, session.loginKey].every(id => typeof id === 'string' && id.length > 0 && id.length <= 512 && !id.includes('/'))) return NextResponse.json({ error: 'Contexto inválido.' }, { status: 400 });
    const db = getAdminDb();
    const vinculoSnap = await db.doc(`alunoLogin/${session.loginKey}/vinculos/${professorUid}`).get();
    const vinculo = vinculoSnap.exists ? vinculoSnap.data() : {};
    if (vinculo.professorUid !== professorUid || vinculo.turmaId !== turmaId || vinculo.alunoId !== alunoId) return NextResponse.json({ error: 'Acesso negado aos dados deste aluno.' }, { status: 403 });

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
        .where('turmaIds', 'array-contains', turmaId)
        .get();
      const todasAtividades = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(a => !['rascunho', 'publicando'].includes(a.status));

      const { filtrarAtividadesParaAluno } = await import('@/dominio/adaptacoes/publicadorAtividadeOnline');
      atividades = filtrarAtividadesParaAluno(todasAtividades, alunoId).map(atividadePublica);
    } catch (e) {
      console.warn('Erro ao buscar atividades:', e.message);
    }

    let entregas = [];
    try {
      const snap = await db.collection('entregas')
        .where('alunoId', '==', alunoId)
        .get();
      const atividadesPermitidas = new Set(atividades.map(atividade => atividade.id));
      entregas = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(entrega =>
        entrega.alunoId === alunoId && entrega.turmaId === turmaId &&
        atividadesPermitidas.has(entrega.activityId) &&
        (!entrega.professorId || entrega.professorId === professorUid)
      ).map(entregaPublica);
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

    atividades = atividades.filter(a => a.status !== 'arquivada' || entregas.some(e => e.activityId === a.id));
    const tokens = {};
    try {
      await Promise.all(
        atividades.map(async (atv) => {
          const novo = await db.doc(`atividades/${atv.id}/tokens/${chaveVinculoAtividade(turmaId, alunoId)}`).get();
          const tokenDoc = novo.exists ? novo : await db.doc(`atividades/${atv.id}/tokens/${alunoId}`).get();
          const dados = tokenDoc.exists ? tokenDoc.data() : {};
          if (dados.alunoId === alunoId && dados.turmaId === turmaId && !dados.revogado) tokens[atv.id] = dados.token;
        })
      );
    } catch (e) {
      console.warn('Erro ao buscar tokens:', e.message);
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
      tokens,
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