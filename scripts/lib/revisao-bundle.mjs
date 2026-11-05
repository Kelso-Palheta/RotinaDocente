/** IDs de questões são específicos; nomes de aulas também são palavras comuns da interface. */
export function contemAcervoPrivado(javascript,{idsQuestoes=[],textosAulas=[]}){
  return idsQuestoes.some(id=>javascript.includes(id)) || textosAulas.some(texto=>javascript.includes(texto)||javascript.includes(JSON.stringify(texto).slice(1,-1)));
}
