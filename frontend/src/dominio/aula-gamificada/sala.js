import { rankingNatacao } from './corrida';
import { falha, listaObrigatoria, segmento } from './comum';
import { regraPontuacao } from './modalidades';
import { facesDasCartas, paresPrivados, questaoPublica } from './questoes';
import { calcularRanking } from './pontuacao';

export const TOTAL_CASAS_TABULEIRO = 12;
export const MAX_TENTATIVAS_HEROIS = 2;

export function equipeDaVezTabuleiro(equipes = [], rodada = 1) {
  if (!Array.isArray(equipes) || !equipes.length) return null;
  const indice = Math.max(0, Number(rodada) - 1) % equipes.length;
  return equipes[indice] || equipes[0];
}

export function inicializarTabuleiroEstado(equipes = [], totalCasas = TOTAL_CASAS_TABULEIRO) {
  const posicoesPorEquipe = Object.fromEntries(equipes.map((e) => [e.id, 0]));
  return {
    totalCasas,
    posicoesPorEquipe,
    equipeDaVezId: equipeDaVezTabuleiro(equipes, 1)?.id ?? null,
    ultimaCarta: null,
    vencedorChegadaId: null,
    ultimaRodadaAvaliada: 0,
  };
}

export function avaliarRodadaTabuleiro({
  tabuleiroEstado,
  equipes = [],
  rodada = 1,
  questao = {},
  respostasRodada = [],
}) {
  const atual = tabuleiroEstado || inicializarTabuleiroEstado(equipes);
  const equipeAtiva = equipeDaVezTabuleiro(equipes, rodada);
  if (!equipeAtiva) return atual;

  const membros = new Set(equipeAtiva.participanteIds || []);
  const daEquipe = (respostasRodada || []).filter((r) =>
    r.equipeId ? String(r.equipeId) === String(equipeAtiva.id) : membros.has(r.participanteId),
  );
  const respondentes = daEquipe.length;
  const acertos = daEquipe.filter((r) => Number(r.pontos) > 0).length;

  let ultimaCarta;
  if (respondentes === 0) {
    ultimaCarta = {
      tipo: 'passe_a_vez',
      titulo: 'Passe a vez',
      avanco: 0,
      equipeId: equipeAtiva.id,
      equipeNome: equipeAtiva.nome,
      rodada,
    };
  } else if (acertos / respondentes <= 0.5) {
    ultimaCarta = {
      tipo: 'erro_nao_ande',
      titulo: 'Ops. Não ande! Você errou',
      avanco: 0,
      equipeId: equipeAtiva.id,
      equipeNome: equipeAtiva.nome,
      rodada,
    };
  } else if (questao?.dificuldade === 'dificil') {
    ultimaCarta = {
      tipo: 'avance_2',
      titulo: 'Parabéns, avance 2 casas.',
      avanco: 2,
      equipeId: equipeAtiva.id,
      equipeNome: equipeAtiva.nome,
      rodada,
    };
  } else {
    ultimaCarta = {
      tipo: 'avance_1',
      titulo: 'Parabéns, avance 1 casa.',
      avanco: 1,
      equipeId: equipeAtiva.id,
      equipeNome: equipeAtiva.nome,
      rodada,
    };
  }

  const totalCasas = Number(atual.totalCasas) || TOTAL_CASAS_TABULEIRO;
  const posAnterior = Number(atual.posicoesPorEquipe?.[equipeAtiva.id]) || 0;
  const novaPos = Math.min(totalCasas, posAnterior + ultimaCarta.avanco);
  const posicoesPorEquipe = {
    ...(atual.posicoesPorEquipe || {}),
    [equipeAtiva.id]: novaPos,
  };
  const vencedorChegadaId =
    atual.vencedorChegadaId || (novaPos >= totalCasas ? equipeAtiva.id : null);

  return {
    ...atual,
    totalCasas,
    posicoesPorEquipe,
    equipeDaVezId: equipeAtiva.id,
    ultimaCarta,
    vencedorChegadaId,
    ultimaRodadaAvaliada: Number(rodada),
  };
}

