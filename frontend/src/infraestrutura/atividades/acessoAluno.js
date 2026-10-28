import { decodeToken, chaveVinculoAtividade } from '@/utils/diario/tokenUtils';
import { getSessionFromRequest } from '@/lib/aluno/session';
import { ehAtividadeRecuperacao } from '@/dominio/atividades/recuperacaoSemestral';
export const erroAcesso = (status, mensagem) => Object.assign(new Error(mensagem), { status });
const idValido = id => typeof id === 'string' && id.length > 0 && id.length <= 512 && !id.includes('/');

/** O mesmo leitor permite revalidar todas as credenciais dentro da transação de entrega. */
export async function autorizarAtividade({ db, request, activityId, token, somenteLeitura = false, ler = ref => ref.get() }) {
  if (!token) throw erroAcesso(401, 'Faça login no Portal ou utilize um link de acesso válido.');
  const decoded = decodeToken(token);
  if (!idValido(activityId) || !decoded || decoded.activityId !== activityId) throw erroAcesso(403, 'Acesso inválido.');
  const atvSnap = await ler(db.doc(`atividades/${activityId}`));
  if (!atvSnap.exists) throw erroAcesso(404, 'Atividade não encontrada.');
  const atividade = { ...atvSnap.data(), id: activityId };
  if (['rascunho', 'publicando'].includes(atividade.status) || (atividade.status === 'arquivada' && !somenteLeitura)) throw erroAcesso(403, 'Atividade indisponível.');
  const tokenId = decoded.turmaId ? chaveVinculoAtividade(decoded.turmaId, decoded.alunoId) : decoded.alunoId;
  const tokenSnap = await ler(db.doc(`atividades/${activityId}/tokens/${tokenId}`));
  if (!tokenSnap.exists) throw erroAcesso(403, 'Acesso não emitido ou revogado.');
  const info = tokenSnap.data();
  if (info.token !== token || info.revogado || info.alunoId !== decoded.alunoId || !idValido(info.turmaId) || (decoded.turmaId && decoded.turmaId !== info.turmaId) || !atividade.turmaIds?.includes(info.turmaId) || (atividade.alunoExclusivoId && atividade.alunoExclusivoId !== info.alunoId)) throw erroAcesso(403, 'Acesso não autorizado para esta turma/aluno.');
  if (ehAtividadeRecuperacao(atividade) && (!Array.isArray(atividade.destinatariosIds) || !atividade.destinatariosIds.includes(info.alunoId))) throw erroAcesso(403, 'Este aluno não é destinatário da recuperação.');
  if (!decoded.segredo) {
    const session = getSessionFromRequest(request);
    if (!session?.loginKey || !idValido(session.loginKey)) throw erroAcesso(401, 'Entre no Portal do Aluno para utilizar este link antigo.');
    const vinculo = await ler(db.doc(`alunoLogin/${session.loginKey}/vinculos/${atividade.professorId}`));
    const dados = vinculo.exists ? vinculo.data() : {};
    if (dados.professorUid !== atividade.professorId || dados.turmaId !== info.turmaId || dados.alunoId !== info.alunoId) throw erroAcesso(403, 'Este acesso pertence a outro aluno.');
  }
  let diario = await ler(db.doc(`professores/${atividade.professorId}/turmas/data`));
  if (!diario.exists) {
    for (const path of [`users/${atividade.professorId}/turmas/data`, `professores/${atividade.professorId}`]) {
      const legado = await ler(db.doc(path));
      if (legado.exists && Array.isArray(legado.data().turmas)) { diario = legado; break; }
    }
  }
  const turma = diario.exists && diario.data().turmas?.find(t => t.id === info.turmaId && (somenteLeitura || !t.arquivada));
  if (!turma?.alunos?.some(a => a.id === info.alunoId)) throw erroAcesso(403, 'Aluno sem vínculo ativo com esta turma.');
  return { atividade, alunoInfo: { alunoId: info.alunoId, turmaId: info.turmaId, nome: info.nome || '' } };
}

export async function buscarEntregaAutorizada(db, activityId, info, ler = ref => ref.get()) {
  const novoId = `${activityId}__${chaveVinculoAtividade(info.turmaId, info.alunoId)}`;
  const atual = await ler(db.doc(`entregas/${novoId}`));
  if (atual.exists) return { ...atual.data(), id: novoId };
  const antigoId = `${activityId}_${info.alunoId}`;
  const antiga = await ler(db.doc(`entregas/${antigoId}`));
  if (antiga.exists && antiga.data().turmaId === info.turmaId && antiga.data().alunoId === info.alunoId) return { ...antiga.data(), id: antigoId };
  return null;
}
