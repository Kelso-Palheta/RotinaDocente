import { anoLetivoTurma } from '@/dominio/diario/evolucao';
import { ehObjeto, falha, textoObrigatorio, textoOpcional } from './comum';
import { equipeDaVezTabuleiro } from './sala';

export const FINALIDADES_SALA = Object.freeze(['revisao', 'avaliativa']);
export const CRITERIOS_HEROIS = Object.freeze(['primeira_tentativa', 'melhor_tentativa']);
export const BIMESTRES_VALIDOS = Object.freeze(['1', '2', '3', '4']);

export function arredondarDuasCasas(valor) {
  const num = Number(valor);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function validarConfiguracaoAvaliacao({
  finalidade = 'revisao',
  avaliacao = null,
  modalidade = 'quiz',
  turmas = [],
} = {}) {
  const fin = String(finalidade ?? 'revisao').trim();
  if (!FINALIDADES_SALA.includes(fin)) {
    throw falha(422, 'Finalidade da sala inválida. Use revisao ou avaliativa.');
  }
  if (fin === 'revisao') {
    return { finalidade: 'revisao', avaliacao: null };
  }

  if (!ehObjeto(avaliacao)) {
    throw falha(422, 'Informe a configuração avaliativa da sala.');
  }

  const tituloAtividade = textoObrigatorio(avaliacao.tituloAtividade, 'título da atividade', { max: 200 });
  const disciplina = textoObrigatorio(avaliacao.disciplina, 'disciplina', { max: 120 });
  const conteudo = textoOpcional(avaliacao.conteudo, 'conteúdo', { max: 300 });
  const bimestre = String(avaliacao.bimestre ?? '').trim();
  if (!BIMESTRES_VALIDOS.includes(bimestre)) {
    throw falha(422, 'Informe um bimestre válido (1, 2, 3 ou 4).');
  }

  const anoLetivo = String(avaliacao.anoLetivo ?? '').trim();
  if (!anoLetivo) {
    throw falha(422, 'Informe o ano letivo da avaliação (ou legado).');
  }
  if (anoLetivo !== 'legado' && !/^\d{4}$/.test(anoLetivo)) {
    throw falha(422, 'Ano letivo inválido.');
  }

  for (const turma of turmas || []) {
    const anoTurma = anoLetivoTurma(turma);
    const rotuloTurma = anoTurma ? String(anoTurma) : 'legado';
    if (rotuloTurma !== anoLetivo) {
      throw falha(
        422,
        `A turma ${turma.nome || turma.id} pertence ao ano letivo "${rotuloTurma}", divergente de "${anoLetivo}".`,
      );
    }
  }

  const valorMaximo = Number(avaliacao.valorMaximo);
  if (!Number.isFinite(valorMaximo) || valorMaximo <= 0 || valorMaximo > 100) {
    throw falha(422, 'O valor máximo da atividade deve ser maior que 0 e até 100.');
  }

  const criterioHerois = String(avaliacao.criterioHerois ?? 'primeira_tentativa').trim();
  if (!CRITERIOS_HEROIS.includes(criterioHerois)) {
    throw falha(422, 'Critério de Heróis inválido. Use primeira_tentativa ou melhor_tentativa.');
  }

  const colunaPorTurma = {};
  if (ehObjeto(avaliacao.colunaPorTurma)) {
    for (const [tid, cfg] of Object.entries(avaliacao.colunaPorTurma)) {
      if (!ehObjeto(cfg)) continue;
      colunaPorTurma[String(tid)] = {
        ...(cfg.atvId ? { atvId: String(cfg.atvId).trim() } : {}),
        ...(cfg.nomeColuna ? { nomeColuna: String(cfg.nomeColuna).trim().slice(0, 120) } : {}),
      };
    }
  }

  return {
    finalidade: 'avaliativa',
    avaliacao: {
      tituloAtividade,
      disciplina,
      conteudo,
      bimestre,
      anoLetivo,
      valorMaximo: arredondarDuasCasas(valorMaximo),
      criterioHerois: modalidade === 'herois' ? criterioHerois : 'primeira_tentativa',
      colunaPorTurma,
      versaoCriterio: 1,
    },
  };
}

function fracaoQuestao({ modalidade, questao, registro, criterioHerois }) {
  if (!registro || !questao) return 0;

  if (modalidade === 'herois') {
    if (criterioHerois === 'primeira_tentativa') {
      const primeira = registro.primeiraResposta ?? registro.resposta;
      return primeira?.alternativaId === questao.respostaCorreta ? 1 : 0;
    }
    return registro.acertou || registro.resposta?.alternativaId === questao.respostaCorreta ? 1 : 0;
  }

  if (questao.tipo === 'multipla_escolha') {
    return registro.resposta?.alternativaId === questao.respostaCorreta ? 1 : 0;
  }

  if (questao.tipo === 'pares') {
    const total = questao.pares?.length || 0;
    if (!total) return 0;
    if (modalidade === 'memoria') {
      const ids = new Set(registro.encontrados || []);
      const acertos = (questao.pares || []).filter((p) => ids.has(p.id)).length;
      return acertos / total;
    }
    const corretos = new Set(
      (questao.respostaCorreta || []).map((p) => `${p.esquerdaId}__${p.direitaId}`),
    );
    const acertos = (registro.resposta?.pares || []).filter((p) =>
      corretos.has(`${p.esquerdaId}__${p.direitaId}`),
    ).length;
    return acertos / total;
  }

  if (questao.tipo === 'ordenacao') {
    const total = questao.itens?.length || 0;
    if (!total) return 0;
    const acertos = (questao.respostaCorreta || []).reduce(
      (soma, id, idx) => soma + (registro.resposta?.ordem?.[idx] === id ? 1 : 0),
      0,
    );
    return acertos / total;
  }

  return 0;
}

export function rodadasAbertasDaSala(sala, conteudos = []) {
  if (!sala || sala.fase === 'espera') return 0;
  const maxConteudos = Array.isArray(conteudos) ? conteudos.length : 0;
  if (Number.isInteger(sala.rodadasAbertas)) {
    return Math.min(Math.max(sala.rodadasAbertas, 0), maxConteudos);
  }
  if (sala.iniciadaEmMs === null) return 0;
  const rodadaAtual = Number(sala.rodada) || 0;
  return Math.min(Math.max(rodadaAtual, 0), maxConteudos);
}

export function calcularAvaliacaoParticipante({
  sala,
  participante,
  conteudos = [],
  respostasDoParticipante = [],
  criterioHerois = null,
}) {
  const criterio = criterioHerois || sala?.avaliacao?.criterioHerois || 'primeira_tentativa';
  const valorMaximo = Number(sala?.avaliacao?.valorMaximo) || 0;
  const abertas = rodadasAbertasDaSala(sala, conteudos);

  const elegiveisIndices = [];
  for (let i = 0; i < abertas; i++) {
    if (sala?.modalidade === 'tabuleiro') {
      const eq = equipeDaVezTabuleiro(sala.equipes || [], i + 1);
      if (eq && participante?.equipeId === eq.id) {
        elegiveisIndices.push(i);
      }
    } else {
      elegiveisIndices.push(i);
    }
  }

  const porRodada = new Map();
  for (const r of respostasDoParticipante || []) {
    if (r?.rodada) porRodada.set(Number(r.rodada), r);
  }

  if (elegiveisIndices.length === 0) {
    return {
      situacao: 'sem_oportunidade',
      elegiveis: 0,
      respondidas: 0,
      naoRespondidas: 0,
      acertos: 0,
      parciais: 0,
      erros: 0,
      aproveitamento: null,
      notaCalculada: null,
      detalhesQuestoes: [],
    };
  }

  const participou = Boolean(participante?.entrouEmMs) || porRodada.size > 0;
  if (!participou) {
    return {
      situacao: 'nao_participou',
      elegiveis: elegiveisIndices.length,
      respondidas: 0,
      naoRespondidas: elegiveisIndices.length,
      acertos: 0,
      parciais: 0,
      erros: 0,
      aproveitamento: null,
      notaCalculada: null,
      detalhesQuestoes: elegiveisIndices.map((idx) => ({
        rodada: idx + 1,
        status: 'nao_respondida',
        fracao: 0,
      })),
    };
  }

  let somaFracoes = 0;
  let respondidas = 0;
  let acertos = 0;
  let parciais = 0;
  let erros = 0;
  const detalhesQuestoes = [];

  for (const idx of elegiveisIndices) {
    const rodadaNum = idx + 1;
    const questao = conteudos[idx]?.segredo?.questao;
    const registro = porRodada.get(rodadaNum) || null;
    if (!registro) {
      detalhesQuestoes.push({ rodada: rodadaNum, status: 'nao_respondida', fracao: 0 });
      continue;
    }
    respondidas++;
    const fracao = fracaoQuestao({
      modalidade: sala.modalidade,
      questao,
      registro,
      criterioHerois: criterio,
    });
    somaFracoes += fracao;
    if (fracao >= 0.9999) acertos++;
    else if (fracao > 0) parciais++;
    else erros++;

    detalhesQuestoes.push({
      rodada: rodadaNum,
      enunciado: questao?.enunciado || '',
      respostaCorreta: questao?.respostaCorreta ?? null,
      explicacao: questao?.explicacao || '',
      status: fracao >= 0.9999 ? 'acerto' : fracao > 0 ? 'parcial' : 'erro',
      fracao: arredondarDuasCasas(fracao),
      tentativas: Number(registro.tentativas) || 1,
      primeiraResposta: registro.primeiraResposta ?? registro.resposta ?? null,
      respostaFinal: registro.resposta ?? null,
    });
  }

  const naoRespondidas = elegiveisIndices.length - respondidas;
  const aproveitamento = somaFracoes / elegiveisIndices.length;
  const notaCalculada = valorMaximo > 0 ? arredondarDuasCasas(valorMaximo * aproveitamento) : null;

  return {
    situacao: respondidas === 0 ? 'nao_respondeu' : 'avaliado',
    elegiveis: elegiveisIndices.length,
    respondidas,
    naoRespondidas,
    acertos,
    parciais,
    erros,
    aproveitamento,
    notaCalculada,
    detalhesQuestoes,
  };
}

export function gerarRelatorioSala({
  sala,
  conteudos = [],
  participantes = [],
  respostas = [],
  revisoesPorParticipante = {},
  auditoria = [],
  zerarAusentes = false,
  sincronizacao = null,
}) {
  const porParticipante = new Map();
  const porEquipe = new Map();
  for (const r of respostas || []) {
    if (r?.participanteId) {
      if (!porParticipante.has(r.participanteId)) porParticipante.set(r.participanteId, []);
      porParticipante.get(r.participanteId).push(r);
    }
    if (r?.equipeId) {
      if (!porEquipe.has(r.equipeId)) porEquipe.set(r.equipeId, []);
      porEquipe.get(r.equipeId).push(r);
    }
  }

  const ehCompartilhada = sala?.modoRespostaGrupo === 'compartilhada';
  const ehGrupos = sala?.formatoParticipacao === 'grupos' || ehCompartilhada || (sala?.equipes || []).length > 0;
  const equipesPorId = new Map((sala?.equipes || []).map((e) => [String(e.id), e]));
  const participantesPorId = new Map((participantes || []).map((p) => [String(p.id), p]));
  const criterioColetivo = sala?.avaliacao?.criterioColetivo || 'somente_relatorio';

  const alunos = (participantes || []).map((p) => {
    const respInd = porParticipante.get(p.id) || [];
    const respEfetivas = ehCompartilhada && p.equipeId ? (porEquipe.get(p.equipeId) || []) : respInd;
    const ausenciaConfirmada = p.presenteConfirmado === false;
    const presenteConfirmado = ausenciaConfirmada
      ? false
      : p.presenteConfirmado === true || Boolean(p.entrouEmMs) || respInd.length > 0;
    const presencaStatus = ausenciaConfirmada
      ? 'ausente_confirmado'
      : p.presenteConfirmado === true
        ? 'presente_confirmado'
        : presenteConfirmado
          ? 'presente_sessao'
          : 'nao_confirmado';

    let base;
    if (ehCompartilhada && !presenteConfirmado) {
      base = calcularAvaliacaoParticipante({
        sala,
        participante: { ...p, entrouEmMs: null },
        conteudos,
        respostasDoParticipante: [],
      });
    } else {
      base = calcularAvaliacaoParticipante({
        sala,
        participante: ehCompartilhada ? { ...p, entrouEmMs: p.entrouEmMs || 1 } : p,
        conteudos,
        respostasDoParticipante: respEfetivas,
      });
    }

    const rev = revisoesPorParticipante?.[p.id] || null;
    let notaAutomatica =
      base.situacao === 'nao_participou' && !ausenciaConfirmada && zerarAusentes && sala?.finalidade === 'avaliativa'
        ? 0
        : base.notaCalculada;
    let situacaoFinal = base.situacao;

    if (ehCompartilhada && sala?.finalidade === 'avaliativa' && criterioColetivo === 'somente_relatorio') {
      notaAutomatica = null;
      if (presenteConfirmado && situacaoFinal !== 'sem_oportunidade') {
        situacaoFinal = 'coletivo_sem_lancamento';
      }
    }

    const notaFinal = rev?.notaRevisada !== undefined && rev?.notaRevisada !== null
      ? arredondarDuasCasas(rev.notaRevisada)
      : notaAutomatica;

    const equipe = p.equipeId ? equipesPorId.get(String(p.equipeId)) : null;
    const repPart = equipe?.representanteParticipanteId
      ? participantesPorId.get(String(equipe.representanteParticipanteId))
      : equipe?.representanteAlunoId
        ? (participantes || []).find((cand) => String(cand.alunoId) === String(equipe.representanteAlunoId))
        : null;
    const autoresUnicos = [...new Set(
      respEfetivas.map((r) => r.autoriaNome).filter(Boolean),
    )];

    return {
      participanteId: p.id,
      alunoId: p.alunoId || p.id,
      turmaId: p.turmaId || null,
      nome: p.nomeExibicao || p.nome || 'Estudante',
      equipeId: p.equipeId || null,
      ...(equipe?.nome ? { equipeNome: equipe.nome } : {}),
      pontosJogo: Number(p.pontos) || 0,
      ...base,
      situacao: situacaoFinal,
      ausenciaConfirmada,
      presencaStatus,
      ...(ehGrupos
        ? {
            origemColetiva: ehCompartilhada,
            modoRespostaGrupo: sala?.modoRespostaGrupo || (ehCompartilhada ? 'compartilhada' : 'individual'),
            criterioColetivo,
            representanteNome: repPart?.nomeExibicao || repPart?.nome || null,
            autoresGrupo: autoresUnicos,
          }
        : {}),
      notaCalculada: notaAutomatica,
      notaRevisada: rev?.notaRevisada ?? null,
      justificativaRevisao: rev?.justificativa ?? null,
      notaFinal,
      versaoRevisao: rev?.versao ?? 0,
    };
  });

  const presentes = alunos.filter((a) => a.situacao !== 'nao_participou').length;
  const ausentes = alunos.filter((a) => a.situacao === 'nao_participou').length;
  const ausentesConfirmados = alunos.filter((a) => a.ausenciaConfirmada).length;
  const semOportunidade = alunos.filter((a) => a.situacao === 'sem_oportunidade').length;
  const respostasUnicasGrupos = ehCompartilhada ? (respostas || []).length : null;
  const notasValidas = alunos.map((a) => a.notaFinal).filter((n) => typeof n === 'number');
  const mediaNota = notasValidas.length
    ? arredondarDuasCasas(notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length)
    : null;

  const limitacoes = [];
  if ((sala?.finalidade || 'revisao') !== 'avaliativa') {
    limitacoes.push('Partida de revisão/legada sem critérios avaliativos formais congelados.');
  }
  if (sala?.fase !== 'encerrada') {
    limitacoes.push('Partida ainda em andamento; resultados sujeitos a alteração até o encerramento.');
  }

  return {
    sala: {
      codigo: sala.codigo,
      titulo: sala.titulo,
      modalidade: sala.modalidade,
      formatoParticipacao: sala.formatoParticipacao || null,
      modoRespostaGrupo: sala.modoRespostaGrupo || null,
      finalidade: sala.finalidade || 'revisao',
      fase: sala.fase,
      rodada: sala.rodada,
      totalRodadas: sala.totalRodadas,
      criadoEmMs: sala.criadoEmMs ?? null,
      encerradaEmMs: sala.encerradaEmMs ?? null,
    },
    configuracaoCongelada: sala.avaliacao || null,
    resumoTurma: {
      totalElegiveis: alunos.length,
      presentes,
      ausentes,
      ausentesConfirmados,
      semOportunidade,
      ...(respostasUnicasGrupos !== null ? { respostasUnicasGrupos } : {}),
      mediaNota,
    },
    ...(ehGrupos
      ? {
          equipes: (sala.equipes || []).map((e) => ({
            id: e.id,
            nome: e.nome,
            representanteParticipanteId: e.representanteParticipanteId || null,
            representanteAlunoId: e.representanteAlunoId || null,
            participanteIds: e.participanteIds || [],
          })),
        }
      : {}),
    alunos,
    auditoria: auditoria || [],
    auditoriaRepresentantes: sala.auditoriaRepresentantes || [],
    auditoriaPresencas: sala.auditoriaPresencas || [],
    sincronizacao: sincronizacao || { status: 'pendente', pendencias: [] },
    limitacoes,
  };
}

export function neutralizarCelulaCsv(valor) {
  const texto = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(texto)) return `'${texto}`;
  return texto;
}

