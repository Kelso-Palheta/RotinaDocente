import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { montarConteudo } from '@/dominio/aula-gamificada/sala';

const pid = (t, a) => createHash('sha256').update(JSON.stringify([t, a])).digest('hex');

function criarAmbienteMultiTurma() {
  const prof = { tipo: 'professor', uid: 'prof1' };
  const anaT1 = { tipo: 'aluno', loginKey: 'ana_t1' };
  const anaT2 = { tipo: 'aluno', loginKey: 'ana_t2' };
  const betoT1 = { tipo: 'aluno', loginKey: 'beto_t1' };
  const caioT1 = { tipo: 'aluno', loginKey: 'caio_t1' };

  const codigo = 'MULTI1';
  const base = `aulaGamificadaSalas/${codigo}`;

  const pAna1 = {
    id: pid('t1', 'a1'),
    alunoId: 'a1',
    turmaId: 't1',
    nomeExibicao: 'Ana (T1)',
    equipeId: 'g1',
    entrouEmMs: 1000,
    pontos: 0,
  };
  const pAna2 = {
    id: pid('t2', 'a1'),
    alunoId: 'a1',
    turmaId: 't2',
    nomeExibicao: 'Ana (T2)',
    equipeId: 'g1',
    entrouEmMs: 1000,
    pontos: 0,
  };
  const pBeto1 = {
    id: pid('t1', 'a2'),
    alunoId: 'a2',
    turmaId: 't1',
    nomeExibicao: 'Beto (T1)',
    equipeId: 'g1',
    entrouEmMs: 1000,
    pontos: 0,
  };
  const pCaio1 = {
    id: pid('t1', 'a3'),
    alunoId: 'a3',
    turmaId: 't1',
    nomeExibicao: 'Caio (T1)',
    equipeId: 'g2',
    entrouEmMs: 1000,
    pontos: 0,
  };
  const participantes = [pAna1, pAna2, pBeto1, pCaio1];

  const equipes = [
    {
      id: 'g1',
      nome: 'Grupo Sol',
      participanteIds: [pAna1.id, pAna2.id, pBeto1.id],
      representanteParticipanteId: pAna1.id,
      representanteAlunoId: 'a1',
    },
    {
      id: 'g2',
      nome: 'Grupo Lua',
      participanteIds: [pCaio1.id],
      representanteParticipanteId: pCaio1.id,
      representanteAlunoId: 'a3',
    },
  ];

  const questao = {
    id: 'q1',
    revision: 1,
    status: 'revisada',
    disciplina: 'Arte',
    anoEscolar: '9º ano',
    conteudo: 'Arte',
    dificuldade: 'facil',
    tipo: 'multipla_escolha',
    enunciado: 'Qual alternativa está correta?',
    explicacao: 'A é correta.',
    alternativas: [
      { id: 'A', texto: 'Correta' },
      { id: 'B', texto: 'Errada' },
    ],
    respostaCorreta: 'A',
  };

  const sala = {
    codigo,
    professorId: prof.uid,
    titulo: 'Disputa Multi-Turma',
    modalidade: 'quiz',
    formatoParticipacao: 'grupos',
    modoRespostaGrupo: 'compartilhada',
    finalidade: 'avaliativa',
    avaliacao: {
      tituloAtividade: 'Av Coletiva',
      disciplina: 'Arte',
      anoLetivo: '2026',
      bimestre: '1',
      valorMaximo: 10,
      criterioColetivo: 'atribuir_presentes',
    },
    turmaIds: ['t1', 't2'],
    roster: participantes.map((p) => p.id),
    equipes,
    rodada: 1,
    totalRodadas: 1,
    rodadasAbertas: 1,
    fase: 'pergunta',
    iniciadaEmMs: 1000,
    encerraEmMs: 200_000,
    tempoSegundos: 60,
    revelado: false,
    revision: 1,
  };

  const docs = new Map(
    Object.entries({
      [base]: sala,
      [`${base}/conteudos/0`]: montarConteudo(questao, 'quiz', {
        codigo,
        indice: 0,
        segredoSemente: 'fixa',
      }),
      'aulaGamificadaDocentes/prof1/questoes/q1': questao,
      'professores/prof1/turmas/data': {
        revision: 1,
        turmas: [
          {
            id: 't1',
            nome: 'Turma 1',
            anoLetivo: 2026,
            alunos: [
              { id: 'a1', nome: 'Ana (T1)' },
              { id: 'a2', nome: 'Beto (T1)' },
              { id: 'a3', nome: 'Caio (T1)' },
            ],
            bimestres: { '1': { atividades: [], notas: {} } },
          },
          {
            id: 't2',
            nome: 'Turma 2',
            anoLetivo: 2026,
            alunos: [{ id: 'a1', nome: 'Ana (T2)' }],
            bimestres: { '1': { atividades: [], notas: {} } },
          },
        ],
      },
    }),
  );

  for (const p of participantes) {
    docs.set(`${base}/participantes/${p.id}`, p);
  }
  docs.set('alunoLogin/ana_t1/vinculos/prof1', { professorUid: prof.uid, turmaId: 't1', alunoId: 'a1' });
  docs.set('alunoLogin/ana_t2/vinculos/prof1', { professorUid: prof.uid, turmaId: 't2', alunoId: 'a1' });
  docs.set('alunoLogin/beto_t1/vinculos/prof1', { professorUid: prof.uid, turmaId: 't1', alunoId: 'a2' });
  docs.set('alunoLogin/caio_t1/vinculos/prof1', { professorUid: prof.uid, turmaId: 't1', alunoId: 'a3' });

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
            filtros.every(([c, op, v]) => op === '==' && d[c] === v),
        )
        .map(([, d]) => structuredClone(d));
    },
    async transaction(fn) {
      const writes = new Map();
      const ler = (f) => {
        if (writes.size) throw new Error('Leitura após escrita.');
        return f();
      };
      const result = await fn({
        get: (p) => ler(() => store.get(p)),
        list: (p, f) => ler(() => store.list(p, f)),
        set: (p, d) => writes.set(p, structuredClone(d)),
      });
      for (const [p, d] of writes) docs.set(p, d);
      return result;
    },
  };

  const servico = new AulaGamificadaService({
    store,
    idParticipante: pid,
    agora: () => 100_000,
    gerarId: () => `id_${docs.size}`,
    gerarCodigo: () => 'NEW001',
  });

  return { servico, docs, prof, anaT1, anaT2, betoT1, caioT1, codigo, pAna1, pAna2, pBeto1, pCaio1 };
}

