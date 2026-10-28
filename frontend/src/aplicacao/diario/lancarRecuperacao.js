import {
  anoLetivoDaTurma,
  calcularRecuperacaoAluno,
  validarComposicao,
  validarConjunto,
} from '@/dominio/atividades/recuperacaoSemestral';

/** 1º semestre usa rec1; 2º semestre usa rec2. Semestre inválido é recusado. */
export function campoDoSemestre(semestre) {
  const valor = String(semestre ?? '').trim();
  if (!['1', '2'].includes(valor)) {
    throw new Error('Semestre da recuperação deve ser 1 ou 2.');
  }
  return valor === '2' ? 'rec2' : 'rec1';
}

export function chaveLancamentoRecuperacao({ conjuntoId, versao, alunoId, semestre, totalCentesimos }) {
  return [conjuntoId, versao, alunoId, String(semestre), totalCentesimos].join(':');
}

const centesimosDaNota = nota => (
  typeof nota === 'number' && Number.isFinite(nota) ? Math.round(nota * 100) : null
);

/**
 * Impressão digital do que o professor conferiu. Alteração de parcela,
 * máximo, entrega, status ou nota invalida a prévia mesmo quando o total
 * final continua igual.
 */
function snapshotAluno(resultado) {
  return JSON.stringify({
    alunoId: resultado.alunoId,
    totalCentesimos: resultado.totalCentesimos,
    completo: resultado.completo,
    pendencias: resultado.pendencias.map(parcela => `${parcela.atividadeId}:${parcela.motivo}`),
    parcelas: resultado.parcelas.map(parcela => ({
      atividadeId: parcela.atividadeId,
      centesimos: parcela.centesimos,
      status: parcela.status ?? null,
      notaRevisada: parcela.notaRevisada ?? null,
      notaFinal: parcela.notaFinal ?? null,
    })),
  });
}

/**
 * Prévia pura: não grava nada. Mostra o total por aluno, pendências, nota
 * atual e se a gravação substituiria uma recuperação manual diferente.
 * A prévia carrega um snapshot integral para que o repositório recuse
 * qualquer mudança relevante desde a conferência.
 */
export function prepararLancamentoRecuperacao({ turmas = [], conjunto, atividades = [], entregas = [], destinatarios } = {}) {
  if (!conjunto?.id) throw new Error('Conjunto de recuperação inválido.');
  const normalizado = validarConjunto(conjunto);
  const semestre = normalizado.semestre;
  const campo = campoDoSemestre(semestre);

  const turma = turmas.find(t => t.id === normalizado.turmaId);
  if (!turma) throw new Error('Turma do conjunto de recuperação não encontrada.');

  const anoDaTurma = anoLetivoDaTurma(turma);
  if (anoDaTurma != null && String(normalizado.anoLetivo) !== String(anoDaTurma)) {
    throw new Error('O conjunto de recuperação pertence a outro ano letivo da turma.');
  }

  const alunosDaTurma = new Map((turma.alunos || []).map(aluno => [aluno.id, aluno]));

  const vistos = new Set();
  for (const atividade of atividades) {
    const id = typeof atividade?.id === 'string' ? atividade.id.trim() : '';
    if (!id) throw new Error('Atividade da recuperação sem identificação.');
    if (vistos.has(id)) throw new Error(`Atividade repetida no conjunto de recuperação: ${id}.`);
    vistos.add(id);
    if (atividade.conjuntoRecuperacaoId != null && atividade.conjuntoRecuperacaoId !== normalizado.id) {
      throw new Error('Atividade pertence a outro conjunto de recuperação.');
    }
    if (atividade.semestre != null && String(atividade.semestre) !== semestre) {
      throw new Error('Atividade pertence a outro semestre.');
    }
    if (Array.isArray(atividade.turmaIds) && !atividade.turmaIds.includes(normalizado.turmaId)) {
      throw new Error('Atividade pertence a outra turma.');
    }
  }

  const idsCanonicos = (normalizado.atividadeIds || []).map(id => String(id));
  if (idsCanonicos.length) {
    const canonica = [...new Set(idsCanonicos)].sort().join('|');
    const informada = [...vistos].sort().join('|');
    if (canonica !== informada) {
      throw new Error('A composição do conjunto mudou. Gere a prévia novamente.');
    }
  }

  const parcelas = atividades.map(atividade => ({ atividadeId: atividade.id, maximo: atividade.notaMaxima }));
  const composicao = validarComposicao(parcelas);
  if (!composicao.completo) {
    throw new Error('A distribuição da recuperação deve somar exatamente 10 pontos.');
  }

  const idsSolicitados = destinatarios === undefined ? normalizado.destinatariosIds : destinatarios;
  if (!Array.isArray(idsSolicitados) || !idsSolicitados.length) {
    throw new Error('Selecione ao menos um aluno para lançar a recuperação.');
  }
  const ids = [];
  for (const bruto of idsSolicitados) {
    const alunoId = typeof bruto === 'string' ? bruto.trim() : '';
    if (!alunoId) throw new Error('Destinatário inválido: informe o aluno por ID.');
    if (!normalizado.destinatariosIds.includes(alunoId)) {
      throw new Error('Destinatário fora do conjunto de recuperação.');
    }
    if (!alunosDaTurma.has(alunoId)) {
      throw new Error('Destinatário não pertence à turma do conjunto de recuperação.');
    }
    if (!ids.includes(alunoId)) ids.push(alunoId);
  }

  const contexto = {
    conjuntoId: normalizado.id,
    turmaId: normalizado.turmaId,
    anoLetivo: normalizado.anoLetivo,
    semestre,
    versao: normalizado.versao,
  };

  const alunos = ids.map(alunoId => {
    const resultado = calcularRecuperacaoAluno({
      alunoId,
      parcelas,
      entregas,
      contexto,
    });
    const atual = turma.recuperacao?.[alunoId]?.[campo];
    const notaAtual = typeof atual === 'number' && Number.isFinite(atual) ? atual : null;
    const anterior = turma.recuperacaoLancamentos?.[alunoId]?.[campo] || null;
    const chave = chaveLancamentoRecuperacao({
      conjuntoId: normalizado.id,
      versao: normalizado.versao,
      alunoId,
      semestre,
      totalCentesimos: resultado.totalCentesimos,
    });
    const notaAtualCentesimos = centesimosDaNota(notaAtual);
    return {
      ...resultado,
      nome: alunosDaTurma.get(alunoId)?.nome || '',
      notaAtual,
      anterior,
      chave,
      substitui: notaAtual != null && notaAtualCentesimos !== resultado.totalCentesimos,
      // Repetição só existe quando o lançamento anterior ainda corresponde ao
      // valor atual. Ajuste manual divergente volta a exigir decisão docente.
      repetido: anterior?.chave === chave && notaAtualCentesimos === resultado.totalCentesimos,
      snapshot: snapshotAluno(resultado),
    };
  });

  return {
    conjuntoId: normalizado.id,
    turmaId: normalizado.turmaId,
    contexto,
    snapshot: JSON.stringify({
      contexto,
      composicao: composicao.parcelas.map(parcela => ({
        atividadeId: parcela.atividadeId,
        centesimos: parcela.centesimos,
      })),
      destinatarios: [...ids].sort(),
    }),
    semestre,
    campo,
    versao: normalizado.versao,
    alunos,
    completos: alunos.filter(aluno => aluno.completo).length,
    pendentes: alunos.filter(aluno => !aluno.completo).length,
    substituicoes: alunos.filter(aluno => aluno.completo && aluno.substitui).length,
  };
}

