import { falha, listaObrigatoria, segmento } from './comum';
import { regraPontuacao } from './modalidades';
import { facesDasCartas, paresPrivados, questaoPublica } from './questoes';
import { calcularRanking } from './pontuacao';

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
    Number.isFinite(sala.encerraEmMs) &&
    agora < sala.encerraEmMs
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
      iniciadaEmMs: agora,
      encerraEmMs: agora + sala.tempoSegundos * 1000,
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
    if (sala.rodada < sala.totalRodadas) {
      return {
        ...base,
        fase: 'pergunta',
        rodada: sala.rodada + 1,
        encerraEmMs: agora + sala.tempoSegundos * 1000,
        revelado: false,
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

function reciboPublico(recibo, { revelado, questao }) {
  if (!recibo) return null;
  const base = {
    status: 'confirmado',
    rodadaId: recibo.rodadaId,
    reciboId: recibo.reciboId ?? recibo.id,
    recebidoEmMs: recibo.recebidoEmMs,
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
  if (revelado) base.pontos = Number(recibo.pontos) || 0;
  return base;
}

function distribuicaoQuiz(respostas, modalidade) {
  if (!['quiz', 'equipes'].includes(modalidade)) return undefined;
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

export function projetarEstado({
  sala,
  conteudo,
  ator,
  participante = null,
  participantes = [],
  respostas = [],
  recibo = null,
  agora = Date.now(),
}) {
  const docente = ator?.tipo === 'professor';
  const revelado = sala.revelado === true;
  const questao = sala.fase === 'espera' ? null : conteudo.questaoPublica;
  const segredo = conteudo.segredo || {};
  const questaoPrivada = segredo.questao || null;

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
    const total = Number(p?.pontos) || 0;
    return revelado ? total : Math.max(0, total - pontosOcultos(p));
  };

  const ranking =
    ['ranking', 'encerrada'].includes(sala.fase) && revelado
      ? calcularRanking(participantes, {
          modalidade: sala.modalidade,
          equipes: sala.equipes || [],
        })
      : undefined;

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
  for (const registro of respostas || []) {
    if (registro?.participanteId) {
      registroPorParticipante.set(registro.participanteId, registro);
    }
  }
  const participanteRespondeu = (p) => {
    if (sala.fase === 'espera') return false;
    const reg = registroPorParticipante.get(p?.id);
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

  const estado = {
    sala: {
      codigo: sala.codigo,
      titulo: sala.titulo,
      modalidade: sala.modalidade,
      fase: sala.fase,
      revision: sala.revision,
      rodada: sala.rodada,
      totalRodadas: sala.totalRodadas,
      tempoSegundos: sala.tempoSegundos,
      regraPontuacao: regraPontuacao(sala.modalidade),
      iniciadaEmMs: sala.iniciadaEmMs ?? null,
      encerradaEmMs: sala.encerradaEmMs ?? null,
      ...(sala.equipes?.length
        ? { equipes: sala.equipes.map(({ id, nome }) => ({ id, nome })) }
        : {}),
    },
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
          recibo: reciboPublico(recibo, { revelado, questao: questaoPrivada }),
        }
      : null,
    ...(ranking ? { ranking } : {}),
    ...(docente
      ? {
          participantes: participantes.map((p) => {
            const respondeu = participanteRespondeu(p);
            return {
              id: p.id,
              nomeExibicao: p.nomeExibicao,
              pontos: pontosProjetados(p),
              equipeId: p.equipeId ?? null,
              entrouEmMs: p.entrouEmMs ?? null,
              respondeu,
              ...(respondeu ? { rodadaRespondida: sala.rodada } : {}),
              ...(p.progresso ? { progresso: p.progresso } : {}),
            };
          }),
          respondentes: participantes
            .filter((p) => participanteRespondeu(p))
            .map((p) => ({ id: p.id, nomeExibicao: p.nomeExibicao })),
          ...(distribuicaoQuiz(respostas, sala.modalidade)
            ? { distribuicao: distribuicaoQuiz(respostas, sala.modalidade) }
            : {}),
        }
      : {}),
  };

  return estado;
}

export function validarCodigoSala(valor) {
  return segmento(valor, { campo: 'Código da sala', max: 12 });
}

export function validarConfiguracaoSala(config, turmas, questoes) {
  if (!config || typeof config !== 'object') throw falha(422, 'Configuração da sala inválida.');
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

export function validarEquipes(equipes, roster) {
  if (equipes === undefined || equipes === null) return [];
  const lista = listaObrigatoria(equipes, 'equipes', { min: 2, max: 30 });
  const ids = new Set();
  const participantes = new Set();
  const rosterIds = new Set(roster.map((r) => r.id));
  return lista.map((equipe, indice) => {
    if (!equipe || typeof equipe !== 'object') throw falha(422, `Equipe ${indice + 1} inválida.`);
    const id = segmento(String(equipe.id ?? `equipe-${indice + 1}`), {
      campo: `ID da equipe ${indice + 1}`,
      max: 60,
    });
    const nome = String(equipe.nome ?? '').trim();
    if (!nome) throw falha(422, `Informe o nome da equipe ${indice + 1}.`);
    if (ids.has(id)) throw falha(422, 'As equipes precisam ter IDs únicos.');
    ids.add(id);
    const membros = Array.isArray(equipe.participanteIds) ? equipe.participanteIds.map(String) : [];
    for (const membro of membros) {
      if (!rosterIds.has(membro))
        throw falha(422, 'Uma equipe referencia um participante que não está nas turmas da sala.');
      if (participantes.has(membro))
        throw falha(422, 'Um participante não pode estar em mais de uma equipe.');
      participantes.add(membro);
    }
    return { id, nome, participanteIds: membros };
  });
}
