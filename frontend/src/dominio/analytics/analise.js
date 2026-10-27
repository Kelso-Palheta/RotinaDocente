import { calcTotal, temNota, calcDesempenhoAnual, round2 } from '@/utils/diario/calculos';
import { classificarFaixaNota } from '@/utils/analytics/metricas';
import { faixaNotaBimestral } from '@/utils/diario/coresNota';
import { ROTULOS_APROVACAO } from '@/dominio/diario/aprovacao';

export const rotuloPeriodo = (periodo) =>
  ({ s1: '1º semestre', s2: '2º semestre', ano: 'Ano completo' })[periodo] || `${periodo}º bimestre`;
const preenchido = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const numero = (v, padrao) => (preenchido(v) ? Number(v) : padrao);
export const corFaixa = (faixa) =>
  ({ excelente: '#16a34a', aprovado: '#2563eb', abaixo: '#dc2626', sem_nota: '#94a3b8' })[faixa] || '#94a3b8';

/** Dataset consultivo comum à tela e ao PDF; nunca altera lançamentos. */
export function montarAnalise(turmas = [], periodo = '1') {
  const bimestral = /^[1-4]$/.test(String(periodo));
  const linhas = turmas.flatMap((turma) =>
    (turma.alunos || []).map((aluno) => {
      const b = turma.bimestres?.[String(periodo)] || {};
      const config = b.config || {};
      const atividades = b.atividades || [];
      const lancamentos = b.notas?.[aluno.id];
      let nota = null,
        completo = false,
        situacao,
        faixa,
        classificacao;
      let minimo = numero(config.mediaAprovacao, 5);
      let escala =
        Math.max(0, numero(config.simuladoMaxFinal, 5)) + Math.max(0, numero(config.atividadesMaxFinal, 5));
      if (bimestral) {
        const valido =
          lancamentos &&
          (preenchido(lancamentos.simulado) || atividades.some((a) => preenchido(lancamentos[a.id])));
        if (valido && temNota(lancamentos, atividades))
          nota = calcTotal(lancamentos.simulado, atividades, lancamentos, config);
        completo =
          nota !== null &&
          (numero(config.simuladoMaxFinal, 5) === 0 || preenchido(lancamentos?.simulado)) &&
          atividades.every((a) => preenchido(lancamentos?.[a.id]));
        classificacao = classificarFaixaNota(nota, config);
        faixa = faixaNotaBimestral(nota, config);
        situacao =
          nota === null
            ? 'Sem nota'
            : nota < minimo
              ? 'Abaixo da média'
              : faixa === 'excelente'
                ? 'Excelente'
                : 'Na média';
      } else {
        const anual = calcDesempenhoAnual({ ...turma, bimestres: turma.bimestres || {} }, aluno.id);
        const etapa =
          periodo === 's1'
            ? anual.S1
            : periodo === 's2'
              ? anual.S2
              : {
                  total: anual.totalAnual,
                  status: anual.statusFinal,
                  completo: anual.S1.completo && anual.S2.completo,
                };
        nota = etapa.total;
        completo = etapa.completo;
        minimo = periodo === 'ano' ? 50 : 25;
        const bimestresEtapa = periodo === 's1' ? [1, 2] : periodo === 's2' ? [3, 4] : [1, 2, 3, 4];
        escala = bimestresEtapa.reduce((soma, numeroBimestre) => {
          const c = turma.bimestres?.[numeroBimestre]?.config || {};
          return (
            soma +
            (Math.max(0, numero(c.simuladoMaxFinal, 5)) + Math.max(0, numero(c.atividadesMaxFinal, 5))) *
              (numeroBimestre % 2 ? 2 : 3)
          );
        }, 0);
        situacao = nota === null ? 'Sem nota' : ROTULOS_APROVACAO[etapa.status];
        faixa = nota === null ? 'sem_nota' : !completo ? 'sem_nota' : nota >= minimo ? 'aprovado' : 'abaixo';
        classificacao =
          nota === null ? 'sem_nota' : !completo ? 'andamento' : nota >= minimo ? 'aprovado' : 'recuperacao';
      }
      return {
        alunoId: aluno.id,
        nome: aluno.nome || 'Estudante',
        turmaId: turma.id,
        turmaNome: turma.nome,
        disciplina: turma.disciplina || '',
        periodo: String(periodo),
        bimestre: bimestral ? Number(periodo) : null,
        nota,
        completo,
        parcial: nota !== null && !completo,
        minimo,
        escala,
        situacao,
        faixa,
        classificacao,
        cor: corFaixa(faixa),
        criterio: bimestral
          ? `Mínimo ${minimo}; atenção a partir de ${numero(config.mediaRecuperacao, 4) === 4.99 ? 4 : numero(config.mediaRecuperacao, 4)}; excelente ≥ 8; escala ${escala}`
          : `Mínimo ${minimo}; pesos 2 e 3 por semestre; recuperação conforme Diário`,
      };
    }),
  );
  const avaliados = linhas.filter((l) => l.nota !== null);
  const concluidos = bimestral ? avaliados : avaliados.filter((l) => l.completo);
  const emAtencao = avaliados
    .filter((l) => ['recuperacao', 'critico'].includes(l.classificacao))
    .sort((a, b) => a.nota - b.nota);
  const aprovados = concluidos.filter((l) => ['excelente', 'aprovado'].includes(l.classificacao));
  const escalasDiferentes = new Set(avaliados.map((l) => l.escala)).size > 1;
  const media = (ls) => (ls.length ? round2(ls.reduce((s, l) => s + l.nota, 0) / ls.length) : null);
  const taxa = (n) => (concluidos.length ? round2((n / concluidos.length) * 100) : null);
  const turmasMetricas = turmas.map((t) => {
    const ls = linhas.filter((l) => l.turmaId === t.id),
      av = ls.filter((l) => l.nota !== null),
      m = media(av);
    const escala = ls[0]?.escala || 10;
    const concluidosTurma = bimestral ? av : av.filter((l) => l.completo);
    const aprovadosTurma = concluidosTurma.filter((l) =>
      ['aprovado', 'excelente'].includes(l.classificacao),
    ).length;
    return {
      turmaId: t.id,
      turmaNome: t.nome,
      disciplina: t.disciplina,
      totalAlunos: ls.length,
      totalAvaliados: av.length,
      mediaTurma: m,
      taxaAprovacao: concluidosTurma.length ? round2((aprovadosTurma / concluidosTurma.length) * 100) : null,
      escala,
      percentualEscala: m === null || !escala ? null : round2((m / escala) * 100),
      cor:
        !bimestral && av.some((l) => !l.completo)
          ? '#94a3b8'
          : ls[0]
            ? corFaixa(
                bimestral
                  ? faixaNotaBimestral(m, { mediaAprovacao: ls[0].minimo })
                  : m === null
                    ? 'sem_nota'
                    : m >= ls[0].minimo
                      ? 'aprovado'
                      : 'abaixo',
              )
            : '#94a3b8',
    };
  });
  const distribuicao = {
    excelente: 0,
    aprovado: 0,
    recuperacao: 0,
    critico: 0,
    andamento: 0,
    total: avaliados.length,
  };
  avaliados.forEach((l) => distribuicao[l.classificacao]++);
  return {
    periodo: String(periodo),
    rotulo: rotuloPeriodo(periodo),
    bimestral,
    linhas,
    totalTurmas: turmas.length,
    totalAlunos: linhas.length,
    totalAvaliados: avaliados.length,
    totalConcluidos: concluidos.length,
    totalSemNota: linhas.length - avaliados.length,
    totalParciais: avaliados.filter((l) => l.parcial).length,
    mediaGeral: escalasDiferentes ? null : media(avaliados),
    escalasDiferentes,
    criteriosDiferentes: new Set(linhas.map((l) => l.criterio)).size > 1,
    taxaAprovacao: taxa(aprovados.length),
    taxaAtencao: taxa(emAtencao.length),
    emAtencao,
    distribuicao,
    turmasMetricas,
  };
}
