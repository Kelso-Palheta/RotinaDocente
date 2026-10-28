/**
 * Regras de recuperação semestral por atividades (RN-81).
 *
 * A recuperação vale 10 pontos no total. O professor distribui esse orçamento
 * entre uma ou várias atividades e as notas obtidas são somadas, sem média.
 * Todo cálculo trabalha em centésimos para não introduzir erro de ponto
 * flutuante; a conversão para decimal acontece somente no fim.
 *
 * Este módulo é puro: não conhece Firebase, tela nem persistência.
 */

export const CENTESIMOS_TOTAL = 1000;
export const FINALIDADE_RECUPERACAO = 'recuperacao_semestral';
export const FINALIDADE_REGULAR = 'regular';

const STATUS_CORRIGIDOS = ['corrigido', 'revisado'];

const pontos = centesimos => {
  const valor = centesimos / 100;
  return String(valor).replace('.', ',');
};

/** Converte um decimal válido de pontos em centésimos inteiros. */
export function paraCentesimos(valor) {
  if (valor === null || valor === undefined || typeof valor === 'boolean') {
    throw new Error('Valor inválido: informe um número de pontos.');
  }
  if (typeof valor === 'string' && !valor.trim()) {
    throw new Error('Valor inválido: informe um número de pontos.');
  }
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error('Valor inválido: informe um número de pontos finito e não negativo.');
  }
  const centesimos = numero * 100;
  // Arredondar esconderia 10,001 como 10,00. A escala é de centésimos exatos.
  if (Math.abs(centesimos - Math.round(centesimos)) > 1e-6) {
    throw new Error('Valor inválido: use no máximo duas casas decimais de pontos.');
  }
  return Math.round(centesimos);
}

/**
 * Valida a distribuição dos 10 pontos entre as atividades do conjunto.
 * Devolve o total e o saldo em centésimos; nunca reescala as parcelas.
 */
export function validarComposicao(parcelas = []) {
  const lista = Array.isArray(parcelas) ? parcelas : [];
  if (!lista.length) throw new Error('O conjunto precisa de ao menos uma atividade.');

  const ids = new Set();
  const normalizadas = [];
  let total = 0;

  for (const parcela of lista) {
    const atividadeId = typeof parcela?.atividadeId === 'string' ? parcela.atividadeId.trim() : '';
    if (!atividadeId) throw new Error('Atividade da recuperação sem identificação.');
    if (ids.has(atividadeId)) throw new Error(`Atividade repetida no conjunto de recuperação: ${atividadeId}.`);
    ids.add(atividadeId);

    const centesimos = paraCentesimos(parcela?.maximo);
    if (centesimos === 0) throw new Error('Cada atividade da recuperação precisa ter máximo maior que zero.');

    total += centesimos;
    normalizadas.push({ atividadeId, centesimos, maximo: centesimos / 100 });
  }

  if (total > CENTESIMOS_TOTAL) {
    throw new Error(`${pontos(total)} pontos excede o limite de 10 pontos da recuperação semestral.`);
  }

  return {
    parcelas: normalizadas,
    total,
    restante: CENTESIMOS_TOTAL - total,
    completo: total === CENTESIMOS_TOTAL,
  };
}

/**
 * Valida a inclusão/edição de uma parcela contra as demais já gravadas.
 * `substituirId` evita contar duas vezes a atividade que está sendo editada.
 */
export function validarNovaParcelaRecuperacao({ parcelasExistentes = [], novaParcela, substituirId } = {}) {
  if (!novaParcela?.atividadeId) throw new Error('Atividade da recuperação sem identificação.');
  const mantidas = (parcelasExistentes || [])
    .filter(parcela => (parcela.atividadeId || parcela.id) !== substituirId)
    .map(parcela => ({
      atividadeId: parcela.atividadeId || parcela.id,
      maximo: parcela.maximo ?? parcela.notaMaxima,
    }));
  return validarComposicao([...mantidas, { atividadeId: novaParcela.atividadeId, maximo: novaParcela.maximo }]);
}

const notaDaEntrega = entrega => {  // Revisão inválida não pode cair silenciosamente para a nota antiga.
  const bruta = entrega?.notaRevisada ?? entrega?.notaFinal;
  return paraCentesimos(bruta);
};

/**
 * Ano letivo canônico da turma. `null` significa turma legada: o conjunto
 * precisa declarar isso explicitamente e nunca herdar o ano do relógio.
 */
export function anoLetivoDaTurma(turma = {}) {
  const ano = Number(turma?.anoLetivo ?? turma?.ano);
  return Number.isInteger(ano) && ano >= 1900 && ano <= 2200 ? ano : null;
}

/**
 * Calcula a nota de recuperação de um aluno somando as parcelas corrigidas.
 * Ausência de entrega ou de correção vira pendência — nunca zero inventado.
 * Quando o contexto é informado, entrega de outra turma/conjunto/semestre
 * não é aceita como se fosse deste conjunto.
 */
