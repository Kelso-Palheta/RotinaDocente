/**
 * Metadados e regras compartilhadas da experiência Aula Gamificada.
 * Segue o contrato congelado de specs/AULA_GAMIFICADA_SPEC.md.
 */

export const MODALIDADES_PADRAO = [
  {
    id: 'quiz',
    nome: 'Quiz ao Vivo',
    resumo: 'Múltipla escolha individual em rodadas cronometradas com feedback imediato.',
    tiposQuestoes: ['multipla_escolha'],
    regraPontuacao: '1000 pontos por resposta correta, sem bônus por tempo.',
    badge: 'Individual',
    accent: 'ciano',
  },
  {
    id: 'memoria',
    nome: 'Memória de Pares',
    resumo: 'Tabuleiro individual de cartas embaralhadas para descobrir pares de conceitos e definições.',
    tiposQuestoes: ['pares'],
    regraPontuacao: 'Até 1000 pontos por desafio, proporcional aos pares encontrados antes do prazo (arredondado).',
    badge: 'Tabuleiro',
    accent: 'amarelo',
  },
  {
    id: 'associacao',
    nome: 'Associação de Colunas',
    resumo: 'Relacione itens da coluna esquerda com seus correspondentes na coluna direita por clique ou teclado.',
    tiposQuestoes: ['pares'],
    regraPontuacao: 'Até 1000 pontos por desafio, proporcional às associações corretas (arredondado).',
    badge: 'Duas colunas',
    accent: 'rosa',
  },
  {
    id: 'ordenacao',
    nome: 'Ordenação',
    resumo: 'Organize etapas, acontecimentos históricos, processos ou conceitos na sequência correta.',
    tiposQuestoes: ['ordenacao'],
    regraPontuacao: 'Até 1000 pontos por desafio, proporcional aos itens na posição correta (arredondado).',
    badge: 'Sequência',
    accent: 'lima',
  },
  {
    id: 'equipes',
    nome: 'Desafio em Equipes',
    resumo: 'Quiz coletivo que agrupa os resultados individuais nas equipes cadastradas pelo professor.',
    tiposQuestoes: ['multipla_escolha'],
    regraPontuacao: '1000 pontos por resposta correta, sem bônus por tempo; uma resposta por aluno/rodada e pontuação da equipe pela soma.',
    regraPreparacao: 'Uma resposta por aluno/rodada, pontuação da equipe pela soma dos resultados individuais.',
    badge: 'Coletivo',
    accent: 'ciano',
  },
  {
    id: 'herois',
    nome: 'Heróis',
    resumo: 'Batalha em fases com feedback individual imediato, chance de Tente novamente no prazo e celebração coletiva.',
    tiposQuestoes: ['multipla_escolha'],
    regraPontuacao: '1000 pontos por resposta correta (até 2 tentativas dentro do prazo com Tente novamente), sem bônus por tempo.',
    badge: 'Fases · Áudio',
    accent: 'rosa',
  },
  {
    id: 'tabuleiro',
    nome: 'Tabuleiro',
    resumo: 'Trilha de blocos de 12 casas por turnos entre equipes com cartas de avanço, Passe a vez e chegada.',
    tiposQuestoes: ['multipla_escolha'],
    regraPontuacao: 'Cada equipe avança casas até a Chegada (12 casas) na sua vez e soma 1000 pontos por resposta correta.',
    regraPreparacao: 'Equipes padrão (Azul e Verde) com alunos distribuídos automaticamente e prévia editável.',
    badge: 'Trilha · Equipes',
    accent: 'lima',
  },
];

export const TIPOS_QUESTAO = {
  multipla_escolha: {
    id: 'multipla_escolha',
    rotulo: 'Múltipla escolha',
    modalidades: ['quiz', 'equipes', 'herois', 'tabuleiro'],
  },
  pares: {
    id: 'pares',
    rotulo: 'Pares (Memória / Associação)',
    modalidades: ['memoria', 'associacao'],
  },
  ordenacao: {
    id: 'ordenacao',
    rotulo: 'Sequência ordenada',
    modalidades: ['ordenacao'],
  },
};

