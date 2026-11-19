import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

function criarStoreMemoria(dadosIniciais = {}) {
  const docs = new Map(Object.entries(dadosIniciais).map(([k, v]) => [k, structuredClone(v)]));
  return {
    docs,
    async get(path) {
      return docs.has(path) ? structuredClone(docs.get(path)) : null;
    },
    async set(path, valor) {
      docs.set(path, structuredClone(valor));
    },
    async list(prefix, filtros = []) {
      const base = `${prefix}/`;
      const itens = [];
      for (const [k, v] of docs.entries()) {
        if (!k.startsWith(base)) continue;
        const resto = k.slice(base.length);
        if (resto.includes('/')) continue;
        const ok = filtros.every(([campo, op, esperado]) => op === '==' && v?.[campo] === esperado);
        if (ok) itens.push(structuredClone(v));
      }
      return itens;
    },
    async transaction(fn) {
      const tx = {
        get: (p) => this.get(p),
        set: (p, v) => this.set(p, v),
        list: (p, f) => this.list(p, f),
      };
      return fn(tx);
    },
  };
}

function criarAmbiente({ dadosExtras = {} } = {}) {
  let relogio = 100_000;
  let seq = 1;
  const store = criarStoreMemoria({
    'professores/prof-1/turmas/data': {
      revision: 3,
      turmas: [
        {
          id: 't1',
          nome: '9º A',
          ano: 2026,
          alunos: [
            { id: 'a1', nome: 'Ana', loginKey: 'ana' },
            { id: 'a2', nome: 'Beto', loginKey: 'beto' },
          ],
          bimestres: {
            '1': {
              atividades: [{ id: 'atv_existente', nome: 'Prova 1', max: 10 }],
              notas: { a1: { atv_existente: 8.5 } },
            },
          },
        },
        {
          id: 't2',
          nome: '9º B',
          ano: 2026,
          alunos: [{ id: 'a3', nome: 'Caio', loginKey: 'caio' }],
          bimestres: {},
        },
      ],
    },
    'alunoLogin/ana/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a1', revogado: false },
    'alunoLogin/beto/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a2', revogado: false },
    'alunoLogin/caio/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't2', alunoId: 'a3', revogado: false },
    'aulaGamificadaDocentes/prof-1/questoes/q1': {
      id: 'q1',
      revision: 1,
      disciplina: 'Arte',
      anoEscolar: '9º ano',
      conteudo: 'Arte Conceitual',
      dificuldade: 'medio',
      tipo: 'multipla_escolha',
      status: 'revisada',
      enunciado: 'Qual a parte mais importante?',
      alternativas: [
        { id: 'A', texto: 'Ideia' },
        { id: 'B', texto: 'Moldura' },
        { id: 'C', texto: 'Preço' },
      ],
      respostaCorreta: 'A',
      explicacao: 'A ideia central define a obra conceitual.',
      justificativaDificuldade: 'Direta.',
    },
    ...dadosExtras,
  });

  const servico = new AulaGamificadaService({
    store,
    agora: () => (relogio += 100),
    gerarCodigo: () => `AV${String(seq++).padStart(4, '0')}`,
    gerarId: () => `id_${seq++}`,
  });

  return { servico, store };
}

const prof = { tipo: 'professor', uid: 'prof-1' };
const outroProf = { tipo: 'professor', uid: 'prof-2' };
const ana = { tipo: 'aluno', uid: 'u-ana', loginKey: 'ana', nome: 'Ana' };
const beto = { tipo: 'aluno', uid: 'u-beto', loginKey: 'beto', nome: 'Beto' };