/**
 * Aplica a prévia sobre uma cópia das turmas. Nunca toca bimestres, outros
 * alunos ou outros campos; substituição exige confirmação explícita e o
 * mesmo lançamento já gravado é tratado como repetição idempotente.
 * O histórico de lançamentos é cumulativo, sem sobrescrever eventos.
 */
export function aplicarLancamentoRecuperacao({
  turmas = [],
  previa,
  selecionados,
  confirmarSubstituicao = [],
  em = new Date().toISOString(),
  por = null,
} = {}) {
  if (!previa?.conjuntoId) throw new Error('Prévia de recuperação inválida.');
  // Lista vazia é seleção explícita de ninguém; só a ausência do argumento lança os completos.
  const escolhidos = new Set(
    Array.isArray(selecionados)
      ? selecionados
      : previa.alunos.filter(a => a.completo).map(a => a.alunoId)
  );
  const confirmados = new Set(confirmarSubstituicao);
  const lancados = [];
  const ignorados = [];
  let resultado = turmas;

  for (const aluno of previa.alunos) {
    if (!escolhidos.has(aluno.alunoId)) continue;
    if (!aluno.completo) { ignorados.push({ alunoId: aluno.alunoId, motivo: 'incompleto' }); continue; }
    if (aluno.repetido) { ignorados.push({ alunoId: aluno.alunoId, motivo: 'repetido' }); continue; }
    if (aluno.substitui && !confirmados.has(aluno.alunoId)) {
      ignorados.push({ alunoId: aluno.alunoId, motivo: 'substituicao_nao_confirmada' });
      continue;
    }

    const indice = resultado.findIndex(turma => turma.id === previa.turmaId);
    if (indice < 0) throw new Error('Turma do conjunto não encontrada ao lançar.');
    if (resultado === turmas) resultado = [...turmas];
    const turma = resultado[indice];
    const recuperacao = {
      ...(turma.recuperacao || {}),
      [aluno.alunoId]: {
        ...(turma.recuperacao?.[aluno.alunoId] || {}),
        [previa.campo]: aluno.total,
      },
    };

    const anterior = turma.recuperacaoLancamentos?.[aluno.alunoId]?.[previa.campo] || null;
    const { historico: historicoAnterior, ...registroAnterior } = anterior || {};
    const historico = [
      ...(Array.isArray(historicoAnterior) ? historicoAnterior : []),
      ...(anterior ? [registroAnterior] : []),
    ];
    const registro = {
      conjuntoId: previa.conjuntoId,
      versao: previa.versao,
      semestre: previa.semestre,
      chave: aluno.chave,
      total: aluno.total,
      parcelas: aluno.parcelas.map(parcela => ({ atividadeId: parcela.atividadeId, nota: parcela.nota })),
      anterior: aluno.notaAtual,
      em,
      por,
      ...(historico.length ? { historico } : {}),
    };
    const lancamentos = {
      ...(turma.recuperacaoLancamentos || {}),
      [aluno.alunoId]: {
        ...(turma.recuperacaoLancamentos?.[aluno.alunoId] || {}),
        [previa.campo]: registro,
      },
    };
    resultado[indice] = { ...turma, recuperacao, recuperacaoLancamentos: lancamentos };
    lancados.push({
      alunoId: aluno.alunoId,
      campo: previa.campo,
      total: aluno.total,
      totalCentesimos: aluno.totalCentesimos,
      anterior: aluno.notaAtual,
      chave: aluno.chave,
    });
  }

  return { turmas: resultado, lancados, ignorados };
}
