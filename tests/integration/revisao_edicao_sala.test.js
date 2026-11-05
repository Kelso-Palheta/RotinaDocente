import { describe, expect, it } from 'vitest';
import { cenario, acao, questaoSintetica, confirmar } from '../helpers/revisaoCenario';
import { RevisaoService } from '../../frontend/src/aplicacao/revisao/RevisaoService';

async function prepararCenarioEdicao(nAlunos = 3) {
  const c = await cenario(nAlunos);
  let hash = 'b'.repeat(64);
  const conteudo = {
    id: 'aula',
    titulo: 'Aula sintética',
    status: 'rascunho',
    objetivos: [{ id: 'o', descricao: 'Conceito' }],
    fontes: [{ titulo: 'Fonte', url: 'https://www.metmuseum.org/' }],
    imagens: [],
    blocos: [
      { id: 'b1', tipo: 'texto', titulo: 'Contexto', texto: 'Ensinar sem responder' },
      { id: 'b2', tipo: 'texto', titulo: 'Síntese', texto: 'Preparação final' },
    ],
  };

  // Três questões sintéticas aprovadas
  const q3 = {
    ...questaoSintetica(3),
    id: 'enem-2024-regular-sintetica-3',
    tema: 'Arte sintética 3',
  };
  const acervoBase = c.opcoes.acervo;
  c.opcoes.acervo = {
    listarAcervo: async () => [
      { id: questaoSintetica(1).id, ano: 2024, tema: 'Arte sintética 1', aplicacoes: ['regular'], hashFonte: 'a'.repeat(64) },
      { id: questaoSintetica(2).id, ano: 2024, tema: 'Arte sintética 2', aplicacoes: ['regular'], hashFonte: 'a'.repeat(64) },
      { id: q3.id, ano: 2024, tema: 'Arte sintética 3', aplicacoes: ['regular'], hashFonte: 'a'.repeat(64) },
    ],
    lerQuestaoAcervo: async (id) => {
      const q = [questaoSintetica(1), questaoSintetica(2), q3].find((x) => x.id === id);
      if (!q) throw Object.assign(new Error('Ausente'), { status: 404 });
      return { questao: structuredClone(q), hashFonte: 'a'.repeat(64) };
    },
    validarImagensAcervo: async () => true,
  };

  c.opcoes.acervoTematico = {
    listarCatalogoTematico: async () => ({
      trilhas: [],
      conteudos: [{ id: 'aula', titulo: conteudo.titulo, hashFonte: hash }],
      questoes: [1, 2, 3].map((num) => ({
        questaoId: questaoSintetica(num).id,
        conteudoIds: ['aula'],
      })),
    }),
    lerConteudoTematico: async () => ({
      conteudo: structuredClone(conteudo),
      hashFonte: hash,
    }),
  };

  c.service = new RevisaoService(c.opcoes);
  // Aprova as três questões e a aula
  for (let num = 1; num <= 3; num += 1) {
    await c.service.aprovar(c.docente, questaoSintetica(num).id, {
      hashFonte: 'a'.repeat(64),
      confirmacoes: confirmar,
      ajustes: {},
    });
  }
  await c.service.aprovarConteudo(c.docente, 'aula', {
    hashFonte: hash,
    confirmacoes: { conteudo: true, imagens: true, cobertura: true },
  });

  // Turma t2 adicional
  const turmasData = await c.store.get('professores/prof-1/turmas/data');
  await c.store.set('professores/prof-1/turmas/data', {
    turmas: [
      ...turmasData.turmas,
      {
        id: 't2',
        nome: 'Segunda Turma',
        alunos: [{ id: 'a_t2_1', nome: 'Aluno Turma 2' }],
      },
      {
        id: 't_arquivada',
        nome: 'Turma Arquivada',
        arquivada: true,
        alunos: [{ id: 'a_arq', nome: 'Aluno Arquivado' }],
      },
    ],
  });
  await c.store.set('alunoLogin/login_t2/vinculos/prof-1', {
    professorUid: 'prof-1',
    turmaId: 't2',
    alunoId: 'a_t2_1',
  });

  c.selecaoTematica = {
    titulo: 'Aulão Inicial',
    turmaIds: ['t1'],
    conteudoIds: ['aula'],
    quantidadeQuestoes: 2,
    questaoIds: [questaoSintetica(1).id, questaoSintetica(2).id],
    duracaoSegundos: 30,
    duracaoPorQuestao: {
      [questaoSintetica(1).id]: 30,
      [questaoSintetica(2).id]: 45,
    },
  };

  return c;
}

