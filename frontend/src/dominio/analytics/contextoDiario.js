import { anoLetivoTurma } from '@/dominio/diario/evolucao';
/** Navegação consultiva por IDs: nunca cria turmas nem migra dados. */
export function resolverContextoAnalytics(query, turmas) {
  const params = new URLSearchParams(query);
  const turma = turmas.find((t) => t.id === params.get('turmaId'));
  if (!turma) return null;
  const b = Number(params.get('bimestre'));
  return {
    turmaId: turma.id,
    ano: anoLetivoTurma(turma) ? String(anoLetivoTurma(turma)) : 'legado',
    arquivadas: Boolean(turma.arquivada),
    bimestre: [1, 2, 3, 4].includes(b) ? b : 1,
    alunoId: turma.alunos?.find((a) => a.id === params.get('alunoId'))?.id || null,
  };
}
