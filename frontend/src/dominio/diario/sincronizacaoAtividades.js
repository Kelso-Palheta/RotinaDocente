import { ehAtividadeRecuperacao } from '@/dominio/atividades/recuperacaoSemestral';

/** Escopo explícito; chamadas legadas por turma continuam suportadas. */
export function normalizarEscopoSincronizacao(valor = null) {
  if (valor === null || valor === undefined) return {};
  const source = typeof valor === 'string' ? { turmaId: valor } : valor;
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Escopo de sincronização inválido.');
  const escopo = {};
  for (const campo of ['turmaId', 'atividadeId', 'alunoId']) {
    if (source[campo] !== undefined && source[campo] !== null) {
      if (typeof source[campo] !== 'string' || !source[campo].trim()) throw new Error(`Filtro ${campo} inválido.`);
      escopo[campo] = source[campo].trim();
    }
  }
  if (source.bimestre !== undefined && source.bimestre !== null) {
    if (!['1', '2', '3', '4'].includes(String(source.bimestre))) throw new Error('Filtro de bimestre inválido.');
    escopo.bimestre = String(source.bimestre);
  }
  return escopo;
}

export function atividadeNoEscopo(atividade, escopo = {}) {
  return (!escopo.turmaId || atividade.turmaIds?.includes(escopo.turmaId))
    && (!escopo.bimestre || String(atividade.bimestre) === String(escopo.bimestre))
    && (!escopo.atividadeId || atividade.id === escopo.atividadeId);
}

/**
 * Recuperação semestral nunca entra na sincronização regular, inclusive na
 * global. A exclusão é explícita para não depender de bimestre ausente.
 */
export function atividadesSincronizaveis(atividades = []) {
  return (atividades || []).filter(atividade => !ehAtividadeRecuperacao(atividade));
}

export function entregaNoEscopo(entrega, escopo = {}) {
  return (!escopo.turmaId || entrega.turmaId === escopo.turmaId)
    && (!escopo.bimestre || entrega.bimestre == null || String(entrega.bimestre) === String(escopo.bimestre))
    && (!escopo.alunoId || entrega.alunoId === escopo.alunoId);
}

/** Não modifica o estado de entrada; cada entrega pertence a uma única turma. */
export function aplicarSincronizacaoAtividades({ turmas, atividades, entregas, escopo: filtro }) {
  const escopo = normalizarEscopoSincronizacao(filtro);
  let atualizadas = turmas;
  let sincronizadas = 0;
  const alteracoes = [];
  for (const atividade of atividadesSincronizaveis(atividades.filter(atv => atividadeNoEscopo(atv, escopo)))) {
    const bimestre = String(atividade.bimestre);
    if (!['1', '2', '3', '4'].includes(bimestre)) continue;
    for (const entrega of entregas) {
      if (entrega.activityId !== atividade.id || !entregaNoEscopo(entrega, escopo)) continue;
      if (!['corrigido', 'revisado'].includes(entrega.status)) continue;
      if (entrega.bimestre != null && String(entrega.bimestre) !== bimestre) continue;
      if (!entrega.turmaId || !atividade.turmaIds?.includes(entrega.turmaId)) continue;
      const nota = entrega.notaRevisada ?? entrega.notaFinal;
      if (typeof nota !== 'number' || !Number.isFinite(nota) || nota < 0) continue;
      const tIdx = atualizadas.findIndex(turma => turma.id === entrega.turmaId);
      const turma = atualizadas[tIdx];
      if (!turma?.alunos?.some(aluno => aluno.id === entrega.alunoId)) continue;
      const bData = turma.bimestres?.[bimestre] || { atividades: [], notas: {} };
      const atvs = bData.atividades || [];
      const porId = atvs.find(atv => atv.id === (atividade.atvIdNoMapa || atividade.id)) || atvs.find(atv => atv.id === atividade.id);
      const porTitulo = atvs.filter(atv => atv.nome?.trim().toLowerCase() === atividade.titulo?.trim().toLowerCase());
      if (!porId && porTitulo.length > 1) continue;
      const coluna = porId || porTitulo[0];
      const atvId = coluna?.id || atividade.atvIdNoMapa || atividade.id;
      const atividadesMapa = coluna ? atvs : [...atvs, { id: atvId, nome: atividade.titulo, max: atividade.notaMaxima ?? 2 }];
      const notas = { ...bData.notas, [entrega.alunoId]: { ...bData.notas?.[entrega.alunoId], [atvId]: nota } };
      const novoBimestre = { ...bData, atividades: atividadesMapa, notas };
      if (atualizadas === turmas) atualizadas = [...turmas];
      atualizadas[tIdx] = { ...turma, bimestres: { ...turma.bimestres, [bimestre]: novoBimestre } };
      sincronizadas++;
      alteracoes.push({ turmaId: turma.id, alunoId: entrega.alunoId, bimestre, atvId });
    }
  }
  return { turmas: atualizadas, sincronizadas, alteracoes };
}
