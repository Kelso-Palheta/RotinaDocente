import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, query, where, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { validarConjunto } from '@/dominio/atividades/recuperacaoSemestral';

const COLECAO = (professorId) => collection(db, 'professores', professorId, 'conjuntos_recuperacao');
const LOCKS = (professorId) => collection(db, 'professores', professorId, 'recuperacao_locks');

const comId = (snap) => ({ ...snap.data(), id: snap.id });

const normalizar = (conjunto) => ({
  ...conjunto,
  versao: Number(conjunto?.versao || 1),
  semestre: String(conjunto.semestre),
  destinatariosIds: Array.isArray(conjunto.destinatariosIds) ? conjunto.destinatariosIds : [],
  atividadeIds: Array.isArray(conjunto.atividadeIds) ? conjunto.atividadeIds : [],
  escalas: conjunto.escalas && typeof conjunto.escalas === 'object' ? conjunto.escalas : {},
});

const conflito = (mensagem) => Object.assign(new Error(mensagem), { code: 'RECUPERACAO_CONFLITO' });

/** Chave determinística do lock por contexto letivo e aluno. */
const chaveLock = (conjunto, alunoId) => (
  [conjunto.turmaId, conjunto.anoLetivo, `S${conjunto.semestre}`, alunoId].join('__')
);

const refLock = (professorId, chave) => doc(db, 'professores', professorId, 'recuperacao_locks', chave);

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
 *
 * A unicidade é garantida por um documento de lock determinístico lido e
 * gravado na mesma transação. Conjuntos antigos, anteriores aos locks, são
 * verificados antes da transação; essa parte é a única que não é atômica.
 */
