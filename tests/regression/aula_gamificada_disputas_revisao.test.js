import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { montarConteudo, validarEquipes } from '@/dominio/aula-gamificada/sala';

const prof = { tipo: 'professor', uid: 'prof1' };
const ana = { tipo: 'aluno', loginKey: 'ana' };
const beto = { tipo: 'aluno', loginKey: 'beto' };
const pid = (t, a) => createHash('sha256').update(JSON.stringify([t, a])).digest('hex');
const codigo = 'DISP01';
const base = `aulaGamificadaSalas/${codigo}`;

function ambiente(modalidade = 'equipes') {
  const participantes = ['a1', 'a2', 'a3'].map((a, i) => ({
    id: pid('t1', a), alunoId: a, turmaId: 't1', nomeExibicao: ['Ana', 'Beto', 'Caio'][i],
    equipeId: i < 2 ? 'g1' : 'g2', entrouEmMs: 1000, pontos: 0,
  }));
  const equipes = [
    { id: 'g1', nome: 'Sol', participanteIds: participantes.slice(0, 2).map((p) => p.id), representanteAlunoId: 'a1' },
    { id: 'g2', nome: 'Lua', participanteIds: [participantes[2].id], representanteAlunoId: 'a3' },
  ];
  const questao = { id: 'q1', revision: 1, status: 'revisada', disciplina: 'Arte',
    anoEscolar: '9º ano', conteudo: 'Arte', dificuldade: 'facil', tipo: 'multipla_escolha',
    enunciado: 'Qual é correta?', explicacao: 'A é correta.',
    alternativas: [{ id: 'A', texto: 'Correta' }, { id: 'B', texto: 'Errada' }, { id: 'C', texto: 'Outra' }],
    respostaCorreta: 'A' };
  const sala = { codigo, professorId: prof.uid, titulo: 'Grupos', modalidade,
    formatoParticipacao: 'grupos', modoRespostaGrupo: 'compartilhada',
    finalidade: 'avaliativa', avaliacao: { tituloAtividade: 'Jogo', disciplina: 'Arte',
      anoLetivo: '2026', bimestre: '1', valorMaximo: 10, criterioColetivo: 'atribuir_presentes' },
    turmaIds: ['t1'], roster: participantes.map((p) => p.id), equipes, rodada: 1,
    totalRodadas: 1, rodadasAbertas: 1, fase: 'pergunta', iniciadaEmMs: 1000,
    encerraEmMs: 200_000, tempoSegundos: 60, revelado: false, revision: 1,
  };
  const docs = new Map(Object.entries({
    [base]: sala,
    [`${base}/conteudos/0`]: montarConteudo(questao, modalidade, { codigo, indice: 0, segredoSemente: 'fixa' }),
    'aulaGamificadaDocentes/prof1/questoes/q1': questao,
    'professores/prof1/turmas/data': { revision: 1, turmas: [{ id: 't1', nome: 'Turma 1', anoLetivo: 2026,
      alunos: participantes.map((p) => ({ id: p.alunoId, nome: p.nomeExibicao })), bimestres: {} }] },
  }));
  participantes.forEach((p, i) => {
    docs.set(`${base}/participantes/${p.id}`, p);
    docs.set(`alunoLogin/${['ana', 'beto', 'caio'][i]}/vinculos/prof1`, {
      professorUid: prof.uid, turmaId: 't1', alunoId: p.alunoId,
    });
  });
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
    gerarId: () => 'aud1', gerarCodigo: () => 'NEW001' });
  const responder = () => servico.responder(ana, codigo, {
    rodada: 1, requestId: 'resp1', resposta: { alternativaId: 'A' },
  });
  const ranking = async () => {
    await responder();
    for (const [i, acao] of ['encerrar_rodada', 'revelar', 'ranking'].entries()) {
      await servico.comandar(prof, codigo, { acao, rodada: 1, expectedRevision: i + 1, requestId: acao });
    }
    return (await servico.estado(prof, codigo)).estado.ranking;
  };
  return { servico, participantes, responder, ranking };
}

describe('Revisão de disputas com evidências e IDs de produção', () => {
  it('REV-DIS-01: representante com alunoId local ambíguo exige identificação da turma/participante', () => {
    const roster = [
      { id: pid('t1', 'a1'), turmaId: 't1', alunoId: 'a1' },
      { id: pid('t2', 'a1'), turmaId: 't2', alunoId: 'a1' },
      { id: pid('t1', 'a3'), turmaId: 't1', alunoId: 'a3' },
    ];
    expect(() => validarEquipes([
      { id: 'g1', nome: 'Sol', participanteIds: roster.slice(0, 2).map((p) => p.id), representanteAlunoId: 'a1' },
      { id: 'g2', nome: 'Lua', participanteIds: [roster[2].id], representanteAlunoId: 'a3' },
    ], roster, { exigirMembros: true, modoRespostaGrupo: 'compartilhada' })).toThrow();
  });

  it('REV-DIS-02: integrante não recebe pontos que antecipam acerto coletivo antes da revelação', async () => {
    const { servico, responder } = ambiente();
    await responder();
    const atual = (await servico.estado(beto, codigo)).estado;
    expect(atual.rodada.revelado).toBe(false);
    expect(atual.eu.pontos).toBe(0);
  });

  it('REV-DIS-03: uma resposta coletiva vale 1000 para o grupo, sem multiplicar pelos integrantes', async () => {
    const { ranking } = ambiente();
    expect((await ranking()).find((e) => e.id === 'g1').pontos).toBe(1000);
  });

  it('REV-DIS-04: Quiz em grupos exibe ranking dos grupos, não o ranking individual', async () => {
    const { ranking } = ambiente('quiz');
    expect((await ranking()).map((e) => e.id).sort()).toEqual(['g1', 'g2']);
  });

  it('REV-DIS-05: ausência expressamente registrada pelo professor prevalece sobre login anterior', async () => {
    const { servico, participantes, responder } = ambiente();
    await responder();
    await servico.comandar(prof, codigo, { acao: 'encerrar_sala', rodada: 1, expectedRevision: 1, requestId: 'fim' });
    await servico.comandar(prof, codigo, { acao: 'confirmar_presenca', rodada: 1, expectedRevision: 2,
      requestId: 'presenca', presentesIds: [participantes[0].id], substituir: true });
    const relatorio = await servico.relatorioSala(prof, codigo);
    expect(relatorio.alunos.find((p) => p.alunoId === 'a2').notaFinal).toBeNull();
  });

  it('REV-DIS-06: nova disputa em grupos individuais não aceita grupo vazio', async () => {
    const { servico, participantes } = ambiente();
    await expect(servico.criarSala(prof, { titulo: 'Grupos novos', modalidade: 'quiz',
      formatoParticipacao: 'grupos', modoRespostaGrupo: 'individual', turmaIds: ['t1'],
      questaoIds: ['q1'], tempoSegundos: 60, requestId: 'criar', equipes: [
        { id: 'g1', nome: 'Vazio', participanteIds: [] },
        { id: 'g2', nome: 'Todos', participanteIds: participantes.map((p) => p.id) },
      ],
    })).rejects.toMatchObject({ status: 422 });
  });
});
