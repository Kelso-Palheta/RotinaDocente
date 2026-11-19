import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

// Limite oficial: https://firebase.google.com/docs/firestore/quotas
const MAX_DOCUMENTO = 1_048_576;

// Limite inferior conservador: conta SOMENTE conteúdo de strings, sem nomes
// de campos, números nem demais overheads que o Firestore também contabiliza.
function bytesStrings(valor) {
  if (typeof valor === 'string') return Buffer.byteLength(valor, 'utf8');
  if (Array.isArray(valor)) return valor.reduce((n, v) => n + bytesStrings(v), 0);
  if (valor && typeof valor === 'object') return Object.values(valor).reduce((n, v) => n + bytesStrings(v), 0);
  return 0;
}

function salaComTurmaCompleta() {
  const codigo = 'AVCAP1';
  const base = `aulaGamificadaSalas/${codigo}`;
  const participantes = Array.from({ length: 40 }, (_, i) => ({
    id: `p${i}`, alunoId: `a${i}`, turmaId: 't1', nomeExibicao: `Aluno ${i}`,
    entrouEmMs: 1000, pontos: 20_000,
  }));
  const sala = {
    codigo, professorId: 'prof-1', titulo: 'Avaliação com 20 questões', modalidade: 'quiz',
    finalidade: 'avaliativa', turmaIds: ['t1'], roster: participantes.map((p) => p.id),
    rodada: 20, totalRodadas: 20, rodadasAbertas: 20, iniciadaEmMs: 1000,
    fase: 'encerrada', revision: 1,
    avaliacao: { tituloAtividade: 'Avaliação', disciplina: 'Arte', bimestre: '1',
      anoLetivo: '2026', valorMaximo: 10 },
  };
  const docs = new Map([
    [base, sala],
    [`${base}/avaliacao/estado`, {}],
    [`atividades/ag_${codigo}_t1`, { id: `ag_${codigo}_t1`, professorId: 'prof-1' }],
  ]);
  for (let i = 0; i < 20; i++) {
    docs.set(`${base}/conteudos/${i}`, { segredo: { questao: {
      tipo: 'multipla_escolha', enunciado: 'E'.repeat(800),
      explicacao: 'F'.repeat(800), respostaCorreta: 'A',
    } } });
    for (const p of participantes) {
      docs.set(`${base}/respostas/${i + 1}_${p.id}`, {
        participanteId: p.id, rodada: i + 1, resposta: { alternativaId: 'A' },
      });
    }
  }
  for (const p of participantes) docs.set(`${base}/participantes/${p.id}`, p);
  const store = {
    async get(p) { return docs.has(p) ? structuredClone(docs.get(p)) : null; },
    async list(p) {
      return [...docs].filter(([k]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes('/'))
        .map(([, v]) => structuredClone(v));
    },
    async transaction(fn) {
      const escritas = new Map();
      const ler = (f) => {
        if (escritas.size) throw new Error('Leitura após escrita.');
        return f();
      };
      const resultado = await fn({
        get: (p) => ler(() => store.get(p)), list: (p) => ler(() => store.list(p)),
        set(p, v) {
          const minimo = bytesStrings(v);
          if (minimo > MAX_DOCUMENTO) {
            throw new Error(`Documento ${p}: só strings já somam ${minimo} bytes; máximo ${MAX_DOCUMENTO}.`);
          }
          escritas.set(p, structuredClone(v));
        },
      });
      for (const [p, v] of escritas) docs.set(p, v);
      return resultado;
    },
  };
  return new AulaGamificadaService({ store, agora: () => 100_000, gerarId: () => 'id1' });
}

describe('REV-AV-15 — avaliação dentro dos limites documentais do Firestore', () => {
  it.each([false, true])('finaliza turma de 40 alunos com 20 questões; publicarPortal=%s', async (publicarPortal) => {
    const servico = salaComTurmaCompleta();
    await expect(servico.finalizarAvaliacao({ tipo: 'professor', uid: 'prof-1' }, 'AVCAP1', {
      expectedRevision: 1, requestId: `finalizar-${publicarPortal}`, publicarPortal,
    })).resolves.toMatchObject({ revision: 2 });
  });
});
