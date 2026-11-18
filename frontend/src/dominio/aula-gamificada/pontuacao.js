import { falha } from './comum';

export const PONTOS_POR_DESAFIO = 1000;

function proporcao(acertos, total) {
  if (!total) return 0;
  return Math.round((PONTOS_POR_DESAFIO * acertos) / total);
}

export function pontuarResposta(questao, resposta) {
  if (questao.tipo === 'multipla_escolha')
    return resposta?.alternativaId === questao.respostaCorreta ? PONTOS_POR_DESAFIO : 0;

  if (questao.tipo === 'pares') {
    const corretos = new Set(
      (questao.respostaCorreta || []).map((p) => `${p.esquerdaId}__${p.direitaId}`),
    );
    const total = questao.pares?.length || 0;
    const acertos = (resposta?.pares || []).filter((p) =>
      corretos.has(`${p.esquerdaId}__${p.direitaId}`),
    ).length;
    return proporcao(acertos, total);
  }

  if (questao.tipo === 'ordenacao') {
    const total = questao.itens?.length || 0;
    const acertos = (questao.respostaCorreta || []).reduce(
      (soma, id, indice) => soma + (resposta?.ordem?.[indice] === id ? 1 : 0),
      0,
    );
    return proporcao(acertos, total);
  }

  throw falha(422, 'Tipo de questão sem pontuação definida.');
}

/** Memória pontua pelos pares efetivamente encontrados, não pelo tabuleiro inteiro. */
export function pontuarMemoria(questao, paresEncontrados = []) {
  const total = questao.pares?.length || 0;
  const ids = new Set(paresEncontrados);
  const acertos = (questao.pares || []).filter((par) => ids.has(par.id)).length;
  return proporcao(acertos, total);
}

function comPosicoes(entradas) {
  const ordenadas = [...entradas].sort((a, b) => b.pontos - a.pontos);
  let posicaoAnterior = null;
  let pontosAnteriores = null;
  return ordenadas.map((entrada, indice) => {
    const posicao = pontosAnteriores === entrada.pontos ? posicaoAnterior : indice + 1;
    posicaoAnterior = posicao;
    pontosAnteriores = entrada.pontos;
    const empate = ordenadas.filter((outra) => outra.pontos === entrada.pontos).length > 1;
    return { ...entrada, posicao, empate };
  });
}

export function calcularRanking(participantes = [], { modalidade, equipes = [] } = {}) {
  const pontos = (p) => (Number.isFinite(p?.pontos) ? p.pontos : 0);

  if (modalidade === 'equipes') {
    const somas = new Map(equipes.map((equipe) => [equipe.id, 0]));
    for (const participante of participantes) {
      if (somas.has(participante.equipeId))
        somas.set(participante.equipeId, somas.get(participante.equipeId) + pontos(participante));
    }
    return comPosicoes(
      equipes.map((equipe) => ({
        id: equipe.id,
        nome: equipe.nome,
        pontos: somas.get(equipe.id) || 0,
      })),
    );
  }

  return comPosicoes(
    participantes.map((participante) => ({
      id: participante.id,
      nome: participante.nomeExibicao ?? participante.nome ?? 'Estudante',
      pontos: pontos(participante),
    })),
  );
}
