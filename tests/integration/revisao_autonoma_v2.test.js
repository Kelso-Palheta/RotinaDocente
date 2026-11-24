import { describe, expect, it } from 'vitest';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';

const ana = { tipo: 'aluno', loginKey: 'a'.repeat(64) };
const beto = { tipo: 'aluno', loginKey: 'b'.repeat(64) };
const prof = { tipo: 'professor', uid: 'p1' };

function fixture(total = 12) {
  const base = { revision: 1, status: 'revisada', tipo: 'multipla_escolha', disciplina: 'Ciências', anoEscolar: '8º ano', conteudo: 'Plantas', dificuldade: 'facil', alternativas: [{ id: 'A', texto: 'Certa' }, { id: 'B', texto: 'Errada' }], respostaCorreta: 'A', explicacao: 'Explicação pedagógica.' };
  const docs = new Map(Object.entries({
    'professores/p1/turmas/data': { turmas: [{ id: 't1', nome: 'Turma 1', alunos: [{ id: 'a1', nome: 'Ana' }, { id: 'b1', nome: 'Beto' }] }] },
    [`alunoLogin/${ana.loginKey}/vinculos/p1`]: { professorUid: 'p1', turmaId: 't1', alunoId: 'a1' },
    [`alunoLogin/${beto.loginKey}/vinculos/p1`]: { professorUid: 'p1', turmaId: 't1', alunoId: 'b1' },
  }));
  for (let i = 1; i <= total; i++) docs.set(`aulaGamificadaDocentes/p1/questoes/q${i}`, { ...base, id: `q${i}`, enunciado: `Pergunta secreta número ${i}?`, explicacao: `Explicação ${i}` });
  const copy = (x) => (x == null ? null : structuredClone(x));
  const store = {
    async get(p) { return copy(docs.get(p)); },
    async list(p, f = []) { return [...docs].filter(([k, d]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes('/') && f.every(([c, , v]) => d[c] === v)).map(([, v]) => copy(v)); },
    async transaction(fn) {
      let escreveu = false; const writes = new Map();
      const r = await fn({
        get: async (p) => { if (escreveu) throw Error('Leitura após escrita'); return store.get(p); },
        list: async (p, f) => { if (escreveu) throw Error('Leitura após escrita'); return store.list(p, f); },
        set: (p, v) => { escreveu = true; writes.set(p, copy(v)); },
      });
      for (const [p, v] of writes) docs.set(p, v);
      return r;
    },
  };
  let n = 0; let t = 1000;
  const svc = new RevisaoAutonomaService({ store, agora: () => t, gerarId: () => `sessao_${++n}` });
  let r = 0;
  const rid = () => `req${++r}`;
  return {
    svc, docs, rid,
    async liberar() { for (let i = 1; i <= total; i++) await svc.publicar(prof, { questaoId: `q${i}`, expectedRevision: 1, turmaIds: ['t1'] }); },
    cfg: (fases = 1, estrelasPorFase = 2, extra = {}) => ({ professorId: 'p1', disciplina: 'Ciências', conteudo: 'Plantas', dificuldade: 'facil', fases, estrelasPorFase, requestId: rid(), ...extra }),
    async criar(fases, est, ator = ana, extra = {}) { return (await svc.criarSessao(ator, this.cfg(fases, est, extra))).sessao; },
    async abrir(s, eventoId, ator = ana) { return (await svc.abrir(ator, s.id, { eventoId, expectedRevision: s.revision, requestId: rid() })).sessao; },
    async responder(s, alternativaId, ator = ana) { return (await svc.responder(ator, s.id, { eventoId: s.aberto.eventoId, questaoId: s.aberto.questao.id, alternativaId, expectedRevision: s.revision, requestId: rid() })).sessao; },
    async confirmar(s, ator = ana) { return (await svc.confirmar(ator, s.id, { eventoId: s.feedback.eventoId, expectedRevision: s.revision, requestId: rid() })).sessao; },
    async resolver(s, id, alt = 'A') { let x = await this.abrir(s, id); x = await this.responder(x, alt); return this.confirmar(x); },
    async avancar(s, ator = ana) { return (await svc.avancar(ator, s.id, { expectedRevision: s.revision, requestId: rid() })).sessao; },
  };
}

describe('V2 — configuração e criação', () => {
  it('cria fases com estrelas + portal, sem expor questões nem gabaritos', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(2, 3);
    expect(s).toMatchObject({ schema: 2, faseAtual: 1, totalFases: 2, total: 8, pontosJogo: 0, estrelasTotal: 3, estrelasRespondidas: 0, portalLiberado: false, aberto: null, feedback: null });
    expect(s.eventos.map((e) => e.tipo)).toEqual(['estrela', 'estrela', 'estrela', 'portal']);
    expect(s.eventos.every((e) => e.estado === 'pendente' && Number.isFinite(e.x))).toBe(true);
    const bruto = JSON.stringify(s);
    expect(bruto).not.toContain('respostaCorreta'); expect(bruto).not.toContain('Pergunta secreta'); expect(bruto).not.toContain('Explicação');
  });
  it('configuração maior que o disponível: 422 com necessário/disponível, sem repetir questões', async () => {
    const c = fixture(5); await c.liberar();
    await expect(c.criar(2, 3)).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/8.*5|5.*8/) });
    await expect(c.criar(1, 4)).rejects.toMatchObject({ status: 422 });
    await expect(c.criar(4, 1)).rejects.toMatchObject({ status: 422 });
    const ok = await c.criar(1, 3); expect(ok.total).toBe(4);
  });
  it('com apenas 1 questão permite só portal; com 12 permite 3×3', async () => {
    const um = fixture(1); await um.liberar();
    expect((await um.criar(1, 0)).eventos.map((e) => e.tipo)).toEqual(['portal']);
    const doze = fixture(12); await doze.liberar();
    expect((await doze.criar(3, 3)).total).toBe(12);
    expect(Object.keys(doze.docs.get(`revisaoAutonomaAlunos/${ana.loginKey}/sessoes/sessao_1`).fases.flatMap((f) => f.eventos.map((e) => e.questaoId)).reduce((m, q) => ({ ...m, [q]: 1 }), {}))).toHaveLength(12);
  });
  it('createSessao é idempotente por requestId e rejeita payload diferente', async () => {
    const c = fixture(); await c.liberar();
    const cfg = c.cfg(1, 2); const a = await c.svc.criarSessao(ana, cfg); const b = await c.svc.criarSessao(ana, cfg);
    expect(b.sessao.id).toBe(a.sessao.id);
    await expect(c.svc.criarSessao(ana, { ...cfg, estrelasPorFase: 1 })).rejects.toMatchObject({ status: 409 });
  });
});

