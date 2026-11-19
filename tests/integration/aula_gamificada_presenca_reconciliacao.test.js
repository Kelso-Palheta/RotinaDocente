import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { montarConteudo } from '@/dominio/aula-gamificada/sala';

const prof = { tipo: 'professor', uid: 'prof1' };
const beto = { tipo: 'aluno', loginKey: 'beto' };
const codigo = 'REC01';
const base = `aulaGamificadaSalas/${codigo}`;
const pid = (t, a) => createHash('sha256').update(JSON.stringify([t, a])).digest('hex');

function criarAmbienteReconciliacao() {
  const participantes = ['a1', 'a2', 'a3'].map((id, i) => ({
    id: pid('t1', id),
    alunoId: id,
    turmaId: 't1',
    nomeExibicao: ['Ana', 'Beto', 'Caio'][i],
    equipeId: i < 2 ? 'g1' : 'g2',
    entrouEmMs: 1000,
    presenteConfirmado: true,
    pontos: 0,
  }));
  const questao = {
    id: 'q1',
    revision: 1,
    status: 'revisada',
    disciplina: 'Arte',
    anoEscolar: '9º ano',
    conteudo: 'Arte',
    dificuldade: 'facil',
    tipo: 'multipla_escolha',
    enunciado: 'Qual é correta?',
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
    titulo: 'Reconciliação Coletiva',
    modalidade: 'quiz',
    formatoParticipacao: 'grupos',
    modoRespostaGrupo: 'compartilhada',
    finalidade: 'avaliativa',
    avaliacao: {
      tituloAtividade: 'Av Reconciliação',
      disciplina: 'Arte',
      anoLetivo: '2026',
      bimestre: '1',
      valorMaximo: 10,
      criterioColetivo: 'atribuir_presentes',
    },
    turmaIds: ['t1'],
    roster: participantes.map((p) => p.id),
    equipes: [
      {
        id: 'g1',
        nome: 'Sol',
        participanteIds: participantes.slice(0, 2).map((p) => p.id),
        representanteParticipanteId: participantes[0].id,
        representanteAlunoId: 'a1',
      },
      {
        id: 'g2',
        nome: 'Lua',
        participanteIds: [participantes[2].id],
        representanteParticipanteId: participantes[2].id,
        representanteAlunoId: 'a3',
      },
    ],
    rodada: 1,
    totalRodadas: 1,
    rodadasAbertas: 1,
    iniciadaEmMs: 1000,
    fase: 'encerrada',
    revelado: true,
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
      [`${base}/respostas/1_eq_g1`]: {
        participanteId: 'eq_g1',
        equipeId: 'g1',
        rodada: 1,
        pontos: 1000,
        resposta: { alternativaId: 'A' },
        autoriaAlunoId: 'a1',
      },
      [`atividades/ag_${codigo}_t1`]: { id: `ag_${codigo}_t1`, professorId: prof.uid },
      'professores/prof1/turmas/data': {
        revision: 1,
        turmas: [
          {
            id: 't1',
            nome: 'Turma 1',
            anoLetivo: 2026,
            alunos: participantes.map((p) => ({ id: p.alunoId, nome: p.nomeExibicao })),
            bimestres: {
              '1': {
                atividades: [{ id: 'atv_outra', nome: 'Prova Anterior', max: 10 }],
                notas: { a2: { atv_outra: 8.5 } },
              },
            },
          },
        ],
      },
      'alunoLogin/beto/vinculos/prof1': { professorUid: prof.uid, turmaId: 't1', alunoId: 'a2' },
    }),
  );
  for (const p of participantes) docs.set(`${base}/participantes/${p.id}`, p);

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

  let seq = 0;
  const servico = new AulaGamificadaService({
    store,
    idParticipante: pid,
    agora: () => 100_000,
    gerarId: () => `aud_${++seq}`,
  });

  return { servico, docs, participantes };
}

