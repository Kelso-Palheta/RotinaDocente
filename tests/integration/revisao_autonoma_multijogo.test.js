import { describe, expect, it } from 'vitest';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';
const aluno = { tipo: 'aluno', loginKey: 'c'.repeat(64) }, prof = { tipo: 'professor', uid: 'p1' };
const base = { revision: 1, status: 'revisada', disciplina: 'História', anoEscolar: '8º ano', conteudo: 'Patrimônio cultural', dificuldade: 'facil', enunciado: 'Resolva o desafio de patrimônio cultural.', explicacao: 'Preservar o patrimônio permite conhecer nossa história.' };
const questoes = [
  { ...base, id: 'quizq', tipo: 'multipla_escolha', alternativas: [{ id: 'A', texto: 'Preservar' }, { id: 'B', texto: 'Destruir' }], respostaCorreta: 'A' },
  { ...base, id: 'paresq', tipo: 'pares', pares: [{ id: 'pa', esquerda: { id: 'u9', texto: 'Museu' }, direita: { id: 'k3', texto: 'Acervo histórico' } }, { id: 'pb', esquerda: { id: 'f2', texto: 'Monumento' }, direita: { id: 'x8', texto: 'Memória pública' } }], respostaCorreta: [{ esquerdaId: 'u9', direitaId: 'k3' }, { esquerdaId: 'f2', direitaId: 'x8' }] },
  { ...base, id: 'ordemq', tipo: 'ordenacao', itens: [{ id: 'r9', texto: 'Conhecer' }, { id: 'b3', texto: 'Preservar' }], respostaCorreta: ['r9', 'b3'] },
];
function fixture() {
  const docs = new Map([
    ['professores/p1/turmas/data', { turmas: [{ id: 't1', nome: 'Turma 1', alunos: [{ id: 'a1', nome: 'Ana' }] }] }],
    [`alunoLogin/${aluno.loginKey}/vinculos/p1`, { professorUid: 'p1', turmaId: 't1', alunoId: 'a1' }],
    ...questoes.map(q => [`aulaGamificadaDocentes/p1/questoes/${q.id}`, structuredClone(q)]),
  ]);
  const copy = x => x == null ? null : structuredClone(x);
  const store = { async get(p) { return copy(docs.get(p)); }, async list(p) { return [...docs].filter(([k]) => k.startsWith(p + '/') && !k.slice(p.length + 1).includes('/')).map(([,v]) => copy(v)); }, async transaction(fn) { let escreveu = false; const escritos = new Map(); const r = await fn({ get: p => { if (escreveu) throw Error('Leitura após escrita'); return store.get(p); }, list: p => { if (escreveu) throw Error('Leitura após escrita'); return store.list(p); }, set: (p,v) => { escreveu = true; escritos.set(p, copy(v)); } }); escritos.forEach((v,k) => docs.set(k,v)); return r; } };
  let n = 0;
  const svc = new RevisaoAutonomaService({ store, agora: () => 1000, gerarId: () => `solo_${++n}` });
  return { svc, docs, async liberar() { for (const q of questoes) await svc.publicar(prof, { questaoId: q.id, expectedRevision: 1, turmaIds: ['t1'] }); }, async criar(modalidade) { return (await svc.criarSessao(aluno, { professorId: 'p1', disciplina: base.disciplina, conteudo: base.conteudo, dificuldade: 'facil', quantidade: 1, modalidade, requestId: `novo_${modalidade}` })).sessao; } };
}
const modos = ['quiz', 'equipes', 'herois', 'tabuleiro', 'natacao', 'acerte_perde', 'memoria', 'associacao', 'ordenacao'];
describe('treino autônomo das nove modalidades', () => {
  it.each(modos)('%s: criar, jogar, revelar, avançar, concluir e retomar sem professor', async modo => {
    const f = fixture(); await f.liberar();
    const catalogo = await f.svc.catalogo(aluno);
    expect(catalogo.jogos.some(c => c.modalidades.includes(modo))).toBe(true);
    let s = await f.criar(modo);
    expect(s.schema).toBe(3); expect(s.modalidade).toBe(modo);
    expect(JSON.stringify(s)).not.toContain('respostaCorreta');
    let seq = 0;
    const responder = async resposta => { s = (await f.svc.responder(aluno, s.id, { resposta, questaoId: s.questao.id, expectedRevision: s.revision, requestId: `resp_${++seq}` })).sessao; };
    if (modo === 'memoria') {
      expect(JSON.stringify(s)).not.toContain('Acervo histórico');
      for (const virarId of ['u9','k3','f2','x8']) await responder({ virarId });
    } else if (modo === 'associacao') await responder({ pares: questoes[1].respostaCorreta });
    else if (modo === 'ordenacao') await responder({ ordem: questoes[2].respostaCorreta });
    else await responder({ alternativaId: 'A' });
    expect(s.fase).toBe('feedback'); expect(s.acertos).toBe(1); expect(s.pontosJogo).toBe(1000);
    expect(s.feedback.explicacao).toBe(base.explicacao);
    s = (await f.svc.avancar(aluno, s.id, { expectedRevision: s.revision, requestId: 'avanco' })).sessao;
    expect(s.fase).toBe('concluida');
    expect((await f.svc.obterSessao(aluno, s.id)).sessao.modalidade).toBe(modo);
    expect((await f.svc.historico(aluno)).sessoes[0]).toMatchObject({ modalidade: modo, acertos: 1, pontosJogo: 1000 });
    expect([...f.docs.keys()].some(k => /notas|boletim|diario/.test(k))).toBe(false);
  });
  it('retry é idempotente e outro payload/revisão não sobrescreve resultado', async () => {
    const f = fixture(); await f.liberar(); const s = await f.criar('quiz');
    const body = { resposta: { alternativaId: 'B' }, questaoId: s.questao.id, expectedRevision: s.revision, requestId: 'retry' };
    const r = await f.svc.responder(aluno, s.id, body);
    expect(await f.svc.responder(aluno, s.id, body)).toEqual(r);
    await expect(f.svc.responder(aluno, s.id, { ...body, resposta: { alternativaId: 'A' } })).rejects.toMatchObject({ status: 409 });
    expect(r.sessao.acertos).toBe(0); expect(r.sessao.erros).toBe(1);
  });
  it('autorização é renovada em cada ação e outra conta não acessa sessão', async () => {
    const f = fixture(); await f.liberar(); const s = await f.criar('quiz');
    await expect(f.svc.obterSessao({ tipo: 'aluno', loginKey: 'd'.repeat(64) }, s.id)).rejects.toMatchObject({ status: 404 });
    const q = f.docs.get('aulaGamificadaDocentes/p1/questoes/quizq'); q.revisaoAutonomaLiberada = false; q.turmaIdsRevisaoAutonoma = [];
    await expect(f.svc.responder(aluno,s.id,{ resposta: { alternativaId:'A' }, questaoId:s.questao.id, expectedRevision:s.revision, requestId:'revogado' })).rejects.toMatchObject({ status:403 });
  });
  it('memória não aceita carta inventada e mantém faces ocultas até virada autorizada', async () => {
    const f = fixture(); await f.liberar(); const s = await f.criar('memoria');
    await expect(f.svc.responder(aluno,s.id,{ resposta: { virarId:'inexistente' }, questaoId:s.questao.id, expectedRevision:s.revision, requestId:'carta' })).rejects.toMatchObject({ status:422 });
    expect((await f.svc.obterSessao(aluno,s.id)).sessao.revision).toBe(s.revision);
  });
});
it.each(['quiz','memoria','associacao','ordenacao','equipes','herois','tabuleiro','natacao','acerte_perde'])('%s: projeção autônoma informa ausência de cronômetro', async modo => {
  const f = fixture(); await f.liberar(); const s = await f.criar(modo);
  expect(s.estadoJogo.semCronometro).toBe(true);
  expect(s.estadoJogo.prazo).toBeNull();
});
it('raia individual corresponde à identidade pública do próprio aluno', async () => {
  const f = fixture(); await f.liberar(); const s = await f.criar('natacao');
  expect(s.estadoJogo.natacaoEstado.raias[0].id).toBe(s.estadoJogo.eu.equipeId || s.estadoJogo.eu.id);
});
