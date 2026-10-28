import { db } from './firebase';
import { aplicarSincronizacaoAtividades, atividadeNoEscopo, atividadesSincronizaveis, normalizarEscopoSincronizacao } from '@/dominio/diario/sincronizacaoAtividades';
import {
  ehAtividadeRecuperacao,
  finalidadeDaAtividade,
  validarNovaParcelaRecuperacao,
  FINALIDADE_RECUPERACAO,
} from '@/dominio/atividades/recuperacaoSemestral';
import {
  doc, collection, setDoc, getDoc, getDocs, deleteDoc,
  query, where, serverTimestamp, writeBatch, runTransaction
} from 'firebase/firestore';
import { gerarLoginAluno, gerarLoginKey, resolverLoginUnico } from '@/utils/diario/loginAluno';
import { criarTokenAtividade, chaveVinculoAtividade, decodeToken } from '@/utils/diario/tokenUtils';
import { conjuntoPossuiEntregas } from './firebase-recuperacao';

const limparAtividade = data => {
  const { alunosPorTurma: _alunos, conjuntoVersao: _versao, ...rest } = data;
  return JSON.parse(JSON.stringify(rest));
};
const dadosToken = (activityId, turmaId, aluno, anterior) => ({
  token: anterior?.token && decodeToken(anterior.token)?.segredo ? anterior.token : criarTokenAtividade(aluno.id, activityId, turmaId),
  nome: aluno.nome || '', turmaId, alunoId: aluno.id, revogado: false,
});
async function planejarTokens(activityId, alunosPorTurma, turmaIds, nova = false) {
  const snap = nova ? { docs: [] } : await getDocs(collection(db, 'atividades', activityId, 'tokens'));
  const existentes = new Map(snap.docs.map(d => [d.id, d.data()]));
  const operacoes = [];
  const desejados = new Set();
  for (const turmaId of turmaIds) {
    for (const aluno of alunosPorTurma[turmaId] || []) {
      const key = chaveVinculoAtividade(turmaId, aluno.id);
      desejados.add(key);
      operacoes.push({ ref: doc(db, 'atividades', activityId, 'tokens', key), data: dadosToken(activityId, turmaId, aluno, existentes.get(key)) });
    }
  }
  for (const [key, data] of existentes) {
    const continua = turmaIds.includes(data.turmaId) && (!Object.hasOwn(alunosPorTurma, data.turmaId) || alunosPorTurma[data.turmaId].some(a => a.id === data.alunoId));
    if (!desejados.has(key) && !continua && !data.revogado) operacoes.push({ ref: doc(db, 'atividades', activityId, 'tokens', key), data: { ...data, revogado: true } });
  }
  return operacoes;
}
async function gravarComTokens(id, data, alunosPorTurma, nova = false, extras = []) {
  const operacoes = alunosPorTurma ? await planejarTokens(id, alunosPorTurma, data.turmaIds || [], nova) : [];
  if (operacoes.length > 449) throw new Error('Muitos acessos em uma operação. Publique em grupos menores de turmas. Nenhum dado foi gravado.');
  const batch = writeBatch(db);
  const limpos = limparAtividade({ ...data, id });
  if (data.createdAt) limpos.createdAt = data.createdAt;
  batch.set(doc(db, 'atividades', id), { ...limpos, updatedAt: serverTimestamp() });
  for (const op of operacoes) batch.set(op.ref, op.data);
  for (const extra of extras) batch.set(extra.ref, extra.data, { merge: true });
  await batch.commit();
}

/**
 * Recuperação não pode ser criada/editada fora do conjunto, com bimestre
 * falso, outra turma/semestre ou distribuição acima de 10 pontos.
 *
 * Composição, escala e versão têm autoridade transacional. A lista persistida
 * no conjunto é a fonte da composição; as atividades irmãs são lidas dentro
 * da mesma transação para validar o orçamento. O congelamento é compartilhado
 * com a entrega: a rota grava `congelado: true` no conjunto na transação de
 * entrega e esta escrita lê o mesmo documento, então Firestore faz uma das
 * ordens vencer e a outra repetir já vendo o marcador.
 */
