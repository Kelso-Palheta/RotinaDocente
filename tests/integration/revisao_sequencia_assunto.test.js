import { describe, expect, it } from 'vitest';
import { cenario, acao, questaoSintetica, confirmar } from '../helpers/revisaoCenario';
import { RevisaoService } from '../../frontend/src/aplicacao/revisao/RevisaoService';

async function prepararDoisAssuntos() {
  const c = await cenario(3);
  const hashA = 'a'.repeat(64);
  const hashB = 'b'.repeat(64);

  const aulaA = {
    id: 'aula-A',
    titulo: 'Vanguardas Europeias',
    status: 'rascunho',
    objetivos: [{ id: 'o1', descricao: 'Conceito A' }],
    fontes: [{ titulo: 'Fonte A', url: 'https://www.metmuseum.org/' }],
    imagens: [],
    blocos: [
      { id: 'b_a1', tipo: 'texto', titulo: 'Introdução A', texto: 'Texto A1' },
      { id: 'b_a2', tipo: 'texto', titulo: 'Síntese A', texto: 'Texto A2' },
    ],
  };

  const aulaB = {
    id: 'aula-B',
    titulo: 'Modernismo no Brasil',
    status: 'rascunho',
    objetivos: [{ id: 'o2', descricao: 'Conceito B' }],
    fontes: [{ titulo: 'Fonte B', url: 'https://www.bb.com.br/' }],
    imagens: [],
    blocos: [
      { id: 'b_b1', tipo: 'texto', titulo: 'Introdução B', texto: 'Texto B1' },
      { id: 'b_b2', tipo: 'texto', titulo: 'Síntese B', texto: 'Texto B2' },
    ],
  };

  const q1 = { ...questaoSintetica(1), id: 'q1', tema: 'Cubismo' };
  const q2 = { ...questaoSintetica(2), id: 'q2', tema: 'Futurismo' };
  const q3 = { ...questaoSintetica(3), id: 'q3', tema: 'Semana de 22' };
  const q4 = { ...questaoSintetica(4), id: 'q4', tema: 'Antropofagia' };
  const qMultiplo = { ...questaoSintetica(5), id: 'q-multi', tema: 'Conexão Transatlântica' };

  const todasQuestoes = [q1, q2, q3, q4, qMultiplo];

  c.opcoes.acervo = {
    listarAcervo: async () => todasQuestoes.map((q) => ({
      id: q.id,
      ano: q.ano,
      tema: q.tema,
      aplicacoes: q.aplicacoes,
      hashFonte: 'f'.repeat(64),
    })),
    lerQuestaoAcervo: async (id) => {
      const q = todasQuestoes.find((x) => x.id === id);
      if (!q) throw Object.assign(new Error('Ausente'), { status: 404 });
      return { questao: structuredClone(q), hashFonte: 'f'.repeat(64) };
    },
    validarImagensAcervo: async () => true,
  };

  c.opcoes.acervoTematico = {
    listarCatalogoTematico: async () => ({
      trilhas: [],
      conteudos: [
        { id: 'aula-A', titulo: aulaA.titulo, hashFonte: hashA },
        { id: 'aula-B', titulo: aulaB.titulo, hashFonte: hashB },
      ],
      questoes: [
        { questaoId: 'q1', conteudoIds: ['aula-A'] },
        { questaoId: 'q2', conteudoIds: ['aula-A'] },
        { questaoId: 'q3', conteudoIds: ['aula-B'] },
        { questaoId: 'q4', conteudoIds: ['aula-B'] },
        { questaoId: 'q-multi', conteudoIds: ['aula-A', 'aula-B'] },
      ],
    }),
    lerConteudoTematico: async (id) => {
      if (id === 'aula-A') return { conteudo: structuredClone(aulaA), hashFonte: hashA };
      if (id === 'aula-B') return { conteudo: structuredClone(aulaB), hashFonte: hashB };
      throw Object.assign(new Error('Aula ausente'), { status: 404 });
    },
  };

  c.service = new RevisaoService(c.opcoes);

  // Aprova todas as questões
  for (const q of todasQuestoes) {
    await c.service.aprovar(c.docente, q.id, {
      hashFonte: 'f'.repeat(64),
      confirmacoes: confirmar,
      ajustes: {},
    });
  }

  // Aprova ambas as aulas
  await c.service.aprovarConteudo(c.docente, 'aula-A', {
    hashFonte: hashA,
    confirmacoes: { conteudo: true, imagens: true, cobertura: true },
  });
  await c.service.aprovarConteudo(c.docente, 'aula-B', {
    hashFonte: hashB,
    confirmacoes: { conteudo: true, imagens: true, cobertura: true },
  });

  return c;
}

