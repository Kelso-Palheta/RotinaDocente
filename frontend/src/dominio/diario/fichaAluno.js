/**
 * Domínio: Diário Pedagógico
 * Consolidação da Ficha 360º Individual do Aluno (Conselho de Classe e Reunião de Pais)
 * Referência: specs/RULES.md (RN-57) e specs/TESTS_SPEC.md (UT-31)
 */

import { calcDesempenhoAnual } from '@/utils/diario/calculos';
import { consolidarFrequenciaTurma } from './frequenciaEscolar';
import { CATEGORIAS_MAP } from '../adaptacoes/CategoriasDeficiencia';

/**
 * Recomendações pedagógicas canônicas por necessidade educacional específica DUA
 */
const RECOMENDACOES_DUA = {
  tdah: [
    'Fragmentação de instruções em etapas curtas e objetivas.',
    'Assento preferencial na primeira fileira, longe de janelas e portas.',
    'Pausas programadas e tempo estendido para avaliações escritas.',
  ],
  tea: [
    'Antecipação da rotina e avisos prévios sobre mudanças de horários.',
    'Comunicação literal e direta, evitando metáforas abstratas nos enunciados.',
    'Espaço silencioso de descompressão sensorial quando necessário.',
  ],
  baixa_visao: [
    'Materiais ampliados com fonte sem serifa (mínimo 18pt) e alto contraste.',
    'Iluminação adequada na mesa do estudante e permissão para uso de lupa/recursos ópticos.',
    'Audiodescrição das imagens, gráficos e esquemas apresentados em aula.',
  ],
  cegueira: [
    'Textos em Braille e leitores de tela digitais acessíveis.',
    'Audiodescrição completa de todos os recursos visuais.',
  ],
  surdez: [
    'Apoio de intérprete de Libras e estímulo a recursos altamente visuais.',
    'Contato visual ao falar e posicionamento de frente para o aluno.',
  ],
  deficiencia_auditiva: [
    'Articulação clara dos lábios e redução de ruídos de fundo no ambiente.',
    'Apoio de legendas em materiais audiovisuais.',
  ],
  di: [
    'Uso de recursos concretos do cotidiano e scaffolding com pistas visuais.',
    'Enunciados com uma ideia central por parágrafo.',
  ],
  altas_habilidades: [
    'Atividades de enriquecimento curricular e aprofundamento investigativo.',
    'Projetos interdisciplinares desafiadores e protagonismo do estudante.',
  ],
  dislexia: [
    'Tempo estendido para leitura e avaliação sem penalização por trocas ortográficas.',
    'Suporte com leitores de texto (TTS) e fonte sem serifa com entrelinhas 1.5.',
  ]
};

/**
 * Consolida a visão pedagógica holística 360º de um estudante.
 * 
 * @param {Object} params
 * @param {Object} params.aluno - Dados cadastrais do estudante
 * @param {Object} params.turma - Dados da turma com avaliações e configurações
 * @param {Object} [params.frequenciasTurma] - Histórico de chamadas da turma
 * @param {Array<Object>} [params.historicoRedacoes] - Redações corrigidas do aluno
 * @param {string} [params.parecerManual] - Parecer qualitativo digitado pelo professor
 * @returns {Object} Ficha 360 consolidada
 */
