import { validarPontuacaoCompetencia } from './enemScoreValidator';

export function normalizarNotasHistorico(redacao) {
  if (!redacao || redacao.modo === 'parcial' || redacao.avaliacaoParcial || redacao.tipoAvaliacao === 'parcial') return null;
  const fonte = redacao.competencias || redacao.scores || redacao;
  const notas = {};
  for (let i=1;i<=5;i++) {
    const valor = Array.isArray(redacao.scoreData)
      ? redacao.scoreData.find(item => String(item.subject).toUpperCase() === `C${i}`)?.A
      : fonte[`c${i}`] ?? fonte[`C${i}`];
    if (!validarPontuacaoCompetencia(valor)) return null;
    notas[`c${i}`] = valor;
  }
  const soma = Object.values(notas).reduce((a,b)=>a+b,0);
  const total = redacao.totalScore ?? redacao.total ?? fonte.total;
  if (total !== undefined && total !== null && total !== soma) return null;
  return {...notas,total:soma};
}

export const dataRedacao = redacao => {
  const value=redacao.createdAt || redacao.data;
  if (value?.toDate) return value.toDate();
  if (value?.seconds !== undefined) return new Date(value.seconds*1000);
  return new Date(value || 0);
};

export function filtrarRedacoes(redacoes, filtros={}) {
  const busca=String(filtros.search || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return redacoes.filter(r => {
    if (!filtros.incluirArquivadas && (r.status==='arquivado' || r.arquivado)) return false;
    if (filtros.turmaId && filtros.turmaId!=='all' && r.turmaId!==filtros.turmaId) return false;
    if (filtros.anoLetivo && filtros.anoLetivo!=='all' && String(r.anoLetivo || 'legado')!==String(filtros.anoLetivo)) return false;
    if (filtros.bimestre && filtros.bimestre!=='all' && String(r.bimestre)!==String(filtros.bimestre)) return false;
    if (filtros.alunoId && filtros.alunoId!=='all' && r.alunoId!==filtros.alunoId) return false;
    return `${r.studentName || ''} ${r.essayTheme || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(busca);
  });
}

export function resumoRedacoes(redacoes) {
  const notas=redacoes.map(normalizarNotasHistorico).filter(Boolean);
  return { total:redacoes.length, publicadas:redacoes.filter(r=>r.status==='publicado'||(!r.schemaVersion&&!r.status)).length,
    revisar:redacoes.filter(r=>!['revisado','publicado','arquivado'].includes(r.status)).length,
    avaliacoesCompletas:notas.length, media:notas.length ? Math.round(notas.reduce((sum,r)=>sum+r.total,0)/notas.length) : null };
}
