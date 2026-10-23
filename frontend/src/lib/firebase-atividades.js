import { db } from './firebase';
import { aplicarSincronizacaoAtividades, atividadeNoEscopo, normalizarEscopoSincronizacao } from '@/dominio/diario/sincronizacaoAtividades';
import {
  doc, collection, setDoc, getDoc, getDocs, deleteDoc,
  query, where, serverTimestamp, writeBatch, runTransaction
} from 'firebase/firestore';
import { gerarLoginAluno, gerarLoginKey, resolverLoginUnico } from '@/utils/diario/loginAluno';
import { encodeToken } from '@/utils/diario/tokenUtils';

export async function createAtividade(data) {
  const id = data.id || `atv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const ref = doc(db, 'atividades', id);
  const sanitizedData = JSON.parse(JSON.stringify(data));
  await setDoc(ref, {
    ...sanitizedData,
    id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return id;
}

export async function updateAtividade(id, data) {
  const ref = doc(db, 'atividades', id);
  const sanitizedData = JSON.parse(JSON.stringify(data));
  await setDoc(ref, { ...sanitizedData, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteAtividade(id) {
  const ref = doc(db, 'atividades', id);
  await deleteDoc(ref);

  const entregasSnap = await getDocs(
    query(collection(db, 'entregas'), where('activityId', '==', id))
  );
  const batch = writeBatch(db);
  entregasSnap.forEach((docSnap) => batch.delete(docSnap.ref));

  const tokensSnap = await getDocs(collection(db, 'atividades', id, 'tokens'));
  tokensSnap.forEach((docSnap) => batch.delete(docSnap.ref));

  await batch.commit();
}

export async function listAtividades(professorId, turmaId) {
  const q = query(
    collection(db, 'atividades'),
    where('professorId', '==', professorId),
    where('turmaIds', 'array-contains', turmaId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function listAllAtividades(professorId) {
  const q = query(
    collection(db, 'atividades'),
    where('professorId', '==', professorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function getAtividade(id) {
  const snap = await getDoc(doc(db, 'atividades', id));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

export async function createTokensForAtividade(activityId, turmaId, alunos) {
  const batch = writeBatch(db);
  for (const aluno of alunos) {
    const token = encodeToken(aluno.id, activityId);
    const ref = doc(db, 'atividades', activityId, 'tokens', aluno.id);
    batch.set(ref, {
      token,
      nome: aluno.nome,
      turmaId,
      alunoId: aluno.id
    });
  }
  await batch.commit();
}

export async function getTokenInfo(activityId, alunoId) {
  const snap = await getDoc(doc(db, 'atividades', activityId, 'tokens', alunoId));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function createTokensForAlunoInTurma(professorId, turmaId, aluno) {
  const atividades = await listAtividades(professorId, turmaId);
  if (atividades.length === 0) return;

  const batch = writeBatch(db);
  for (const atv of atividades) {
    const token = encodeToken(aluno.id, atv.id);
    const ref = doc(db, 'atividades', atv.id, 'tokens', aluno.id);
    batch.set(ref, {
      token,
      nome: aluno.nome,
      turmaId,
      alunoId: aluno.id
    });
  }
  await batch.commit();
}

export async function syncAlunoLogin(professorUid, aluno, turmaId) {
  if (!aluno.dataNascimento) return null;

  const buscarDoc = async (loginCandidato) => {
    const key = await gerarLoginKey(loginCandidato);
    const snap = await getDoc(doc(db, 'alunoLogin', key));
    return snap.exists() ? { nome: snap.data().nome || '' } : null;
  };
  const resolucao = await resolverLoginUnico(aluno.nome, aluno.dataNascimento, buscarDoc);
  if (resolucao.conflito || !resolucao.login) return null;
  const login = resolucao.login;
  const loginKey = await gerarLoginKey(login);

  // 1. Salva/atualiza o doc base do aluno
  const baseRef = doc(db, 'alunoLogin', loginKey);
  await setDoc(baseRef, { nome: aluno.nome, login }, { merge: true });

  // 2. Busca o nome do professor
  let nomeProfessor = 'Professor';
  try {
    const profSnap = await getDoc(doc(db, 'professores', professorUid));
    if (profSnap.exists()) {
      nomeProfessor = profSnap.data().nome || 'Professor';
    }
  } catch (e) {
    console.error('Erro ao buscar nome do professor para vinculo:', e);
  }

  // 3. Salva o vínculo específico do professor
  const vinculoRef = doc(db, 'alunoLogin', loginKey, 'vinculos', professorUid);
  await setDoc(vinculoRef, {
    professorUid,
    turmaId,
    alunoId: aluno.id,
    modulo: 'diario',
    nomeProfessor,
    atualizadoEm: serverTimestamp()
  }, { merge: true });

  return login;
}

export async function removeAlunoLogin(aluno) {
  if (!aluno.dataNascimento) return;
  const login = gerarLoginAluno(aluno.nome, aluno.dataNascimento);
  const loginKey = await gerarLoginKey(login);
  await deleteDoc(doc(db, 'alunoLogin', loginKey));
}

export async function syncNotasAluno(professorUid, turmaId, turma) {
  const batch = writeBatch(db);
  for (const aluno of turma.alunos) {
    const recordId = `${professorUid}_${turmaId}_${aluno.id}`;
    const ref = doc(db, 'notasAluno', recordId);
    batch.set(ref, {
      nome: aluno.nome,
      bimestres: turma.bimestres,
      atualizadoEm: serverTimestamp()
    }, { merge: true });
  }
  await batch.commit();
}

export async function syncSingleNotasAluno(professorUid, turmaId, alunoId, bimestres) {
  const recordId = `${professorUid}_${turmaId}_${alunoId}`;
  const ref = doc(db, 'notasAluno', recordId);
  await setDoc(ref, {
    bimestres,
    atualizadoEm: serverTimestamp()
  }, { merge: true });
}

export async function countEntregasPendentes(escopo, { professorId, turmaId, bimestre } = {}) {
  const constraints = [where('status', '==', 'entregue')];
  if (escopo === 'turma') {
    constraints.push(where('turmaId', '==', turmaId));
    constraints.push(where('bimestre', '==', Number(bimestre)));
  } else {
    constraints.push(where('professorId', '==', professorId));
  }
  const q = query(collection(db, 'entregas'), ...constraints);
  const snap = await getDocs(q);
  return snap.size;
}

export async function countEntregasPorAtividade(atividadeIds) {
  if (!atividadeIds.length) return {};
  const counts = {};
  for (const id of atividadeIds) {
    const snap = await getDocs(query(
      collection(db, 'entregas'),
      where('activityId', '==', id)
    ));
    let pendentes = 0;
    snap.forEach(d => {
      if (d.data().status === 'entregue') pendentes++;
    });
    counts[id] = { total: snap.size, pendentes };
  }
  return counts;
}

export async function sincronizarTodasAsNotas(professorId, filtro = null) {
  if (!professorId) throw new Error('Usuário não autenticado.');
  const escopo = normalizarEscopoSincronizacao(filtro);
  const constraints = [where('professorId', '==', professorId)];
  if (escopo.turmaId) constraints.push(where('turmaIds', 'array-contains', escopo.turmaId));
  const atvSnap = await getDocs(query(collection(db, 'atividades'), ...constraints));
  // Bimestre é filtrado localmente para não exigir novos índices compostos do Firestore.
  const atividades = atvSnap.docs.map(d => ({ ...d.data(), id: d.id }))
    .filter(atv => atv.professorId === professorId && atividadeNoEscopo(atv, escopo));
  const vazio = { sincronizadas: 0, erros: 0, detalhes: [], publicacoes: [] };
  if (!atividades.length) return vazio;

  const entregas = [];
  const detalhes = [];
  for (const atividade of atividades) {
    try {
      const snap = await getDocs(query(collection(db, 'entregas'), where('activityId', '==', atividade.id)));
      entregas.push(...snap.docs.map(d => ({ ...d.data(), id: d.id, activityId: atividade.id })));
    } catch (error) {
      detalhes.push({ atv: atividade.titulo, erro: error.message });
    }
  }
  if (!entregas.length) return { ...vazio, erros: detalhes.length, detalhes };
  const turmaRef = doc(db, 'professores', professorId, 'turmas', 'data');
  return runTransaction(db, async transaction => {
    const turmaSnap = await transaction.get(turmaRef);
    if (!turmaSnap.exists()) return { ...vazio, erros: detalhes.length, detalhes };
    const result = aplicarSincronizacaoAtividades({ turmas: turmaSnap.data().turmas || [], atividades, entregas, escopo });
    if (result.sincronizadas) transaction.set(turmaRef, { turmas: result.turmas, updatedAt: serverTimestamp() }, { merge: true });
    const publicacoes = [];
    const vistos = new Set();
    for (const alteracao of result.alteracoes) {
      const chave = JSON.stringify([alteracao.turmaId, alteracao.alunoId, alteracao.bimestre]);
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const turma = result.turmas.find(t => t.id === alteracao.turmaId);
      publicacoes.push({ ...alteracao, dadosBimestre: turma.bimestres[alteracao.bimestre] });
    }
    return { sincronizadas: result.sincronizadas, erros: detalhes.length, detalhes, publicacoes };
  });
}