describe('Integração Avaliação, Histórico Paginado, Portal e Diário', () => {
  it('contexto avaliativo, criação com 2 turmas, Heróis primeira_tentativa, revisão auditada, sincronização e Portal', async () => {
    const { servico, store } = criarAmbiente();

    const ctx = await servico.contextoAvaliacao(prof);
    expect(ctx.turmas).toHaveLength(2);
    expect(ctx.anos.map((a) => a.id)).toContain('2026');

    const { sala } = await servico.criarSala(prof, {
      titulo: 'Avaliação Heróis',
      modalidade: 'herois',
      turmaIds: ['t1', 't2'],
      questaoIds: ['q1'],
      tempoSegundos: 60,
      finalidade: 'avaliativa',
      avaliacao: {
        tituloAtividade: 'Missão Arte Conceitual',
        disciplina: 'Arte',
        conteudo: 'Arte Conceitual',
        bimestre: '1',
        anoLetivo: '2026',
        valorMaximo: 10,
        criterioHerois: 'primeira_tentativa',
      },
      requestId: 'req-av-1',
    });

    expect(sala.finalidade).toBe('avaliativa');
    expect(sala.avaliacao.criterioHerois).toBe('primeira_tentativa');
    // Atividades criadas separadamente por turma
    expect(await store.get(`atividades/ag_${sala.codigo}_t1`)).toMatchObject({
      origem: 'aula_gamificada',
      turmaIds: ['t1'],
      bimestre: '1',
      notaMaxima: 10,
    });
    expect(await store.get(`atividades/ag_${sala.codigo}_t2`)).toMatchObject({
      origem: 'aula_gamificada',
      turmaIds: ['t2'],
    });

    await servico.entrar(ana, sala.codigo, { requestId: 'e-ana' });
    await servico.entrar(beto, sala.codigo, { requestId: 'e-beto' });

    await servico.comandar(prof, sala.codigo, {
      acao: 'iniciar',
      rodada: 1,
      expectedRevision: 1,
      requestId: 'c1',
    });

    // Ana erra na 1ª e acerta na 2ª -> primeira_tentativa deve dar nota 0!
    await servico.responder(ana, sala.codigo, {
      rodada: 1,
      resposta: { alternativaId: 'B' },
      requestId: 'r-ana-1',
    });
    await servico.responder(ana, sala.codigo, {
      rodada: 1,
      resposta: { alternativaId: 'A' },
      requestId: 'r-ana-2',
    });
    // Beto acerta na 1ª -> nota 10
    await servico.responder(beto, sala.codigo, {
      rodada: 1,
      resposta: { alternativaId: 'A' },
      requestId: 'r-beto-1',
    });

    await servico.comandar(prof, sala.codigo, {
      acao: 'encerrar_sala',
      rodada: 1,
      expectedRevision: 2,
      requestId: 'c-end',
    });

    const rel = await servico.relatorioSala(prof, sala.codigo);
    const relAna = rel.alunos.find((a) => a.alunoId === 'a1');
    const relBeto = rel.alunos.find((a) => a.alunoId === 'a2');
    const relCaio = rel.alunos.find((a) => a.alunoId === 'a3');
    expect(relAna.notaCalculada).toBe(0);
    expect(relAna.detalhesQuestoes[0].tentativas).toBe(2);
    expect(relBeto.notaCalculada).toBe(10);
    expect(relCaio.situacao).toBe('nao_participou');
    expect(relCaio.notaCalculada).toBeNull();

    // Portal antes da publicação não expõe resultado
    await expect(servico.relatorioSala(ana, sala.codigo)).rejects.toMatchObject({ status: 403 });
    const minhasAntes = await servico.minhasAvaliacoes(ana);
    expect(minhasAntes.avaliacoes).toHaveLength(0);

    // Professor revisa nota da Ana com justificativa e auditoria
    const revRes = await servico.revisarNotaAvaliacao(prof, sala.codigo, {
      requestId: 'rev-ana-1',
      expectedRevision: 3,
      participanteId: relAna.participanteId,
      notaRevisada: 5,
      justificativa: 'Considerado esforço na segunda tentativa.',
    });
    expect(revRes.relatorio.auditoria).toHaveLength(1);
    expect(revRes.relatorio.alunos.find((a) => a.alunoId === 'a1').notaFinal).toBe(5);

    // Finaliza e publica no Portal
    await servico.finalizarAvaliacao(prof, sala.codigo, {
      requestId: 'fin-1',
      expectedRevision: 4,
      publicarPortal: true,
    });

    // Prévia + sincronização com o Diário
    const previa = await servico.sincronizarDiario(prof, sala.codigo, {
      requestId: 'sync-prev',
      expectedRevision: 5,
      dryRun: true,
    });
    expect(previa.previa.alteracoes.length).toBeGreaterThanOrEqual(2);

    const sync = await servico.sincronizarDiario(prof, sala.codigo, {
      requestId: 'sync-real',
      expectedRevision: 5,
      dryRun: false,
      publicarPortal: true,
    });
    expect(sync.sincronizadas).toBeGreaterThanOrEqual(2);

    // Nota pré-existente atv_existente preservada no Diário!
    const diarioAtual = await store.get('professores/prof-1/turmas/data');
    const t1 = diarioAtual.turmas.find((t) => t.id === 't1');
    expect(t1.bimestres['1'].notas.a1.atv_existente).toBe(8.5);
    expect(t1.bimestres['1'].notas.a1[`ag_${sala.codigo}_t1`]).toBe(5);
    expect(t1.bimestres['1'].notas.a2[`ag_${sala.codigo}_t1`]).toBe(10);

    // Portal do aluno agora lista para Ana, e outro professor recebe 403
    const minhasDepois = await servico.minhasAvaliacoes(ana);
    expect(minhasDepois.avaliacoes).toHaveLength(1);
    expect(minhasDepois.avaliacoes[0].notaFinal).toBe(5);
    await expect(servico.relatorioSala(outroProf, sala.codigo)).rejects.toMatchObject({ status: 403 });
  });

  it('lista histórico paginado além de 30 salas com filtros sem truncamento oculto', async () => {
    const extras = {};
    for (let i = 1; i <= 35; i++) {
      const codigo = `HS${String(i).padStart(4, '0')}`;
      extras[`aulaGamificadaDocentes/prof-1/salas/${codigo}`] = {
        codigo,
        professorId: 'prof-1',
        titulo: `Sala ${i}`,
        modalidade: 'quiz',
        finalidade: i % 2 === 0 ? 'avaliativa' : 'revisao',
        turmaIds: ['t1'],
        fase: 'encerrada',
        criadoEmMs: 1000 + i * 100,
        avaliacao: i % 2 === 0 ? { bimestre: '1', anoLetivo: '2026', disciplina: 'Arte', valorMaximo: 10 } : null,
      };
    }
    const { servico } = criarAmbiente({ dadosExtras: extras });

    const p1 = await servico.listarAvaliacoes(prof, { limite: 20 });
    expect(p1.totalFiltrado).toBe(35);
    expect(p1.itens).toHaveLength(20);
    expect(p1.proximoCursor).toBeTruthy();

    const p2 = await servico.listarAvaliacoes(prof, { limite: 20, cursor: p1.proximoCursor });
    expect(p2.itens).toHaveLength(15);
    expect(p2.proximoCursor).toBeNull();

    const soAvaliativas = await servico.listarAvaliacoes(prof, { finalidade: 'avaliativa', bimestre: '1' });
    expect(soAvaliativas.totalFiltrado).toBe(17);
  });
});
