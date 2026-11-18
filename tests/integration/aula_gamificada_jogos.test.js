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

const docente = { tipo: 'professor', uid: 'prof-1' };
const outroDocente = { tipo: 'professor', uid: 'prof-2' };
const login = (letra) => letra.repeat(64);
const aluno = (letra) => ({ tipo: 'aluno', loginKey: login(letra) });

const pegar = async (promise) => {
  try {
    await promise;
  } catch (erro) {
    return erro;
  }
  return null;
};

const baseQuestao = {
  disciplina: 'Arte',
  anoEscolar: '1º ano do Ensino Médio',
  conteudo: 'Ciclo da água',
  dificuldade: 'facil',
  explicacao: 'Explicação pedagógica sintética.',
  justificativaDificuldade: 'Conteúdo direto para a série.',
};

const multipla = (numero = 1, gabarito = 'B') => ({
  ...baseQuestao,
  tipo: 'multipla_escolha',
  enunciado: `Questão ${numero} sobre o ciclo da água?`,
  alternativas: [
    { id: 'A', texto: 'Evaporação' },
    { id: 'B', texto: 'Condensação' },
    { id: 'C', texto: 'Precipitação' },
  ],
  respostaCorreta: gabarito,
});

const pares = (quantidade = 4) => ({
  ...baseQuestao,
  tipo: 'pares',
  enunciado: 'Relacione cada conceito à sua definição.',
  pares: Array.from({ length: quantidade }, (_, i) => ({
    esquerda: `Conceito ${i + 1}`,
    direita: `Definição ${i + 1}`,
  })),
});

const ordenacao = () => ({
  ...baseQuestao,
  tipo: 'ordenacao',
  enunciado: 'Ordene as etapas do ciclo da água.',
  itens: ['Evaporação', 'Condensação', 'Precipitação', 'Infiltração'].map((texto) => ({ texto })),
});