describe('V2 — estrelas, pontos e portal', () => {
  it('ordem livre: abre qualquer estrela, uma por vez, com apenas a questão escolhida', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(1, 3);
    const [e1, e2, e3] = s.eventos;
    const a = await c.abrir(s, e3.id);
    expect(a.aberto.eventoId).toBe(e3.id); expect(a.aberto.questao.enunciado).toMatch(/Pergunta secreta/);
    expect(JSON.stringify(a).match(/Pergunta secreta/g)).toHaveLength(1);
    expect(JSON.stringify(a)).not.toContain('respostaCorreta');
    await expect(c.svc.abrir(ana, s.id, { eventoId: e1.id, expectedRevision: a.revision, requestId: 'x1' })).rejects.toMatchObject({ status: 409 });
    expect(e2.estado).toBe('pendente');
  });
  it('acerto vale 100 uma única vez; erro vale 0; repetição não infla', async () => {
    const c = fixture(); await c.liberar();
    let s = await c.criar(1, 2);
    let a = await c.abrir(s, s.eventos[0].id);
    const body = { eventoId: a.aberto.eventoId, questaoId: a.aberto.questao.id, alternativaId: 'A', expectedRevision: a.revision, requestId: 'resp1' };
    const r1 = (await c.svc.responder(ana, s.id, body)).sessao;
    const r2 = (await c.svc.responder(ana, s.id, body)).sessao;
    expect(r1.pontosJogo).toBe(100); expect(r2.pontosJogo).toBe(100); expect(r2.acertos).toBe(1);
    expect(r1.feedback).toMatchObject({ correta: true, respostaCorreta: 'A' }); expect(r1.feedback.explicacao).toBeTruthy();
    await expect(c.svc.responder(ana, s.id, { ...body, requestId: 'resp2', expectedRevision: r1.revision })).rejects.toMatchObject({ status: 409 });
    expect((await c.svc.obterSessao(ana, s.id)).sessao.pontosJogo).toBe(100);
    s = await c.confirmar(r1);
    a = await c.abrir(s, s.eventos[1].id);
    const e = await c.responder(a, 'B');
    expect(e.pontosJogo).toBe(100); expect(e.erros).toBe(1); expect(e.feedback).toMatchObject({ correta: false, respostaCorreta: 'A' });
  });
  it('mesmo requestId com outra resposta: 409; revisão velha: 409', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(1, 1); const a = await c.abrir(s, s.eventos[0].id);
    const base = { eventoId: a.aberto.eventoId, questaoId: a.aberto.questao.id, expectedRevision: a.revision, requestId: 'mesmo' };
    await c.svc.responder(ana, s.id, { ...base, alternativaId: 'A' });
    await expect(c.svc.responder(ana, s.id, { ...base, alternativaId: 'B' })).rejects.toMatchObject({ status: 409 });
    await expect(c.svc.confirmar(ana, s.id, { eventoId: base.eventoId, expectedRevision: 1, requestId: 'velha' })).rejects.toMatchObject({ status: 409 });
  });
  it('portal fica bloqueado até todas as estrelas serem respondidas e confirmadas (inclusive erradas)', async () => {
    const c = fixture(); await c.liberar();
    let s = await c.criar(1, 2);
    const portal = s.eventos.at(-1).id;
    await expect(c.svc.abrir(ana, s.id, { eventoId: portal, expectedRevision: s.revision, requestId: 'p0' })).rejects.toMatchObject({ status: 409 });
    s = await c.resolver(s, s.eventos[0].id, 'B');
    expect(s).toMatchObject({ estrelasRespondidas: 1, portalLiberado: false });
    // respondeu mas não confirmou: portal segue bloqueado
    let a = await c.abrir(s, s.eventos[1].id); a = await c.responder(a, 'A');
    await expect(c.svc.abrir(ana, s.id, { eventoId: portal, expectedRevision: a.revision, requestId: 'p1' })).rejects.toMatchObject({ status: 409 });
    s = await c.confirmar(a);
    expect(s).toMatchObject({ estrelasRespondidas: 2, portalLiberado: true, pontosJogo: 100 });
    expect(s.eventos.map((e) => e.estado)).toEqual(['concluido', 'concluido', 'pendente']);
    expect(s.eventos.slice(0, 2).map((e) => e.correta)).toEqual([false, true]);
  });
  it('sem confirmar o feedback não há como abrir outro desafio nem avançar', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(1, 2); let a = await c.abrir(s, s.eventos[0].id); a = await c.responder(a, 'A');
    await expect(c.svc.abrir(ana, s.id, { eventoId: s.eventos[1].id, expectedRevision: a.revision, requestId: 'o2' })).rejects.toMatchObject({ status: 409 });
    await expect(c.svc.avancar(ana, s.id, { expectedRevision: a.revision, requestId: 'av' })).rejects.toMatchObject({ status: 409 });
  });
  it('abrir é idempotente e não reabre evento concluído', async () => {
    const c = fixture(); await c.liberar();
    let s = await c.criar(1, 1);
    const body = { eventoId: s.eventos[0].id, expectedRevision: s.revision, requestId: 'ab' };
    const a1 = (await c.svc.abrir(ana, s.id, body)).sessao; const a2 = (await c.svc.abrir(ana, s.id, body)).sessao;
    expect(a2.revision).toBe(a1.revision);
    s = await c.confirmar(await c.responder(a1, 'A'));
    await expect(c.svc.abrir(ana, s.id, { eventoId: s.eventos[0].id, expectedRevision: s.revision, requestId: 'ab2' })).rejects.toMatchObject({ status: 409 });
    expect(s.pontosJogo).toBe(100);
  });
});

