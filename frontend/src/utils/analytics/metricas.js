/**
 * Módulo de Métricas e Agregações Estatísticas — Dashboard Analytics Pedagógico
 * Referência: specs/RULES.md (RN-17, RN-18)
 */

import { calcTotal, temNota, round2 } from '../diario/calculos';

/**
 * Classifica a faixa de nota do aluno conforme RN-18.
 * @param {number|null} nota
 * @returns {'excelente' | 'aprovado' | 'recuperacao' | 'critico' | 'sem_nota'}
 */
export function classificarFaixaNota(nota, config = {}) {
  if (nota === null || nota === undefined || nota === '' || !Number.isFinite(Number(nota))) {
    return 'sem_nota';
  }
  const aprovacao = Number(config.mediaAprovacao ?? 5);
  const recuperacao = Number(config.mediaRecuperacao ?? 4);
  if (nota < aprovacao) return nota >= (recuperacao === 4.99 ? 4 : recuperacao) ? 'recuperacao' : 'critico';
  if (nota >= 8.0) return 'excelente';
  return 'aprovado';
}

/**
 * Calcula as métricas de uma turma específica para um determinado bimestre.
 * @param {object} turma - Objeto da turma com alunos e bimestres
 * @param {string|number} bimestre - Número do bimestre ('1', '2', '3', '4')
 * @returns {object} Métricas da turma
 */
export function calcularMetricasTurma(turma, bimestre = '1') {
  if (!turma) {
    return {
      totalAlunos: 0,
      totalAvaliados: 0,
      mediaTurma: null,
      taxaAprovacao: 0,
      taxaRecuperacao: 0,
      taxaRisco: 0,
      notasValidas: [],
    };
  }

  const bKey = String(bimestre);
  const bData = turma.bimestres?.[bKey] || { config: {}, atividades: [], notas: {} };
  const { atividades = [], notas = {}, config } = bData;
  const alunos = turma.alunos || [];

  const notasValidas = [];
  let aprovados = 0;
  let emRecuperacao = 0;
  let emRisco = 0;

  alunos.forEach((aluno) => {
    const notaObj = notas[aluno.id];
    if (temNota(notaObj, atividades)) {
      const total = calcTotal(notaObj?.simulado, atividades, notaObj, config);
      notasValidas.push({
        alunoId: aluno.id,
        nome: aluno.nome,
        nota: total,
        classificacao: classificarFaixaNota(total, config),
      });

      if (total >= (config?.mediaAprovacao ?? 5)) {
        aprovados++;
      } else if (classificarFaixaNota(total, config) === 'recuperacao') {
        emRecuperacao++;
      } else {
        emRisco++;
      }
    }
  });

  const totalAvaliados = notasValidas.length;
  const mediaTurma =
    totalAvaliados > 0
      ? round2(notasValidas.reduce((acc, item) => acc + item.nota, 0) / totalAvaliados)
      : null;

  return {
    turmaId: turma.id,
    turmaNome: turma.nome,
    disciplina: turma.disciplina,
    totalAlunos: alunos.length,
    totalAvaliados,
    mediaTurma,
    taxaAprovacao: totalAvaliados > 0 ? round2((aprovados / totalAvaliados) * 100) : 0,
    taxaRecuperacao: totalAvaliados > 0 ? round2((emRecuperacao / totalAvaliados) * 100) : 0,
    taxaRisco: totalAvaliados > 0 ? round2((emRisco / totalAvaliados) * 100) : 0,
    notasValidas,
  };
}

/**
 * Consolida as métricas globais para um conjunto de turmas.
 * @param {Array} turmas
 * @param {string|number} bimestre
 * @returns {object}
 */