export const DIFICULDADES = [
  { id: 'facil', rotulo: 'Fácil', classe: 'bg-[#E7DBFD] text-[#25104A] border-[#B9A6EF]' },
  { id: 'medio', rotulo: 'Médio', classe: 'bg-[#FFE500] text-[#25104A] border-[#25104A]/20' },
  { id: 'dificil', rotulo: 'Difícil', classe: 'bg-[#25104A] text-[#FFFDF7] border-[#25104A]' },
];

export const DISCIPLINAS_SUGERIDAS = [
  'Arte / ENEM',
  'Língua Portuguesa',
  'Matemática',
  'Biologia',
  'Física',
  'Química',
  'História',
  'Geografia',
  'Filosofia',
  'Sociologia',
  'Língua Inglesa',
  'Educação Física',
  'Ciências',
  'Projeto de Vida',
];

export const ANOS_ESCOLARES_SUGERIDOS = [
  '6º ano EF',
  '7º ano EF',
  '8º ano EF',
  '9º ano EF',
  '1º ano EM',
  '2º ano EM',
  '3º ano EM',
  'EJA / Pré-ENEM',
];

export const FASES_ROTULO = {
  espera: 'Aguardando início',
  pergunta: 'Rodada em andamento',
  feedback: 'Feedback e gabarito',
  ranking: 'Placar da rodada',
  encerrada: 'Sala encerrada',
};

export const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function obterModalidadeInfo(id, modalidadesServidor = null) {
  const base = MODALIDADES_PADRAO.find((m) => m.id === id) || MODALIDADES_PADRAO[0];
  if (!Array.isArray(modalidadesServidor)) return base;
  const doServidor = modalidadesServidor.find((m) => m.id === id);
  if (!doServidor) return base;
  return {
    ...base,
    nome: doServidor.nome || base.nome,
    tiposQuestoes: Array.isArray(doServidor.tiposQuestoes) && doServidor.tiposQuestoes.length
      ? doServidor.tiposQuestoes
      : base.tiposQuestoes,
  };
}

export function mesclarModalidades(modalidadesServidor) {
  if (!Array.isArray(modalidadesServidor) || modalidadesServidor.length === 0) {
    return MODALIDADES_PADRAO;
  }
  const mapa = new Map(MODALIDADES_PADRAO.map((m) => [m.id, m]));
  const resultado = [];
  for (const item of modalidadesServidor) {
    const base = mapa.get(item.id);
    if (base) {
      resultado.push({
        ...base,
        nome: item.nome || base.nome,
        tiposQuestoes: Array.isArray(item.tiposQuestoes) && item.tiposQuestoes.length
          ? item.tiposQuestoes
          : base.tiposQuestoes,
      });
      mapa.delete(item.id);
    } else {
      resultado.push({
        id: item.id,
        nome: item.nome || item.id,
        resumo: '',
        tiposQuestoes: Array.isArray(item.tiposQuestoes) ? item.tiposQuestoes : ['multipla_escolha'],
        regraPontuacao: 'Pontuação calculada pelo servidor.',
        badge: 'Modalidade',
        accent: 'ciano',
      });
    }
  }
  for (const restante of mapa.values()) {
    resultado.push(restante);
  }
  return resultado;
}

export function questaoCompativelComModalidade(questao, modalidadeId, modalidadesServidor = null) {
  if (!questao) return false;
  const info = obterModalidadeInfo(modalidadeId, modalidadesServidor);
  return info.tiposQuestoes.includes(questao.tipo);
}

export function rotuloDificuldade(dificuldade) {
  return DIFICULDADES.find((d) => d.id === dificuldade)?.rotulo || dificuldade || 'Médio';
}

export function classeDificuldade(dificuldade) {
  return DIFICULDADES.find((d) => d.id === dificuldade)?.classe || DIFICULDADES[1].classe;
}

export function rotuloTipoQuestao(tipo) {
  return TIPOS_QUESTAO[tipo]?.rotulo || tipo || 'Questão';
}

