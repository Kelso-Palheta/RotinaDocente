import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { montarConteudo } from '@/dominio/aula-gamificada/sala';

const prof = { tipo: 'professor', uid: 'prof1' };
const beto = { tipo: 'aluno', loginKey: 'beto' };
const codigo = 'PRES01';
const base = `aulaGamificadaSalas/${codigo}`;
const pid = (t, a) => createHash('sha256').update(JSON.stringify([t, a])).digest('hex');

async function publicarCorrigirPresencaERepublicar() {
  const participantes = ['a1', 'a2', 'a3'].map((id, i) => ({
    id: pid('t1', id), alunoId: id, turmaId: 't1', nomeExibicao: ['Ana', 'Beto', 'Caio'][i],
    equipeId: i < 2 ? 'g1' : 'g2', entrouEmMs: 1000, presenteConfirmado: true, pontos: 0,
  }));
  const questao = { id: 'q1', revision: 1, status: 'revisada', disciplina: 'Arte',
    anoEscolar: '9º ano', conteudo: 'Arte', dificuldade: 'facil', tipo: 'multipla_escolha',
    enunciado: 'Qual é correta?', explicacao: 'A é correta.',
    alternativas: [{ id: 'A', texto: 'Correta' }, { id: 'B', texto: 'Errada' }, { id: 'C', texto: 'Outra' }],
    respostaCorreta: 'A' };
  const sala = { codigo, professorId: prof.uid, titulo: 'Avaliação coletiva', modalidade: 'quiz',
    formatoParticipacao: 'grupos', modoRespostaGrupo: 'compartilhada', finalidade: 'avaliativa',
    avaliacao: { tituloAtividade: 'Jogo', disciplina: 'Arte', anoLetivo: '2026', bimestre: '1',
      valorMaximo: 10, criterioColetivo: 'atribuir_presentes' },
    turmaIds: ['t1'], roster: participantes.map((p) => p.id),
    equipes: [{ id: 'g1', nome: 'Sol', participanteIds: participantes.slice(0, 2).map((p) => p.id),
      representanteParticipanteId: participantes[0].id, representanteAlunoId: 'a1' },
      { id: 'g2', nome: 'Lua', participanteIds: [participantes[2].id],
        representanteParticipanteId: participantes[2].id, representanteAlunoId: 'a3' }],
    rodada: 1, totalRodadas: 1, rodadasAbertas: 1, iniciadaEmMs: 1000,
    fase: 'encerrada', revelado: true, revision: 1,
  };
  const docs = new Map(Object.entries({
    [base]: sala,
    [`${base}/conteudos/0`]: montarConteudo(questao, 'quiz', { codigo, indice: 0, segredoSemente: 'fixa' }),
    [`${base}/respostas/1_eq_g1`]: { participanteId: 'eq_g1', equipeId: 'g1', rodada: 1,
      pontos: 1000, resposta: { alternativaId: 'A' }, autoriaAlunoId: 'a1' },
    [`atividades/ag_${codigo}_t1`]: { id: `ag_${codigo}_t1`, professorId: prof.uid },
    'professores/prof1/turmas/data': { revision: 1, turmas: [{ id: 't1', anoLetivo: 2026,
      alunos: participantes.map((p) => ({ id: p.alunoId, nome: p.nomeExibicao })), bimestres: {} }] },
    'alunoLogin/beto/vinculos/prof1': { professorUid: prof.uid, turmaId: 't1', alunoId: 'a2' },
  }));
  for (const p of participantes) docs.set(`${base}/participantes/${p.id}`, p);
  const store = {
    async get(p) { return docs.has(p) ? structuredClone(docs.get(p)) : null; },
    async list(p, filtros = []) {
      return [...docs].filter(([k, d]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes('/')
        && filtros.every(([c, op, v]) => op === '==' && d[c] === v)).map(([, d]) => structuredClone(d));
    },
    async transaction(fn) {
      const writes = new Map();
      const ler = (f) => { if (writes.size) throw new Error('Leitura após escrita.'); return f(); };
      const result = await fn({ get: (p) => ler(() => store.get(p)),
        list: (p, f) => ler(() => store.list(p, f)), set: (p, d) => writes.set(p, structuredClone(d)) });
      for (const [p, d] of writes) docs.set(p, d);
      return result;
    },
  };
  const servico = new AulaGamificadaService({ store, idParticipante: pid, agora: () => 100_000,
    gerarId: () => 'aud1' });
  await servico.finalizarAvaliacao(prof, codigo, {
    expectedRevision: 1, requestId: 'pub1', publicarPortal: true,
  });
  expect((await servico.minhasAvaliacoes(beto)).avaliacoes[0].notaFinal).toBe(10);
  await servico.comandar(prof, codigo, { acao: 'confirmar_presenca', rodada: 1, expectedRevision: 2,
    requestId: 'corrigir-presenca', presentesIds: [participantes[0].id], substituir: true });
  const atual = await servico.relatorioSala(prof, codigo);
  expect(atual.alunos.find((a) => a.alunoId === 'a2').notaFinal).toBeNull();
  await servico.finalizarAvaliacao(prof, codigo, {
    expectedRevision: 3, requestId: 'pub2', publicarPortal: true,
  });
  return { servico, docs };
}

describe('Reconciliação de ausência depois de nota coletiva publicada', () => {
  it('REV-DIS-08: resumo do Portal acompanha o detalhe da nova versão sem nota', async () => {
    const { servico } = await publicarCorrigirPresencaERepublicar();
    const detalhe = await servico.relatorioSala(beto, codigo);
    expect(detalhe.meuResultado.notaFinal).toBeNull();
    const resumo = (await servico.minhasAvaliacoes(beto)).avaliacoes.find((a) => a.codigo === codigo);
    expect(resumo?.notaFinal ?? null).toBeNull();
  });

  it('REV-DIS-09: entrega anterior deixa de fornecer nota corrigida para sincronização regular', async () => {
    const { docs } = await publicarCorrigirPresencaERepublicar();
    const entrega = docs.get(`entregas/ag_${codigo}_t1_a2`);
    const sincronizavel = ['corrigido', 'revisado'].includes(entrega?.status)
      && typeof (entrega.notaRevisada ?? entrega.notaFinal) === 'number';
    expect(sincronizavel).toBe(false);
  });
});
