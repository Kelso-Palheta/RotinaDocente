import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

const prof = { tipo: 'professor', uid: 'prof-1' };
const aluno = { tipo: 'aluno', loginKey: 'ana' };
const idParticipante = (turmaId, alunoId) =>
  createHash('sha256').update(JSON.stringify([turmaId, alunoId])).digest('hex');

function criarStore(inicial = {}) {
  const docs = new Map(Object.entries(inicial));
  const store = {
    async get(p) {
      return docs.has(p) ? structuredClone(docs.get(p)) : null;
    },
    async list(p, filtros = []) {
      return [...docs]
        .filter(
          ([k, d]) =>
            k.startsWith(`${p}/`) &&
            !k.slice(p.length + 1).includes('/') &&
            filtros.every(([campo, op, valor]) => op === '==' && d[campo] === valor),
        )
        .map(([, d]) => structuredClone(d));
    },
    async transaction(fn) {
      const escritas = new Map();
      const ler = (f) => {
        if (escritas.size) throw new Error('Leitura após escrita na transação.');
        return f();
      };
      const resultado = await fn({
        get: (p) => ler(() => store.get(p)),
        list: (p, f) => ler(() => store.list(p, f)),
        set: (p, d) => escritas.set(p, structuredClone(d)),
      });
      for (const [p, d] of escritas) docs.set(p, d);
      return resultado;
    },
  };
  return { docs, store };
}

