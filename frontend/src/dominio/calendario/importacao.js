/** Valida o conteúdo antes de exibi-lo para revisão e antes de persistir. */
export function validarConteudosImportados(topicos) {
  if (!Array.isArray(topicos) || !topicos.length) throw new Error('Nenhum conteúdo válido foi encontrado. Revise o texto e tente novamente.');
  return topicos.map((topico, index) => {
    const titulo = typeof topico?.titulo === 'string' ? topico.titulo.trim() : '';
    const descricao = typeof topico?.descricao === 'string' ? topico.descricao.trim() : '';
    const duracao = topico?.duracaoEstimadaAulas == null ? 1 : Number(topico.duracaoEstimadaAulas);
    if (!titulo || titulo.length > 300 || !Number.isInteger(duracao) || duracao < 1 || duracao > 200) {
      throw new Error(`Conteúdo ${index + 1} inválido: informe título e duração inteira entre 1 e 200 aulas.`);
    }
    return { ordem: index + 1, titulo, descricao, duracaoEstimadaAulas: duracao };
  });
}