export async function criarConjuntoRecuperacao(professorId, dados = {}, alunosDaTurma = []) {
  if (!professorId) throw new Error('Usuário não autenticado.');
  const conjunto = validarConjunto({ ...dados, professorId });

  const idsTurma = new Set((alunosDaTurma || []).map(aluno => aluno?.id ?? aluno).filter(Boolean));
  if (idsTurma.size && conjunto.destinatariosIds.some(id => !idsTurma.has(id))) {
    throw new Error('Destinatário não pertence à turma selecionada.');
  }

  const legados = (await listConjuntosRecuperacao(professorId, {
    turmaId: conjunto.turmaId,
    anoLetivo: conjunto.anoLetivo,
    semestre: conjunto.semestre,
  })).filter(existente => existente.estado !== 'cancelado');
  const conflitoLegado = conjunto.destinatariosIds.find(id => legados.some(c => c.destinatariosIds.includes(id)));
  if (conflitoLegado) throw conflito('Aluno já possui conjunto de recuperação vigente neste semestre.');

  const ref = doc(COLECAO(professorId));
  const registro = normalizar({
    ...conjunto,
    id: ref.id,
    versao: 1,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  await runTransaction(db, async (tx) => {
    for (const alunoId of registro.destinatariosIds) {
      const chave = chaveLock(registro, alunoId);
      const lock = await tx.get(refLock(professorId, chave));
      if (lock.exists()) {
        throw conflito('Aluno já possui conjunto de recuperação vigente neste semestre.');
      }
    }
    tx.set(ref, registro);
    for (const alunoId of registro.destinatariosIds) {
      tx.set(refLock(professorId, chaveLock(registro, alunoId)), {
        conjuntoId: ref.id,
        turmaId: registro.turmaId,
        anoLetivo: registro.anoLetivo,
        semestre: registro.semestre,
        alunoId,
        versao: 1,
      });
    }
  });

  return registro;
}

/**
 * Entregas de um conjunto. Consulta pelo ID do conjunto (entregas novas) e
 * pelas atividades (entregas antigas, gravadas antes do contexto completo).
 * A consulta externa cobre apenas dados legados; a corrida entre entrega e
 * edição é fechada pelo marcador `congelado` gravado na transação de entrega.
 */
export async function conjuntoPossuiEntregas(professorId, conjuntoId, atividadeIds = []) {
  if (!conjuntoId) return false;
  const porConjunto = await getDocs(query(
    collection(db, 'entregas'),
    where('professorId', '==', professorId),
    where('conjuntoRecuperacaoId', '==', conjuntoId),
  ));
  if (porConjunto.docs.length) return true;
  for (const atividadeId of atividadeIds) {
    if (typeof atividadeId !== 'string' || !atividadeId) continue;
    const snap = await getDocs(query(collection(db, 'entregas'), where('activityId', '==', atividadeId)));
    if (snap.docs.length) return true;
  }
  return false;
}

const erroCongelado = () => Object.assign(
  new Error('A recuperação já possui entregas. Destinatários e contexto ficam congelados; crie outro conjunto para mudar o público.'),
  { code: 'RECUPERACAO_CONGELADA' },
);

const mesmaLista = (a = [], b = []) => (
  JSON.stringify([...a].map(String).sort()) === JSON.stringify([...b].map(String).sort())
);

/**
 * Atualiza o conjunto e incrementa a versão. A versão da tela é conferida
 * dentro da transação para que uma edição antiga não sobrescreva outra.
 *
 * Destinatários e contexto (turma/ano/semestre) ficam congelados depois da
 * primeira entrega. Antes disso, mudar o contexto move as reservas: as chaves
 * antigas só são apagadas se ainda pertencerem a este conjunto, e as novas são
 * reservadas para todos os destinatários na mesma transação.
 *
 * Composição e escala não são editadas aqui: elas pertencem ao caminho
 * transacional de criação/edição das atividades.
 */
export async function atualizarConjuntoRecuperacao(professorId, conjuntoId, dados = {}) {
  if (!professorId || !conjuntoId) throw new Error('Conjunto de recuperação inválido.');
  const { versaoEsperada, ...alteracoes } = dados;
  const ref = doc(db, 'professores', professorId, 'conjuntos_recuperacao', conjuntoId);

  const antesSnap = await getDoc(ref);
  if (!antesSnap.exists() || antesSnap.data().professorId !== professorId) {
    throw new Error('Conjunto de recuperação não encontrado.');
  }
  const antes = normalizar(comId(antesSnap));
  const entregasLegado = await conjuntoPossuiEntregas(professorId, conjuntoId, [
    ...new Set([...antes.atividadeIds, ...Object.keys(antes.escalas)]),
  ]);

  let atualizado;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().professorId !== professorId) {
      throw new Error('Conjunto de recuperação não encontrado.');
    }
    const atual = normalizar({ ...snap.data(), id: conjuntoId });
    if (versaoEsperada != null && Number(versaoEsperada) !== atual.versao) {
      throw conflito('O conjunto mudou em outra aba. Recarregue antes de editar.');
    }

    if (alteracoes.atividadeIds !== undefined || alteracoes.escalas !== undefined) {
      const mesmosIds = alteracoes.atividadeIds === undefined
        || mesmaLista(alteracoes.atividadeIds, atual.atividadeIds);
      const mesmasEscalas = alteracoes.escalas === undefined
        || JSON.stringify(alteracoes.escalas) === JSON.stringify(atual.escalas);
      if (!mesmosIds || !mesmasEscalas) {
        throw new Error('A composição da recuperação é definida pelas atividades. Edite ou crie a parcela para mudar a distribuição.');
      }
    }

    const conjunto = validarConjunto({ ...atual, ...alteracoes, professorId });
    const destinatariosMudaram = !mesmaLista(conjunto.destinatariosIds, atual.destinatariosIds);
    const contextoMudou = ['turmaId', 'anoLetivo', 'semestre']
      .some(campo => String(conjunto[campo]) !== String(atual[campo]));

    if ((destinatariosMudaram || contextoMudou) && (atual.congelado === true || entregasLegado)) {
      throw erroCongelado();
    }
    if (contextoMudou && (atual.atividadeIds.length || Object.keys(atual.escalas).length)) {
      throw new Error('O conjunto já possui atividades. Crie outro conjunto para mudar turma, ano ou semestre.');
    }

    const chavesNovas = new Map(
      conjunto.destinatariosIds.map(alunoId => [alunoId, chaveLock(conjunto, alunoId)]),
    );
    const chavesAntigas = new Map(
      atual.destinatariosIds.map(alunoId => [alunoId, chaveLock(atual, alunoId)]),
    );

    // Todas as leituras de reserva acontecem antes de qualquer escrita.
    const reservasNovas = new Map();
    for (const [alunoId, chave] of chavesNovas) {
      const lock = await tx.get(refLock(professorId, chave));
      if (lock.exists() && lock.data().conjuntoId !== conjuntoId) {
        throw conflito('Aluno já possui conjunto de recuperação vigente neste semestre.');
      }
      reservasNovas.set(chave, alunoId);
    }

    const remover = [];
    for (const [alunoId, chave] of chavesAntigas) {
      if (chavesNovas.get(alunoId) === chave) continue;
      const lock = await tx.get(refLock(professorId, chave));
      if (lock.exists() && lock.data().conjuntoId === conjuntoId) remover.push(chave);
    }

    atualizado = normalizar({
      ...conjunto,
      id: conjuntoId,
      versao: atual.versao + 1,
      criadoEm: atual.criadoEm,
      atualizadoEm: serverTimestamp(),
    });
    tx.set(ref, atualizado, { merge: true });
    for (const chave of remover) tx.delete(refLock(professorId, chave));
    for (const [chave, alunoId] of reservasNovas) {
      tx.set(refLock(professorId, chave), {
        conjuntoId,
        turmaId: conjunto.turmaId,
        anoLetivo: conjunto.anoLetivo,
        semestre: conjunto.semestre,
        alunoId,
        versao: atualizado.versao,
      });
    }
  });

  return atualizado;
}

/**
 * Cancelamento idempotente. Cada reserva é lida antes das escritas e só é
 * apagada se ainda pertencer a este conjunto; repetir o cancelamento antigo
 * não pode derrubar a reserva de um conjunto novo para o mesmo aluno.
 */
export async function cancelarConjuntoRecuperacao(professorId, conjuntoId) {
  if (!professorId || !conjuntoId) throw new Error('Conjunto de recuperação inválido.');
  const ref = doc(db, 'professores', professorId, 'conjuntos_recuperacao', conjuntoId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().professorId !== professorId) {
      throw new Error('Conjunto de recuperação não encontrado.');
    }
    const atual = normalizar({ ...snap.data(), id: conjuntoId });
    if (atual.estado === 'cancelado') return;

    const remover = [];
    for (const alunoId of atual.destinatariosIds) {
      const chave = chaveLock(atual, alunoId);
      const lock = await tx.get(refLock(professorId, chave));
      if (lock.exists() && lock.data().conjuntoId === conjuntoId) remover.push(chave);
    }

    tx.set(ref, {
      estado: 'cancelado',
      versao: atual.versao + 1,
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
    for (const chave of remover) tx.delete(refLock(professorId, chave));
  });
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

export const _interno = { chaveLock, refLock };