describe('Integração completa das correções de disputas', () => {
  it('REV-DIS-01: homônimo de alunoId em outra turma não envia; representante autorizado envia e troca por participanteId funciona', async () => {
    const { servico, prof, anaT1, anaT2, betoT1, codigo, pBeto1 } = criarAmbienteMultiTurma();

    // Ana da T2 (mesmo alunoId 'a1') NÃO pode responder no lugar de Ana da T1
    await expect(
      servico.responder(anaT2, codigo, {
        rodada: 1,
        requestId: 'ana2-tent',
        resposta: { alternativaId: 'A' },
      }),
    ).rejects.toMatchObject({ status: 403 });

    // Troca ambígua apenas por alunoId 'a1' é rejeitada
    await expect(
      servico.comandar(prof, codigo, {
        acao: 'alterar_representante',
        expectedRevision: 1,
        requestId: 'troca-ambigua',
        equipeId: 'g1',
        representanteAlunoId: 'a1',
      }),
    ).rejects.toMatchObject({ status: 422 });

    // Ana da T1 (representante autorizada) envia com sucesso
    const rec = await servico.responder(anaT1, codigo, {
      rodada: 1,
      requestId: 'ana1-ok',
      resposta: { alternativaId: 'A' },
    });
    expect(rec.recibo.status).toBe('confirmado');

    // Troca por representanteParticipanteId estável funciona para Beto
    const troca = await servico.comandar(prof, codigo, {
      acao: 'alterar_representante',
      expectedRevision: 1,
      requestId: 'troca-beto',
      equipeId: 'g1',
      representanteParticipanteId: pBeto1.id,
    });
    expect(troca.estado.sala.equipes.find((e) => e.id === 'g1').representanteParticipanteId).toBe(pBeto1.id);
    expect((await servico.estado(betoT1, codigo)).estado.eu.ehRepresentante).toBe(true);
  });

  it('REV-DIS-02/03/04: placar antes de revelar é 0, reconexão/idempotência preserva 1000 para grupo de 3 vs grupo de 1', async () => {
    const { servico, prof, anaT1, betoT1, codigo } = criarAmbienteMultiTurma();

    // Envio idempotente
    await servico.responder(anaT1, codigo, {
      rodada: 1,
      requestId: 'resp-g1',
      resposta: { alternativaId: 'A' },
    });
    await servico.responder(anaT1, codigo, {
      rodada: 1,
      requestId: 'resp-g1',
      resposta: { alternativaId: 'A' },
    });

    // Antes de revelar: nem Beto nem projeção veem 1000
    expect((await servico.estado(betoT1, codigo)).estado.eu.pontos).toBe(0);
    expect((await servico.estado(prof, codigo)).estado.ranking).toBeUndefined();

    await servico.comandar(prof, codigo, { acao: 'encerrar_rodada', rodada: 1, expectedRevision: 1, requestId: 'c1' });
    await servico.comandar(prof, codigo, { acao: 'revelar', rodada: 1, expectedRevision: 2, requestId: 'c2' });
    const rank = await servico.comandar(prof, codigo, { acao: 'ranking', rodada: 1, expectedRevision: 3, requestId: 'c3' });

    const g1 = rank.estado.ranking.find((e) => e.id === 'g1');
    const g2 = rank.estado.ranking.find((e) => e.id === 'g2');
    expect(g1.pontos).toBe(1000);
    expect(g2.pontos).toBe(0);
    expect(g1.posicao).toBe(1);
    expect(g2.posicao).toBe(2);
  });

  it('REV-DIS-05: ausente confirmado não recebe nota coletiva nem zero no relatório, portal ou Diário', async () => {
    const { servico, docs, prof, anaT1, codigo, pAna1, pCaio1 } = criarAmbienteMultiTurma();

    await servico.responder(anaT1, codigo, {
      rodada: 1,
      requestId: 'resp-pres',
      resposta: { alternativaId: 'A' },
    });
    await servico.comandar(prof, codigo, { acao: 'encerrar_sala', rodada: 1, expectedRevision: 1, requestId: 'fim' });
    await servico.comandar(prof, codigo, {
      acao: 'confirmar_presenca',
      rodada: 1,
      expectedRevision: 2,
      requestId: 'pres',
      presentesIds: [pAna1.id, pCaio1.id],
      substituir: true,
    });

    const rel = await servico.relatorioSala(prof, codigo);
    const betoRel = rel.alunos.find((a) => a.participanteId.includes(pid('t1', 'a2')));
    expect(betoRel.ausenciaConfirmada).toBe(true);
    expect(betoRel.notaFinal).toBeNull();

    // Finalizar + publicar no portal: Beto não ganha nota coletiva nem zero
    await servico.finalizarAvaliacao(prof, codigo, {
      requestId: 'fin1',
      expectedRevision: 3,
      publicarPortal: true,
      zerarAusentes: true,
    });
    expect(docs.has(`aulaGamificadaPortal/a2/avaliacoes/${codigo}`)).toBe(false);
    const portalAna = docs.get(`aulaGamificadaPortal/a1/avaliacoes/${codigo}`);
    expect(portalAna.origemColetiva).toBe(true);
    expect(portalAna.equipeNome).toBe('Grupo Sol');

    // Sincronizar Diário: Beto vai para pendências (sem_nota), nunca recebe 10 ou 0 no Diário
    const sync = await servico.sincronizarDiario(prof, codigo, {
      requestId: 'sync1',
      expectedRevision: 4,
      dryRun: false,
    });
    expect(sync.pendencias.some((p) => p.alunoId === 'a2' && p.tipo === 'sem_nota')).toBe(true);
    const t1 = docs.get('professores/prof1/turmas/data').turmas.find((t) => t.id === 't1');
    expect(t1.bimestres['1'].notas.a2).toBeUndefined();
    expect(t1.bimestres['1'].notas.a1[`ag_${codigo}_t1`]).toBe(10);
  });
});