export function formatarCronometro(segundos) {
  const s = Math.max(0, Math.floor(Number(segundos) || 0));
  const min = Math.floor(s / 60);
  const seg = s % 60;
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

export function converterTimestampMs(valor) {
  if (valor == null) return null;
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string') {
    const parsed = Date.parse(valor);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function validarUrlImagemSegura(url) {
  if (!url || typeof url !== 'string') return false;
  const limpa = url.trim();
  if (!limpa) return false;
  if (limpa.startsWith('/')) return !limpa.startsWith('//');
  try {
    const parsed = new URL(limpa);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function normalizarCodigoSala(valor) {
  return String(valor || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

export function textoCarta(valor) {
  if (valor && typeof valor === 'object') return String(valor.texto ?? '');
  return String(valor ?? '');
}

/**
 * Gera um ID opaco e independente para cartas de pares, sem prefixo de lado
 * nem correlação inferível entre esquerda e direita.
 */
export function gerarIdOpacoCarta() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `c_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
  const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  return `c_${rand.slice(0, 16)}`;
}

/**
 * Reaproveita o mesmo requestId enquanto o payload da operação pendente for idêntico;
 * gera um novo requestId quando o payload muda.
 */
export function resolverRequestIdOperacao(ref, assinatura, gerarFn) {
  if (ref.current && ref.current.assinatura === assinatura && ref.current.requestId) {
    return ref.current.requestId;
  }
  const requestId = gerarFn();
  ref.current = { assinatura, requestId };
  return requestId;
}

function participanteRespondeuRodada(participante, rodadaAtual) {
  if (!participante || typeof participante !== 'object') return false;
  if (participante.respondeu === true) return true;
  if (participante.rodadaRespondida != null && Number(participante.rodadaRespondida) === Number(rodadaAtual)) {
    return true;
  }
  const prog = participante.progresso;
  if (prog && typeof prog === 'object') {
    if (prog.respondeu === true || prog.completo === true) return true;
    if (prog.rodadaRespondida != null && Number(prog.rodadaRespondida) === Number(rodadaAtual)) return true;
    if ((Number(prog.paresEncontrados) || 0) > 0) return true;
  }
  return false;
}

function normalizarCartasMemoria(questaoBruta, { rodadaObj, recibo, revelado }) {
  if (!questaoBruta || !Array.isArray(questaoBruta.cartas)) return questaoBruta;

  // Coleta somente faces explicitamente autorizadas pelo servidor na projeção atual.
  const mapaFaces = new Map();
  const fontesFaces = [
    ...(Array.isArray(rodadaObj?.faces) ? rodadaObj.faces : []),
    ...(Array.isArray(recibo?.facesEncontradas) ? recibo.facesEncontradas : []),
    ...(Array.isArray(recibo?.facesVisiveis) ? recibo.facesVisiveis : []),
  ];
  for (const face of fontesFaces) {
    if (face && typeof face === 'object' && face.id) {
      mapaFaces.set(String(face.id), {
        texto: String(face.texto ?? ''),
        ...(face.imagem ? { imagem: face.imagem } : {}),
      });
    }
  }

  const temControleServidor =
    Array.isArray(rodadaObj?.faces) ||
    Array.isArray(recibo?.cartasVisiveis) ||
    Array.isArray(recibo?.cartasEncontradas) ||
    Array.isArray(recibo?.cartasReveladas);

  const encontradasSet = new Set((recibo?.cartasEncontradas || []).map(String));
  // cartasVisiveis substitui integralmente cartas abertas anteriores (fecha pares errados!).
  const visiveisFonte = Array.isArray(recibo?.cartasVisiveis)
    ? recibo.cartasVisiveis
    : Array.isArray(recibo?.cartasReveladas)
    ? recibo.cartasReveladas
    : [];
  const visiveisSet = new Set(visiveisFonte.map(String));

  const cartas = questaoBruta.cartas.map((entrada) => {
    const ehString = typeof entrada === 'string';
    const id = ehString ? entrada : String(entrada?.id ?? '');
    const faceServidor = mapaFaces.get(id);

    if (ehString || temControleServidor) {
      const encontrada = encontradasSet.has(id);
      const virada = encontrada || visiveisSet.has(id) || Boolean(revelado && faceServidor);
      const texto = virada
        ? (faceServidor?.texto ?? (!ehString ? String(entrada?.texto ?? '') : ''))
        : '';
      const imagem = virada
        ? (faceServidor?.imagem ?? (!ehString ? entrada?.imagem ?? null : null))
        : null;
      return {
        id,
        virada,
        encontrada,
        texto,
        ...(imagem ? { imagem } : {}),
      };
    }

    // Fixture estático de teste sem campos de recibo: nunca expõe texto em carta fechada.
    const encontrada = Boolean(entrada?.encontrada);
    const virada = encontrada || Boolean(entrada?.virada);
    return {
      id,
      virada,
      encontrada,
      texto: virada ? String(entrada?.texto ?? entrada?.face ?? '') : '',
      ...(virada && entrada?.imagem ? { imagem: entrada.imagem } : {}),
    };
  });

  return {
    ...questaoBruta,
    cartas,
  };
}

/**
 * Normaliza o estado retornado pela API (suporta tanto o formato plano quanto
 * o formato estruturado { sala, rodada, eu, participantes, distribuicao }).
 */
export function normalizarEstadoSala(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;

  const sala = bruto.sala && typeof bruto.sala === 'object' ? bruto.sala : null;
  const rodadaObj = bruto.rodada && typeof bruto.rodada === 'object' ? bruto.rodada : null;
  const eu = bruto.eu && typeof bruto.eu === 'object' ? bruto.eu : null;

  const modalidade = bruto.modalidade ?? sala?.modalidade ?? 'quiz';
  const fase = bruto.fase ?? sala?.fase ?? 'espera';
  const rodada =
    typeof bruto.rodada === 'number'
      ? bruto.rodada
      : Number(rodadaObj?.numero ?? sala?.rodada ?? 0);
  const totalRodadas =
    bruto.totalRodadas ??
    rodadaObj?.total ??
    sala?.totalRodadas ??
    bruto.questaoIds?.length ??
    1;
  const revelado =
    typeof bruto.revelado === 'boolean'
      ? bruto.revelado
      : typeof rodadaObj?.revelado === 'boolean'
      ? rodadaObj.revelado
      : Boolean(bruto.feedback);

  const reciboBruto = bruto.recibo ?? eu?.recibo ?? null;
  const reciboDaRodada =
    reciboBruto &&
    (reciboBruto.rodadaId == null || Number(reciboBruto.rodadaId) === Number(rodada));
  const recibo = reciboDaRodada
    ? {
        ...reciboBruto,
        pontuacao: reciboBruto.pontuacao ?? reciboBruto.pontos ?? null,
        concluido: Boolean(reciboBruto.concluido ?? reciboBruto.completo),
      }
    : null;

  const questaoBruta = bruto.questao ?? rodadaObj?.questao ?? null;
  const questao =
    modalidade === 'memoria'
      ? normalizarCartasMemoria(questaoBruta, { rodadaObj, recibo, revelado })
      : questaoBruta;

  let participacao = bruto.participacao || bruto.estatisticas || null;
  if (
    !participacao &&
    (Array.isArray(bruto.participantes) ||
      Array.isArray(bruto.distribuicao) ||
      Array.isArray(bruto.respondentes))
  ) {
    const participantes = Array.isArray(bruto.participantes) ? bruto.participantes : [];
    const distMapa = {};
    let totalDistribuicao = 0;
    if (Array.isArray(bruto.distribuicao)) {
      for (const item of bruto.distribuicao) {
        if (item?.alternativaId) {
          const qtd = Number(item.total) || 0;
          distMapa[item.alternativaId] = qtd;
          totalDistribuicao += qtd;
        }
      }
    }

    // Respondentes somente por evidência explícita do servidor — nunca por presença ou pontuação.
    const respondentesExplicitos = Array.isArray(bruto.respondentes)
      ? bruto.respondentes.map((r) => (typeof r === 'string' ? r : r?.nomeExibicao || r?.nome || r?.id))
      : participantes
          .filter((p) => participanteRespondeuRodada(p, rodada))
          .map((p) => p.nomeExibicao || p.nome || p.id);

    const presentes = participantes
      .filter((p) => p?.entrouEmMs != null)
      .map((p) => p.nomeExibicao || p.nome || p.id);

    const concluidosMemoria = participantes.filter((p) => p?.progresso?.completo === true).length;
    const participantesComMemoria = participantes.filter(
      (p) => p?.progresso && (p.progresso.paresEncontrados != null || p.progresso.completo != null)
    );
    const totalParesEncontrados = participantesComMemoria.reduce(
      (soma, p) => soma + (Number(p?.progresso?.paresEncontrados) || 0),
      0
    );

    const totalRespondentes = Math.max(totalDistribuicao, respondentesExplicitos.length);

    participacao = {
      totalParticipantes: participantes.length,
      totalPresentes: presentes.length,
      presentes,
      totalRespondentes,
      respondentes: respondentesExplicitos,
      distribuicao: distMapa,
      ...(modalidade === 'memoria' && participantesComMemoria.length > 0
        ? {
            progressoMemoria: {
              concluidos: concluidosMemoria,
              mediaPares: Math.round((totalParesEncontrados / participantesComMemoria.length) * 10) / 10,
            },
          }
        : {}),
    };
  }

  const feedback =
    bruto.feedback ??
    (revelado && rodadaObj
      ? {
          respostaCorreta: rodadaObj.gabarito,
          explicacao: rodadaObj.explicacao,
          paresCorretos: rodadaObj.paresCorretos,
        }
      : null);

  const equipeAluno =
    bruto.equipeAluno ??
    (eu?.equipeId && Array.isArray(sala?.equipes)
      ? sala.equipes.find((eq) => eq.id === eu.equipeId) || { id: eu.equipeId, nome: eu.equipeId }
      : null);

  const rankingBruto = Array.isArray(bruto.ranking) ? bruto.ranking : [];
  const rankingEquipes = Array.isArray(bruto.rankingEquipes)
    ? bruto.rankingEquipes
    : modalidade === 'equipes'
    ? rankingBruto
    : [];
  const ranking = modalidade === 'equipes' && !Array.isArray(bruto.rankingEquipes) ? [] : rankingBruto;

  return {
    ...bruto,
    codigo: bruto.codigo ?? sala?.codigo ?? '',
    revision: Number(bruto.revision ?? sala?.revision ?? 0),
    titulo: bruto.titulo ?? sala?.titulo ?? '',
    modalidade,
    fase,
    rodada,
    totalRodadas,
    tempoSegundos: bruto.tempoSegundos ?? sala?.tempoSegundos ?? 60,
    revelado,
    aberta: typeof bruto.aberta === 'boolean' ? bruto.aberta : fase === 'pergunta',
    servidorAgora: bruto.servidorAgora ?? null,
    prazo: bruto.prazo ?? null,
    questao,
    recibo,
    feedback,
    equipeAluno,
    equipes: bruto.equipes ?? sala?.equipes ?? [],
    tabuleiroEstado: bruto.tabuleiroEstado ?? sala?.tabuleiroEstado ?? null,
    participacao: participacao || {
      totalParticipantes: 0,
      totalPresentes: 0,
      presentes: [],
      totalRespondentes: 0,
      respondentes: [],
      distribuicao: {},
    },
    ranking,
    rankingEquipes,
  };
}

/**
 * Normaliza posições de ranking preservando empates mesmo se o servidor omitir `posicao`.
 */
export function normalizarRankingComEmpates(lista = []) {
  if (!Array.isArray(lista)) return [];
  const ordenada = [...lista].sort((a, b) => (Number(b.pontos ?? b.pontuacao ?? 0) - Number(a.pontos ?? a.pontuacao ?? 0)));
  let ultimaPontuacao = null;
  let ultimaPosicao = 0;
  return ordenada.map((item, indice) => {
    const pontos = Number(item.pontos ?? item.pontuacao ?? 0);
    const posicaoCalculada = ultimaPontuacao !== null && pontos === ultimaPontuacao ? ultimaPosicao : indice + 1;
    ultimaPontuacao = pontos;
    ultimaPosicao = posicaoCalculada;
    return {
      ...item,
      pontos,
      posicao: Number.isInteger(item.posicao) && item.posicao > 0 ? item.posicao : posicaoCalculada,
    };
  });
}
