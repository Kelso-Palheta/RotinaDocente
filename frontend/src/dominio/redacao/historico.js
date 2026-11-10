import { validarPontuacaoCompetencia } from './enemScoreValidator';
import { anoLetivoTurma } from '../diario/evolucao';
import { gerarLoginDoisNomes, resolverLoginsAlunos } from '../../utils/diario/loginAluno';

const normalizarTexto = (valor = '') => String(valor).trim().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLowerCase();

export function anosRedacao(turmas, anosExtras = []) {
  return [...new Set([...turmas.map(t => anoLetivoTurma(t) || 'legado'), ...anosExtras].filter(Boolean).map(String))]
    .sort((a, b) => (Number(b) || 0) - (Number(a) || 0));
}

export function contextosHistorico(redacoes, turmas) {
  const porId = new Map(turmas.map(t => [String(t.id), t]));
  const porLogin = new Map();
  for (const turma of turmas) {
    for (const { aluno, login } of resolverLoginsAlunos(turma.alunos || [])) {
      if (!login || !aluno.id || String(aluno.dataNascimento).replace(/\D/g, '').length !== 4) continue;
      for (const chave of new Set([login, gerarLoginDoisNomes(aluno.nome, aluno.dataNascimento)])) {
        const candidatos = porLogin.get(chave) || [];
        candidatos.push({ turma, aluno });
        porLogin.set(chave, candidatos);
      }
    }
  }

  return new Map(redacoes.map(redacao => {
    let turma = porId.get(String(redacao.turmaId));
    let alunoId = redacao.alunoId;
    const logins = [redacao.loginAluno, redacao.login].filter(Boolean).map(normalizarTexto);
    const login = logins.every(chave => chave === logins[0]) && logins[0];
    if ((!redacao.turmaId || !alunoId) && Number(redacao.schemaVersion || redacao.schemaVersao || 0) < 2 && login) {
      const nome = normalizarTexto(redacao.studentName || '');
      const turmaNome = normalizarTexto(redacao.turmaNome || redacao.studentClass || '');
      const candidatos = (porLogin.get(login) || []).filter(candidato =>
        nome && normalizarTexto(candidato.aluno.nome) === nome
        && (!redacao.turmaId || candidato.turma === turma)
        && (!alunoId || String(candidato.aluno.id) === String(alunoId))
        && (!redacao.anoLetivo || String(anoLetivoTurma(candidato.turma)) === String(redacao.anoLetivo))
        && (!turmaNome || turmaNome === 'n/a' || normalizarTexto(candidato.turma.nome) === turmaNome));
      if (candidatos.length === 1) {
        turma = candidatos[0].turma;
        alunoId = candidatos[0].aluno.id;
      }
    }
    return [redacao.id, {
      turmaId: redacao.turmaId || turma?.id,
      alunoId,
      anoLetivo: redacao.anoLetivo || (turma && anoLetivoTurma(turma)),
    }];
  }));
}

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

export function filtrarRedacoes(redacoes, filtros={}, contextos) {
  const busca=String(filtros.search || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return redacoes.filter(r => {
    if (!filtros.incluirArquivadas && (r.status==='arquivado' || r.arquivado)) return false;
    const contexto = contextos?.get(r.id) || r;
    if (filtros.turmaId && filtros.turmaId!=='all' && String(contexto.turmaId)!==String(filtros.turmaId)) return false;
    if (filtros.anoLetivo && filtros.anoLetivo!=='all' && String(contexto.anoLetivo || 'legado')!==String(filtros.anoLetivo)) return false;
    if (filtros.bimestre && filtros.bimestre!=='all' && String(r.bimestre)!==String(filtros.bimestre)) return false;
    if (filtros.alunoId && filtros.alunoId!=='all' && String(contexto.alunoId)!==String(filtros.alunoId)) return false;
    return `${r.studentName || ''} ${r.essayTheme || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(busca);
  });
}

export function resumoRedacoes(redacoes) {
  const notas=redacoes.map(normalizarNotasHistorico).filter(Boolean);
  return { total:redacoes.length, publicadas:redacoes.filter(r=>r.status==='publicado'||(!r.schemaVersion&&!r.status)).length,
    revisar:redacoes.filter(r=>!['revisado','publicado','arquivado'].includes(r.status)).length,
    avaliacoesCompletas:notas.length, media:notas.length ? Math.round(notas.reduce((sum,r)=>sum+r.total,0)/notas.length) : null };
}
