import { beforeEach, describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

class Memoria {
  constructor() {
    this.docs = new Map();
    this.fila = Promise.resolve();
  }

  async get(path) {
    return structuredClone(this.docs.get(path) ?? null);
  }

  async list(path, filtros = []) {
    return this.listar(this.docs, path, filtros);
  }

  listar(docs, path, filtros) {
    const prefixo = `${path}/`;
    return [...docs]
      .filter(
        ([p, d]) =>
          p.startsWith(prefixo) &&
          !p.slice(prefixo.length).includes('/') &&
          filtros.every(([campo, op, valor]) => op === '==' && d[campo] === valor),
      )
      .map(([p, d]) => ({ ...structuredClone(d), id: p.slice(prefixo.length) }));
  }

  async set(path, data) {
    this.docs.set(path, structuredClone(data));
  }

  transaction(fn) {
    const job = this.fila.then(async () => {
      const docs = new Map(this.docs);
      const tx = {
        get: async (p) => structuredClone(docs.get(p) ?? null),
        list: async (p, f = []) => this.listar(docs, p, f),
        set: (p, d) => docs.set(p, structuredClone(d)),
        create: (p, d) => {
          if (docs.has(p)) throw Object.assign(new Error('Existe'), { status: 409 });
          docs.set(p, structuredClone(d));
        },
        delete: (p) => docs.delete(p),
      };
      const resultado = await fn(tx);
      this.docs = docs;
      return resultado;
    });
    this.fila = job.catch(() => {});
    return job;
  }
}

const professor = (uid = 'prof-1') => ({ tipo: 'professor', uid });
const cap = (fn) => {
  try {
    fn();
  } catch (erro) {
    return erro;
  }
  return null;
};
const pegar = async (promise) => {
  try {
    await promise;
  } catch (erro) {
    return erro;
  }
  return null;
};

const questaoBase = (extra = {}) => ({
  disciplina: 'Arte',
  anoEscolar: '1º ano do Ensino Médio',
  conteudo: 'Ciclo da água',
  dificuldade: 'facil',
  tipo: 'multipla_escolha',
  enunciado: 'Qual etapa transforma vapor em gotas?',
  alternativas: [
    { id: 'A', texto: 'Evaporação' },
    { id: 'B', texto: 'Condensação' },
  ],
  respostaCorreta: 'B',
  explicacao: 'A condensação forma gotas.',
  justificativaDificuldade: 'Vocabulário direto.',
  ...extra,
});

describe('banco privado de questões', () => {
  let store;
  let service;
  let contador;
  let relogio;

  beforeEach(async () => {
    store = new Memoria();
    contador = 0;
    relogio = 1000;
    service = new AulaGamificadaService({
      store,
      agora: () => relogio++,
      gerarId: () => `id-${++contador}`,
      gerarCodigo: () => 'SALA01',
      idParticipante: (turmaId, alunoId) => `${turmaId}:${alunoId}`,
    });
    await store.set('professores/prof-1', {
      turmas: [
        {
          id: 't1',
          nome: 'Turma 1',
          alunos: [
            { id: 'a1', nome: 'Ana' },
            { id: 'a2', nome: 'Bia' },
          ],
        },
      ],
    });
    await store.set('professores/prof-2', {
      turmas: [{ id: 't2', nome: 'Turma 2', alunos: [{ id: 'b1', nome: 'Caio' }] }],
    });
  });

  const criar = async (extra = {}, requestId = 'req-criar') =>
    service.salvarQuestao(professor(), { questao: questaoBase(extra), requestId });

  const revisar = async (id, expectedRevision, requestId = 'req-revisar') =>
    service.revisarQuestao(professor(), id, { expectedRevision, requestId });

  it('cria rascunho, revisa e lista apenas o banco do docente', async () => {
    const { questao } = await criar();
    expect(questao.status).toBe('rascunho');

    const { questao: revisada } = await revisar(questao.id, questao.revision);
    expect(revisada.status).toBe('revisada');
    expect(revisada.revision).toBe(questao.revision + 1);

    const catalogo = await service.catalogo(professor());
    expect(catalogo.questoes).toHaveLength(1);
    expect(catalogo.questoes[0].status).toBe('revisada');
    expect(catalogo.modalidades.map((m) => m.id)).toEqual([
      'quiz',
      'memoria',
      'associacao',
      'ordenacao',
      'equipes',
    ]);
    expect(catalogo.turmas).toEqual([
      {
        id: 't1',
        nome: 'Turma 1',
        totalAlunos: 2,
        alunos: [
          { id: 't1:a1', alunoId: 'a1', nome: 'Ana' },
          { id: 't1:a2', alunoId: 'a2', nome: 'Bia' },
        ],
      },
    ]);

    const outro = await service.catalogo(professor('prof-2'));
    expect(outro.questoes).toHaveLength(0);
  });

  it('não cria duplicata ao repetir o mesmo requestId', async () => {
    const primeira = await criar({}, 'req-unico');
    const segunda = await criar({ enunciado: 'Tentativa repetida' }, 'req-unico');

    expect(segunda.questao.id).toBe(primeira.questao.id);
    expect(segunda.questao.enunciado).toBe(primeira.questao.enunciado);
    expect(await store.list('aulaGamificadaDocentes/prof-1/questoes')).toHaveLength(1);
  });

  it('exige expectedRevision e preserva o rascunho em conflito', async () => {
    const { questao } = await criar();
    const { questao: editada } = await service.salvarQuestao(professor(), {
      questao: { ...questao, enunciado: 'Novo enunciado', id: questao.id },
      expectedRevision: questao.revision,
      requestId: 'req-editar',
    });
    expect(editada.status).toBe('rascunho');
    expect(editada.revision).toBe(questao.revision + 1);

    const erro = await pegar(
      service.salvarQuestao(professor(), {
        questao: { ...questao, enunciado: 'Edição concorrente', id: questao.id },
        expectedRevision: questao.revision,
        requestId: 'req-editar-2',
      }),
    );
    expect(erro?.status).toBe(409);
    const salva = await store.get(`aulaGamificadaDocentes/prof-1/questoes/${questao.id}`);
    expect(salva.enunciado).toBe('Novo enunciado');
    expect(salva.revision).toBe(questao.revision + 1);
  });

  it('salva rascunho gerado pela IA como criação, sem exigir revisão anterior', async () => {
    service.ia = { gerar: async () => ({ questoes: [questaoBase()] }) };
    const { questoes } = await service.gerar(
      professor(),
      {
        disciplina: 'Arte',
        anoEscolar: '1º ano do Ensino Médio',
        conteudo: 'Ciclo da água',
        tipo: 'multipla_escolha',
        fonte: 'tema',
        quantidades: { facil: 1, medio: 0, dificil: 0 },
        modalidade: 'quiz',
      },
      { apiKey: 'chave-de-teste' },
    );

    const { questao } = await service.salvarQuestao(professor(), {
      questao: questoes[0],
      requestId: 'req-salvar-rascunho',
    });

    expect(questao.id).toBe(questoes[0].id);
    expect(questao.revision).toBe(1);
    expect(questao.status).toBe('rascunho');
  });

  it('isola o banco entre professores', async () => {
    const { questao } = await criar();
    const erro = await pegar(service.revisarQuestao(professor('prof-2'), questao.id, {
      expectedRevision: questao.revision,
      requestId: 'req-alheio',
    }));
    expect(erro?.status).toBe(404);
  });

  it('cria sala somente com questões revisadas e compatíveis e congela o conteúdo', async () => {
    const { questao } = await criar();
    const erro = await pegar(
      service.criarSala(professor(), {
        titulo: 'Sala sem revisão',
        modalidade: 'quiz',
        turmaIds: ['t1'],
        questaoIds: [questao.id],
        tempoSegundos: 60,
        requestId: 'req-sala-rascunho',
      }),
    );
    expect(erro?.status).toBe(422);

    await revisar(questao.id, questao.revision);
    const { sala } = await service.criarSala(professor(), {
      titulo: 'Sala revisada',
      modalidade: 'quiz',
      turmaIds: ['t1'],
      questaoIds: [questao.id],
      tempoSegundos: 60,
      requestId: 'req-sala',
    });
    expect(sala.codigo).toBe('SALA01');
    expect(sala.fase).toBe('espera');

    await service.comandar(professor(), 'SALA01', {
      acao: 'iniciar',
      expectedRevision: sala.revision,
      rodada: 1,
      requestId: 'req-iniciar',
    });
    const antes = await service.estado(professor(), 'SALA01');
    expect(antes.estado.rodada.questao.enunciado).toBe('Qual etapa transforma vapor em gotas?');

    const atual = await store.get(`aulaGamificadaDocentes/prof-1/questoes/${questao.id}`);
    await service.salvarQuestao(professor(), {
      questao: { ...atual, enunciado: 'Enunciado alterado depois da sala' },
      expectedRevision: atual.revision,
      requestId: 'req-editar-depois',
    });

    const depois = await service.estado(professor(), 'SALA01');
    expect(depois.estado.rodada.questao.enunciado).toBe('Qual etapa transforma vapor em gotas?');
  });

  it('recusa modalidade incompatível com o tipo da questão', async () => {
    const { questao } = await criar();
    await revisar(questao.id, questao.revision);

    const erro = await pegar(
      service.criarSala(professor(), {
        titulo: 'Sala errada',
        modalidade: 'memoria',
        turmaIds: ['t1'],
        questaoIds: [questao.id],
        tempoSegundos: 60,
        requestId: 'req-sala-tipo',
      }),
    );
    expect(erro?.status).toBe(422);
    expect(erro?.message).toMatch(/memória|pares|compatível/i);
  });
});