describe('V2 — fases, retomada e conclusão', () => {
  async function jogarFase(c, s, alt = 'A') {
    for (const e of s.eventos.filter((x) => x.tipo === 'estrela')) s = await c.resolver(s, e.id, alt);
    return c.resolver(s, s.eventos.at(-1).id, alt);
  }
  it('portal concluído avança de fase e depois conclui; pontos e acertos separados', async () => {
    const c = fixture(); await c.liberar();
    let s = await c.criar(2, 2);
    s = await jogarFase(c, s);
    expect(s.pontosJogo).toBe(300);
    s = await c.avancar(s);
    expect(s).toMatchObject({ faseAtual: 2, estrelasRespondidas: 0, portalLiberado: false, pontosJogo: 300, acertos: 3, fase: 'jogando' });
    s = await jogarFase(c, s, 'B');
    expect(s.pontosJogo).toBe(300); expect(s.erros).toBe(3);
    s = await c.avancar(s);
    expect(s).toMatchObject({ fase: 'concluida', total: 6, acertos: 3, erros: 3, desafiosRespondidos: 6, pontosJogo: 300 });
    const h = (await c.svc.historico(ana)).sessoes[0];
    expect(h).toMatchObject({ schema: 2, acertos: 3, erros: 3, pontosJogo: 300, totalFases: 2, fase: 'concluida', progresso: 6, total: 6 });
  });
  it('não avança sem portal concluído', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(2, 1);
    await expect(c.svc.avancar(ana, s.id, { expectedRevision: s.revision, requestId: 'x' })).rejects.toMatchObject({ status: 409 });
  });
  it('retomada restaura fase, eventos resolvidos, pontos e feedback pendente', async () => {
    const c = fixture(); await c.liberar();
    let s = await c.criar(2, 2); s = await c.resolver(s, s.eventos[0].id);
    let a = await c.abrir(s, s.eventos[1].id); a = await c.responder(a, 'B');
    const r = (await c.svc.obterSessao(ana, s.id)).sessao;
    expect(r.feedback).toMatchObject({ eventoId: s.eventos[1].id, correta: false });
    expect(r.aberto.eventoId).toBe(s.eventos[1].id);
    expect(r.eventos.map((e) => e.estado)).toEqual(['concluido', 'respondido', 'pendente']);
    expect(r.pontosJogo).toBe(100);
    expect((await c.svc.historico(ana)).ativaId).toBe(s.id);
  });
  it('desafio aberto e sem resposta é retomado sem perder a questão congelada', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(1, 1); const a = await c.abrir(s, s.eventos[0].id);
    const r = (await c.svc.obterSessao(ana, s.id)).sessao;
    expect(r.aberto.questao.id).toBe(a.aberto.questao.id); expect(r.feedback).toBeNull();
  });
  it('reforço dos erros cria nova sessão V2 sem sobrescrever a primeira tentativa', async () => {
    const c = fixture(); await c.liberar();
    let s = await c.criar(1, 3);
    s = await c.resolver(s, s.eventos[0].id, 'B'); s = await c.resolver(s, s.eventos[1].id, 'B'); s = await c.resolver(s, s.eventos[2].id, 'A'); s = await c.resolver(s, s.eventos[3].id, 'A');
    s = await c.avancar(s);
    const ref = (await c.svc.criarSessao(ana, c.cfg(undefined, undefined, { repetirSessaoId: s.id, quantidade: 2 }))).sessao;
    expect(ref).toMatchObject({ schema: 2, total: 2, totalFases: 1 });
    expect(ref.eventos.map((e) => e.tipo)).toEqual(['estrela', 'portal']);
    const original = (await c.svc.obterSessao(ana, s.id)).sessao;
    expect(original).toMatchObject({ acertos: 2, erros: 2, pontosJogo: 200 });
  });
});

