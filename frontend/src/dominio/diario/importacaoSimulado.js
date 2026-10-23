const normalizarNome = nome => typeof nome === 'string'
  ? nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()
  : '';

const vazio = valor => valor === undefined || valor === null || valor === '';

export function notaMaximaSimulado(turma, bimestre) {
  const max = Number(turma.bimestres?.[String(bimestre)]?.config?.simuladoMaxLanca ?? 5);
  return Number.isFinite(max) && max > 0 ? max : 5;
}

function lerNota(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== 'string' || !/^\d+(?:[.,]\d+)?$/.test(valor.trim())) return null;
  const n = Number(valor.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Correspondência somente por nome completo normalizado; nenhuma inferência por similaridade. */
export function prepararImportacaoSimulado(registros, turma, bimestre) {
  const nomes = new Map();
  for (const aluno of turma.alunos || []) {
    const nome = normalizarNome(aluno.nome);
    if (!nomes.has(nome)) nomes.set(nome, []);
    nomes.get(nome).push(aluno);
  }
  const repeticoes = new Map();
  for (const registro of registros) {
    const nome = normalizarNome(registro.nome);
    repeticoes.set(nome, (repeticoes.get(nome) || 0) + 1);
  }
  const max = notaMaximaSimulado(turma, bimestre);
  const notas = turma.bimestres?.[String(bimestre)]?.notas || {};
  return registros.map(registro => {
    const nome = normalizarNome(registro.nome);
    const encontrados = nomes.get(nome) || [];
    const aluno = encontrados.length === 1 ? encontrados[0] : null;
    const nota = lerNota(registro.nota);
    const notaAtual = aluno ? notas[aluno.id]?.simulado : undefined;
    let situacao = 'pronto';
    if (!nome || encontrados.length === 0) situacao = 'nao_encontrado';
    else if (encontrados.length > 1) situacao = 'ambiguo';
    else if (repeticoes.get(nome) > 1) situacao = 'duplicado';
    else if (nota === null) situacao = 'nota_invalida';
    else if (nota < 0 || nota > max) situacao = 'fora_da_escala';
    else if (!vazio(notaAtual)) situacao = 'nota_existente';
    return { nome: registro.nome, alunoId: aluno?.id ?? null, alunoNome: aluno?.nome ?? null, nota, notaAtual, situacao };
  });
}

/** Revalida o estado corrente e aplica somente notas ausentes, em atualização imutável única. */
export function aplicarImportacaoSimulado(turmas, turmaId, bimestre, registros) {
  if (!['1', '2', '3', '4'].includes(String(bimestre))) return turmas;
  const index = turmas.findIndex(turma => turma.id === turmaId);
  const turma = turmas[index];
  const bData = turma?.bimestres?.[String(bimestre)];
  if (!bData) return turmas;
  const prontas = prepararImportacaoSimulado(registros, turma, bimestre).filter(linha => linha.situacao === 'pronto');
  if (!prontas.length) return turmas;
  const notas = { ...(bData.notas || {}) };
  for (const linha of prontas) {
    notas[linha.alunoId] = { ...notas[linha.alunoId], simulado: Math.round(linha.nota * 100) / 100 };
  }
  const next = [...turmas];
  next[index] = { ...turma, bimestres: { ...turma.bimestres, [String(bimestre)]: { ...bData, notas } } };
  return next;
}
