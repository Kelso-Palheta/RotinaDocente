/** Regras puras dos novos jogos: nada depende do relógio ou do navegador. */
export function pontosAcerte(sala, correta) {
  if (!correta) return 0;
  return sala.desafioFinal === true && sala.rodada === sala.totalRodadas ? 10000 : 1000;
}

export function consolidarNatacao({ estado = null, participantes = [], equipes = [], respostas = [], rodada, trechos = 5, formatoParticipacao = 'individual', modoRespostaGrupo = 'individual' }) {
  if (estado && Number(estado.ultimaRodadaAvaliada) >= Number(rodada)) return structuredClone(estado);
  const totalTrechos = estado?.totalTrechos || trechos;
  const anteriores = new Map((estado?.raias || []).map(r => [r.id, r.progresso]));
  const porAluno = new Map(respostas.map(r => [r.participanteId, r]));
  const grupos = formatoParticipacao === 'grupos';
  const unidades = grupos ? equipes : participantes;
  const raias = unidades.map(unidade => {
    let avanco = 0;
    if (!grupos) avanco = Number(porAluno.get(unidade.id)?.pontos) > 0 ? 1 : 0;
    else if (modoRespostaGrupo === 'compartilhada') {
      avanco = respostas.some(r => r.equipeId === unidade.id && Number(r.pontos) > 0) ? 1 : 0;
    } else {
      const membros = participantes.filter(p => p.equipeId === unidade.id && p.presenteConfirmado !== false && (p.entrouEmMs || porAluno.has(p.id)));
      avanco = membros.length ? membros.filter(p => Number(porAluno.get(p.id)?.pontos) > 0).length / membros.length : 0;
    }
    const soma = (anteriores.get(unidade.id) || 0) + avanco;
    const progresso = soma + 1e-9 >= totalTrechos ? totalTrechos : soma;
    return { id: unidade.id, nome: unidade.nomeExibicao || unidade.nome || 'Participante', progresso };
  });
  return { totalTrechos, raias, ultimaRodadaAvaliada: Number(rodada), vencedoresIds: raias.filter(r => r.progresso >= totalTrechos).map(r => r.id) };
}

export function rankingNatacao(estado, rankingOriginal = []) {
  const pontos = new Map(rankingOriginal.map(r => [r.id, r.pontos]));
  const ordenadas = [...(estado?.raias || [])].sort((a, b) => Math.abs(b.progresso - a.progresso) < 1e-9 ? 0 : b.progresso - a.progresso);
  let posicao = 0;
  return ordenadas.map((raia, indice) => {
    if (!indice || Math.abs(raia.progresso - ordenadas[indice - 1].progresso) >= 1e-9) posicao = indice + 1;
    return { ...raia, pontos: pontos.get(raia.id) || 0, posicao, empate: ordenadas.filter(r => Math.abs(r.progresso - raia.progresso) < 1e-9).length > 1 };
  });
}