const MENSAGEM_CONGELAMENTO = 'A recuperação já possui entregas. A composição e a escala ficam congeladas; crie outro conjunto para mudar a distribuição.';

const erroConjuntoObsoleto = () => Object.assign(
  new Error('A composição da recuperação mudou. Reabra o conjunto e tente novamente.'),
  { code: 'RECUPERACAO_CONJUNTO_OBSOLETO' },
);

function validarCabecalhoRecuperacao(data) {
  if (!data.conjuntoRecuperacaoId) throw new Error('Conjunto de recuperação obrigatório.');
  if (!['1', '2'].includes(String(data.semestre))) throw new Error('Semestre da recuperação inválido.');
  if (data.bimestre != null) throw new Error('Atividade de recuperação não usa bimestre.');
  if ((data.turmaIds || []).length !== 1) throw new Error('Atividade de recuperação pertence a uma única turma.');
  return {
    professorId: data.professorId,
    turmaId: data.turmaIds[0],
    conjuntoId: data.conjuntoRecuperacaoId,
  };
}

function idsDaComposicao(conjunto, conhecidos = []) {
  const escalas = conjunto.escalas && typeof conjunto.escalas === 'object' ? conjunto.escalas : {};
  return [...new Set([
    ...(Array.isArray(conjunto.atividadeIds) ? conjunto.atividadeIds : []),
    ...Object.keys(escalas),
    ...conhecidos,
  ].map(String))];
}

/**
 * Pistas de atividades ligadas ao conjunto. A lista do conjunto é a fonte
 * transacional; esta consulta só recupera parcelas antigas que ainda não
 * estejam nela. Cada documento é reconferido dentro da transação.
 */
async function idsConhecidosDoConjunto(professorId, conjuntoId) {
  const snap = await getDocs(query(collection(db, 'atividades'), where('professorId', '==', professorId)));
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id }))
    .filter(atv => atv.conjuntoRecuperacaoId === conjuntoId && ehAtividadeRecuperacao(atv))
    .map(atv => atv.id);
}

