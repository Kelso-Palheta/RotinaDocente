import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

const prof = { tipo: 'professor', uid: 'prof-1' };
const aluno = { tipo: 'aluno', loginKey: 'ana' };
const codigo = 'AV0001';
const base = `aulaGamificadaSalas/${codigo}`;
const diarioPath = 'professores/prof-1/turmas/data';
const idParticipante = (turmaId, alunoId) => createHash('sha256')
  .update(JSON.stringify([turmaId, alunoId])).digest('hex');

function ambiente({ anoTurma = 2026 } = {}) {
  const pid = idParticipante('t1', 'a1');
  const sala = {
    codigo, professorId: prof.uid, titulo: 'Avaliação de Arte', modalidade: 'quiz',
    finalidade: 'avaliativa', turmaIds: ['t1'], roster: [pid], criadoEmMs: 1000,
    rodada: 1, rodadasAbertas: 1, iniciadaEmMs: 1000, totalRodadas: 1,
    fase: 'encerrada', revision: 1,
    avaliacao: { tituloAtividade: 'Avaliação', disciplina: 'Arte', bimestre: '1',
      anoLetivo: '2026', valorMaximo: 10, colunaPorTurma: {} },
  };
  const docs = new Map(Object.entries({
    [base]: sala,
    [`${base}/conteudos/0`]: { segredo: { questao: {
      tipo: 'multipla_escolha', respostaCorreta: 'A', explicacao: 'Explicação publicada.',
    } } },
    [`${base}/participantes/${pid}`]: {
      id: pid, alunoId: 'a1', turmaId: 't1', nomeExibicao: 'Ana', entrouEmMs: 1000,
    },
    [`${base}/respostas/1_${pid}`]: { participanteId: pid, rodada: 1, resposta: { alternativaId: 'A' } },
    [`${base}/avaliacao/estado`]: { finalizada: true, publicadoPortal: false },
    [`atividades/ag_${codigo}_t1`]: { id: `ag_${codigo}_t1`, professorId: prof.uid },
    [diarioPath]: { revision: 1, turmas: [{ id: 't1', anoLetivo: anoTurma,
      alunos: [{ id: 'a1', nome: 'Ana' }], bimestres: { '1': { atividades: [], notas: {} } } }] },
    'alunoLogin/ana/vinculos/prof-1': { professorUid: prof.uid, turmaId: 't1', alunoId: 'a1' },
  }));
  const store = {
    async get(p) { return docs.has(p) ? structuredClone(docs.get(p)) : null; },
    async list(p, filtros = []) {
      return [...docs].filter(([k, d]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes('/')
        && filtros.every(([campo, op, valor]) => op === '==' && d[campo] === valor))
        .map(([, d]) => structuredClone(d));
    },
    async transaction(fn) {
      const escritas = new Map();
      const ler = (f) => {
        if (escritas.size) throw new Error('Leitura após escrita na transação.');
        return f();
      };
      const resultado = await fn({
        get: (p) => ler(() => store.get(p)), list: (p, f) => ler(() => store.list(p, f)),
        set: (p, d) => escritas.set(p, structuredClone(d)),
      });
      for (const [p, d] of escritas) docs.set(p, d);
      return resultado;
    },
  };
  return {
    docs, pid,
    servico: new AulaGamificadaService({ store, idParticipante, agora: () => 100_000, gerarId: () => 'rev1' }),
  };
}

describe('Avaliação gamificada — contratos reais de produção', () => {
  it('REV-AV-12: filtro de aluno reconhece o participante SHA-256 usado em produção', async () => {
    const { servico } = ambiente();
    const resultado = await servico.listarAvaliacoes(prof, { turmaId: 't1', alunoId: 'a1' });
    expect(resultado.itens.map((s) => s.codigo)).toContain(codigo);
  });

  it('REV-AV-13: sincronização rejeita turma cujo ano diverge da avaliação congelada', async () => {
    const { servico } = ambiente({ anoTurma: 2025 });
    await expect(servico.sincronizarDiario(prof, codigo, {
      expectedRevision: 1, requestId: 'sync-ano', dryRun: false, diarioRevisionEsperada: 1,
    })).rejects.toMatchObject({ status: 422 });
  });

  it('REV-AV-14: revisão docente não substitui resultado publicado sem nova publicação', async () => {
    const { servico, pid } = ambiente();
    await servico.finalizarAvaliacao(prof, codigo, {
      expectedRevision: 1, requestId: 'publicar-1', publicarPortal: true,
    });
    const publicado = await servico.relatorioSala(aluno, codigo);
    expect(publicado.meuResultado.notaFinal).toBe(10);
    await servico.revisarNotaAvaliacao(prof, codigo, {
      expectedRevision: 2, requestId: 'revisar-1', participanteId: pid,
      notaRevisada: 6, justificativa: 'Revisão aguardando nova publicação docente.',
    });
    const relatorioDocente = await servico.relatorioSala(prof, codigo);
    expect(relatorioDocente.alunos[0].notaFinal).toBe(6);
    const resumoPortal = await servico.minhasAvaliacoes(aluno);
    expect(resumoPortal.avaliacoes[0].notaFinal).toBe(10);
    const detalhePortal = await servico.relatorioSala(aluno, codigo);
    expect(detalhePortal.meuResultado.notaFinal).toBe(10);
  });
});