export function avaliarTentativaHerois({ sala, registro = null, acertou, agora = Date.now() }) {
  if (!aceitaRespostas(sala, agora))
    throw falha(409, 'O prazo desta rodada terminou.');
  if (sala?.fase !== 'pergunta')
    throw falha(409, 'A rodada não está aberta para respostas.');

  const tentativasAnteriores = Number(registro?.tentativas) || 0;
  if (registro?.acertou || tentativasAnteriores >= MAX_TENTATIVAS_HEROIS) {
    throw falha(409, 'Você já concluiu suas tentativas nesta rodada.');
  }

  const tentativas = tentativasAnteriores + 1;
  const acertouAgora = Boolean(acertou);
  const podeTentarNovamente = !acertouAgora && tentativas < MAX_TENTATIVAS_HEROIS;
  const pontosRodada = acertouAgora ? 1000 : 0;
  const estadoHeroi = acertouAgora
    ? 'vitoria_fase'
    : podeTentarNovamente
      ? 'golpe_tente_novamente'
      : 'golpe_encerrado';

  return {
    tentativas,
    maxTentativas: MAX_TENTATIVAS_HEROIS,
    acertou: acertouAgora,
    podeTentarNovamente,
    pontosRodada,
    estadoHeroi,
  };
}

export const FASES = Object.freeze(['espera', 'pergunta', 'feedback', 'ranking', 'encerrada']);
export const ACOES = Object.freeze([
  'iniciar',
  'encerrar_rodada',
  'revelar',
  'ranking',
  'proxima',
  'encerrar_sala',
]);

export function aceitaRespostas(sala, agora) {
  return (
    sala?.fase === 'pergunta' &&
    ((sala.modalidade === 'acerte_perde' && sala.semCronometro === true && sala.encerraEmMs === null) ||
      (Number.isFinite(sala.encerraEmMs) && agora < sala.encerraEmMs))
  );
}

export function validarComando(sala, comando) {
  if (!comando || typeof comando !== 'object') throw falha(422, 'Comando inválido.');
  if (!ACOES.includes(comando.acao)) throw falha(422, 'Ação de sala inválida.');
  if (comando.expectedRevision !== sala.revision)
    throw falha(409, 'A sala mudou. Confira o estado atualizado antes de continuar.');
  const rodada = Number(comando.rodada);
  if (comando.acao === 'iniciar') {
    if (rodada !== 1) throw falha(409, 'A sala começa na primeira rodada.');
  } else if (rodada !== sala.rodada) {
    throw falha(409, 'A rodada informada não é a rodada atual.');
  }
  return comando.acao;
}

/**
 * Transição pura. Conteúdo e participantes são persistidos pelo serviço.
 * Fluxo: espera → pergunta → feedback → ranking → próxima pergunta/encerramento.
 */