async function gravarAtividadeRecuperacao(id, data, anterior = null) {
  const { professorId, turmaId, conjuntoId } = validarCabecalhoRecuperacao(data);

  const operacoes = data.alunosPorTurma
    ? await planejarTokens(id, data.alunosPorTurma, data.turmaIds || [], !anterior)
    : [];
  if (operacoes.length > 449) throw new Error('Muitos acessos em uma operação. Publique em grupos menores de turmas. Nenhum dado foi gravado.');

  const conjuntoRef = doc(db, 'professores', professorId, 'conjuntos_recuperacao', conjuntoId);
  const conjuntoAntes = await getDoc(conjuntoRef);
  if (!conjuntoAntes.exists()) throw new Error('Conjunto de recuperação não encontrado.');
  const antes = conjuntoAntes.data();
  const entregasLegado = await conjuntoPossuiEntregas(professorId, conjuntoId, [
    ...new Set([
      ...(Array.isArray(antes.atividadeIds) ? antes.atividadeIds : []),
      ...Object.keys(antes.escalas || {}),
    ]),
  ]);
  const conhecidos = await idsConhecidosDoConjunto(professorId, conjuntoId);
  const limpos = limparAtividade({ ...data, id });

  await runTransaction(db, async (tx) => {
    const conjuntoSnap = await tx.get(conjuntoRef);
    if (!conjuntoSnap.exists()) throw new Error('Conjunto de recuperação não encontrado.');
    const conjunto = conjuntoSnap.data();
    if (conjunto.professorId !== professorId
      || conjunto.turmaId !== turmaId
      || String(conjunto.semestre) !== String(data.semestre)
      || conjunto.estado === 'cancelado') {
      throw new Error('Atividade não pertence a este conjunto, turma ou semestre.');
    }
    if (!Array.isArray(conjunto.destinatariosIds) || !conjunto.destinatariosIds.length) {
      throw new Error('Conjunto de recuperação sem destinatários.');
    }

    // A versão persistida é a autoridade: uma tela antiga não grava por cima
    // de outra edição nem de uma entrega que acabou de congelar o conjunto.
    if (data.conjuntoVersao != null && Number(data.conjuntoVersao) !== Number(conjunto.versao || 1)) {
      throw erroConjuntoObsoleto();
    }

    const destinatarios = Array.isArray(data.destinatariosIds) ? data.destinatariosIds : conjunto.destinatariosIds;
    if (!destinatarios?.length || destinatarios.some(alunoId => !conjunto.destinatariosIds.includes(alunoId))) {
      throw new Error('Destinatário fora do conjunto de recuperação.');
    }

    const escalas = conjunto.escalas && typeof conjunto.escalas === 'object' ? conjunto.escalas : {};
    if (anterior && escalas[id] != null && Number(escalas[id]) !== Number(anterior.notaMaxima)) {
      throw erroConjuntoObsoleto();
    }

    const idsComposicao = idsDaComposicao(conjunto, conhecidos);
    const parcelas = [];
    for (const irmaoId of idsComposicao) {
      if (irmaoId === String(id)) continue;
      const irmaoSnap = await tx.get(doc(db, 'atividades', irmaoId));
      if (irmaoSnap.exists()) {
        const irmao = { ...irmaoSnap.data(), id: irmaoId };
        if (irmao.professorId === professorId
          && irmao.conjuntoRecuperacaoId === conjuntoId
          && ehAtividadeRecuperacao(irmao)) {
          parcelas.push({ atividadeId: irmaoId, maximo: irmao.notaMaxima });
        }
        continue;
      }
      const escala = Number(escalas[irmaoId]);
      if (Number.isFinite(escala) && escala > 0) {
        parcelas.push({ atividadeId: irmaoId, maximo: escala });
      }
    }

    const composicao = validarNovaParcelaRecuperacao({
      parcelasExistentes: parcelas,
      novaParcela: { atividadeId: id, maximo: data.notaMaxima },
      substituirId: id,
    });

    const idsPersistidos = idsComposicao.filter(irmaoId => irmaoId !== String(id)).sort();
    const idsNovos = [...new Set([...parcelas.map(p => p.atividadeId), String(id)])].sort();
    const escalaMudou = Boolean(anterior) && Number(anterior.notaMaxima) !== Number(data.notaMaxima);
    const composicaoMudou = idsPersistidos.join('|') !== idsNovos.join('|') || escalaMudou;

    if (composicaoMudou && (conjunto.congelado === true || entregasLegado)) {
      throw new Error(MENSAGEM_CONGELAMENTO);
    }

    tx.set(doc(db, 'atividades', id), { ...limpos, updatedAt: serverTimestamp() });
    for (const operacao of operacoes) tx.set(operacao.ref, operacao.data);

    if (composicaoMudou) {
      const escalasNovas = {
        ...escalas,
        ...Object.fromEntries(parcelas.map(p => [p.atividadeId, Number(p.maximo)])),
        [id]: Number(data.notaMaxima),
      };
      tx.set(conjuntoRef, {
        atividadeIds: [...new Set([...parcelas.map(p => p.atividadeId), String(id)])],
        escalas: escalasNovas,
        estado: composicao.completo ? 'pronto' : 'rascunho',
        versao: Number(conjunto.versao || 1) + 1,
        atualizadoEm: serverTimestamp(),
      }, { merge: true });
    }
  });

  return id;
}