export function calcularRecuperacaoAluno({ alunoId, parcelas = [], entregas = [], contexto } = {}) {
  if (!alunoId) throw new Error('Aluno da recuperação não informado.');
  const composicao = validarComposicao(parcelas);
  const pendencias = [];
  const detalhes = [];
  let totalCentesimos = 0;

  for (const parcela of composicao.parcelas) {
    const doAluno = (entregas || []).filter(
      entrega => entrega?.activityId === parcela.atividadeId && entrega?.alunoId === alunoId
    );

    if (contexto) {
      const foraDoContexto = doAluno.find(entrega => {
        const turmaDiferente = contexto.turmaId != null && entrega?.turmaId != null && entrega.turmaId !== contexto.turmaId;
        const conjuntoDiferente = contexto.conjuntoId != null && entrega?.conjuntoRecuperacaoId != null
          && entrega.conjuntoRecuperacaoId !== contexto.conjuntoId;
        const semestreDiferente = contexto.semestre != null && entrega?.semestre != null
          && String(entrega.semestre) !== String(contexto.semestre);
        return turmaDiferente || conjuntoDiferente || semestreDiferente;
      });
      if (foraDoContexto) {
        pendencias.push({ atividadeId: parcela.atividadeId, motivo: 'entrega_fora_do_contexto' });
        continue;
      }
    }

    const candidatas = doAluno;

    if (!candidatas.length) {
      pendencias.push({ atividadeId: parcela.atividadeId, motivo: 'sem_entrega' });
      continue;
    }
    if (candidatas.length > 1) {
      pendencias.push({ atividadeId: parcela.atividadeId, motivo: 'entrega_duplicada' });
      continue;
    }

    const entrega = candidatas[0];
    if (!STATUS_CORRIGIDOS.includes(entrega.status)) {
      pendencias.push({ atividadeId: parcela.atividadeId, motivo: 'nao_corrigida' });
      continue;
    }

    let centesimos;
    try {
      centesimos = notaDaEntrega(entrega);
    } catch {
      pendencias.push({ atividadeId: parcela.atividadeId, motivo: 'nota_invalida' });
      continue;
    }

    if (centesimos > parcela.centesimos) {
      pendencias.push({ atividadeId: parcela.atividadeId, motivo: 'nota_acima_do_maximo' });
      continue;
    }

    totalCentesimos += centesimos;
    detalhes.push({
      atividadeId: parcela.atividadeId,
      entregaId: entrega.id ?? null,
      centesimos,
      nota: centesimos / 100,
      status: entrega.status,
      notaRevisada: entrega.notaRevisada ?? null,
      notaFinal: entrega.notaFinal ?? null,
    });
  }

  return {
    alunoId,
    totalCentesimos,
    total: totalCentesimos / 100,
    completo: composicao.completo && pendencias.length === 0,
    pendencias,
    parcelas: detalhes,
    composicao,
  };
}

const exigirTexto = (valor, mensagem) => {
  if (typeof valor !== 'string' || !valor.trim()) throw new Error(mensagem);
  return valor.trim();
};

/**
 * Valida o contexto do conjunto: uma turma, um ano letivo explícito, um
 * semestre e os destinatários por ID. Não cria bimestre nem converte ano.
 */
export function validarConjunto(conjunto = {}) {
  const professorId = exigirTexto(conjunto.professorId, 'Professor responsável pelo conjunto é obrigatório.');
  const turmaId = exigirTexto(conjunto.turmaId, 'Turma do conjunto de recuperação é obrigatória.');
  const anoLetivo = exigirTexto(conjunto.anoLetivo, 'Ano letivo explícito é obrigatório no conjunto de recuperação.');
  if (anoLetivo !== 'legado') {
    const ano = Number(anoLetivo);
    if (!Number.isInteger(ano) || ano < 1900 || ano > 2200) {
      throw new Error('Ano letivo do conjunto deve ser um ano válido ou "legado" para turmas sem ano.');
    }
  }

  const semestreBruto = conjunto.semestre;
  const semestre = String(semestreBruto ?? '').trim();
  if (!['1', '2'].includes(semestre)) {
    throw new Error('Semestre da recuperação deve ser 1 ou 2.');
  }

  const destinatariosBrutos = Array.isArray(conjunto.destinatariosIds) ? conjunto.destinatariosIds : [];
  const destinatariosIds = [];
  for (const id of destinatariosBrutos) {
    const alunoId = typeof id === 'string' ? id.trim() : '';
    if (!alunoId) throw new Error('Destinatário inválido: informe o aluno por ID.');
    if (!destinatariosIds.includes(alunoId)) destinatariosIds.push(alunoId);
  }
  if (!destinatariosIds.length) throw new Error('Selecione ao menos um aluno para a recuperação.');

  const atividadeIds = Array.isArray(conjunto.atividadeIds)
    ? conjunto.atividadeIds.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim())
    : [];

  return {
    ...conjunto,
    professorId,
    turmaId,
    anoLetivo,
    semestre,
    destinatariosIds,
    atividadeIds,
    estado: conjunto.estado || 'rascunho',
    versao: Number.isInteger(conjunto.versao) && conjunto.versao > 0 ? conjunto.versao : 1,
  };
}

/** Atividade sem finalidade declarada continua regular (compatibilidade). */
export function finalidadeDaAtividade(atividade = {}) {
  return atividade?.finalidade === FINALIDADE_RECUPERACAO ? FINALIDADE_RECUPERACAO : FINALIDADE_REGULAR;
}

export function ehAtividadeRecuperacao(atividade) {
  return finalidadeDaAtividade(atividade) === FINALIDADE_RECUPERACAO;
}

/** Estrutura mínima de uma atividade de recuperação já gravada. */
export function eAtividadeRecuperacaoValida(atividade) {
  return ehAtividadeRecuperacao(atividade)
    && typeof atividade?.conjuntoRecuperacaoId === 'string'
    && atividade.conjuntoRecuperacaoId.length > 0
    && ['1', '2'].includes(String(atividade?.semestre));
}
