import { avatarPorId } from '@/dominio/revisao-autonoma/avatares';
import { falha } from '@/dominio/aula-gamificada/comum';
import { PONTOS_ACERTO, criarMundoV2 } from '@/dominio/revisao-autonoma/plataformaV2';

/** Limite de segurança para o documento completo da sessão (Firestore aceita ~1 MiB). */
export const LIMITE_BYTES_SESSAO = 900_000;

export function tamanhoEmBytes(doc) {
  return new TextEncoder().encode(JSON.stringify(doc)).length;
}

/** Monta fases/eventos congelando uma questão por evento. `contagens[i]` = questões da fase i (estrelas + portal). */
export function montarFasesV2(questoes, contagens) {
  let cursor = 0;
  return contagens.map((n, i) => {
    const eventos = [];
    for (let j = 0; j < n; j++) {
      const portal = j === n - 1;
      eventos.push({ id: portal ? `f${i + 1}portal` : `f${i + 1}e${j + 1}`, tipo: portal ? 'portal' : 'estrela', questaoId: questoes[cursor++].id, estado: 'pendente', pontos: 0 });
    }
    return { eventos };
  });
}

const concluidoOuRespondido = (e) => e.estado === 'respondido' || e.estado === 'concluido';
const todosEventos = (s) => s.fases.flatMap((f) => f.eventos);

export function resumoV2(s) {
  const ev = todosEventos(s).filter(concluidoOuRespondido);
  return { id: s.id, schema: 2, avatarId: avatarPorId(s.avatarId).id, professorId: s.professorId, turmaId: s.turmaId, disciplina: s.disciplina, conteudo: s.conteudo, dificuldade: s.dificuldade, fase: s.fase, progresso: ev.length, total: todosEventos(s).length, acertos: ev.filter((e) => e.correta).length, erros: ev.filter((e) => !e.correta).length, pontosJogo: s.pontosJogo, totalFases: s.fases.length, faseAtual: s.faseIndice + 1, atualizadoEmMs: s.atualizadoEmMs };
}

export function projetarV2(s) {
  const fase = s.fases[s.faseIndice];
  const estrelas = fase.eventos.filter((e) => e.tipo === 'estrela');
  const mundo = criarMundoV2(s.faseIndice + 1, estrelas.length, s.layoutVersao === 3 ? 3 : 2);
  const eventos = fase.eventos.map((e) => {
    const pos = e.tipo === 'portal' ? mundo.portal : mundo.estrelas[estrelas.indexOf(e)];
    return { id: e.id, tipo: e.tipo, estado: e.estado, ...(concluidoOuRespondido(e) ? { correta: e.correta } : {}), x: pos.x, y: pos.y };
  });
  const todos = todosEventos(s);
  const respondidos = todos.filter(concluidoOuRespondido);
  const aberto = s.fase !== 'concluida' ? fase.eventos.find((e) => e.id === s.abertoId) : null;
  const q = aberto && s.questoes.find((x) => x.id === aberto.questaoId);
  return {
    schema: 2, avatarId: avatarPorId(s.avatarId).id, layoutVersao: s.layoutVersao === 3 ? 3 : 2, id: s.id, revision: s.revision, fase: s.fase, faseAtual: s.faseIndice + 1, totalFases: s.fases.length,
    disciplina: s.disciplina, conteudo: s.conteudo, dificuldade: s.dificuldade, eventos,
    estrelasTotal: estrelas.length, estrelasRespondidas: estrelas.filter((e) => e.estado === 'concluido').length,
    portalLiberado: estrelas.every((e) => e.estado === 'concluido'),
    pontosJogo: s.pontosJogo, acertos: respondidos.filter((e) => e.correta).length, erros: respondidos.filter((e) => !e.correta).length,
    desafiosRespondidos: respondidos.length, total: todos.length,
    aberto: q ? { eventoId: aberto.id, tipo: aberto.tipo, questao: { id: q.id, enunciado: q.enunciado, alternativas: q.alternativas.map(({ id, texto }) => ({ id, texto })), ...(q.imagem ? { imagem: q.imagem } : {}) } } : null,
    feedback: q && aberto.estado === 'respondido' ? { eventoId: aberto.id, correta: aberto.correta, alternativaId: aberto.alternativaId, respostaCorreta: q.respostaCorreta, explicacao: q.explicacao } : null,
  };
}

export function assinaturaV2(acao, body) {
  return JSON.stringify([acao, body.expectedRevision, body.eventoId || null, body.questaoId || null, body.alternativaId || null]);
}

/** Aplica abrir/responder/confirmar/avancar. Retorna a nova sessão ou `{ semMudanca: true }` quando já está aberto. */
export function aplicarAcaoV2(s, body, acao, agora) {
  if (s.fase === 'concluida') throw falha(409, 'Esta aventura já foi concluída.');
  const atual = { ...s, fases: structuredClone(s.fases), revision: s.revision + 1, atualizadoEmMs: agora };
  const fase = atual.fases[s.faseIndice];
  if (acao === 'avancar') {
    if (s.abertoId) throw falha(409, 'Termine o desafio aberto antes de avançar.');
    if (fase.eventos.find((e) => e.tipo === 'portal')?.estado !== 'concluido') throw falha(409, 'Passe pelo portal e leia o feedback antes de avançar.');
    if (s.faseIndice + 1 === s.fases.length) atual.fase = 'concluida';
    else atual.faseIndice = s.faseIndice + 1;
    return atual;
  }
  const ev = fase.eventos.find((e) => e.id === body.eventoId);
  if (!ev) throw falha(409, 'Desafio não encontrado nesta fase.');
  if (acao === 'abrir') {
    if (s.abertoId === ev.id && ev.estado === 'aberto') return { semMudanca: true };
    if (s.abertoId) throw falha(409, 'Conclua o desafio aberto antes de abrir outro.');
    if (ev.estado !== 'pendente') throw falha(409, 'Este desafio já foi respondido.');
    if (ev.tipo === 'portal' && fase.eventos.some((e) => e.tipo === 'estrela' && e.estado !== 'concluido')) throw falha(409, 'Revise todas as estrelas desta fase antes do portal.');
    ev.estado = 'aberto'; atual.abertoId = ev.id;
    return atual;
  }
  if (acao === 'responder') {
    if (ev.estado !== 'aberto' || s.abertoId !== ev.id) throw falha(409, 'Este desafio já foi respondido ou não está aberto.');
    if (body.questaoId !== ev.questaoId) throw falha(409, 'Esta questão não corresponde ao desafio aberto.');
    const q = s.questoes.find((x) => x.id === ev.questaoId);
    if (!q.alternativas.some((a) => a.id === body.alternativaId)) throw falha(422, 'Escolha uma alternativa válida.');
    ev.alternativaId = body.alternativaId;
    ev.correta = body.alternativaId === q.respostaCorreta;
    ev.pontos = ev.correta ? PONTOS_ACERTO : 0;
    ev.estado = 'respondido';
    atual.pontosJogo = s.pontosJogo + ev.pontos;
    return atual;
  }
  if (acao === 'confirmar') {
    if (ev.estado !== 'respondido') throw falha(409, 'Responda o desafio antes de confirmar a leitura.');
    ev.estado = 'concluido'; atual.abertoId = null;
    return atual;
  }
  throw falha(404, 'Ação desconhecida.');
}
