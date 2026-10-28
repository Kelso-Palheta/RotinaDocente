import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { validarConjunto } from '@/dominio/atividades/recuperacaoSemestral';

const COLECAO = (professorId) => collection(db, 'professores', professorId, 'conjuntos_recuperacao');

const comId = (snap) => ({ ...snap.data(), id: snap.id });

const normalizar = (conjunto) => ({
  ...conjunto,
  semestre: String(conjunto.semestre),
  destinatariosIds: Array.isArray(conjunto.destinatariosIds) ? conjunto.destinatariosIds : [],
  atividadeIds: Array.isArray(conjunto.atividadeIds) ? conjunto.atividadeIds : [],
});

/** Conjuntos são privados do professor e filtrados localmente por contexto. */
export async function listConjuntosRecuperacao(professorId, { turmaId, anoLetivo, semestre, incluirCancelados = false } = {}) {
  if (!professorId) throw new Error('Usuário não autenticado.');
  const snap = await getDocs(COLECAO(professorId));
  return snap.docs
    .map(comId)
    .map(normalizar)
    .filter(conjunto => conjunto.professorId === professorId)
    .filter(conjunto => incluirCancelados || conjunto.estado !== 'cancelado')
    .filter(conjunto => (!turmaId || conjunto.turmaId === turmaId)
      && (!anoLetivo || conjunto.anoLetivo === String(anoLetivo))
      && (!semestre || conjunto.semestre === String(semestre)))
    .sort((a, b) => String(b.criadoEm?.seconds || '').localeCompare(String(a.criadoEm?.seconds || '')));
}

export async function getConjuntoRecuperacao(professorId, conjuntoId) {
  if (!professorId || !conjuntoId) throw new Error('Conjunto de recuperação inválido.');
  const snap = await getDoc(doc(db, 'professores', professorId, 'conjuntos_recuperacao', conjuntoId));
  if (!snap.exists() || snap.data().professorId !== professorId) throw new Error('Conjunto de recuperação não encontrado.');
  return normalizar(comId(snap));
}

/**
 * Cria o conjunto sem matricular ninguém automaticamente. O aluno só entra
 * quando o professor marca o destinatário; um aluno não pode ter dois
 * conjuntos vigentes no mesmo contexto.
 */
export async function criarConjuntoRecuperacao(professorId, dados = {}, alunosDaTurma = []) {
  if (!professorId) throw new Error('Usuário não autenticado.');
  const conjunto = validarConjunto({ ...dados, professorId });

  const idsTurma = new Set((alunosDaTurma || []).map(aluno => aluno?.id ?? aluno).filter(Boolean));
  if (idsTurma.size && conjunto.destinatariosIds.some(id => !idsTurma.has(id))) {
    throw new Error('Destinatário não pertence à turma selecionada.');
  }

  const existentes = await listConjuntosRecuperacao(professorId, {
    turmaId: conjunto.turmaId,
    anoLetivo: conjunto.anoLetivo,
    semestre: conjunto.semestre,
  });
  const conflito = conjunto.destinatariosIds.find(id => existentes.some(c => c.destinatariosIds.includes(id)));
  if (conflito) throw new Error('Aluno já possui conjunto de recuperação vigente neste semestre.');

  const ref = doc(COLECAO(professorId));
  const registro = {
    ...conjunto,
    id: ref.id,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  };
  await setDoc(ref, registro);
  return normalizar(registro);
}

export async function atualizarConjuntoRecuperacao(professorId, conjuntoId, dados = {}) {
  const atual = await getConjuntoRecuperacao(professorId, conjuntoId);
  const conjunto = validarConjunto({ ...atual, ...dados, professorId });
  await setDoc(doc(db, 'professores', professorId, 'conjuntos_recuperacao', conjuntoId), {
    ...conjunto,
    id: conjuntoId,
    atualizadoEm: serverTimestamp(),
  }, { merge: true });
  return normalizar({ ...conjunto, id: conjuntoId });
}

export async function cancelarConjuntoRecuperacao(professorId, conjuntoId) {
  await getConjuntoRecuperacao(professorId, conjuntoId);
  await setDoc(doc(db, 'professores', professorId, 'conjuntos_recuperacao', conjuntoId), {
    estado: 'cancelado',
    atualizadoEm: serverTimestamp(),
  }, { merge: true });
}

/** Atividades do conjunto, todas privadas do professor. */
export async function listarAtividadesDoConjunto(professorId, conjuntoId) {
  if (!professorId || !conjuntoId) return [];
  const snap = await getDocs(query(collection(db, 'atividades'), where('professorId', '==', professorId)));
  return snap.docs
    .map(comId)
    .filter(atividade => atividade.conjuntoRecuperacaoId === conjuntoId && atividade.finalidade === 'recuperacao_semestral')
    .sort((a, b) => String(a.titulo || '').localeCompare(String(b.titulo || '')));
}

export async function listarEntregasDoConjunto(atividadeIds = []) {
  const entregas = [];
  for (const activityId of atividadeIds) {
    const snap = await getDocs(query(collection(db, 'entregas'), where('activityId', '==', activityId)));
    entregas.push(...snap.docs.map(d => ({ ...d.data(), id: d.id, activityId })));
  }
  return entregas;
}
