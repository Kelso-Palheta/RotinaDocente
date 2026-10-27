/** Consulta sem gravação: identidade e interfaces são injetadas pela apresentação. */
export async function consultarDiarioAnalytics({ uid, repository, storage }) {
  let cache = null;
  try {
    cache = JSON.parse(storage?.getItem(`diario:${uid}:v2`) || 'null');
  } catch {
    /* cache inválido não substitui nuvem */
  }
  try {
    const dados = await repository.carregar();
    return {
      turmas: dados.turmas,
      origem: 'nuvem',
      carregando: false,
      erro:
        cache?.pendente && Array.isArray(cache.turmas)
          ? 'Existe rascunho local ainda não confirmado. Esta análise mostra a nuvem; revise as diferenças no Diário.'
          : '',
      atualizadoEm: new Date().toISOString(),
    };
  } catch (error) {
    return {
      turmas: Array.isArray(cache?.turmas) ? cache.turmas : [],
      origem: cache ? 'cache local' : 'indisponível',
      carregando: false,
      erro: error.message,
      atualizadoEm: null,
    };
  }
}