export async function createAtividade(data) {
  const id = data.id || `atv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const ref = doc(db, 'atividades', id);
  const atual = await getDoc(ref);
  if (atual.exists()) {
    const existente = atual.data();
    if (existente.professorId !== data.professorId) throw new Error('Atividade pertence a outra conta.');
    // Repetição após falha do mapa não cria outra atividade nem redefine publicação.
    if (existente.status === 'arquivada') throw new Error('Atividade arquivada. Reabra o editor para criar outra.');
    await updateAtividade(id, data);
    return id;
  }
  if (ehAtividadeRecuperacao(data)) {
    await gravarAtividadeRecuperacao(id, { ...data, createdAt: serverTimestamp() });
    return id;
  }
  await gravarComTokens(id, { ...data, createdAt: serverTimestamp() }, data.alunosPorTurma, true);
  return id;
}
export async function updateAtividade(id, data) {
  const ref = doc(db, 'atividades', id);
  const atual = await getDoc(ref);
  if (!atual.exists()) throw new Error('Atividade não encontrada.');
  const anterior = atual.data();
  if (data.finalidade !== undefined && finalidadeDaAtividade(data) !== finalidadeDaAtividade(anterior)) {
    throw new Error('A finalidade da atividade não pode ser alterada. Crie outra atividade.');
  }
  if (anterior.conjuntoRecuperacaoId && data.conjuntoRecuperacaoId !== undefined
    && data.conjuntoRecuperacaoId !== anterior.conjuntoRecuperacaoId) {
    throw new Error('A atividade de recuperação não pode mudar de conjunto. Crie outra atividade.');
  }
  const entregas = await getDocs(query(collection(db, 'entregas'), where('activityId', '==', id)));
  const campos = ['bimestre', 'turmaIds', 'questoes', 'notaMaxima', 'finalidade', 'conjuntoRecuperacaoId', 'semestre', 'destinatariosIds'];
  const estrutural = campos.some(k => data[k] !== undefined && JSON.stringify(data[k]) !== JSON.stringify(anterior[k]));
  if (estrutural && entregas.docs.length) throw new Error('Esta atividade já possui entregas. Preserve bimestre, turmas, questões e escala; crie outra atividade para mudar a estrutura.');
  if (estrutural && anterior.professorId) {
    const diario = await getDoc(doc(db, 'professores', anterior.professorId, 'turmas', 'data'));
    const temNotas = diario.exists() && diario.data().turmas?.some(t => Object.values(t.bimestres || {}).some(b => Object.values(b.notas || {}).some(n => n[id] != null || (anterior.atvIdNoMapa && n[anterior.atvIdNoMapa] != null))));
    if (temNotas) throw new Error('A atividade já tem notas no Diário. A estrutura e o bimestre foram preservados.');
  }
  const consolidada = { ...anterior, ...data, professorId: anterior.professorId };
  if (ehAtividadeRecuperacao(consolidada)) {
    await gravarAtividadeRecuperacao(id, consolidada, anterior);
    return;
  }
  await gravarComTokens(id, consolidada, data.alunosPorTurma, false);
}
/** Arquivar conserva entregas, devolutivas, acessos e notas históricas. */
export async function deleteAtividade(id) {
  await setDoc(doc(db, 'atividades', id), { status: 'arquivada', arquivadaEm: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
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
  if (alunos.length > 449) throw new Error('Turma excede o limite de acessos por operação.');
  const atuais = await getDocs(collection(db, 'atividades', activityId, 'tokens'));
  const mapa = new Map(atuais.docs.map(d => [d.id, d.data()]));
  const batch = writeBatch(db);
  for (const aluno of alunos) {
    const key = chaveVinculoAtividade(turmaId, aluno.id);
    batch.set(doc(db, 'atividades', activityId, 'tokens', key), dadosToken(activityId, turmaId, aluno, mapa.get(key)));
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
  for (const atv of atividades) {
    if (!atv.alunoExclusivoId || atv.alunoExclusivoId === aluno.id) await createTokensForAtividade(atv.id, turmaId, [aluno]);
  }
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
    if (professorId) constraints.push(where('professorId', '==', professorId));
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
  // Recuperação semestral fica fora da sincronização regular, inclusive global.
  const atividades = atividadesSincronizaveis(atvSnap.docs.map(d => ({ ...d.data(), id: d.id }))
    .filter(atv => atv.professorId === professorId && atividadeNoEscopo(atv, escopo)));
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