describe('REVISAO_TEMATICA_SPEC — Sequência por assunto', () => {
  it('fluxo completo por assunto: conteúdo A -> A1 -> A2 -> conteúdo B -> B1 -> B2 com placar acumulado e sem revelar questões prematuramente', async () => {
    const c = await prepararDoisAssuntos();

    const selecao = {
      titulo: 'Aulão Sequencial ENEM',
      turmaIds: ['t1'],
      conteudoIds: ['aula-A', 'aula-B'],
      quantidadeQuestoes: 4,
      questaoIds: ['q1', 'q2', 'q3', 'q4'],
      duracaoSegundos: 30,
      duracaoPorQuestao: { q1: 20, q2: 25, q3: 30, q4: 35 },
      modoFluxo: 'sequencia_assunto',
    };

    const { sala } = await c.service.criar(c.docente, selecao);
    const codigo = sala.codigo;

    // Aluno entra
    await c.service.entrar(c.aluno(0), codigo);

    // 1. Iniciar: mostra conteúdo de A (bloco 1)
    await acao(c, codigo, 'mostrar_conteudo');
    let estadoDoc = await c.service.estado(c.docente, codigo);
    let estadoAluno = await c.service.estado(c.aluno(0), codigo);

    expect(estadoDoc.estado.fase).toBe('conteudo');
    expect(estadoDoc.estado.aula.conteudoId).toBe('aula-A');
    expect(estadoDoc.estado.aula.bloco.id).toBe('b_a1');
    expect(estadoDoc.estado.aula.ultimoBloco).toBe(false);
    expect(estadoAluno.estado.rodada.questao).toBeNull(); // questão A1 não revelada

    // Avança para o segundo bloco de A (último bloco de A)
    await acao(c, codigo, 'avancar_conteudo');
    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.aula.bloco.id).toBe('b_a2');
    expect(estadoDoc.estado.aula.ultimoBloco).toBe(true);

    // 2. Abre pergunta A1
    await acao(c, codigo, 'abrir_pergunta');
    estadoDoc = await c.service.estado(c.docente, codigo);
    estadoAluno = await c.service.estado(c.aluno(0), codigo);
    expect(estadoDoc.estado.fase).toBe('pergunta');
    expect(estadoDoc.estado.rodada.questao.id).toBe('q1');
    expect(estadoAluno.estado.rodada.questao.id).toBe('q1');

    // Aluno responde A1 com B (gabarito)
    await c.service.responder(c.aluno(0), codigo, { rodadaId: estadoAluno.estado.rodada.id, alternativa: 'B' });
    await acao(c, codigo, 'encerrar_pergunta');
    await acao(c, codigo, 'mostrar_feedback');
    await acao(c, codigo, 'mostrar_ranking');

    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.ranking[0].pontos).toBe(1000);

    // 3. Próxima pergunta dentro de A (A2)
    await acao(c, codigo, 'proxima_rodada');
    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.fase).toBe('pergunta');
    expect(estadoDoc.estado.rodada.questao.id).toBe('q2');

    // Aluno responde A2 com B (gabarito)
    await c.service.responder(c.aluno(0), codigo, { rodadaId: estadoDoc.estado.rodada.id, alternativa: 'B' });
    await acao(c, codigo, 'encerrar_pergunta');
    await acao(c, codigo, 'mostrar_feedback');
    await acao(c, codigo, 'mostrar_ranking');

    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.ranking[0].pontos).toBe(2000); // placar acumulado

    // 4. Mudança de assunto: A terminou, agora avança para conteúdo B!
    // Ação é 'apresentar_proximo_assunto'
    await acao(c, codigo, 'apresentar_proximo_assunto');
    estadoDoc = await c.service.estado(c.docente, codigo);
    estadoAluno = await c.service.estado(c.aluno(0), codigo);

    expect(estadoDoc.estado.fase).toBe('conteudo');
    expect(estadoDoc.estado.aula.conteudoId).toBe('aula-B');
    expect(estadoDoc.estado.aula.bloco.id).toBe('b_b1');
    expect(estadoDoc.estado.rodada.encerraEmMs).toBeNull(); // timer anterior limpo
    expect(estadoAluno.estado.rodada.questao).toBeNull(); // questão B1 não revelada

    // Avança bloco de B até o último
    await acao(c, codigo, 'avancar_conteudo');
    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.aula.bloco.id).toBe('b_b2');
    expect(estadoDoc.estado.aula.ultimoBloco).toBe(true);

    // 5. Abre pergunta B1
    await acao(c, codigo, 'abrir_pergunta');
    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.rodada.questao.id).toBe('q3');

    await c.service.responder(c.aluno(0), codigo, { rodadaId: estadoDoc.estado.rodada.id, alternativa: 'B' });
    await acao(c, codigo, 'encerrar_pergunta');
    await acao(c, codigo, 'mostrar_feedback');
    await acao(c, codigo, 'mostrar_ranking');

    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.ranking[0].pontos).toBe(3000); // placar acumulado

    // 6. Próxima pergunta dentro de B (B2)
    await acao(c, codigo, 'proxima_rodada');
    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.rodada.questao.id).toBe('q4');

    await c.service.responder(c.aluno(0), codigo, { rodadaId: estadoDoc.estado.rodada.id, alternativa: 'B' });
    await acao(c, codigo, 'encerrar_pergunta');
    await acao(c, codigo, 'mostrar_feedback');
    await acao(c, codigo, 'mostrar_ranking');

    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.ranking[0].pontos).toBe(4000);

    // 7. Finaliza a sala após o último assunto
    await acao(c, codigo, 'finalizar');
    estadoDoc = await c.service.estado(c.docente, codigo);
    expect(estadoDoc.estado.fase).toBe('finalizada');
  });

  it('questão com múltiplos vínculos sem duplicação e atribuição explícita', async () => {
    const c = await prepararDoisAssuntos();

    // q-multi é vinculada a aula-A e aula-B. Atribuímos explicitamente a aula-B.
    const selecao = {
      titulo: 'Múltiplos Vínculos',
      turmaIds: ['t1'],
      conteudoIds: ['aula-A', 'aula-B'],
      quantidadeQuestoes: 2,
      questaoIds: ['q1', 'q-multi'],
      atribuicoes: {
        'q1': 'aula-A',
        'q-multi': 'aula-B',
      },
      duracaoSegundos: 30,
      duracaoPorQuestao: { q1: 30, 'q-multi': 30 },
      modoFluxo: 'sequencia_assunto',
    };

    const { sala } = await c.service.criar(c.docente, selecao);
    const doc = await c.store.get(`revisaoSalas/${sala.codigo}`);
    expect(doc.rodadas).toHaveLength(2);
    expect(doc.rodadas[0].questaoId).toBe('q1');
    expect(doc.rodadas[0].conteudoId).toBe('aula-A');
    expect(doc.rodadas[1].questaoId).toBe('q-multi');
    expect(doc.rodadas[1].conteudoId).toBe('aula-B');
  });

  it('rejeita atribuição adulterada de questão para assunto incompatível', async () => {
    const c = await prepararDoisAssuntos();

    // q1 é vinculada SOMENTE a aula-A. Tentativa de atribuir a aula-B deve ser rejeitada com 422.
    const selecao = {
      titulo: 'Atribuição Inválida',
      turmaIds: ['t1'],
      conteudoIds: ['aula-A', 'aula-B'],
      quantidadeQuestoes: 2,
      questaoIds: ['q1', 'q3'],
      atribuicoes: {
        'q1': 'aula-B', // INVÁLIDO
        'q3': 'aula-B',
      },
      duracaoSegundos: 30,
      duracaoPorQuestao: { q1: 30, q3: 30 },
      modoFluxo: 'sequencia_assunto',
    };

    await expect(c.service.criar(c.docente, selecao)).rejects.toMatchObject({ status: 422 });
  });

  it('rejeita quando um assunto selecionado fica sem questões atribuídas', async () => {
    const c = await prepararDoisAssuntos();

    // aula-A e aula-B selecionadas, mas todas as questões são de aula-A (aula-B fica com 0 questões)
    const selecao = {
      titulo: 'Assunto Sem Questões',
      turmaIds: ['t1'],
      conteudoIds: ['aula-A', 'aula-B'],
      quantidadeQuestoes: 2,
      questaoIds: ['q1', 'q2'],
      duracaoSegundos: 30,
      duracaoPorQuestao: { q1: 30, q2: 30 },
      modoFluxo: 'sequencia_assunto',
    };

    await expect(c.service.criar(c.docente, selecao)).rejects.toMatchObject({ status: 422 });
  });

  it('reconexão no início do conteúdo de B sincroniza professor, telão e aluno', async () => {
    const c = await prepararDoisAssuntos();
    const selecao = {
      titulo: 'Reconexão em B',
      turmaIds: ['t1'],
      conteudoIds: ['aula-A', 'aula-B'],
      quantidadeQuestoes: 2,
      questaoIds: ['q1', 'q3'],
      duracaoSegundos: 30,
      duracaoPorQuestao: { q1: 20, q3: 30 },
      modoFluxo: 'sequencia_assunto',
    };
    const { sala } = await c.service.criar(c.docente, selecao);
    const codigo = sala.codigo;

    await c.service.entrar(c.aluno(0), codigo);
    await acao(c, codigo, 'mostrar_conteudo');
    await acao(c, codigo, 'avancar_conteudo');
    await acao(c, codigo, 'abrir_pergunta');
    await acao(c, codigo, 'encerrar_pergunta');
    await acao(c, codigo, 'mostrar_feedback');
    await acao(c, codigo, 'mostrar_ranking');

    // Avança para assunto B
    await acao(c, codigo, 'apresentar_proximo_assunto');

    // Nova instância do serviço (simulando reconexão HTTP / novo worker)
    const novoService = new RevisaoService(c.opcoes);
    const estadoAluno = await novoService.estado(c.aluno(0), codigo);
    const estadoDocente = await novoService.estado(c.docente, codigo);

    expect(estadoAluno.estado.fase).toBe('conteudo');
    expect(estadoAluno.estado.aula.conteudoId).toBe('aula-B');
    expect(estadoAluno.estado.aula.bloco.id).toBe('b_b1');
    expect(estadoAluno.estado.rodada.questao).toBeNull();

    expect(estadoDocente.estado.fase).toBe('conteudo');
    expect(estadoDocente.estado.aula.conteudoId).toBe('aula-B');
    expect(estadoDocente.estado.aula.bloco.id).toBe('b_b1');
  });

  it('salas legadas continuam funcionando com a introdução global inalterada', async () => {
    const c = await prepararDoisAssuntos();

    // Sem modoFluxo: 'sequencia_assunto' (legado temático v2)
    const selecao = {
      titulo: 'Sala Legada',
      turmaIds: ['t1'],
      conteudoIds: ['aula-A'],
      quantidadeQuestoes: 2,
      questaoIds: ['q1', 'q2'],
      duracaoSegundos: 30,
      duracaoPorQuestao: { q1: 30, q2: 30 },
    };

    const { sala } = await c.service.criar(c.docente, selecao);
    const codigo = sala.codigo;

    await c.service.entrar(c.aluno(0), codigo);
    await acao(c, codigo, 'mostrar_conteudo');
    await acao(c, codigo, 'avancar_conteudo');
    await acao(c, codigo, 'abrir_pergunta');
    await acao(c, codigo, 'encerrar_pergunta');
    await acao(c, codigo, 'mostrar_feedback');
    await acao(c, codigo, 'mostrar_ranking');
    await acao(c, codigo, 'proxima_rodada');

    const estado = await c.service.estado(c.docente, codigo);
    expect(estado.estado.fase).toBe('pergunta');
    expect(estado.estado.rodada.questao.id).toBe('q2');
  });
});