describe('V2 — segurança, isolamento e compatibilidade', () => {
  it('outro aluno não lê nem altera a sessão; vínculo revogado e conteúdo retirado bloqueiam', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(1, 2);
    await expect(c.svc.obterSessao(beto, s.id)).rejects.toMatchObject({ status: 404 });
    await expect(c.svc.abrir(beto, s.id, { eventoId: s.eventos[0].id, expectedRevision: s.revision, requestId: 'b1' })).rejects.toMatchObject({ status: 404 });
    const qid = c.docs.get(`revisaoAutonomaAlunos/${ana.loginKey}/sessoes/${s.id}`).fases[0].eventos[0].questaoId;
    c.docs.get(`aulaGamificadaDocentes/p1/questoes/${qid}`).turmaIdsRevisaoAutonoma = [];
    await expect(c.svc.obterSessao(ana, s.id)).rejects.toMatchObject({ status: 403 });
    c.docs.get(`aulaGamificadaDocentes/p1/questoes/${qid}`).turmaIdsRevisaoAutonoma = ['t1'];
    c.docs.get(`alunoLogin/${ana.loginKey}/vinculos/p1`).revogado = true;
    await expect(c.svc.obterSessao(ana, s.id)).rejects.toMatchObject({ status: 403 });
  });
  it('não escreve notas/Diário e usa campos separados para pontos de jogo e acertos', async () => {
    const c = fixture(); await c.liberar();
    let s = await c.criar(1, 1);
    s = await c.resolver(s, s.eventos[0].id); await c.resolver(s, s.eventos[1].id);
    expect([...c.docs.keys()].some((k) => /diario|notas|avaliacao|nota/i.test(k))).toBe(false);
    const doc = [...c.docs].find(([k]) => /sessoes\/sessao_1$/.test(k))[1];
    expect(doc).toHaveProperty('pontosJogo'); expect(doc).not.toHaveProperty('nota');
  });
  it('mantém o tamanho do documento muito abaixo do limite do Firestore', async () => {
    const c = fixture(); await c.liberar();
    await c.criar(3, 3);
    const doc = [...c.docs].find(([k]) => /sessoes\/sessao_1$/.test(k))[1];
    expect(Buffer.byteLength(JSON.stringify(doc))).toBeLessThan(200_000);
  });
  it('sessão V1 continua com as regras originais: uma questão por fase e sem eventos', async () => {
    const c = fixture(); await c.liberar();
    const s = (await c.svc.criarSessao(ana, { professorId: 'p1', disciplina: 'Ciências', conteudo: 'Plantas', dificuldade: 'facil', quantidade: 2, requestId: 'v1' })).sessao;
    expect(s.schema).toBeUndefined(); expect(s.eventos).toBeUndefined(); expect(s.total).toBe(2); expect(s.fase).toBe('jogando');
    const r = await c.svc.responder(ana, s.id, { questaoId: s.questao.id, expectedRevision: s.revision, alternativaId: 'A', requestId: 'v1r' });
    expect(r.sessao.fase).toBe('feedback'); expect(r.sessao.pontosJogo).toBeUndefined();
    await expect(c.svc.abrir(ana, s.id, { eventoId: 'x', expectedRevision: r.sessao.revision, requestId: 'v1o' })).rejects.toMatchObject({ status: 409 });
  });
  it('resposta com alternativa inexistente ou questão diferente é rejeitada', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(1, 1); const a = await c.abrir(s, s.eventos[0].id);
    await expect(c.svc.responder(ana, s.id, { eventoId: a.aberto.eventoId, questaoId: a.aberto.questao.id, alternativaId: 'Z', expectedRevision: a.revision, requestId: 'z' })).rejects.toMatchObject({ status: 422 });
    await expect(c.svc.responder(ana, s.id, { eventoId: a.aberto.eventoId, questaoId: 'outra', alternativaId: 'A', expectedRevision: a.revision, requestId: 'z2' })).rejects.toMatchObject({ status: 409 });
  });
  it('concorrência: duas abas respondendo com a mesma revisão — só a primeira vence', async () => {
    const c = fixture(); await c.liberar();
    const s = await c.criar(1, 1); const a = await c.abrir(s, s.eventos[0].id);
    const mk = (alt, id) => c.svc.responder(ana, s.id, { eventoId: a.aberto.eventoId, questaoId: a.aberto.questao.id, alternativaId: alt, expectedRevision: a.revision, requestId: id });
    const r1 = await mk('A', 'aba1');
    await expect(mk('B', 'aba2')).rejects.toMatchObject({ status: 409 });
    expect(r1.sessao.pontosJogo).toBe(100);
    expect((await c.svc.obterSessao(ana, s.id)).sessao).toMatchObject({ acertos: 1, erros: 0 });
  });
});