export function aplicarComando(sala, comando, agora) {
  const acao = validarComando(sala, comando);
  const base = { ...sala, revision: sala.revision + 1, atualizadoEmMs: agora };

  if (acao === 'iniciar') {
    if (sala.fase !== 'espera') throw falha(409, 'A sala já começou.');
    return {
      ...base,
      fase: 'pergunta',
      rodada: 1,
      rodadasAbertas: 1,
      iniciadaEmMs: agora,
      encerraEmMs: sala.modalidade === 'acerte_perde' && sala.semCronometro === true ? null : agora + sala.tempoSegundos * 1000,
      revelado: false,
    };
  }

  if (acao === 'encerrar_rodada') {
    if (sala.fase !== 'pergunta') throw falha(409, 'A rodada não está aberta.');
    return { ...base, fase: 'feedback', revelado: false };
  }

  if (acao === 'revelar') {
    if (sala.fase !== 'feedback') throw falha(409, 'Encerre a rodada antes de revelar o feedback.');
    if (sala.revelado) throw falha(409, 'O feedback desta rodada já foi revelado.');
    return { ...base, revelado: true };
  }

  if (acao === 'ranking') {
    if (sala.fase !== 'feedback') throw falha(409, 'Revele o feedback antes de abrir o ranking.');
    if (!sala.revelado) throw falha(409, 'Revele o feedback antes de abrir o ranking.');
    return { ...base, fase: 'ranking' };
  }

  if (acao === 'proxima') {
    if (sala.fase !== 'ranking') throw falha(409, 'Abra o ranking antes de avançar.');
    if ((sala.modalidade === 'tabuleiro' && sala.tabuleiroEstado?.vencedorChegadaId) || (sala.modalidade === 'natacao' && sala.natacaoEstado?.vencedoresIds?.length)) {
      return { ...base, fase: 'encerrada', encerradaEmMs: agora };
    }
    if (sala.rodada < sala.totalRodadas) {
      const proximaRodada = sala.rodada + 1;
      const proxTabuleiro =
        sala.modalidade === 'tabuleiro' && sala.tabuleiroEstado
          ? {
              ...sala.tabuleiroEstado,
              equipeDaVezId: equipeDaVezTabuleiro(sala.equipes, proximaRodada)?.id ?? null,
              ultimaCarta: null,
            }
          : sala.tabuleiroEstado;
      return {
        ...base,
        fase: 'pergunta',
        rodada: proximaRodada,
        rodadasAbertas: Math.max(Number(sala.rodadasAbertas) || 0, proximaRodada),
        encerraEmMs: sala.modalidade === 'acerte_perde' && sala.semCronometro === true ? null : agora + sala.tempoSegundos * 1000,
        revelado: false,
        ...(proxTabuleiro ? { tabuleiroEstado: proxTabuleiro } : {}),
      };
    }
    return { ...base, fase: 'encerrada', encerradaEmMs: agora };
  }

  if (sala.fase === 'encerrada') throw falha(409, 'A sala já foi encerrada.');
  return { ...base, fase: 'encerrada', encerradaEmMs: agora };
}

