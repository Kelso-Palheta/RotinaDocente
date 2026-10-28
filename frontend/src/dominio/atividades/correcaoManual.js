const round2 = value => Math.round(value * 100) / 100;
const texto = value => typeof value === 'string' ? value.trim() : '';

/**
 * Rótulo do período pedagógico de uma atividade. Recuperação não tem
 * bimestre: expor "undefinedº bimestre" no boletim ou no PDF é um erro.
 */
export function rotuloPeriodo(atividade = {}) {
  if (atividade.finalidade === 'recuperacao_semestral') {
    const semestre = String(atividade.semestre ?? '').trim();
    return ['1', '2'].includes(semestre) ? `${semestre}º semestre` : 'Recuperação semestral';
  }
  const bimestre = Number(atividade.bimestre);
  return Number.isInteger(bimestre) && bimestre >= 1 && bimestre <= 4
    ? `${bimestre}º bimestre`
    : 'Período não informado';
}

function validarNota(value, max) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(?:[.,]\d+)?$/.test(value.trim()))) throw new Error('Informe uma nota válida.');
  const n = typeof value === 'number' ? value : Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > max) throw new Error(`Nota deve estar entre 0 e ${max}.`);
  return round2(n);
}

export function registrarCorrecaoAnterior(entrega) {
  return {
    nota: entrega.notaRevisada ?? entrega.notaFinal ?? null,
    tipoCorrecao: entrega.tipoCorrecao || (entrega.status === 'revisado' ? 'manual' : 'ia'),
    feedback: texto(entrega.feedback),
    resultados: entrega.resultados || {},
  };
}

export function prepararCorrecaoManual(atividade, entrega, dados, professorId) {
  const questoes = atividade.questoes || [];
  const max = Number(atividade.notaMaxima ?? (questoes.length ? questoes.reduce((s, q) => s + Number(q.notaMaxima || 0), 0) : 10));
  if (!Number.isFinite(max) || max < 0) throw new Error('Nota máxima da atividade inválida.');
  const resultados = {};
  let nota;
  const feedbackGeral = texto(dados.feedback);
  if (questoes.length) {
    for (const q of questoes) {
      const entrada = dados.resultados?.[q.id] || {};
      const notaMaxima = Number(q.notaMaxima ?? 0);
      if (!Number.isFinite(notaMaxima) || notaMaxima < 0) throw new Error('Nota máxima da questão inválida.');
      const notaObtida = validarNota(entrada.nota, notaMaxima);
      const feedback = texto(entrada.feedback);
      if (!feedback) throw new Error('Informe o feedback de cada questão.');
      resultados[q.id] = { notaObtida, notaMaxima, feedback, criterios: [], ...(q.tipo === 'objetiva' ? { correto: notaObtida === notaMaxima } : {}) };
    }
    nota = round2(Object.values(resultados).reduce((s, r) => s + r.notaObtida, 0));
    if (nota > max) throw new Error('A soma das notas excede a nota máxima da atividade.');
  } else {
    nota = validarNota(dados.nota, max);
    if (!feedbackGeral) throw new Error('Informe o feedback da atividade.');
  }
  const feedback = feedbackGeral || questoes.map((q, i) => `Questão ${i + 1}: ${resultados[q.id].feedback}`).join('\n\n');
  return {
    tipoCorrecao: 'manual', status: 'revisado', notaFinal: nota, notaRevisada: nota,
    notaAnteriorRevisao: entrega.notaRevisada ?? entrega.notaFinal ?? null,
    revisadaPorId: professorId || null, feedback, feedbackGeral,
    resultados, penalidadePlagio: false, correcaoAnterior: registrarCorrecaoAnterior(entrega),
  };
}

/** Seleciona somente campos pedagógicos da entrega pertencente ao aluno/turma/professor. */
export function montarHistoricoFeedback({ atividades = [], entregas = [], alunoId, turmaId, professorId }) {
  if (!alunoId || !turmaId || !professorId) return [];
  const mapa = new Map(atividades.filter(a => a.professorId === professorId && a.turmaIds?.includes(turmaId)).map(a => [a.id, a]));
  return entregas.flatMap(entrega => {
    const atividade = mapa.get(entrega.activityId);
    if (!atividade || entrega.alunoId !== alunoId || entrega.turmaId !== turmaId) return [];
    if (entrega.professorId && entrega.professorId !== professorId) return [];
    if (!['corrigido', 'revisado'].includes(entrega.status)) return [];
    if (entrega.bimestre != null && String(entrega.bimestre) !== String(atividade.bimestre)) return [];
    const questoes = (atividade.questoes || []).map((q, index) => {
      const resultado = entrega.resultados?.[q.id];
      if (!resultado) return null;
      return {
        numero: index + 1, enunciado: texto(q.enunciado), resposta: texto(entrega.respostas?.[q.id]?.resposta),
        nota: resultado.notaObtida ?? null, notaMaxima: resultado.notaMaxima ?? q.notaMaxima ?? null,
        feedback: texto(resultado.feedback),
      };
    }).filter(Boolean);
    return [{
      atividadeId: atividade.id, titulo: texto(atividade.titulo), bimestre: atividade.bimestre,
      finalidade: atividade.finalidade === 'recuperacao_semestral' ? 'recuperacao_semestral' : 'regular',
      semestre: atividade.finalidade === 'recuperacao_semestral' ? String(atividade.semestre ?? '') : null,
      periodo: rotuloPeriodo(atividade),
      nota: entrega.notaRevisada ?? entrega.notaFinal ?? null, notaMaxima: atividade.notaMaxima ?? 10,
      tipoCorrecao: entrega.tipoCorrecao || (entrega.status === 'revisado' ? 'manual' : 'ia'),
      feedback: texto(entrega.feedbackGeral) || texto(entrega.feedback), resposta: texto(entrega.respostaTexto), questoes,
    }];
  }).sort((a, b) => {
    const chave = item => item.finalidade === 'recuperacao_semestral'
      ? 10 + Number(item.semestre || 0)
      : Number(item.bimestre) || 0;
    return chave(a) - chave(b) || a.titulo.localeCompare(b.titulo, 'pt-BR');
  });
}
