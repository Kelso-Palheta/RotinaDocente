import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

const MAX_DOCUMENTO = 1_048_576;

function bytesStrings(valor) {
  if (typeof valor === 'string') return Buffer.byteLength(valor, 'utf8');
  if (Array.isArray(valor)) return valor.reduce((n, v) => n + bytesStrings(v), 0);
  if (valor && typeof valor === 'object') return Object.values(valor).reduce((n, v) => n + bytesStrings(v), 0);
  return 0;
}

function ambienteTurmaCompleta() {
  const codigo = 'AVCAP2';
  const base = `aulaGamificadaSalas/${codigo}`;
  const participantes = Array.from({ length: 40 }, (_, i) => ({
    id: `p${i}`,
    alunoId: `a${i}`,
    turmaId: 't1',
    nomeExibicao: `Aluno ${i}`,
    entrouEmMs: 1000,
    pontos: 20_000,
  }));
  const sala = {
    codigo,
    professorId: 'prof-1',
    titulo: 'Avaliação Completa 40x20',
    modalidade: 'quiz',
    finalidade: 'avaliativa',
    turmaIds: ['t1'],
    roster: participantes.map((p) => p.id),
    rodada: 20,
    totalRodadas: 20,
    rodadasAbertas: 20,
    iniciadaEmMs: 1000,
    fase: 'encerrada',
    revision: 1,
    avaliacao: {
      tituloAtividade: 'Avaliação',
      disciplina: 'Arte',
      bimestre: '1',
      anoLetivo: '2026',
      valorMaximo: 10,
    },
  };
  const docs = new Map([
    [base, sala],
    [`${base}/avaliacao/estado`, {}],
    [`atividades/ag_${codigo}_t1`, { id: `ag_${codigo}_t1`, professorId: 'prof-1' }],
    [
      'professores/prof-1/turmas/data',
      {
        revision: 1,
        turmas: [
          {
            id: 't1',
            anoLetivo: 2026,
            alunos: participantes.map((p) => ({ id: p.alunoId, nome: p.nomeExibicao })),
            bimestres: { '1': { atividades: [], notas: {} } },
          },
        ],
      },
    ],
    ['alunoLogin/ana0/vinculos/prof-1', { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a0' }],
  ]);
  for (let i = 0; i < 20; i++) {
    docs.set(`${base}/conteudos/${i}`, {
      segredo: {
        questao: {
          tipo: 'multipla_escolha',
          enunciado: `Q${i + 1}: ` + 'E'.repeat(795),
          explicacao: `Exp${i + 1}: ` + 'F'.repeat(794),
          respostaCorreta: 'A',
        },
      },
    });
    for (const p of participantes) {
      docs.set(`${base}/respostas/${i + 1}_${p.id}`, {
        participanteId: p.id,
        rodada: i + 1,
        resposta: { alternativaId: 'A' },
      });
    }
  }
  for (const p of participantes) docs.set(`${base}/participantes/${p.id}`, p);

  let falharProximaTx = false;
  const store = {
    async get(p) {
      return docs.has(p) ? structuredClone(docs.get(p)) : null;
    },
    async list(p) {
      return [...docs]
        .filter(([k]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes('/'))
        .map(([, v]) => structuredClone(v));
    },
    async transaction(fn) {
      const escritas = new Map();
      const ler = (f) => {
        if (escritas.size) throw new Error('Leitura após escrita.');
        return f();
      };
      const resultado = await fn({
        get: (p) => ler(() => store.get(p)),
        list: (p) => ler(() => store.list(p)),
        set(p, v) {
          const minimo = bytesStrings(v);
          if (minimo > MAX_DOCUMENTO) {
            throw new Error(`Documento ${p}: só strings já somam ${minimo} bytes; máximo ${MAX_DOCUMENTO}.`);
          }
          escritas.set(p, structuredClone(v));
        },
      });
      if (falharProximaTx) {
        falharProximaTx = false;
        throw new Error('Falha transitória simulada antes do commit.');
      }
      for (const [p, v] of escritas) docs.set(p, v);
      return resultado;
    },
  };
  return {
    docs,
    falharProxima: () => {
      falharProximaTx = true;
    },
    servico: new AulaGamificadaService({
      store,
      idParticipante: (_tId, aId) => aId.replace('a', 'p'),
      agora: () => 100_000,
      gerarId: () => 'id1',
    }),
  };
}

describe('REV-AV-15 — capacidade, revisão, reenvio, falha recuperável e versões antigas', () => {
  it('suporta revisão de nota em turma completa, reenvio idempotente, falha recuperável e preserva versão publicada v1 após v2', async () => {
    const { docs, falharProxima, servico } = ambienteTurmaCompleta();
    const prof = { tipo: 'professor', uid: 'prof-1' };
    const aluno0 = { tipo: 'aluno', loginKey: 'ana0' };

    // 1. Publica v1 (todos os docs <= 1 MiB)
    const pub1 = await servico.finalizarAvaliacao(prof, 'AVCAP2', {
      expectedRevision: 1,
      requestId: 'pub-v1',
      publicarPortal: true,
    });
    expect(pub1.revision).toBe(2);
    expect(pub1.relatorio.alunos).toHaveLength(40);

    // 2. Revisa nota em turma de 40 alunos e 20 questões + testa reenvio idempotente
    const rev1 = await servico.revisarNotaAvaliacao(prof, 'AVCAP2', {
      expectedRevision: 2,
      requestId: 'rev-p0',
      participanteId: 'p0',
      notaRevisada: 8.5,
      justificativa: 'Ajuste de critério.',
    });
    expect(rev1.revision).toBe(3);
    expect(rev1.relatorio.alunos.find((a) => a.participanteId === 'p0').notaFinal).toBe(8.5);

    // 3. Falha recuperável ao tentar republicar v2 não expõe v2 parcialmente
    falharProxima();
    await expect(
      servico.finalizarAvaliacao(prof, 'AVCAP2', {
        expectedRevision: 3,
        requestId: 'pub-v2',
        publicarPortal: true,
      }),
    ).rejects.toThrow('Falha transitória');

    // Aluno ainda vê v1 (10) com explicação completa de 800 chars, sem vazamento de 8.5
    const antesRecuperar = await servico.relatorioSala(aluno0, 'AVCAP2');
    expect(antesRecuperar.versaoPublicada).toBe(1);
    expect(antesRecuperar.meuResultado.notaFinal).toBe(10);
    expect(antesRecuperar.meuResultado.detalhesQuestoes).toHaveLength(20);
    expect(antesRecuperar.meuResultado.detalhesQuestoes[0].explicacao.length).toBe(800);

    // 4. Reenvio da republicação v2 após falha + segundo reenvio idempotente
    const pub2 = await servico.finalizarAvaliacao(prof, 'AVCAP2', {
      expectedRevision: 3,
      requestId: 'pub-v2',
      publicarPortal: true,
    });
    const pub2Retry = await servico.finalizarAvaliacao(prof, 'AVCAP2', {
      expectedRevision: 3,
      requestId: 'pub-v2',
      publicarPortal: true,
    });
    expect(pub2Retry).toEqual(pub2);
    expect(pub2.revision).toBe(4);

    // Reenvio idempotente da revisão antiga devolve revision 3 (não 4!)
    const rev1Retry = await servico.revisarNotaAvaliacao(prof, 'AVCAP2', {
      expectedRevision: 2,
      requestId: 'rev-p0',
      participanteId: 'p0',
      notaRevisada: 8.5,
      justificativa: 'Ajuste de critério.',
    });
    expect(rev1Retry.revision).toBe(3);

    // Aluno agora vê v2 (8.5) com feedback completo
    const aposPub2 = await servico.relatorioSala(aluno0, 'AVCAP2');
    expect(aposPub2.versaoPublicada).toBe(2);
    expect(aposPub2.meuResultado.notaFinal).toBe(8.5);
    expect(aposPub2.meuResultado.justificativaRevisao).toBe('Ajuste de critério.');
    expect(aposPub2.meuResultado.detalhesQuestoes[19].enunciado.length).toBeGreaterThanOrEqual(800);

    // Versão antiga (v1) permanece preservada e legível no armazenamento
    expect(docs.get('aulaGamificadaSalas/AVCAP2/avaliacaoVersoes/1').versaoPublicada).toBe(1);
    expect(docs.get('aulaGamificadaSalas/AVCAP2/avaliacaoPublicados/1_p0').notaFinal).toBe(10);
  });
});
