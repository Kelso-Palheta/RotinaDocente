/** Projeções explícitas: campos futuros não se tornam públicos por acidente. */
const selecionar = (dados, campos) => Object.fromEntries(campos.filter(k => dados[k] !== undefined).map(k => [k, dados[k]]));
export function atividadePublica(dados) {
  const publica = selecionar(dados, ['id', 'professorId', 'turmaIds', 'status', 'titulo', 'descricao', 'disciplina', 'anoEscolar', 'bimestre', 'notaMaxima', 'dataEntrega', 'textoBase', 'textosBase', 'tipoAtividade']);
  publica.questoes = (dados.questoes || []).map(q => selecionar(q, ['id', 'numero', 'tipo', 'enunciado', 'notaMaxima', 'alternativas', 'imagens', 'textoApoio', 'scaffolding', 'apoioVisualDescricao']));
  if (!publica.questoes.length && dados.enunciado) publica.enunciado = dados.enunciado;
  return publica;
}
export function entregaPublica(dados) {
  return dados ? selecionar(dados, ['id', 'activityId', 'alunoId', 'turmaId', 'bimestre', 'respostas', 'respostaTexto', 'status', 'submittedAt', 'notaRevisada', 'notaFinal', 'notaOriginal', 'feedback', 'feedbackGeral', 'resultados', 'criterios', 'tipoCorrecao']) : null;
}
export function validarRespostasEntrega(atividade, entrada) {
  const questoes = atividade.questoes || [];
  if (!questoes.length) {
    if (typeof entrada.respostaTexto !== 'string' || !entrada.respostaTexto.trim() || entrada.respostaTexto.length > 20000) throw new Error('Resposta inválida.');
    return { respostaTexto: entrada.respostaTexto.trim() };
  }
  const respostas = entrada.respostas;
  if (!respostas || typeof respostas !== 'object' || Array.isArray(respostas) || Object.keys(respostas).some(id => !questoes.some(q => q.id === id))) throw new Error('Respostas inválidas.');
  const normalizadas = {};
  for (const q of questoes) {
    const valor = respostas[q.id]?.resposta;
    if (typeof valor !== 'string' || !valor.trim() || valor.length > 5000) throw new Error('Preencha todas as respostas.');
    if (['objetiva', 'multipla_escolha'].includes(q.tipo) && !q.alternativas?.some(a => a.id === valor && a.texto?.trim())) throw new Error('Alternativa inválida.');
    normalizadas[q.id] = { tipo: q.tipo, resposta: valor.trim() };
  }
  return { respostas: normalizadas };
}
