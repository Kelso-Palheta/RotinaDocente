import { calcularRecuperacaoAluno } from '@/dominio/atividades/recuperacaoSemestral';

/** 1º semestre usa rec1; 2º semestre usa rec2. */
export function campoDoSemestre(semestre) {
  return String(semestre) === '2' ? 'rec2' : 'rec1';
}

export function chaveLancamentoRecuperacao({ conjuntoId, versao, alunoId, semestre, totalCentesimos }) {
  return [conjuntoId, versao, alunoId, String(semestre), totalCentesimos].join(':');
}

/**
 * Prévia pura: não grava nada. Mostra o total por aluno, pendências, nota
 * atual e se a gravação substituiria uma recuperação manual diferente.
 */
export function prepararLancamentoRecuperacao({ turmas = [], conjunto, atividades = [], entregas = [], destinatarios } = {}) {
  if (!conjunto?.id) throw new Error('Conjunto de recuperação inválido.');
  const semestre = String(conjunto.semestre);
  const campo = campoDoSemestre(semestre);
  const turma = turmas.find(t => t.id === conjunto.turmaId);
  if (!turma) throw new Error('Turma do conjunto de recuperação não encontrada.');

  const parcelas = atividades.map(atividade => ({ atividadeId: atividade.id, maximo: atividade.notaMaxima }));
  const alunosDaTurma = new Map((turma.alunos || []).map(aluno => [aluno.id, aluno]));
  const ids = (destinatarios || conjunto.destinatariosIds || []).filter(id => alunosDaTurma.has(id));

  const alunos = ids.map(alunoId => {
    const resultado = calcularRecuperacaoAluno({ alunoId, parcelas, entregas });
    const atual = turma.recuperacao?.[alunoId]?.[campo];
    const notaAtual = typeof atual === 'number' && Number.isFinite(atual) ? atual : null;
    const anterior = turma.recuperacaoLancamentos?.[alunoId]?.[campo] || null;
    const chave = chaveLancamentoRecuperacao({
      conjuntoId: conjunto.id,
      versao: conjunto.versao || 1,
      alunoId,
      semestre,
      totalCentesimos: resultado.totalCentesimos,
    });
    return {
      ...resultado,
      nome: alunosDaTurma.get(alunoId)?.nome || '',
      notaAtual,
      anterior,
      chave,
      substitui: notaAtual != null && Math.abs(Math.round(notaAtual * 100) - resultado.totalCentesimos) > 0,
      repetido: anterior?.chave === chave,
    };
  });

  return {
    conjuntoId: conjunto.id,
    turmaId: conjunto.turmaId,
    semestre,
    campo,
    versao: Number(conjunto.versao || 1),
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
    const lancamentos = {
      ...(turma.recuperacaoLancamentos || {}),
      [aluno.alunoId]: {
        ...(turma.recuperacaoLancamentos?.[aluno.alunoId] || {}),
        [previa.campo]: {
          conjuntoId: previa.conjuntoId,
          versao: previa.versao,
          semestre: previa.semestre,
          chave: aluno.chave,
          total: aluno.total,
          parcelas: aluno.parcelas.map(parcela => ({ atividadeId: parcela.atividadeId, nota: parcela.nota })),
          anterior: aluno.notaAtual,
          em,
          por,
        },
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
