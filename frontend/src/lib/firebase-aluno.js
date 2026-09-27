import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { gerarLoginKey } from '@/utils/diario/loginAluno';

export async function getAtividadePublica(activityId) {
  const snap = await getDoc(doc(db, 'atividades', activityId));
  if (!snap.exists()) return null;
  const data = { ...snap.data(), id: snap.id };
  delete data.gabarito;
  if (Array.isArray(data.questoes)) {
    data.questoes = data.questoes.map(({ gabarito: _g, rubrica: _r, ...rest }) => rest);
  }
  return data;
}

export async function submitEntrega({ activityId, alunoId, turmaId, bimestre, respostas, respostaTexto }) {
  const entregaId = `${activityId}_${alunoId}`;
  const ref = doc(db, 'entregas', entregaId);
  const atvSnap = await getDoc(doc(db, 'atividades', activityId));
  const professorId = atvSnap.exists() ? atvSnap.data().professorId : null;
  const payload = {
    activityId, alunoId, turmaId, bimestre,
    ...(professorId ? { professorId } : {}),
    ...(respostas != null ? { respostas } : {}),
    ...(respostaTexto != null ? { respostaTexto } : {}),
    status: 'entregue', submittedAt: serverTimestamp()
  };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  await setDoc(ref, payload);
  return entregaId;
}

export async function getEntrega(activityId, alunoId) {
  const entregaId = `${activityId}_${alunoId}`;
  const snap = await getDoc(doc(db, 'entregas', entregaId));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

/**
 * Valida login do aluno e retorna dados + todos os vínculos com professores.
 * Estrutura:
 *   alunoLogin/{hash} → { nome, login }
 *   alunoLogin/{hash}/vinculos/{professorUid} → { professorUid, turmaId, nomeProfessor, modulo }
 */
export async function validarLoginAluno(login) {
  const loginKey = await gerarLoginKey(login);
  const snap = await getDoc(doc(db, 'alunoLogin', loginKey));
  if (!snap.exists()) return null;

  const base = snap.data();

  // Busca todos os vínculos (professores que cadastraram este aluno)
  const vinculosSnap = await getDocs(collection(db, 'alunoLogin', loginKey, 'vinculos'));
  const vinculos = vinculosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Compatibilidade: se o doc antigo tem campos professorUid/turmaId direto, usa como vínculo
  if (vinculos.length === 0 && base.professorUid) {
    vinculos.push({
      professorUid: base.professorUid,
      turmaId: base.turmaId || 'N/A',
      modulo: base.modulo || 'diario',
      nomeProfessor: base.nomeProfessor || 'Professor'
    });
  }

  return { nome: base.nome, login: base.login, loginKey, vinculos };
}

/**
 * Cria/atualiza o vínculo de um professor com um aluno.
 * Chamado ao criar correção de redação ou ao publicar notas do diário.
 */
export async function vincularAlunoProfessor({ login, nome, professorUid, turmaId, modulo, nomeProfessor }) {
  const loginKey = await gerarLoginKey(login);

  // Salva/atualiza o doc base do aluno
  const baseRef = doc(db, 'alunoLogin', loginKey);
  await setDoc(baseRef, { nome, login }, { merge: true });

  // Salva o vínculo específico do professor
  const vinculoRef = doc(db, 'alunoLogin', loginKey, 'vinculos', professorUid);
  await setDoc(vinculoRef, {
    professorUid,
    turmaId,
    modulo,
    nomeProfessor: nomeProfessor || 'Professor',
    atualizadoEm: serverTimestamp()
  }, { merge: true });

  return loginKey;
}

export async function getRedacaoAluno(professorUid, loginKey) {
  const snap = await getDoc(doc(db, 'professores', professorUid, 'correcoes', loginKey));
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id };
}

export async function getNotasAluno(recordId) {
  const snap = await getDoc(doc(db, 'notasAluno', recordId));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function getAtividadesDoAluno(professorUid, turmaId) {
  const q = query(
    collection(db, 'atividades'),
    where('professorId', '==', professorUid),
    where('turmaIds', 'array-contains', turmaId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = { ...d.data(), id: d.id };
    delete data.gabarito;
    if (Array.isArray(data.questoes)) {
      data.questoes = data.questoes.map(({ gabarito: _g, rubrica: _r, ...rest }) => rest);
    }
    return data;
  });
}

export async function getEntregasDoAluno(alunoId) {
  const q = query(collection(db, 'entregas'), where('alunoId', '==', alunoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}



export async function limparVinculosOrfaos(professorUid, turmasAtivas, alunosRemovidos) {
  for (const aluno of alunosRemovidos) {
    if (!aluno.nome || !aluno.dataNascimento) continue;
    
    // Check if student is still in ANY active turma
    const aindaAtivo = turmasAtivas.some(t => 
      t.alunos.some(a => a.id === aluno.id || (a.nome === aluno.nome && a.dataNascimento === aluno.dataNascimento))
    );
    
    if (!aindaAtivo) {
      try {
        const loginStr = await import('@/utils/diario/loginAluno').then(m => m.gerarLoginAluno(aluno.nome, aluno.dataNascimento));
        const loginKey = await gerarLoginKey(loginStr);
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'alunoLogin', loginKey, 'vinculos', professorUid));
      } catch (e) {
        console.error('Erro ao limpar vinculo órfão:', e);
      }
    }
  }
}

export async function limparTodosVinculosOrfaos(professorUid, turmasAtivas) {
  try {
    const { collectionGroup, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
    const q = query(collectionGroup(db, 'vinculos'), where('professorUid', '==', professorUid));
    const snap = await getDocs(q);
    
    const activeKeys = new Set();
    turmasAtivas.forEach(t => {
      if (t.alunos && Array.isArray(t.alunos)) {
        t.alunos.forEach(a => {
          activeKeys.add(`${t.id}_${a.id}`);
        });
      }
    });

    for (const d of snap.docs) {
      const data = d.data();
      const vinculoTurmaId = data.turmaId;
      const vinculoAlunoId = data.alunoId;
      const key = `${vinculoTurmaId}_${vinculoAlunoId}`;
      
      // If the link is not active anymore, delete it
      if (!activeKeys.has(key)) {
        console.log(`Deletando vinculo órfão retroativo: ${d.ref.path}`);
        await deleteDoc(d.ref);
      }
    }
  } catch (e) {
    console.error('Erro ao limpar todos os vinculos órfãos:', e);
  }
}