function escaparCsv(valor) {
  const seguro = neutralizarCelulaCsv(valor).replace(/"/g, '""');
  return `"${seguro}"`;
}

export function gerarCsvRelatorio(relatorio) {
  const cfg = relatorio?.configuracaoCongelada;
  const resumo = relatorio?.resumoTurma || {};
  const linhas = [
    [
      'Sala',
      relatorio?.sala?.codigo || '',
      'Título',
      cfg?.tituloAtividade || relatorio?.sala?.titulo || '',
      'Formato',
      relatorio?.sala?.formatoParticipacao || 'individual',
      'Modo Grupo',
      relatorio?.sala?.modoRespostaGrupo || '-',
    ].map(escaparCsv).join(','),
    [
      'Modalidade',
      relatorio?.sala?.modalidade || '',
      'Finalidade',
      relatorio?.sala?.finalidade || 'revisao',
      'Ano/Bimestre',
      cfg ? `${cfg.anoLetivo} / ${cfg.bimestre}º Bim` : '-',
      'Valor Máximo',
      cfg?.valorMaximo ?? '-',
      'Critério Coletivo',
      cfg?.criterioColetivo || '-',
      'Presentes',
      resumo.presentes ?? '-',
      'Respostas Únicas Grupos',
      resumo.respostasUnicasGrupos ?? '-',
    ].map(escaparCsv).join(','),
  ];
  const cabecalho = [
    'Aluno',
    'Grupo',
    'Presenca',
    'Origem Nota',
    'Representante/Autoria',
    'Situacao',
    'Elegiveis',
    'Respondidas',
    'Acertos',
    'Parciais',
    'Erros',
    'Aproveitamento (%)',
    'Nota Calculada',
    'Nota Revisada',
    'Nota Final',
    'Justificativa',
  ];
  linhas.push(cabecalho.map(escaparCsv).join(','));
  for (const a of relatorio?.alunos || []) {
    const origem = a.origemColetiva
      ? `Coletiva (${a.criterioColetivo || 'atribuir_presentes'})`
      : a.equipeId
        ? 'Grupo (resposta individual)'
        : 'Individual';
    const autoria = a.autoresGrupo?.length
      ? a.autoresGrupo.join(' / ')
      : a.representanteNome || '';
    linhas.push(
      [
        a.nome,
        a.equipeNome || a.equipeId || '-',
        a.presencaStatus || (a.ausenciaConfirmada ? 'ausente_confirmado' : 'presente'),
        origem,
        autoria,
        a.situacao,
        a.elegiveis,
        a.respondidas,
        a.acertos,
        a.parciais,
        a.erros,
        typeof a.aproveitamento === 'number' ? (a.aproveitamento * 100).toFixed(1) : '',
        typeof a.notaCalculada === 'number' ? a.notaCalculada.toFixed(2) : '',
        typeof a.notaRevisada === 'number' ? a.notaRevisada.toFixed(2) : '',
        typeof a.notaFinal === 'number' ? a.notaFinal.toFixed(2) : '',
        a.justificativaRevisao || '',
      ]
        .map(escaparCsv)
        .join(','),
    );
  }
  return linhas.join('\n');
}