export function consolidarFichaAluno360({
  aluno,
  turma,
  frequenciasTurma = null,
  historicoRedacoes = null,
  parecerManual = '',
}) {
  if (!aluno) {
    throw new Error('Aluno não informado para consolidação da ficha 360º');
  }

  const alunoId = aluno.id || aluno.uid;

  // 1. DADOS DE IDENTIFICAÇÃO
  const identificacao = {
    id: alunoId,
    nome: aluno.nome || 'Estudante Sem Nome',
    matricula: aluno.matricula || aluno.codigo || '—',
    turmaNome: turma?.nome || 'Turma não informada',
    disciplina: turma?.disciplina || 'Geral',
    anoLetivo: turma?.ano || new Date().getFullYear(),
    emissaoEm: new Date().toISOString(),
  };

  // 2. RENDIMENTO ACADÊMICO
  let bimestres = [null, null, null, null];
  let situacao = 'Em curso';
  let totalAnual = null;

  if (turma?.bimestres) {
    const desempenho = calcDesempenhoAnual(turma, alunoId);
    bimestres = desempenho.bimTotais || [null, null, null, null];
    totalAnual = desempenho.totalAnual;
    if (desempenho.statusFinal === 'good') situacao = 'Aprovado';
    else if (desempenho.statusFinal === 'warn') situacao = 'Recuperação';
    else if (desempenho.statusFinal === 'bad') situacao = 'Reprovado por Nota';
  } else if (Array.isArray(turma?.avaliacoes)) {
    // Suporte tolerante à estrutura direta de avaliações
    for (let b = 1; b <= 4; b++) {
      const avs = turma.avaliacoes.filter((a) => Number(a.bimestre) === b && a.notas?.[alunoId] !== undefined);
      if (avs.length > 0) {
        const soma = avs.reduce((acc, a) => acc + (Number(a.notas[alunoId]) || 0), 0);
        bimestres[b - 1] = Math.round((soma / avs.length) * 100) / 100;
      }
    }
    const bimValidos = bimestres.filter((v) => v !== null);
    if (bimValidos.length > 0) {
      const media = bimValidos.reduce((a, b) => a + b, 0) / bimValidos.length;
      totalAnual = Math.round(media * 10) / 10;
      situacao = totalAnual >= 6 ? 'Aprovado' : 'Recuperação';
    }
  }

  // 3. FREQUÊNCIA E ASSIDUIDADE LDB
  let frequenciaConsolidada = {
    totalAulas: 0,
    presencas: 0,
    faltas: 0,
    faltasJustificadas: 0,
    percentual: 100,
    statusLdb: 'regular',
    alertaLegal: 'Frequência regular em conformidade com o Art. 24 da LDB.',
  };

  if (frequenciasTurma && typeof frequenciasTurma === 'object') {
    const consolidadoAlunos = consolidarFrequenciaTurma([aluno], frequenciasTurma);
    if (consolidadoAlunos.length > 0) {
      const freq = consolidadoAlunos[0];
      let alertaLegal = 'Frequência regular em conformidade com o Art. 24 da LDB.';
      if (freq.statusLdb === 'critico') {
        alertaLegal = 'Atenção: Estudante ultrapassou o limite de 25% de faltas permitido pelo Art. 24 da LDB (Risco iminente de reprovação).';
      } else if (freq.statusLdb === 'alerta') {
        alertaLegal = 'Alerta: Estudante aproxima-se do limite de 25% de faltas previsto pelo Art. 24 da LDB.';
      }

      frequenciaConsolidada = {
        totalAulas: freq.totalAulas,
        presencas: freq.presencas,
        faltas: freq.faltas,
        faltasJustificadas: freq.faltasJustificadas,
        percentual: freq.percentual,
        statusLdb: freq.statusLdb,
        alertaLegal,
      };
    }
  }

  // 4. PERFIL INCLUSIVO DUA
  const necessidadesAluno = Array.isArray(aluno.necessidades) ? aluno.necessidades : [];
  const temNecessidades = necessidadesAluno.length > 0;
  const recomendacoes = [];
  const labelsNecessidades = [];

  if (temNecessidades) {
    necessidadesAluno.forEach((id) => {
      const cat = CATEGORIAS_MAP?.[id];
      labelsNecessidades.push(cat?.nome || id.toUpperCase());
      const recs = RECOMENDACOES_DUA[id] || [];
      recs.forEach((r) => {
        if (!recomendacoes.includes(r)) recomendacoes.push(r);
      });
    });
  } else {
    recomendacoes.push('Perfil de Desenvolvimento Regular sem adaptações específicas cadastradas.');
  }

  // 5. HISTÓRICO DE REDAÇÃO ENEM
  let redacaoConsolidada = null;
  if (Array.isArray(historicoRedacoes) && historicoRedacoes.length > 0) {
    const totalRedacoes = historicoRedacoes.length;
    const somaPontuacao = historicoRedacoes.reduce((acc, r) => acc + (Number(r.pontuacaoTotal) || 0), 0);
    const mediaTotal = Math.round(somaPontuacao / totalRedacoes);

    // Médias por competência (C1 a C5)
    const comps = ['c1', 'c2', 'c3', 'c4', 'c5'];
    const mediasComps = {};
    comps.forEach((c) => {
      const notas = historicoRedacoes
        .map((r) => r.competencias?.[c])
        .filter((n) => typeof n === 'number');
      if (notas.length > 0) {
        mediasComps[c.toUpperCase()] = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
      }
    });

    const entries = Object.entries(mediasComps);
    let competenciaAlvo = 'C1';
    let competenciaDestaque = 'C1';

    if (entries.length > 0) {
      entries.sort((a, b) => a[1] - b[1]);
      competenciaAlvo = entries[0][0]; // menor nota
      competenciaDestaque = entries[entries.length - 1][0]; // maior nota
    }

    redacaoConsolidada = {
      totalRedacoes,
      mediaTotal,
      mediasCompetencias: mediasComps,
      competenciaAlvo,
      competenciaDestaque,
    };
  }

  return {
    aluno: identificacao,
    turma: {
      id: turma?.id,
      nome: identificacao.turmaNome,
      disciplina: identificacao.disciplina,
      ano: identificacao.anoLetivo,
    },
    academico: {
      bimestres,
      totalAnual,
      situacao,
    },
    frequencia: frequenciaConsolidada,
    inclusao: {
      temNecessidades,
      necessidades: necessidadesAluno,
      labels: labelsNecessidades,
      recomendacoes,
    },
    redacao: redacaoConsolidada,
    parecerPedagogico: parecerManual || '',
  };
}