/** Cópia congelada: semente secreta impede reconstruir o embaralhamento por dados públicos. */
export function montarConteudo(questao, modalidade, { codigo, indice, segredoSemente = null }) {
  const entropia =
    segredoSemente ||
    (typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`);
  const seed = `${codigo}:${indice}:${questao.id}:${entropia}`;
  return {
    questaoId: questao.id,
    questaoPublica: questaoPublica(questao, modalidade, { seed }),
    segredo: {
      tipo: questao.tipo,
      respostaCorreta: structuredClone(questao.respostaCorreta),
      explicacao: questao.explicacao,
      pares: paresPrivados(questao),
      // Cópia privada completa: validação e pontuação nunca releem o banco editável.
      questao: structuredClone(questao),
    },
  };
}

function reciboPublico(recibo, { revelado, questao, modalidade }) {
  if (!recibo) return null;
  const base = {
    status: 'confirmado',
    rodadaId: recibo.rodadaId,
    reciboId: recibo.reciboId ?? recibo.id,
    recebidoEmMs: recibo.recebidoEmMs,
    ...(recibo.equipeId ? { equipeId: recibo.equipeId } : {}),
    ...(recibo.autoriaAlunoId ? { autoriaAlunoId: recibo.autoriaAlunoId } : {}),
    ...(recibo.autoriaNome ? { autoriaNome: recibo.autoriaNome } : {}),
    ...(recibo.resposta ? { resposta: structuredClone(recibo.resposta) } : {}),
  };
  if (recibo.virarId) {
    // Contrato de IDs preservado; faces acompanham só o que o jogador pode ver.
    const visiveis = recibo.cartasVisiveis ?? recibo.cartasReveladas ?? [];
    const encontradas = recibo.cartasEncontradas ?? [];
    base.virarId = recibo.virarId;
    base.cartasReveladas = [...(recibo.cartasReveladas || [])];
    base.cartasEncontradas = [...encontradas];
    base.cartasVisiveis = [...visiveis];
    base.facesVisiveis = facesDasCartas(questao, visiveis);
    base.facesEncontradas = facesDasCartas(questao, encontradas);
    base.completo = recibo.completo === true;
  }
  if (recibo.estadoHeroi) {
    base.tentativas = Number(recibo.tentativas) || 1;
    base.maxTentativas = Number(recibo.maxTentativas) || MAX_TENTATIVAS_HEROIS;
    base.podeTentarNovamente = recibo.podeTentarNovamente === true;
    base.estadoHeroi = recibo.estadoHeroi;
  }
  if (revelado) {
    base.pontos = Number(recibo.pontos) || 0;
    if (['natacao', 'acerte_perde'].includes(modalidade) && questao?.tipo === 'multipla_escolha') base.correta = recibo.resposta?.alternativaId === questao.respostaCorreta;
    if (recibo.correcaoManual) base.correcaoManual = structuredClone(recibo.correcaoManual);
    if (recibo.correcaoManual) base.correta = recibo.correcaoManual.correta;
    else if (recibo.resposta?.texto != null) base.pendenteCorrecao = true;
  }
  return base;
}

function distribuicaoQuiz(respostas, modalidade, { revelado = false } = {}) {
  if (!['quiz', 'equipes', 'herois', 'tabuleiro', 'natacao', 'acerte_perde'].includes(modalidade)) return undefined;
  if (modalidade === 'herois' && !revelado) return undefined;
  const contagem = new Map();
  for (const resposta of respostas || []) {
    const alternativaId = resposta?.resposta?.alternativaId;
    if (!alternativaId) continue;
    contagem.set(alternativaId, (contagem.get(alternativaId) || 0) + 1);
  }
  return [...contagem.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([alternativaId, total]) => ({ alternativaId, total }));
}

export function ehRepresentanteEquipe(equipe, participante, participantes = []) {
  if (!equipe || !participante) return false;
  if (equipe.representanteParticipanteId) {
    return String(participante.id) === String(equipe.representanteParticipanteId);
  }
  const repAlunoId = equipe.representanteAlunoId ? String(equipe.representanteAlunoId) : '';
  if (!repAlunoId || String(participante.alunoId) !== repAlunoId) return false;
  const ocorrencias = (participantes || []).filter((p) => String(p.alunoId) === repAlunoId);
  return ocorrencias.length <= 1;
}

export function projetarEstado({
  sala,
  conteudo,
  ator,
  participante = null,
  participantes = [],
  respostas = [],
  todasRespostas = null,
  recibo = null,
  agora = Date.now(),
}) {
  const docente = ator?.tipo === 'professor';
  const revelado = sala.revelado === true;
  const questao = sala.fase === 'espera' ? null : conteudo.questaoPublica;
  const segredo = conteudo.segredo || {};
  const questaoPrivada = segredo.questao || null;
  const ehCompartilhada = sala.modoRespostaGrupo === 'compartilhada';

  const pontosPorEquipe = new Map();
  if (ehCompartilhada) {
    const fonteRespostas = Array.isArray(todasRespostas) ? todasRespostas : respostas || [];
    for (const registro of fonteRespostas) {
      if (!registro?.equipeId) continue;
      const mesmaRodada = Number(registro.rodada) === Number(sala.rodada);
      if (mesmaRodada && !revelado) continue;
      const eqKey = String(registro.equipeId);
      pontosPorEquipe.set(eqKey, (pontosPorEquipe.get(eqKey) || 0) + (Number(registro.pontos) || 0));
    }
  }

  // Pontuação da rodada corrente só é publicada depois da revelação. O recibo
  // privado confirma o recebimento sem antecipar acerto/erro.
  const pontosDaRodada = new Map();
  for (const registro of respostas || []) {
    pontosDaRodada.set(registro.participanteId, Number(registro.pontos) || 0);
  }
  const pontosOcultos = (p) => {
    const daRodada = pontosDaRodada.get(p?.id);
    if (daRodada !== undefined) return daRodada;
    if (participante && p?.id === participante.id) return Number(recibo?.pontos) || 0;
    return 0;
  };
  const pontosProjetados = (p) => {
    if (ehCompartilhada) {
      if (!p?.equipeId) return 0;
      return pontosPorEquipe.get(String(p.equipeId)) || 0;
    }
    const total = Number(p?.pontos) || 0;
    return revelado ? total : Math.max(0, total - pontosOcultos(p));
  };

  let ranking =
    ['ranking', 'encerrada'].includes(sala.fase) && revelado
      ? calcularRanking(participantes, {
          modalidade: sala.modalidade,
      ...(['plataforma', 'resgate'].includes(sala.experiencia) ? { experiencia: sala.experiencia } : {}),
          formatoParticipacao: sala.formatoParticipacao,
          modoRespostaGrupo: sala.modoRespostaGrupo,
          equipes: sala.equipes || [],
          posicoesPorEquipe: sala.tabuleiroEstado?.posicoesPorEquipe || {},
          pontosPorEquipe: ehCompartilhada ? pontosPorEquipe : null,
        })
      : undefined;

  if (ranking && sala.modalidade === 'natacao') ranking = rankingNatacao(sala.natacaoEstado, ranking);

  // Memória: o estado público traz apenas IDs; faces visíveis são projetadas
  // individualmente a partir do que o jogador já virou/encontrou.
  let facesMemoria = [];
  if (sala.modalidade === 'memoria' && Array.isArray(questao?.cartas)) {
    if (revelado) {
      facesMemoria = facesDasCartas(questaoPrivada, questao.cartas);
    } else if (participante) {
      const ids = [
        ...(recibo?.cartasVisiveis ?? recibo?.cartasReveladas ?? []),
        ...(recibo?.cartasEncontradas ?? []),
      ];
      facesMemoria = facesDasCartas(questaoPrivada, ids);
    }
  }

  // Distingue presença (entrouEmMs) de resposta/progresso na rodada corrente,
  // sem associar o nome do participante à alternativa escolhida.
  const registroPorParticipante = new Map();
  const registroPorEquipe = new Map();
  for (const registro of respostas || []) {
    if (registro?.participanteId) {
      registroPorParticipante.set(registro.participanteId, registro);
    }
    if (registro?.equipeId) {
      registroPorEquipe.set(String(registro.equipeId), registro);
    }
  }
  const participanteRespondeu = (p) => {
    if (sala.fase === 'espera') return false;
    const reg =
      sala.modoRespostaGrupo === 'compartilhada' && p?.equipeId
        ? registroPorEquipe.get(String(p.equipeId))
        : registroPorParticipante.get(p?.id);
    if (!reg) return false;
    if (sala.modalidade === 'memoria') {
      return Boolean(
        reg.completo ||
          reg.ultimoRecibo ||
          reg.encontrados?.length ||
          reg.viradas?.length,
      );
    }
    return Boolean(reg.resposta || reg.ultimoRecibo);
  };

  const equipeDoParticipante =
    participante?.equipeId
      ? (sala.equipes || []).find((e) => String(e.id) === String(participante.equipeId))
      : null;

  const estado = {
    sala: {
      codigo: sala.codigo,
      titulo: sala.titulo,
      modalidade: sala.modalidade,
      ...(['plataforma', 'resgate'].includes(sala.experiencia) ? { experiencia: sala.experiencia } : {}),
      ...(sala.formatoParticipacao ? { formatoParticipacao: sala.formatoParticipacao } : {}),
      ...(sala.modoRespostaGrupo ? { modoRespostaGrupo: sala.modoRespostaGrupo } : {}),
      finalidade: sala.finalidade || 'revisao',
      ...(sala.avaliacao ? { avaliacao: structuredClone(sala.avaliacao) } : {}),
      fase: sala.fase,
      revision: sala.revision,
      rodada: sala.rodada,
      totalRodadas: sala.totalRodadas,
      tempoSegundos: sala.tempoSegundos,
      regraPontuacao: regraPontuacao(sala.modalidade),
      ...(sala.modalidade === 'acerte_perde' ? { semCronometro: Boolean(sala.semCronometro), desafioFinal: Boolean(sala.desafioFinal) } : {}),
      iniciadaEmMs: sala.iniciadaEmMs ?? null,
      encerradaEmMs: sala.encerradaEmMs ?? null,
      ...(sala.equipes?.length
        ? {
            equipes: sala.equipes.map(({ id, nome, cor, representanteAlunoId, representanteParticipanteId, participanteIds }) => ({
              id,
              nome,
              ...(cor ? { cor } : {}),
              ...(docente && participanteIds ? { participanteIds } : {}),
              ...(docente && representanteParticipanteId ? { representanteParticipanteId } : {}),
              ...(docente && representanteAlunoId ? { representanteAlunoId } : {}),
            })),
          }
        : {}),
      ...(sala.modalidade === 'natacao' && sala.natacaoEstado ? { natacaoEstado: structuredClone(sala.natacaoEstado) } : {}),
      ...(sala.modalidade === 'tabuleiro' && sala.tabuleiroEstado
        ? { tabuleiroEstado: structuredClone(sala.tabuleiroEstado) }
        : {}),
    },
    ...(sala.modalidade === 'tabuleiro' && sala.tabuleiroEstado
      ? { tabuleiroEstado: structuredClone(sala.tabuleiroEstado) }
      : {}),
    ...(sala.modalidade === 'natacao' && sala.natacaoEstado ? { natacaoEstado: structuredClone(sala.natacaoEstado) } : {}),
    pendentesCorrecao: respostas.filter(r => r.resposta?.texto != null && !r.correcaoManual).length,
    servidorAgora: agora,
    prazo: sala.encerraEmMs ?? null,
    aberta: aceitaRespostas(sala, agora),
    rodada: {
      numero: sala.rodada,
      total: sala.totalRodadas,
      id: String(sala.rodada),
      questao,
      revelado,
      ...(sala.modalidade === 'memoria' && Array.isArray(questao?.cartas)
        ? { faces: facesMemoria }
        : {}),
      ...(revelado
        ? {
            gabarito: structuredClone(segredo.respostaCorreta),
            explicacao: segredo.explicacao,
            ...(segredo.pares?.length
              ? {
                  paresCorretos: segredo.pares.map((par) => ({
                    ...par,
                    esquerda: facesDasCartas(questaoPrivada, [par.esquerdaId])[0] ?? null,
                    direita: facesDasCartas(questaoPrivada, [par.direitaId])[0] ?? null,
                  })),
                }
              : {}),
          }
        : {}),
    },
    eu: participante
      ? {
          id: participante.id,
          nomeExibicao: participante.nomeExibicao,
          pontos: pontosProjetados(participante),
          equipeId: participante.equipeId ?? null,
          ...(sala.modoRespostaGrupo === 'compartilhada'
            ? {
                ehRepresentante: ehRepresentanteEquipe(equipeDoParticipante, participante, participantes),
              }
            : {}),
          recibo: reciboPublico(recibo, { revelado, questao: questaoPrivada, modalidade: sala.modalidade }),
        }
      : null,
    ...(ranking ? { ranking } : {}),
    ...(docente
      ? {
          participantes: participantes.map((p) => {
            const respondeu = participanteRespondeu(p);
            return {
              id: p.id,
              alunoId: p.alunoId || null,
              turmaId: p.turmaId || null,
              nomeExibicao: p.nomeExibicao,
              pontos: pontosProjetados(p),
              equipeId: p.equipeId ?? null,
              entrouEmMs: p.entrouEmMs ?? null,
              presenteConfirmado: p.presenteConfirmado ?? null,
              respondeu,
              ...(respondeu ? { rodadaRespondida: sala.rodada } : {}),
              ...(p.progresso ? { progresso: p.progresso } : {}),
            };
          }),
          respondentes: participantes
            .filter((p) => participanteRespondeu(p))
            .map((p) => ({ id: p.id, nomeExibicao: p.nomeExibicao })),
          ...(distribuicaoQuiz(respostas, sala.modalidade, { revelado })
            ? { distribuicao: distribuicaoQuiz(respostas, sala.modalidade, { revelado }) }
            : {}),
        }
      : {}),
  };

  return estado;
}

export function validarCodigoSala(valor) {
  return segmento(valor, { campo: 'Código da sala', max: 12 });
}

export function validarExperienciaSala(config) {
  if (config.experiencia != null && !['padrao','plataforma','resgate'].includes(config.experiencia)) throw falha(422, 'Experiência de jogo inválida.');
  if (config.experiencia === 'plataforma' && config.modalidade !== 'quiz') throw falha(422, 'A plataforma em sala precisa da modalidade Quiz.');
  if (config.experiencia === 'resgate') {
    if (config.modalidade !== 'quiz') throw falha(422, 'O Resgate do Rio precisa da modalidade Quiz.');
    if (!Array.isArray(config.questaoIds) || new Set(config.questaoIds.map(String)).size < 3) throw falha(422, 'O Resgate do Rio precisa de pelo menos três questões distintas.');
  }
  return ['plataforma', 'resgate'].includes(config.experiencia) ? config.experiencia : 'padrao';
}

export function validarConfiguracaoSala(config, turmas, questoes) {
  if (!config || typeof config !== 'object') throw falha(422, 'Configuração da sala inválida.');
  validarExperienciaSala(config);
  const titulo = String(config.titulo ?? '').trim();
  if (!titulo) throw falha(422, 'Informe o título da sala.');
  const turmaIds = listaObrigatoria(config.turmaIds, 'turmas', { min: 1, max: 30 }).map((id) =>
    String(id),
  );
  const questaoIds = listaObrigatoria(config.questaoIds, 'questões', { min: 1, max: 50 }).map((id) =>
    String(id),
  );
  const tempoSegundos = Number(config.tempoSegundos);
  if (!Number.isInteger(tempoSegundos) || tempoSegundos < 10 || tempoSegundos > 3600)
    throw falha(422, 'O tempo por rodada deve estar entre 10 e 3600 segundos.');
  const turmasValidas = new Set((turmas || []).map((t) => String(t.id)));
  if (turmaIds.some((id) => !turmasValidas.has(id)))
    throw falha(422, 'Uma das turmas não pertence ao professor.');
  const mapa = new Map((questoes || []).map((q) => [String(q.id), q]));
  if (questaoIds.some((id) => !mapa.has(id)))
    throw falha(404, 'Uma das questões não está no banco do professor.');
  return { titulo, turmaIds, questaoIds, tempoSegundos, mapaQuestoes: mapa };
}

export function montarRoster(turmas, turmaIds, idParticipante) {
  const roster = [];
  for (const turma of turmas || []) {
    if (!turmaIds.includes(String(turma.id))) continue;
    for (const aluno of turma.alunos || []) {
      roster.push({
        id: idParticipante(String(turma.id), String(aluno.id)),
        turmaId: String(turma.id),
        alunoId: String(aluno.id),
        nomeExibicao: String(aluno.nome || 'Estudante').trim().slice(0, 80),
      });
    }
  }
  return roster;
}

export function validarEquipes(
  equipes,
  roster,
  { exigirMembros = false, exigirCobertura = false, modoRespostaGrupo = 'individual' } = {},
) {
  if (equipes === undefined || equipes === null) return [];
  const lista = listaObrigatoria(equipes, 'equipes', { min: 2, max: 30 });
  const ids = new Set();
  const participantes = new Set();
  const rosterIds = new Set(roster.map((r) => r.id));
  const freqAlunoId = new Map();
  const porAlunoId = new Map();
  for (const r of roster) {
    const key = String(r.alunoId);
    freqAlunoId.set(key, (freqAlunoId.get(key) || 0) + 1);
    if (!porAlunoId.has(key)) porAlunoId.set(key, r);
  }
  const resultado = lista.map((equipe, indice) => {
    if (!equipe || typeof equipe !== 'object') throw falha(422, `Equipe ${indice + 1} inválida.`);
    const id = segmento(String(equipe.id ?? `equipe-${indice + 1}`), {
      campo: `ID da equipe ${indice + 1}`,
      max: 60,
    });
    const nome = String(equipe.nome ?? '').trim();
    if (!nome) throw falha(422, `Informe o nome da equipe ${indice + 1}.`);
    if (ids.has(id)) throw falha(422, 'As equipes precisam ter IDs únicos.');
    ids.add(id);
    const membrosBrutos = Array.isArray(equipe.participanteIds)
      ? equipe.participanteIds.map(String)
      : Array.isArray(equipe.membros)
        ? equipe.membros.map((m) => {
            const mStr = String(m);
            if (rosterIds.has(mStr)) return mStr;
            if ((freqAlunoId.get(mStr) || 0) > 1) {
              throw falha(422, `Identificação ambígua do integrante "${mStr}": informe o ID estável do participante.`);
            }
            return porAlunoId.get(mStr)?.id || mStr;
          })
        : [];
    for (const membro of membrosBrutos) {
      if (!rosterIds.has(membro))
        throw falha(422, 'Uma equipe referencia um participante que não está nas turmas da sala.');
      if (participantes.has(membro))
        throw falha(422, 'Um participante não pode estar em mais de uma equipe.');
      participantes.add(membro);
    }
    if (exigirMembros && membrosBrutos.length === 0) {
      throw falha(422, `A equipe "${nome}" precisa de pelo menos um integrante.`);
    }
    const membrosRoster = roster.filter((r) => membrosBrutos.includes(r.id));
    let representanteParticipanteId = equipe.representanteParticipanteId
      ? String(equipe.representanteParticipanteId)
      : null;
    let representanteAlunoId = equipe.representanteAlunoId ? String(equipe.representanteAlunoId) : null;
    if (modoRespostaGrupo === 'compartilhada') {
      if (!membrosRoster.length) {
        throw falha(422, `A equipe "${nome}" precisa de integrantes para definir um representante.`);
      }
      if (representanteParticipanteId) {
        const rep = membrosRoster.find((r) => String(r.id) === representanteParticipanteId);
        if (!rep) {
          throw falha(422, `O representante escolhido não pertence à equipe "${nome}".`);
        }
        representanteAlunoId = String(rep.alunoId);
      } else if (representanteAlunoId) {
        if ((freqAlunoId.get(representanteAlunoId) || 0) > 1) {
          throw falha(
            422,
            `Identificação ambígua do representante "${representanteAlunoId}" entre turmas: informe representanteParticipanteId.`,
          );
        }
        const rep = membrosRoster.find((r) => String(r.alunoId) === representanteAlunoId);
        if (!rep) {
          throw falha(422, `O representante escolhido não pertence à equipe "${nome}".`);
        }
        representanteParticipanteId = String(rep.id);
      } else {
        representanteParticipanteId = String(membrosRoster[0].id);
        representanteAlunoId = String(membrosRoster[0].alunoId);
      }
    }
    return {
      id,
      nome: nome.slice(0, 80),
      participanteIds: membrosBrutos,
      ...(equipe.cor ? { cor: String(equipe.cor).slice(0, 20) } : {}),
      ...(representanteParticipanteId ? { representanteParticipanteId } : {}),
      ...(representanteAlunoId ? { representanteAlunoId } : {}),
    };
  });
  if (exigirCobertura && participantes.size < roster.length) {
    throw falha(422, 'Todos os participantes selecionados precisam estar distribuídos em um grupo.');
  }
  return resultado;
}
