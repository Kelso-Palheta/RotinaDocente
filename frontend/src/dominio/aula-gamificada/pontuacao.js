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

function comPosicoes(entradas, { porTabuleiro = false } = {}) {
  const ordenadas = [...entradas].sort((a, b) => {
    if (porTabuleiro) {
      const diffCasa = (Number(b.posicaoTabuleiro) || 0) - (Number(a.posicaoTabuleiro) || 0);
      if (diffCasa !== 0) return diffCasa;
    }
    return b.pontos - a.pontos;
  });
  let posicaoAnterior = null;
  let chaveAnterior = null;
  const chave = (e) => (porTabuleiro ? `${Number(e.posicaoTabuleiro) || 0}:${e.pontos}` : String(e.pontos));
  return ordenadas.map((entrada, indice) => {
    const atual = chave(entrada);
    const posicao = chaveAnterior === atual ? posicaoAnterior : indice + 1;
    posicaoAnterior = posicao;
    chaveAnterior = atual;
    const empate = ordenadas.filter((outra) => chave(outra) === atual).length > 1;
    return { ...entrada, posicao, empate };
  });
}

export function calcularRanking(
  participantes = [],
  {
    modalidade,
    formatoParticipacao,
    modoRespostaGrupo,
    equipes = [],
    posicoesPorEquipe = {},
    pontosPorEquipe = null,
    respostas = null,
  } = {},
) {
  const pontos = (p) => (Number.isFinite(p?.pontos) ? p.pontos : 0);
  const rankingPorGrupos =
    formatoParticipacao === 'grupos' ||
    (formatoParticipacao !== 'individual' &&
      (modalidade === 'equipes' || modalidade === 'tabuleiro' || equipes.length > 0));

  if (rankingPorGrupos && equipes.length > 0) {
    const somas = new Map(equipes.map((equipe) => [equipe.id, 0]));
    if (modoRespostaGrupo === 'compartilhada') {
      if (pontosPorEquipe instanceof Map) {
        for (const equipe of equipes) {
          somas.set(equipe.id, Number(pontosPorEquipe.get(String(equipe.id))) || 0);
        }
      } else if (pontosPorEquipe && typeof pontosPorEquipe === 'object') {
        for (const equipe of equipes) {
          somas.set(equipe.id, Number(pontosPorEquipe[equipe.id]) || 0);
        }
      } else if (Array.isArray(respostas)) {
        for (const r of respostas) {
          if (r?.equipeId && somas.has(r.equipeId)) {
            somas.set(r.equipeId, somas.get(r.equipeId) + (Number(r.pontos) || 0));
          }
        }
      } else {
        for (const equipe of equipes) {
          if (Number.isFinite(equipe?.pontos)) {
            somas.set(equipe.id, Number(equipe.pontos));
          } else {
            const primeiro = participantes.find((p) => p.equipeId === equipe.id);
            somas.set(equipe.id, primeiro ? pontos(primeiro) : 0);
          }
        }
      }
    } else {
      for (const participante of participantes) {
        if (somas.has(participante.equipeId))
          somas.set(participante.equipeId, somas.get(participante.equipeId) + pontos(participante));
      }
    }
    return comPosicoes(
      equipes.map((equipe) => ({
        id: equipe.id,
        nome: equipe.nome,
        pontos: somas.get(equipe.id) || 0,
        ...(modalidade === 'tabuleiro'
          ? { posicaoTabuleiro: Number(posicoesPorEquipe?.[equipe.id]) || 0 }
          : {}),
      })),
      { porTabuleiro: modalidade === 'tabuleiro' },
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