describe('Integração — reconciliação completa entre Relatório, Portal e Diário', () => {
  it('sinaliza pendências após mudança de presença, preserva versão anterior até republicar, reconcilia Diário e suporta retorno à presença', async () => {
    const { servico, docs, participantes } = criarAmbienteReconciliacao();

    // 1. Publica e sincroniza nota 10 no Diário
    await servico.finalizarAvaliacao(prof, codigo, {
      expectedRevision: 1,
      requestId: 'pub1',
      publicarPortal: true,
    });
    await servico.sincronizarDiario(prof, codigo, {
      expectedRevision: 2,
      requestId: 'sync1',
      dryRun: false,
    });
    expect(docs.get('professores/prof1/turmas/data').turmas[0].bimestres['1'].notas.a2[`ag_${codigo}_t1`]).toBe(10);

    // 2. Marca Beto como ausente (sem republicar ainda -> Portal ainda mantém v1 até republicar)
    await servico.comandar(prof, codigo, {
      acao: 'confirmar_presenca',
      rodada: 1,
      expectedRevision: 2,
      requestId: 'pres-aus',
      presentesIds: [participantes[0].id, participantes[2].id],
      substituir: true,
    });

    // Troca de representante não apaga pendenciasAtualizacao
    await servico.comandar(prof, codigo, {
      acao: 'alterar_representante',
      expectedRevision: 3,
      requestId: 'rep-swap',
      equipeId: 'g1',
      representanteParticipanteId: participantes[1].id,
    });
    const avalAposTroca = docs.get(`${base}/avaliacao/estado`);
    expect(avalAposTroca.pendenciasAtualizacao.portalPendente).toBe(true);
    expect(avalAposTroca.pendenciasAtualizacao.diarioPendente).toBe(true);

    // Revisão não republicada ainda preserva v1 visível ao aluno no Portal
    expect((await servico.minhasAvaliacoes(beto)).avaliacoes[0].notaFinal).toBe(10);

    // 3. Republica (idempotente se repetida) -> Portal e Entrega atualizam para sem nota
    await servico.finalizarAvaliacao(prof, codigo, {
      expectedRevision: 4,
      requestId: 'pub2',
      publicarPortal: true,
    });
    await servico.finalizarAvaliacao(prof, codigo, {
      expectedRevision: 4,
      requestId: 'pub2',
      publicarPortal: true,
    });
    const resumoAus = (await servico.minhasAvaliacoes(beto)).avaliacoes[0];
    expect(resumoAus.notaFinal).toBeNull();
    expect(resumoAus.ausenciaConfirmada).toBe(true);
    expect(docs.get(`entregas/ag_${codigo}_t1_a2`).status).toBe('invalidada_sem_nota');

    // 4. Prévia do Diário aponta divergência; sem confirmar, não apaga nem declara sincronizada
    const previa = await servico.sincronizarDiario(prof, codigo, {
      expectedRevision: 5,
      requestId: 'sync-prev',
      dryRun: true,
    });
    expect(previa.previa.pendencias.some((p) => p.tipo === 'divergencia_diario_sem_nota' && p.alunoId === 'a2')).toBe(true);

    // Reconciliação explícita remove apenas a coluna do jogo e preserva atv_outra (8.5)
    const syncRec = await servico.sincronizarDiario(prof, codigo, {
      expectedRevision: 5,
      requestId: 'sync-rec',
      dryRun: false,
      reconciliarAusentes: true,
      confirmarSobrescrita: true,
    });
    expect(syncRec.alteracoes.some((a) => a.alunoId === 'a2' && a.acao === 'removida_por_ausencia')).toBe(true);
    const notasBetoDiario = docs.get('professores/prof1/turmas/data').turmas[0].bimestres['1'].notas.a2;
    expect(notasBetoDiario[`ag_${codigo}_t1`]).toBeUndefined();
    expect(notasBetoDiario.atv_outra).toBe(8.5);

    // 5. Retorno à presença: confirma Beto novamente -> republica -> re-sincroniza nota 10
    await servico.comandar(prof, codigo, {
      acao: 'confirmar_presenca',
      rodada: 1,
      expectedRevision: 5,
      requestId: 'pres-ret',
      presentesIds: participantes.map((p) => p.id),
      substituir: true,
    });
    await servico.finalizarAvaliacao(prof, codigo, {
      expectedRevision: 6,
      requestId: 'pub3',
      publicarPortal: true,
    });
    await servico.sincronizarDiario(prof, codigo, {
      expectedRevision: 7,
      requestId: 'sync3',
      dryRun: false,
    });
    expect((await servico.minhasAvaliacoes(beto)).avaliacoes[0].notaFinal).toBe(10);
    expect(docs.get(`entregas/ag_${codigo}_t1_a2`).status).toBe('corrigido');
    expect(docs.get('professores/prof1/turmas/data').turmas[0].bimestres['1'].notas.a2[`ag_${codigo}_t1`]).toBe(10);
  });
});