describe('Avaliação gamificada — complementos da segunda revisão (REV-AV-12..14)', () => {
  it('REV-AV-12: filtra aluno sem turmaId, separa mesmo alunoId em turmas distintas e suporta fallback em participantes', async () => {
    const pidT1 = idParticipante('t1', 'a1');
    const pidT2 = idParticipante('t2', 'a1');
    const { store } = criarStore({
      'aulaGamificadaDocentes/prof-1/salas/S00001': {
        codigo: 'S00001',
        professorId: 'prof-1',
        turmaIds: ['t1'],
        roster: [pidT1],
        criadoEmMs: 1000,
      },
      'aulaGamificadaDocentes/prof-1/salas/S00002': {
        codigo: 'S00002',
        professorId: 'prof-1',
        turmaIds: ['t2'],
        roster: [pidT2],
        criadoEmMs: 2000,
      },
      'aulaGamificadaDocentes/prof-1/salas/S00003': {
        codigo: 'S00003',
        professorId: 'prof-1',
        turmaIds: ['t1'],
        roster: [],
        criadoEmMs: 3000,
      },
      'aulaGamificadaSalas/S00003/participantes/legacy-doc': {
        id: 'legacy-doc',
        turmaId: 't1',
        alunoId: 'a1',
      },
    });
    const servico = new AulaGamificadaService({ store, idParticipante, agora: () => 5000, gerarId: () => 'id1' });

    const semTurma = await servico.listarAvaliacoes(prof, { alunoId: 'a1' });
    expect(semTurma.itens.map((i) => i.codigo).sort()).toEqual(['S00001', 'S00002', 'S00003']);

    const soT1 = await servico.listarAvaliacoes(prof, { turmaId: 't1', alunoId: 'a1' });
    expect(soT1.itens.map((i) => i.codigo).sort()).toEqual(['S00001', 'S00003']);

    const soT2 = await servico.listarAvaliacoes(prof, { turmaId: 't2', alunoId: 'a1' });
    expect(soT2.itens.map((i) => i.codigo)).toEqual(['S00002']);
  });

  it('REV-AV-13: valida anoLetivoTurma na prévia, normaliza legado e preserva outras turmas/bimestres/simulado/recuperacao', async () => {
    const pid = idParticipante('t1', 'a1');
    const diarioPath = 'professores/prof-1/turmas/data';
    const { docs, store } = criarStore({
      'aulaGamificadaSalas/AVLEG1': {
        codigo: 'AVLEG1',
        professorId: 'prof-1',
        titulo: 'Legado',
        modalidade: 'quiz',
        finalidade: 'avaliativa',
        turmaIds: ['t1'],
        roster: [pid],
        criadoEmMs: 1000,
        rodada: 1,
        rodadasAbertas: 1,
        iniciadaEmMs: 1000,
        totalRodadas: 1,
        fase: 'encerrada',
        revision: 1,
        avaliacao: {
          tituloAtividade: 'Av Legado',
          disciplina: 'Arte',
          bimestre: '1',
          anoLetivo: 'legado',
          valorMaximo: 10,
          colunaPorTurma: {},
        },
      },
      'aulaGamificadaSalas/AVLEG1/conteudos/0': {
        segredo: { questao: { tipo: 'multipla_escolha', respostaCorreta: 'A' } },
      },
      [`aulaGamificadaSalas/AVLEG1/participantes/${pid}`]: {
        id: pid,
        alunoId: 'a1',
        turmaId: 't1',
        nomeExibicao: 'Ana',
        entrouEmMs: 1000,
      },
      [`aulaGamificadaSalas/AVLEG1/respostas/1_${pid}`]: {
        participanteId: pid,
        rodada: 1,
        resposta: { alternativaId: 'A' },
      },
      'aulaGamificadaSalas/AVLEG1/avaliacao/estado': { finalizada: true, publicadoPortal: false },
      [diarioPath]: {
        revision: 1,
        turmas: [
          {
            id: 't1',
            alunos: [{ id: 'a1', nome: 'Ana' }],
            bimestres: {
              '1': { atividades: [], notas: {}, simulado: { a1: 8 }, recuperacao: { a1: 9 } },
              '2': { atividades: [{ id: 'x', nome: 'Outra', max: 10 }], notas: { a1: { x: 7 } } },
            },
          },
          {
            id: 't2',
            anoLetivo: 2025,
            alunos: [{ id: 'a2', nome: 'Bia' }],
            bimestres: { '1': { atividades: [], notas: {} } },
          },
        ],
      },
    });
    const servico = new AulaGamificadaService({ store, idParticipante, agora: () => 5000, gerarId: () => 'id1' });

    // Legado (sem anoLetivo na turma) combina com anoLetivo: 'legado' e preserva simulado/recuperação/outros bimestres e turmas
    const resSync = await servico.sincronizarDiario(prof, 'AVLEG1', {
      expectedRevision: 1,
      requestId: 'sync-legado',
      dryRun: false,
      diarioRevisionEsperada: 1,
    });
    expect(resSync.sincronizadas).toBe(1);
    const diarioAtualizado = docs.get(diarioPath);
    expect(diarioAtualizado.turmas[0].bimestres['1'].simulado).toEqual({ a1: 8 });
    expect(diarioAtualizado.turmas[0].bimestres['1'].recuperacao).toEqual({ a1: 9 });
    expect(diarioAtualizado.turmas[0].bimestres['2'].notas).toEqual({ a1: { x: 7 } });
    expect(diarioAtualizado.turmas[1].anoLetivo).toBe(2025);

    // Prévia (dryRun) também rejeita com 422 se ano divergir
    docs.set('aulaGamificadaSalas/AVLEG1', {
      ...docs.get('aulaGamificadaSalas/AVLEG1'),
      avaliacao: { ...docs.get('aulaGamificadaSalas/AVLEG1').avaliacao, anoLetivo: '2026' },
    });
    await expect(
      servico.sincronizarDiario(prof, 'AVLEG1', {
        expectedRevision: 1,
        requestId: 'prev-div',
        dryRun: true,
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('REV-AV-14: republicação atualiza resumo/detalhe com idempotência, mantém diarioPendente e protege registro legado sem snapshot', async () => {
    const pid = idParticipante('t1', 'a1');
    const diarioPath = 'professores/prof-1/turmas/data';
    const { docs, store } = criarStore({
      'aulaGamificadaSalas/AVPUB1': {
        codigo: 'AVPUB1',
        professorId: 'prof-1',
        titulo: 'Avaliação',
        modalidade: 'quiz',
        finalidade: 'avaliativa',
        turmaIds: ['t1'],
        roster: [pid],
        criadoEmMs: 1000,
        rodada: 1,
        rodadasAbertas: 1,
        iniciadaEmMs: 1000,
        totalRodadas: 1,
        fase: 'encerrada',
        revision: 1,
        avaliacao: {
          tituloAtividade: 'Av 1',
          disciplina: 'Arte',
          bimestre: '1',
          anoLetivo: '2026',
          valorMaximo: 10,
          colunaPorTurma: {},
        },
      },
      'aulaGamificadaSalas/AVPUB1/conteudos/0': {
        segredo: { questao: { tipo: 'multipla_escolha', respostaCorreta: 'A', explicacao: 'Exp A' } },
      },
      [`aulaGamificadaSalas/AVPUB1/participantes/${pid}`]: {
        id: pid,
        alunoId: 'a1',
        turmaId: 't1',
        nomeExibicao: 'Ana',
        entrouEmMs: 1000,
      },
      [`aulaGamificadaSalas/AVPUB1/respostas/1_${pid}`]: {
        participanteId: pid,
        rodada: 1,
        resposta: { alternativaId: 'A' },
      },
      'aulaGamificadaSalas/AVPUB1/avaliacao/estado': { finalizada: true, publicadoPortal: false },
      'atividades/ag_AVPUB1_t1': { id: 'ag_AVPUB1_t1', professorId: 'prof-1' },
      [diarioPath]: {
        revision: 1,
        turmas: [
          {
            id: 't1',
            anoLetivo: 2026,
            alunos: [{ id: 'a1', nome: 'Ana' }],
            bimestres: { '1': { atividades: [], notas: {} } },
          },
        ],
      },
      'alunoLogin/ana/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a1' },
    });
    let agora = 100_000;
    const servico = new AulaGamificadaService({ store, idParticipante, agora: () => agora, gerarId: () => 'r1' });

    // 1. Publica 10 e sincroniza no Diário
    const p1 = await servico.finalizarAvaliacao(prof, 'AVPUB1', {
      expectedRevision: 1,
      requestId: 'pub-1',
      publicarPortal: true,
    });
    expect(p1.revision).toBe(2);
    await servico.sincronizarDiario(prof, 'AVPUB1', {
      expectedRevision: 2,
      requestId: 'sync-1',
      dryRun: false,
      diarioRevisionEsperada: 1,
    });

    // 2. Revisa para 6 sem republicar nem resincronizar
    agora = 101_000;
    const rev = await servico.revisarNotaAvaliacao(prof, 'AVPUB1', {
      expectedRevision: 2,
      requestId: 'rev-1',
      participanteId: pid,
      notaRevisada: 6,
      justificativa: 'Ajuste após vista.',
    });
    expect(rev.revision).toBe(3);

    // Aluno ainda vê 10 antes da republicação
    expect((await servico.minhasAvaliacoes(aluno)).avaliacoes[0].notaFinal).toBe(10);
    expect((await servico.relatorioSala(aluno, 'AVPUB1')).meuResultado.notaFinal).toBe(10);

    // 3. Republica explicitamente (com idempotência no mesmo requestId)
    agora = 102_000;
    const p2 = await servico.finalizarAvaliacao(prof, 'AVPUB1', {
      expectedRevision: 3,
      requestId: 'pub-2',
      publicarPortal: true,
    });
    const p2Retry = await servico.finalizarAvaliacao(prof, 'AVPUB1', {
      expectedRevision: 3,
      requestId: 'pub-2',
      publicarPortal: true,
    });
    expect(p2Retry).toEqual(p2);

    const resumo2 = await servico.minhasAvaliacoes(aluno);
    expect(resumo2.avaliacoes[0].notaFinal).toBe(6);
    expect(resumo2.avaliacoes[0].versaoPublicada).toBe(2);
    const detalhe2 = await servico.relatorioSala(aluno, 'AVPUB1');
    expect(detalhe2.meuResultado.notaFinal).toBe(6);
    expect(detalhe2.versaoPublicada).toBe(2);

    // Portal resolvido, mas Diário continua pendente até nova sincronização
    const estadoAposRepub = docs.get('aulaGamificadaSalas/AVPUB1/avaliacao/estado');
    expect(estadoAposRepub.pendenciasAtualizacao.portalPendente).toBe(false);
    expect(estadoAposRepub.pendenciasAtualizacao.diarioPendente).toBe(true);

    // 4. Registro legado sem snapshotPublicado/avaliacaoVersoes e com portalPendente=true não vaza nota revisada
    const estadoLegado = structuredClone(estadoAposRepub);
    delete estadoLegado.snapshotPublicado;
    delete estadoLegado.versaoPublicada;
    estadoLegado.pendenciasAtualizacao.portalPendente = true;
    docs.set('aulaGamificadaSalas/AVPUB1/avaliacao/estado', estadoLegado);
    docs.set('aulaGamificadaPortal/a1/avaliacoes/AVPUB1', {
      ...docs.get('aulaGamificadaPortal/a1/avaliacoes/AVPUB1'),
      notaFinal: 10,
      versaoPublicada: 1,
    });
    const legado = await servico.relatorioSala(aluno, 'AVPUB1');
    expect(legado.meuResultado.notaFinal).toBe(10);
    expect(legado.snapshotLegadoLimitado).toBe(true);
    expect(legado.limitacoes?.length).toBeGreaterThan(0);
  });
});
