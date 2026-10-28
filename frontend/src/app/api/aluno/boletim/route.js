import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getSessionFromRequest } from '@/lib/aluno/session';
import { atividadePublica, entregaPublica } from '@/dominio/atividades/acessoAluno';
import { conjuntoLiberadoParaResposta } from '@/dominio/atividades/recuperacaoSemestral';
import { podeLerRedacao, redacaoPublica } from '@/dominio/redacao/acessoAluno';
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
    const falhas = {};
    let notasData = null;
    try {
      const notasSnap = await db.doc(`notasAluno/${recordId}`).get();
      if (notasSnap.exists) {
        notasData = notasSnap.data();
      }
    } catch (e) {
      falhas.notas = true;
      console.warn('Erro ao buscar notas:', e.message);
    }

    let entregasBrutas = [];
    try {
      const snap = await db.collection('entregas')
        .where('alunoId', '==', alunoId)
        .get();
      entregasBrutas = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(entrega =>
        entrega.alunoId === alunoId && entrega.turmaId === turmaId &&
        (!entrega.professorId || entrega.professorId === professorUid)
      );
    } catch (e) {
      falhas.entregas = true;
      console.warn('Erro ao buscar entregas:', e.message);
    }

    let atividades = [];
    let entregas = [];
    try {
      const snap = await db.collection('atividades')
        .where('professorId', '==', professorUid)
        .where('turmaIds', 'array-contains', turmaId)
        .get();
      const todasAtividades = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(a => !['rascunho', 'publicando'].includes(a.status));

      // A recuperação só aparece depois do fechamento exato dos 10 pontos.
      // Entrega antiga de conjunto incompleto continua acessível como legado,
      // mas nenhuma resposta nova é aceita por esse conjunto.
      const idsConjuntos = [...new Set(todasAtividades
        .filter(a => a.finalidade === 'recuperacao_semestral' && a.conjuntoRecuperacaoId)
        .map(a => a.conjuntoRecuperacaoId))];
      const liberacoes = new Map();
      await Promise.all(idsConjuntos.map(async conjuntoId => {
        try {
          const conjuntoSnap = await db.doc(`professores/${professorUid}/conjuntos_recuperacao/${conjuntoId}`).get();
          if (conjuntoSnap.exists) liberacoes.set(conjuntoId, conjuntoLiberadoParaResposta(conjuntoSnap.data()));
        } catch (e) {
          // Falha de leitura não pode esconder tarefas do aluno.
          console.warn('Erro ao verificar conjunto de recuperação:', e.message);
          liberacoes.set(conjuntoId, true);
        }
      }));
      const entregues = new Set(entregasBrutas.map(entrega => entrega.activityId));
      const publicaveis = todasAtividades.filter(atividade => {
        if (atividade.finalidade !== 'recuperacao_semestral' || !atividade.conjuntoRecuperacaoId) return true;
        if (!liberacoes.has(atividade.conjuntoRecuperacaoId)) return true;
        if (liberacoes.get(atividade.conjuntoRecuperacaoId)) return true;
        return falhas.entregas ? true : entregues.has(atividade.id);
      });

      const { filtrarAtividadesParaAluno } = await import('@/dominio/adaptacoes/publicadorAtividadeOnline');
      atividades = filtrarAtividadesParaAluno(publicaveis, alunoId).map(atividadePublica);
      const permitidas = new Set(atividades.map(atividade => atividade.id));
      entregas = entregasBrutas.filter(entrega => permitidas.has(entrega.activityId)).map(entregaPublica);
    } catch (e) {
      falhas.atividades = true;
      console.warn('Erro ao buscar atividades:', e.message);
    }

    let redacao = null;
    let redacoes = [];
    try {
      const collection = db.collection(`professores/${professorUid}/correcoes`);
      const snap = await collection.where('alunoId', '==', alunoId).get();
      redacoes = snap.docs.map(d => ({...d.data(),id:d.id})).filter(r => podeLerRedacao(r,session,vinculo,professorUid)).map(redacaoPublica);
      const legacy = await db.doc(`professores/${professorUid}/correcoes/${session.loginKey}`).get();
      if (legacy.exists) {
        const data = {...legacy.data(),id:legacy.id};
        if (podeLerRedacao(data,session,vinculo,professorUid) && !redacoes.some(r => r.id === data.id)) redacoes.push(redacaoPublica(data));
      }
      const time = value => value?.toMillis?.() || (value?._seconds || value?.seconds || 0)*1000 || Date.parse(value || '') || 0;
      redacoes.sort((a,b)=>time(b.publicadoEm || b.publishedAt || b.createdAt)-time(a.publicadoEm || a.publishedAt || a.createdAt));
      redacao = redacoes[0] || null;
    } catch (e) {
      falhas.redacoes = true;
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
      falhas.tokens = true;
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
      redacoes,
      falhas,
    });
  } catch (error) {
    console.error('[/api/aluno/boletim] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar o boletim do aluno.' },
      { status: 500 }
    );
  }
}