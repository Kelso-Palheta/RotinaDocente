/** Autoriza propriedade com vínculo atual. Identidades contraditórias nunca prevalecem. */
export function podeLerRedacao(redacao, session, vinculo, professorUid) {
  if (!redacao || !session || !vinculo || vinculo.professorUid !== professorUid) return false;
  if (redacao.publicado === false || redacao.archivedAt || redacao.arquivadoEm || redacao.arquivada || redacao.arquivado || ['arquivado','arquivada','rascunho','corrigido','revisado','draft','archived','corrected','reviewed'].includes(redacao.status)) return false;
  const v2 = Number(redacao.schemaVersion || redacao.schemaVersao || 0) >= 2;
  if (v2 && redacao.status !== 'publicado') return false;
  if (redacao.alunoId && redacao.alunoId !== vinculo.alunoId) return false;
  if (redacao.turmaId && redacao.turmaId !== vinculo.turmaId) return false;
  if (redacao.loginKey && redacao.loginKey !== session.loginKey) return false;
  const logins = [redacao.loginAluno,redacao.login].filter(Boolean);
  if (logins.some(login => String(login).toLowerCase() !== String(session.login || '').toLowerCase())) return false;
  const login = logins[0];
  if (v2) return Boolean(vinculo.alunoId && vinculo.turmaId && redacao.alunoId === vinculo.alunoId && redacao.turmaId === vinculo.turmaId);
  return Boolean(redacao.id === session.loginKey || redacao.loginKey === session.loginKey || (login && String(login).toLowerCase() === String(session.login || '').toLowerCase()));
}

/** Projeção deliberada: não expor identidade de acesso, revisões ou observações internas. */
export function redacaoPublica(redacao) {
  const fields = ['id','studentName','studentClass','essayTheme','text','originalText','result','scoreData','scores','totalScore','createdAt','updatedAt','publishedAt','publicadoEm','revisadoEm','dataCorrecao','bimestre','anoLetivo','status','tipoCorrecao','metodoCorrecao','modo','assessmentMode','anulada','schemaVersion','version','rubricaVersao','motivoAnulacao'];
  return Object.fromEntries(fields.filter(key => redacao[key] !== undefined).map(key => [key,redacao[key]]));
}