describe('REVISAO_EDICAO_SALA_SPEC — ED-01 a ED-04', () => {
  it('ED-01: formulário com valores reais; editar e reabrir com mesmo código/link e nova configuração', async () => {
    const c = await prepararCenarioEdicao();
    const { sala: salaCriada } = await c.service.criar(c.docente, c.selecaoTematica);
    const codigo = salaCriada.codigo;

    // 1. Obter dados para edição
    const dadosEdicao = await c.service.obterEdicao(c.docente, codigo);
    expect(dadosEdicao.codigo).toBe(codigo);
    expect(dadosEdicao.revisao).toBe(1);
    expect(dadosEdicao.podeEditarTurmas).toBe(true);
    expect(dadosEdicao.selecao.titulo).toBe('Aulão Inicial');
    expect(dadosEdicao.selecao.turmaIds).toEqual(['t1']);
    expect(dadosEdicao.selecao.questaoIds).toEqual([
      questaoSintetica(1).id,
      questaoSintetica(2).id,
    ]);
    expect(dadosEdicao.selecao.duracaoSegundos).toBe(30);
    expect(dadosEdicao.selecao.duracaoPorQuestao).toEqual({
      [questaoSintetica(1).id]: 30,
      [questaoSintetica(2).id]: 45,
    });

    // 2. Editar com nova configuração (troca de título, duração, ordem e adição de questão 3 e turma t2)
    const novaSelecao = {
      ...c.selecaoTematica,
      titulo: 'Aulão Atualizado',
      turmaIds: ['t1', 't2'],
      duracaoSegundos: 40,
      quantidadeQuestoes: 3,
      questaoIds: [
        questaoSintetica(2).id,
        questaoSintetica(3).id,
        questaoSintetica(1).id,
      ],
      duracaoPorQuestao: {
        [questaoSintetica(2).id]: 20,
        [questaoSintetica(3).id]: 50,
        [questaoSintetica(1).id]: 40,
      },
    };

    const resultadoEdicao = await c.service.editar(c.docente, codigo, {
      selecao: novaSelecao,
      revisaoEsperada: 1,
    });
    expect(resultadoEdicao.sala.codigo).toBe(codigo);
    expect(resultadoEdicao.sala.revisao).toBe(2);

    // 3. Reabrir e verificar que mesma sala, link, código, criação e professor foram preservados
    const salaApos = await c.store.get(`revisaoSalas/${codigo}`);
    expect(salaApos.codigo).toBe(codigo);
    expect(salaApos.id).toBe(codigo);
    expect(salaApos.professorId).toBe(c.docente.uid);
    expect(salaApos.criadaEmMs).toBe(100000);
    expect(salaApos.titulo).toBe('Aulão Atualizado');
    expect(salaApos.turmaIds).toEqual(['t1', 't2']);
    expect(salaApos.duracaoSegundos).toBe(40);
    expect(salaApos.revisao).toBe(2);
    expect(salaApos.fase).toBe('espera');
    expect(salaApos.rodadas.map((r) => r.questaoId)).toEqual([
      questaoSintetica(2).id,
      questaoSintetica(3).id,
      questaoSintetica(1).id,
    ]);

    // Publicação de espera atualizada na mesma transação
    const publicacao = await c.store.get(`revisaoSalas/${codigo}/publicacao/estado`);
    expect(publicacao.sala.titulo).toBe('Aulão Atualizado');
    expect(publicacao.sala.revisao).toBe(2);
    expect(publicacao.fase).toBe('espera');
    expect(publicacao.rodada.total).toBe(3);
    // Gabarito e respostas NÃO devem ser expostos na espera
    expect(JSON.stringify(publicacao)).not.toContain('"gabarito"');

    // Reabrir via obterEdicao retorna a nova seleção
    const reaberta = await c.service.obterEdicao(c.docente, codigo);
    expect(reaberta.selecao.titulo).toBe('Aulão Atualizado');
    expect(reaberta.selecao.questaoIds).toEqual([
      questaoSintetica(2).id,
      questaoSintetica(3).id,
      questaoSintetica(1).id,
    ]);
    expect(reaberta.revisao).toBe(2);
  });

  it('ED-02: proprietário apenas; aluno e outro docente rejeitados; nenhum material privado exposto', async () => {
    const c = await prepararCenarioEdicao();
    const { sala } = await c.service.criar(c.docente, c.selecaoTematica);
    const codigo = sala.codigo;
    const outroDocente = { tipo: 'professor', uid: 'outro-docente' };
    const aluno = c.aluno(0);

    // Aluno tentando obter ou editar
    await expect(c.service.obterEdicao(aluno, codigo)).rejects.toMatchObject({ status: 403 });
    await expect(c.service.editar(aluno, codigo, { selecao: c.selecaoTematica, revisaoEsperada: 1 })).rejects.toMatchObject({ status: 403 });

    // Outro docente tentando obter ou editar
    await expect(c.service.obterEdicao(outroDocente, codigo)).rejects.toMatchObject({ status: 403 });
    await expect(c.service.editar(outroDocente, codigo, { selecao: c.selecaoTematica, revisaoEsperada: 1 })).rejects.toMatchObject({ status: 403 });

    // Sala inexistente
    await expect(c.service.obterEdicao(c.docente, 'INEX9999')).rejects.toMatchObject({ status: 404 });

    // Resposta de obterEdicao não expõe gabaritos, explicações ou nomes de participantes
    const dados = await c.service.obterEdicao(c.docente, codigo);
    const jsonStr = JSON.stringify(dados);
    expect(jsonStr).not.toContain('gabarito');
    expect(jsonStr).not.toContain('explicacoes');
    expect(jsonStr).not.toContain('Estudante');
    expect(dados).not.toHaveProperty('participantes');
  });

  it('ED-03: início concorrente, versão antiga e troca de turma após entrada bloqueados; título/tempo ainda editáveis na espera', async () => {
    const c = await prepararCenarioEdicao();
    const { sala } = await c.service.criar(c.docente, c.selecaoTematica);
    const codigo = sala.codigo;

    // 1. Versão antiga (conflito de concorrência)
    await expect(
      c.service.editar(c.docente, codigo, {
        selecao: { ...c.selecaoTematica, titulo: 'Título Alterado' },
        revisaoEsperada: 99,
      })
    ).rejects.toMatchObject({ status: 409 });

    // 2. Aluno entra na espera
    await c.service.entrar(c.aluno(0), codigo);
    const edicaoComParticipante = await c.service.obterEdicao(c.docente, codigo);
    expect(edicaoComParticipante.podeEditarTurmas).toBe(false);
    expect(edicaoComParticipante.totalParticipantes).toBe(1);

    // Tentativa de alterar turmas após entrada de participantes deve ser bloqueada (409)
    await expect(
      c.service.editar(c.docente, codigo, {
        selecao: { ...c.selecaoTematica, turmaIds: ['t1', 't2'] },
        revisaoEsperada: 1,
      })
    ).rejects.toMatchObject({ status: 409 });

    // 3. Mas alterar título, duração ou questões na espera ainda é permitido!
    const edicaoPermitida = await c.service.editar(c.docente, codigo, {
      selecao: {
        ...c.selecaoTematica,
        titulo: 'Título com Participantes',
        duracaoSegundos: 50,
      },
      revisaoEsperada: 1,
    });
    expect(edicaoPermitida.sala.revisao).toBe(2);

    // O participante anterior continua na sala intacto
    const participantes = await c.store.list(`revisaoSalas/${codigo}/participantes`);
    expect(participantes).toHaveLength(1);

    // 4. Início concorrente: professor avança a fase para conteúdo/pergunta
    await acao(c, codigo, 'mostrar_conteudo');

    // Uma vez iniciada, obterEdicao e editar são bloqueados (409)
    await expect(c.service.obterEdicao(c.docente, codigo)).rejects.toMatchObject({ status: 409 });
    await expect(
      c.service.editar(c.docente, codigo, {
        selecao: { ...c.selecaoTematica, titulo: 'Tentativa após início' },
        revisaoEsperada: 3,
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('ED-04: rejeitar questões incompatíveis, tempos inválidos e turma arquivada; preservar histórico, projeção e fluxo legado', async () => {
    const c = await prepararCenarioEdicao();
    const { sala } = await c.service.criar(c.docente, c.selecaoTematica);
    const codigo = sala.codigo;

    // Questão incompatível/fora do tema
    await expect(
      c.service.editar(c.docente, codigo, {
        selecao: { ...c.selecaoTematica, questaoIds: ['questao-inexistente', questaoSintetica(1).id] },
        revisaoEsperada: 1,
      })
    ).rejects.toMatchObject({ status: 422 });

    // Tempo inválido
    await expect(
      c.service.editar(c.docente, codigo, {
        selecao: { ...c.selecaoTematica, duracaoSegundos: 5 },
        revisaoEsperada: 1,
      })
    ).rejects.toMatchObject({ status: 422 });

    // Tempo individual inválido
    await expect(
      c.service.editar(c.docente, codigo, {
        selecao: {
          ...c.selecaoTematica,
          duracaoPorQuestao: { [questaoSintetica(1).id]: 2 },
        },
        revisaoEsperada: 1,
      })
    ).rejects.toMatchObject({ status: 422 });

    // Turma arquivada
    await expect(
      c.service.editar(c.docente, codigo, {
        selecao: { ...c.selecaoTematica, turmaIds: ['t_arquivada'] },
        revisaoEsperada: 1,
      })
    ).rejects.toMatchObject({ status: 422 });

    // Preservação de fluxo legado (sala sem schemaVersion 2 / legada v1)
    const cLegado = await cenario();
    for (let i = 1; i <= 2; i += 1) {
      await cLegado.service.aprovar(cLegado.docente, questaoSintetica(i).id, {
        hashFonte: 'a'.repeat(64),
        confirmacoes: confirmar,
        ajustes: {},
      });
    }
    const { sala: salaLegada } = await cLegado.service.criar(cLegado.docente, {
      titulo: 'Sala Legada v1',
      turmaIds: ['t1'],
      questaoIds: [questaoSintetica(1).id, questaoSintetica(2).id],
      duracaoSegundos: 20,
    });
    const codLegado = salaLegada.codigo;

    const edicaoLegada = await cLegado.service.obterEdicao(cLegado.docente, codLegado);
    expect(edicaoLegada.selecao.titulo).toBe('Sala Legada v1');
    expect(edicaoLegada.selecao.schemaVersion).toBeUndefined();

    // Edição preserva contrato legado
    const resLegado = await cLegado.service.editar(cLegado.docente, codLegado, {
      selecao: {
        titulo: 'Sala Legada v1 Editada',
        turmaIds: ['t1'],
        questaoIds: [questaoSintetica(2).id],
        duracaoSegundos: 25,
      },
      revisaoEsperada: 1,
    });
    expect(resLegado.sala.revisao).toBe(2);

    const docLegadoApos = await cLegado.store.get(`revisaoSalas/${codLegado}`);
    expect(docLegadoApos.titulo).toBe('Sala Legada v1 Editada');
    expect(docLegadoApos.schemaVersion).toBeUndefined();
    expect(docLegadoApos.rodadas).toHaveLength(1);
    expect(docLegadoApos.rodadas[0].questaoId).toBe(questaoSintetica(2).id);
  });
});

it('ED-05: adicionar, manter e remover questões respeita a ordem transacional do Firestore', async () => {
  const c = await prepararCenarioEdicao();
  const { sala } = await c.service.criar(c.docente, c.selecaoTematica);
  const transaction = c.store.transaction.bind(c.store);
  c.store.transaction = (executar) => transaction((tx) => {
    let escreveu = false;
    const vigiar = (operacao, escrita) => (...args) => {
      if (!escrita && escreveu) throw new Error('Leitura após escrita');
      if (escrita) escreveu = true;
      return tx[operacao](...args);
    };
    return executar({
      get: vigiar('get', false),
      list: vigiar('list', false),
      set: vigiar('set', true),
      delete: vigiar('delete', true),
    });
  });

  const questaoIds = [questaoSintetica(3).id, questaoSintetica(2).id];
  await c.service.editar(c.docente, sala.codigo, {
    revisaoEsperada: 1,
    selecao: { ...c.selecaoTematica, questaoIds, duracaoPorQuestao: {} },
  });
  const atual = await c.service.obterEdicao(c.docente, sala.codigo);
  expect(atual.revisao).toBe(2);
  expect(atual.selecao.questaoIds).toEqual(questaoIds);
});

it('ED-06: tempo padrão editado alcança perguntas sem tempo individual', async () => {
  const c = await prepararCenarioEdicao();
  const [primeira, segunda] = c.selecaoTematica.questaoIds;
  const { sala } = await c.service.criar(c.docente, {
    ...c.selecaoTematica,
    duracaoPorQuestao: { [segunda]: 45 },
  });
  const { selecao, revisao } = await c.service.obterEdicao(c.docente, sala.codigo);
  expect(selecao.duracaoPorQuestao).toEqual({ [segunda]: 45 });
  await c.service.editar(c.docente, sala.codigo, {
    revisaoEsperada: revisao,
    selecao: { ...selecao, duracaoSegundos: 70 },
  });
  const atual = await c.store.get(`revisaoSalas/${sala.codigo}`);
  expect(atual.rodadas.map(({ questaoId, duracaoSegundos }) => [questaoId, duracaoSegundos]))
    .toEqual([[primeira, 70], [segunda, 45]]);
});