describe('servidor dos cinco jogos', () => {
  let store;
  let service;
  let relogio;
  let contador;
  let codigos;
  let pedidos;

  beforeEach(async () => {
    store = new Memoria();
    relogio = 10_000;
    contador = 0;
    codigos = ['SALA01', 'SALA02', 'SALA03', 'SALA04', 'SALA05'];
    pedidos = 0;
    service = new AulaGamificadaService({
      store,
      agora: () => relogio,
      gerarId: () => `id-${++contador}`,
      gerarCodigo: () => codigos.shift(),
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
            { id: 'a3', nome: 'Caio' },
          ],
        },
        {
          id: 't2',
          nome: 'Turma 2',
          alunos: [{ id: 'c1', nome: 'Duda' }],
        },
      ],
    });
    await store.set('professores/prof-2', {
      turmas: [{ id: 't9', nome: 'Turma externa', alunos: [{ id: 'z1', nome: 'Zeca' }] }],
    });

    for (const [letra, alunoId, turmaId, professorUid] of [
      ['a', 'a1', 't1', 'prof-1'],
      ['b', 'a2', 't1', 'prof-1'],
      ['c', 'a3', 't1', 'prof-1'],
      ['d', 'c1', 't2', 'prof-1'],
      ['e', 'z1', 't9', 'prof-2'],
    ]) {
      await store.set(`alunoLogin/${login(letra)}/vinculos/${professorUid}`, {
        professorUid,
        turmaId,
        alunoId,
        revogado: false,
      });
    }
  });

  const novoPedido = (prefixo) => `${prefixo}-${++pedidos}`;

  const salvarRevisada = async (conteudo) => {
    const { questao } = await service.salvarQuestao(docente, {
      questao: conteudo,
      requestId: novoPedido('criar'),
    });
    const { questao: revisada } = await service.revisarQuestao(docente, questao.id, {
      expectedRevision: questao.revision,
      requestId: novoPedido('revisar'),
    });
    return revisada;
  };

  const criarSala = async (config) => {
    const { sala } = await service.criarSala(docente, {
      titulo: 'Sala sintética',
      turmaIds: ['t1'],
      tempoSegundos: 60,
      ...config,
      requestId: novoPedido('sala'),
    });
    return sala;
  };

  const iniciar = async (codigo) => {
    const atual = await service.estado(docente, codigo);
    return service.comandar(docente, codigo, {
      acao: 'iniciar',
      expectedRevision: atual.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('iniciar'),
    });
  };

  const responder = async (ator, codigo, resposta, rodada = 1, requestId = novoPedido('resp')) =>
    service.responder(ator, codigo, { rodada, requestId, resposta });

  const estado = async (ator, codigo) => service.estado(ator, codigo);

  it('quiz: aceita uma resposta, repete com o mesmo recibo, rejeita troca e resposta tardia', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });
    const inicio = await iniciar(sala.codigo);

    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });
    const primeira = await responder(aluno('a'), sala.codigo, { alternativaId: 'B' }, 1, 'resp-unica');
    expect(primeira.recibo.status).toBe('confirmado');

    const repetida = await responder(aluno('a'), sala.codigo, { alternativaId: 'B' }, 1, 'resp-unica');
    expect(repetida.recibo.reciboId).toBe(primeira.recibo.reciboId);

    const troca = await pegar(responder(aluno('a'), sala.codigo, { alternativaId: 'A' }, 1, novoPedido('resp')));
    expect(troca?.status).toBe(409);

    const painelOculto = await estado(docente, sala.codigo);
    expect(
      painelOculto.estado.participantes.find((p) => p.id === 't1:a1').pontos,
    ).toBe(0);

    const proprio = await estado(aluno('a'), sala.codigo);
    expect(proprio.estado.eu.recibo.resposta).toEqual({ alternativaId: 'B' });
    expect(proprio.estado.eu.pontos).toBe(0);
    expect(proprio.estado.participantes).toBeUndefined();

    const feedback = await service.comandar(docente, sala.codigo, {
      acao: 'encerrar_rodada',
      expectedRevision: inicio.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('fim'),
    });
    await service.comandar(docente, sala.codigo, {
      acao: 'revelar',
      expectedRevision: feedback.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('revelar'),
    });
    const painel = await estado(docente, sala.codigo);
    const ana = painel.estado.participantes.find((p) => p.id === 't1:a1');
    expect(ana.pontos).toBe(1000);
    const proprioRevelado = await estado(aluno('a'), sala.codigo);
    expect(proprioRevelado.estado.eu.pontos).toBe(1000);

    await service.entrar(aluno('b'), sala.codigo, { requestId: novoPedido('entrar') });
    relogio = inicio.estado.prazo + 1;
    const tardia = await pegar(responder(aluno('b'), sala.codigo, { alternativaId: 'B' }, 1, novoPedido('resp')));
    expect(tardia?.status).toBe(409);
  });

  it('entrada repetida e concorrente preserva a pontuação já gravada', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });
    await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });
    await responder(aluno('a'), sala.codigo, { alternativaId: 'B' });

    const [x, y] = await Promise.all([
      service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar-rep') }),
      service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar-conc') }),
    ]);

    // Pontuação não revelada não aparece no estado, mas também não pode ser apagada.
    expect(x.estado.eu.pontos).toBe(0);
    expect(y.estado.eu.pontos).toBe(0);
    const gravado = await store.get(
      `aulaGamificadaSalas/${sala.codigo}/participantes/t1:a1`,
    );
    expect(gravado.pontos).toBe(1000);
    expect(gravado.entrouEmMs).toBeTruthy();
  });

  it('quiz: duas respostas concorrentes com o mesmo requestId geram um único recibo e uma única pontuação', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });
    await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });

    const [r1, r2] = await Promise.all([
      responder(aluno('a'), sala.codigo, { alternativaId: 'B' }, 1, 'resp-concorrente'),
      responder(aluno('a'), sala.codigo, { alternativaId: 'B' }, 1, 'resp-concorrente'),
    ]);
    expect(r1.recibo.reciboId).toBe(r2.recibo.reciboId);

    const painel = await estado(docente, sala.codigo);
    expect(painel.estado.participantes.find((p) => p.id === 't1:a1').pontos).toBe(0);
    const gravado = await store.get(
      `aulaGamificadaSalas/${sala.codigo}/participantes/t1:a1`,
    );
    expect(gravado.pontos).toBe(1000);
  });

  it('comandos: concorrência na mesma revisão deixa apenas um avanço', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });
    const comando = (requestId) =>
      service.comandar(docente, sala.codigo, {
        acao: 'iniciar',
        expectedRevision: sala.revision,
        rodada: 1,
        requestId,
      });

    const resultados = await Promise.allSettled([comando('cmd-1'), comando('cmd-2')]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((r) => r.status === 'rejected')[0].reason.status).toBe(409);

    const atual = await estado(docente, sala.codigo);
    expect(atual.estado.sala.revision).toBe(sala.revision + 1);
    expect(atual.estado.sala.fase).toBe('pergunta');
  });

  it('associação: pontua pela proporção de pares e rejeita cartas desconhecidas ou repetidas', async () => {
    const q = await salvarRevisada(pares(4));
    const sala = await criarSala({ modalidade: 'associacao', questaoIds: [q.id] });
    await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });

    const { segredo } = await store.get(`aulaGamificadaSalas/${sala.codigo}/conteudos/0`);
    const doisCorretos = segredo.pares.slice(0, 2);

    const recibo = await responder(aluno('a'), sala.codigo, { pares: doisCorretos });
    expect(recibo.recibo.status).toBe('confirmado');

    const painel = await estado(docente, sala.codigo);
    expect(painel.estado.participantes.find((p) => p.id === 't1:a1').pontos).toBe(0);
    const gravado = await store.get(
      `aulaGamificadaSalas/${sala.codigo}/participantes/t1:a1`,
    );
    expect(gravado.pontos).toBe(500);

    await service.entrar(aluno('b'), sala.codigo, { requestId: novoPedido('entrar') });
    const invalido = await pegar(
      responder(aluno('b'), sala.codigo, { pares: [{ esquerdaId: 'nao-existe', direitaId: segredo.pares[0].direitaId }] }),
    );
    expect(invalido?.status).toBe(422);

    await service.entrar(aluno('c'), sala.codigo, { requestId: novoPedido('entrar') });
    const repetido = await pegar(
      responder(aluno('c'), sala.codigo, {
        pares: [
          { esquerdaId: segredo.pares[0].esquerdaId, direitaId: segredo.pares[0].direitaId },
          { esquerdaId: segredo.pares[0].esquerdaId, direitaId: segredo.pares[1].direitaId },
        ],
      }),
    );
    expect(repetido?.status).toBe(422);
  });

  it('ordenação: pontua posições corretas e exige permutação completa', async () => {
    const q = await salvarRevisada(ordenacao());
    const sala = await criarSala({ modalidade: 'ordenacao', questaoIds: [q.id] });
    await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });

    const { segredo } = await store.get(`aulaGamificadaSalas/${sala.codigo}/conteudos/0`);
    const correta = segredo.respostaCorreta;
    const duasTrocadas = [correta[1], correta[0], correta[2], correta[3]];

    await responder(aluno('a'), sala.codigo, { ordem: duasTrocadas });
    const painel = await estado(docente, sala.codigo);
    expect(painel.estado.participantes.find((p) => p.id === 't1:a1').pontos).toBe(0);
    const gravado = await store.get(
      `aulaGamificadaSalas/${sala.codigo}/participantes/t1:a1`,
    );
    expect(gravado.pontos).toBe(500);

    await service.entrar(aluno('b'), sala.codigo, { requestId: novoPedido('entrar') });
    const incompleta = await pegar(responder(aluno('b'), sala.codigo, { ordem: correta.slice(0, 3) }));
    expect(incompleta?.status).toBe(422);
  });

  it('memória: erra, fecha na próxima virada, completa uma vez e consolida ao encerrar', async () => {
    const q = await salvarRevisada(pares(4));
    const sala = await criarSala({ modalidade: 'memoria', questaoIds: [q.id] });
    await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });
    await service.entrar(aluno('b'), sala.codigo, { requestId: novoPedido('entrar') });
    await service.entrar(aluno('c'), sala.codigo, { requestId: novoPedido('entrar') });

    const { segredo } = await store.get(`aulaGamificadaSalas/${sala.codigo}/conteudos/0`);
    const [p0, p1, p2, p3] = segredo.pares;
    const reqFinal = novoPedido('mem-final');

    await responder(aluno('a'), sala.codigo, { virarId: p0.esquerdaId });
    const errado = await responder(aluno('a'), sala.codigo, { virarId: p1.esquerdaId });
    expect(errado.recibo.cartasReveladas).toHaveLength(2);

    const fecha = await responder(aluno('a'), sala.codigo, { virarId: p0.direitaId });
    expect(fecha.recibo.cartasReveladas).toEqual([p0.direitaId]);

    await responder(aluno('a'), sala.codigo, { virarId: p0.esquerdaId });
    const primeiroPar = await responder(aluno('a'), sala.codigo, { virarId: p1.esquerdaId });
    expect(primeiroPar.recibo.cartasEncontradas).toHaveLength(2);

    for (const par of [p1, p2, p3]) {
      await responder(aluno('a'), sala.codigo, { virarId: par.esquerdaId });
      const fim = await responder(
        aluno('a'),
        sala.codigo,
        { virarId: par.direitaId },
        1,
        par === p3 ? reqFinal : novoPedido('mem'),
      );
      if (par === p3) expect(fim.recibo.completo).toBe(true);
    }

    const painel = await estado(docente, sala.codigo);
    expect(painel.estado.participantes.find((p) => p.id === 't1:a1').pontos).toBe(0);
    expect(
      painel.estado.participantes.find((p) => p.id === 't1:a1').progresso,
    ).toEqual({ paresEncontrados: 4, totalPares: 4, completo: true });
    const gravado = await store.get(
      `aulaGamificadaSalas/${sala.codigo}/participantes/t1:a1`,
    );
    expect(gravado.pontos).toBe(1000);

    const repetido = await responder(aluno('a'), sala.codigo, { virarId: p3.direitaId }, 1, reqFinal);
    expect(repetido.recibo.completo).toBe(true);

    const concluido = await pegar(
      responder(aluno('a'), sala.codigo, { virarId: p0.esquerdaId }, 1, novoPedido('mem')),
    );
    expect(concluido?.status).toBe(409);

    // Bia encontra apenas um par e não conclui; o ranking consolida uma única vez.
    await responder(aluno('b'), sala.codigo, { virarId: p0.esquerdaId });
    await responder(aluno('b'), sala.codigo, { virarId: p0.direitaId });

    const atual = await estado(docente, sala.codigo);
    const feedback = await service.comandar(docente, sala.codigo, {
      acao: 'encerrar_rodada',
      expectedRevision: atual.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('encerrar'),
    });
    const revelado = await service.comandar(docente, sala.codigo, {
      acao: 'revelar',
      expectedRevision: feedback.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('revelar'),
    });
    const ranking = await service.comandar(docente, sala.codigo, {
      acao: 'ranking',
      expectedRevision: revelado.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('ranking'),
    });

    const bia = ranking.estado.participantes.find((p) => p.id === 't1:a2');
    expect(bia.pontos).toBe(250);
    expect(
      ranking.estado.participantes.find((p) => p.id === 't1:a1').pontos,
    ).toBe(1000);
    expect(ranking.estado.ranking.map((r) => [r.id, r.posicao])).toEqual([
      ['t1:a1', 1],
      ['t1:a2', 2],
      ['t1:a3', 3],
    ]);

    const semDuplicar = await service.estado(docente, sala.codigo);
    expect(semDuplicar.estado.participantes.find((p) => p.id === 't1:a2').pontos).toBe(250);
  });

  it('equipes: soma os pontos dos membros e informa a regra na preparação', async () => {
    const q1 = await salvarRevisada(multipla(1, 'B'));
    const q2 = await salvarRevisada(multipla(2, 'A'));
    const sala = await criarSala({
      modalidade: 'equipes',
      questaoIds: [q1.id, q2.id],
      equipes: [
        { id: 'azul', nome: 'Azul', participanteIds: ['t1:a1', 't1:a2'] },
        { id: 'verde', nome: 'Verde', participanteIds: ['t1:a3'] },
      ],
    });

    expect(sala.regraPontuacao).toMatch(/soma/i);
    await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });
    await service.entrar(aluno('b'), sala.codigo, { requestId: novoPedido('entrar') });

    await responder(aluno('a'), sala.codigo, { alternativaId: 'B' });
    await responder(aluno('b'), sala.codigo, { alternativaId: 'B' });

    const atual = await estado(docente, sala.codigo);
    const feedback = await service.comandar(docente, sala.codigo, {
      acao: 'encerrar_rodada',
      expectedRevision: atual.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('encerrar'),
    });
    const revelado = await service.comandar(docente, sala.codigo, {
      acao: 'revelar',
      expectedRevision: feedback.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('revelar'),
    });
    const ranking = await service.comandar(docente, sala.codigo, {
      acao: 'ranking',
      expectedRevision: revelado.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('ranking'),
    });

    expect(ranking.estado.ranking).toEqual([
      { id: 'azul', nome: 'Azul', pontos: 2000, posicao: 1, empate: false },
      { id: 'verde', nome: 'Verde', pontos: 0, posicao: 2, empate: false },
    ]);

    const alunoRanking = await estado(aluno('a'), sala.codigo);
    expect(alunoRanking.estado.eu.equipeId).toBe('azul');
    expect(alunoRanking.estado.ranking).toHaveLength(2);
  });

  it('isola turma, professor e aluno externo', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });

    const outraTurma = await pegar(service.entrar(aluno('d'), sala.codigo, { requestId: novoPedido('entrar') }));
    expect(outraTurma?.status).toBe(403);

    const outroProfessor = await pegar(service.entrar(aluno('e'), sala.codigo, { requestId: novoPedido('entrar') }));
    expect(outroProfessor?.status).toBe(403);

    const comandoAlheio = await pegar(
      service.comandar(outroDocente, sala.codigo, {
        acao: 'iniciar',
        expectedRevision: sala.revision,
        rodada: 1,
        requestId: novoPedido('comando'),
      }),
    );
    expect(comandoAlheio?.status).toBe(403);

    const painelAlheio = await pegar(service.estado(outroDocente, sala.codigo));
    expect(painelAlheio?.status).toBe(403);
  });

  it('reconexão: recarrega o estado durável sem reiniciar a rodada', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });
    const inicio = await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });
    await responder(aluno('a'), sala.codigo, { alternativaId: 'B' });

    const reconectado = await estado(aluno('a'), sala.codigo);
    expect(reconectado.estado.sala.fase).toBe('pergunta');
    expect(reconectado.estado.rodada.numero).toBe(1);
    expect(reconectado.estado.prazo).toBe(inicio.estado.prazo);
    expect(reconectado.estado.eu.recibo.resposta).toEqual({ alternativaId: 'B' });
  });

  it('revelação: esconde o gabarito até o comando e publica a explicação depois', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });
    await iniciar(sala.codigo);
    await service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') });

    const antes = await estado(aluno('a'), sala.codigo);
    expect(antes.estado.rodada.gabarito).toBeUndefined();
    expect(antes.estado.rodada.explicacao).toBeUndefined();

    const atual = await estado(docente, sala.codigo);
    const feedback = await service.comandar(docente, sala.codigo, {
      acao: 'encerrar_rodada',
      expectedRevision: atual.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('encerrar'),
    });
    const depois = await service.comandar(docente, sala.codigo, {
      acao: 'revelar',
      expectedRevision: feedback.estado.sala.revision,
      rodada: 1,
      requestId: novoPedido('revelar'),
    });

    expect(depois.estado.rodada.gabarito).toBe('B');
    expect(depois.estado.rodada.explicacao).toMatch(/Explicação pedagógica/);
  });

  it('nega participação quando a turma é arquivada ou o aluno sai do diário', async () => {
    const q = await salvarRevisada(multipla());
    const sala = await criarSala({ modalidade: 'quiz', questaoIds: [q.id] });

    await store.set('professores/prof-1', {
      turmas: [
        {
          id: 't1',
          nome: 'Turma 1',
          alunos: [{ id: 'a2', nome: 'Bia' }],
        },
      ],
    });
    const removido = await pegar(
      service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') }),
    );
    expect(removido?.status).toBe(403);

    await store.set('professores/prof-1', {
      turmas: [
        {
          id: 't1',
          nome: 'Turma 1',
          arquivada: true,
          alunos: [
            { id: 'a1', nome: 'Ana' },
            { id: 'a2', nome: 'Bia' },
          ],
        },
      ],
    });
    const arquivada = await pegar(
      service.entrar(aluno('a'), sala.codigo, { requestId: novoPedido('entrar') }),
    );
    expect(arquivada?.status).toBe(403);
  });
});