export function calcularMetricasGlobais(turmas = [], bimestre = '1') {
  if (!Array.isArray(turmas) || turmas.length === 0) {
    return {
      totalTurmas: 0,
      totalAlunos: 0,
      totalAvaliados: 0,
      mediaGeral: null,
      taxaAprovacao: 0,
      taxaRisco: 0,
      turmasMetricas: [],
    };
  }

  let totalAlunos = 0;
  let totalAvaliados = 0;
  let somaNotas = 0;
  let totalAprovados = 0;
  let totalRisco = 0;
  const turmasMetricas = [];

  turmas.forEach((turma) => {
    const metrica = calcularMetricasTurma(turma, bimestre);
    turmasMetricas.push(metrica);
    totalAlunos += metrica.totalAlunos;
    totalAvaliados += metrica.totalAvaliados;

    metrica.notasValidas.forEach((nv) => {
      somaNotas += nv.nota;
      if (nv.classificacao === 'excelente' || nv.classificacao === 'aprovado') {
        totalAprovados++;
      } else if (nv.classificacao === 'critico') {
        totalRisco++;
      }
    });
  });

  const mediaGeral = totalAvaliados > 0 ? round2(somaNotas / totalAvaliados) : null;
  const taxaAprovacao = totalAvaliados > 0 ? round2((totalAprovados / totalAvaliados) * 100) : 0;
  const taxaRisco = totalAvaliados > 0 ? round2((totalRisco / totalAvaliados) * 100) : 0;

  return {
    totalTurmas: turmas.length,
    totalAlunos,
    totalAvaliados,
    mediaGeral,
    taxaAprovacao,
    taxaRisco,
    turmasMetricas,
  };
}

/**
 * Calcula a evolução histórica da média de uma turma (ou de todas) ao longo dos 4 bimestres.
 * @param {object|Array} turmaOuTurmas
 * @returns {Array<{ bimestre: string, media: number|null, avaliados: number }>}
 */
export function calcularEvolucaoBimestral(turmaOuTurmas) {
  const bimestres = ['1', '2', '3', '4'];
  const labels = ['1º Bim', '2º Bim', '3º Bim', '4º Bim'];

  const isArray = Array.isArray(turmaOuTurmas);

  return bimestres.map((b, idx) => {
    if (isArray) {
      const globais = calcularMetricasGlobais(turmaOuTurmas, b);
      return {
        bimestre: labels[idx],
        numero: Number(b),
        media: globais.mediaGeral,
        avaliados: globais.totalAvaliados,
      };
    }

    const metricas = calcularMetricasTurma(turmaOuTurmas, b);
    return {
      bimestre: labels[idx],
      numero: Number(b),
      media: metricas.mediaTurma,
      avaliados: metricas.totalAvaliados,
    };
  });
}

/**
 * Calcula a distribuição quantitativa de notas em 4 faixas pedagógicas.
 * @param {object|Array} turmaOuTurmas
 * @param {string|number} bimestre
 * @returns {object} Contagem por faixa
 */
export function calcularDistribuicaoNotas(turmaOuTurmas, bimestre = '1') {
  const distribuicao = {
    excelente: 0,
    aprovado: 0,
    recuperacao: 0,
    critico: 0,
    total: 0,
  };

  const processarNotas = (notasValidas) => {
    notasValidas.forEach((nv) => {
      if (distribuicao[nv.classificacao] !== undefined) {
        distribuicao[nv.classificacao]++;
        distribuicao.total++;
      }
    });
  };

  if (Array.isArray(turmaOuTurmas)) {
    turmaOuTurmas.forEach((t) => {
      const metrica = calcularMetricasTurma(t, bimestre);
      processarNotas(metrica.notasValidas);
    });
  } else if (turmaOuTurmas) {
    const metrica = calcularMetricasTurma(turmaOuTurmas, bimestre);
    processarNotas(metrica.notasValidas);
  }

  return distribuicao;
}

/**
 * Identifica e ordena os estudantes com notas em faixa de risco/recuperação para intervenção preventiva.
 * @param {Array} turmas
 * @param {string|number} bimestre
 * @returns {Array<object>} Alunos em risco ordenados da menor para a maior nota
 */
export function obterAlunosEmRisco(turmas = [], bimestre = '1') {
  const turmasList = Array.isArray(turmas) ? turmas : [turmas];
  const emRisco = [];

  turmasList.forEach((turma) => {
    if (!turma) return;
    const metrica = calcularMetricasTurma(turma, bimestre);
    metrica.notasValidas.forEach((nv) => {
      if (nv.classificacao === 'critico' || nv.classificacao === 'recuperacao') {
        emRisco.push({
          alunoId: nv.alunoId,
          nome: nv.nome,
          turmaId: turma.id,
          turmaNome: turma.nome,
          disciplina: turma.disciplina,
          nota: nv.nota,
          classificacao: nv.classificacao,
          bimestre: Number(bimestre),
          minimo: Number(turma.bimestres?.[String(bimestre)]?.config?.mediaAprovacao ?? 5),
        });
      }
    });
  });

  // Ordena prioritariamente da menor nota (mais crítico) para a maior
  return emRisco.sort((a, b) => a.nota - b.nota);
}
