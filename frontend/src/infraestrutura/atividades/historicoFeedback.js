import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { listAtividades } from '@/lib/firebase-atividades';
import { montarHistoricoFeedback } from '@/dominio/atividades/correcaoManual';

export async function carregarHistoricoFeedbackAluno(professorId, turmaId, alunoId) {
  if (!professorId || !turmaId || !alunoId) throw new Error('Identifique professor, turma e aluno para carregar as devolutivas.');
  const atividades = await listAtividades(professorId, turmaId);
  const snapshots = await Promise.all(atividades.map(atividade => getDocs(query(collection(db, 'entregas'), where('alunoId', '==', alunoId), where('activityId', '==', atividade.id)))));
  const entregas = snapshots.flatMap(snap => snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  return montarHistoricoFeedback({ atividades, entregas, professorId, turmaId, alunoId });
}
