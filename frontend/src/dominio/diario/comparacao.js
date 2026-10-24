/** Mapas JSON não têm ordem significativa; listas mantêm sua ordem original. */
export function serializarDadosDiario(valor) {
  return JSON.stringify(valor, (_chave, item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return Object.fromEntries(Object.keys(item).sort().map(chave => [chave, item[chave]]));
    }
    return item;
  });
}
export function dadosIguais(a, b) {
  return serializarDadosDiario(a) === serializarDadosDiario(b);
}
export function basesDiarioIguais(a, b) {
  return Boolean(a && b) && a.revision === b.revision && Boolean(a._existe) === Boolean(b._existe)
    && (a._origem ?? null) === (b._origem ?? null) && dadosIguais(a.turmas, b.turmas);
}
