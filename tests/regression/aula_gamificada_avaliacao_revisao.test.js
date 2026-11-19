import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { montarConteudo } from '@/dominio/aula-gamificada/sala';
import { calcularAvaliacaoParticipante } from '@/dominio/aula-gamificada/avaliacao';

const prof = { tipo: 'professor', uid: 'prof-1' };
const codigo = 'AV0001';
const base = `aulaGamificadaSalas/${codigo}`;
const diarioPath = 'professores/prof-1/turmas/data';

function ambiente({ estrito = true, fase = 'encerrada', finalizada = true } = {}) {
  const questao = {
    id: 'q1', revision: 1, status: 'revisada', tipo: 'multipla_escolha', dificuldade: 'facil',
    disciplina: 'Arte', anoEscolar: '9º ano', conteudo: 'Arte conceitual',
    justificativaDificuldade: 'Recordação de conteúdo básico.',
    enunciado: 'Escolha a resposta correta.',
    alternativas: [{ id: 'A', texto: 'Correta' }, { id: 'B', texto: 'Errada' }, { id: 'C', texto: 'Outra' }],
    respostaCorreta: 'A', explicacao: 'A é a resposta correta.',
  };
  const conteudo = montarConteudo(questao, 'quiz', { codigo, indice: 0, segredoSemente: 'fixa' });
  const sala = {
    codigo, professorId: prof.uid, titulo: 'Avaliação de Arte', modalidade: 'quiz',
    finalidade: 'avaliativa', turmaIds: ['t1'], roster: ['t1:a1'],
    rodada: 1, totalRodadas: 1, fase, revision: 1, equipes: [],
    tempoSegundos: 60, encerraEmMs: 200_000, revelado: true,
    avaliacao: {
      tituloAtividade: 'Prova 1', disciplina: 'Arte', bimestre: '1',
      anoLetivo: '2026', valorMaximo: 10, colunaPorTurma: {},
    },
  };
  const participante = {
    id: 't1:a1', alunoId: 'a1', turmaId: 't1', nomeExibicao: 'Ana', entrouEmMs: 1000, pontos: 1000,
  };
  const docs = new Map(Object.entries({
    [base]: sala,
    [`${base}/conteudos/0`]: conteudo,
    [`${base}/participantes/t1:a1`]: participante,
    [`${base}/respostas/1_t1:a1`]: {
      participanteId: 't1:a1', rodada: 1, resposta: { alternativaId: 'A' }, pontos: 1000,
    },
    [`${base}/avaliacao/estado`]: { finalizada },
    [`aulaGamificadaDocentes/${prof.uid}/salas/${codigo}`]: sala,
    [`atividades/ag_${codigo}_t1`]: { id: `ag_${codigo}_t1`, professorId: prof.uid },
    [diarioPath]: {
      revision: 3,
      turmas: [{
        id: 't1', ano: 2026, alunos: [{ id: 'a1', nome: 'Ana' }],
        bimestres: { '1': { atividades: [{ id: 'anterior', nome: 'Prova 1', max: 2 }], notas: {} } },
      }],
    },
  }).map(([p, d]) => [p, structuredClone(d)]));
  const store = {
    async get(p) { return docs.has(p) ? structuredClone(docs.get(p)) : null; },
    async list(p) {
      return [...docs].filter(([k]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes('/'))
        .map(([, d]) => structuredClone(d));
    },
    async transaction(fn) {
      const escritas = new Map();
      const ler = (f) => {
        if (estrito && escritas.size) throw new Error('Todas as leituras devem preceder as escritas da transação.');
        return f();
      };
      const resultado = await fn({
        get: (p) => ler(() => store.get(p)),
        list: (p) => ler(() => store.list(p)),
        set: (p, d) => escritas.set(p, structuredClone(d)),
      });
      for (const [p, d] of escritas) docs.set(p, d);
      return resultado;
    },
  };
  const servico = new AulaGamificadaService({ store, agora: () => 100_000, gerarId: () => 'auditoria1' });
  return { servico, store, sala, conteudo, participante };
}

describe('Regressões da revisão independente da avaliação gamificada', () => {
  it('REV-AV-01: comandos existentes continuam compatíveis com transações Firestore', async () => {
    const { servico } = ambiente({ fase: 'espera' });
    await expect(servico.comandar(prof, codigo, {
      acao: 'iniciar', rodada: 1, expectedRevision: 1, requestId: 'iniciar-1',
    })).resolves.toHaveProperty('estado');
  });

  it('REV-AV-02: finalizar grava entregas sem ler documentos após escritas', async () => {
    const { servico } = ambiente();
    await expect(servico.finalizarAvaliacao(prof, codigo, {
      expectedRevision: 1, requestId: 'finalizar-1',
    })).resolves.toMatchObject({ revision: 2 });
  });

  it('REV-AV-03: não finaliza nem publica uma partida ainda aberta', async () => {
    const { servico } = ambiente({ estrito: false, fase: 'pergunta', finalizada: false });
    await expect(servico.finalizarAvaliacao(prof, codigo, {
      expectedRevision: 1, requestId: 'finalizar-aberta', publicarPortal: true,
    })).rejects.toMatchObject({ status: 409 });
  });

  it('REV-AV-04: sincronização exige conferência e finalização anteriores', async () => {
    const { servico } = ambiente({ finalizada: false });
    await expect(servico.sincronizarDiario(prof, codigo, {
      expectedRevision: 1, requestId: 'sync-nao-finalizada', dryRun: false,
    })).rejects.toMatchObject({ status: 409 });
  });

  it('REV-AV-05: título igual não vincula automaticamente a coluna antiga de outra escala', async () => {
    const { servico, store } = ambiente();
    await servico.sincronizarDiario(prof, codigo, {
      expectedRevision: 1, requestId: 'sync-ids', dryRun: false,
    });
    const bimestre = (await store.get(diarioPath)).turmas[0].bimestres['1'];
    expect(bimestre.notas.a1.anterior).toBeUndefined();
    expect(bimestre.notas.a1[`ag_${codigo}_t1`]).toBe(10);
    expect(bimestre.atividades.find((a) => a.id === `ag_${codigo}_t1`).max).toBe(10);
  });

  it('REV-AV-06: finalizar uma sala nunca iniciada não inventa questão aberta', () => {
    const { sala, conteudo, participante } = ambiente();
    const resultado = calcularAvaliacaoParticipante({
      sala: { ...sala, fase: 'encerrada', iniciadaEmMs: null },
      participante, conteudos: [conteudo], respostasDoParticipante: [],
    });
    expect(resultado.elegiveis).toBe(0);
    expect(resultado.situacao).toBe('sem_oportunidade');
    expect(resultado.notaCalculada).toBeNull();
  });

  it('REV-AV-07: valor de revisão inválido não vira nota zero silenciosamente', async () => {
    const { servico } = ambiente();
    await expect(servico.revisarNotaAvaliacao(prof, codigo, {
      expectedRevision: 1, requestId: 'revisao-invalida', participanteId: 't1:a1',
      notaRevisada: 'invalida', justificativa: 'Deve rejeitar dado inválido.',
    })).rejects.toMatchObject({ status: 422 });
  });
});
