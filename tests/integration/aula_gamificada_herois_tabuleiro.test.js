import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

function criarStoreMemoria(dadosIniciais = {}) {
  const docs = new Map(Object.entries(dadosIniciais).map(([k, v]) => [k, structuredClone(v)]));
  return {
    async get(path) {
      return docs.has(path) ? structuredClone(docs.get(path)) : null;
    },
    async set(path, valor) {
      docs.set(path, structuredClone(valor));
    },
    async list(prefix, filtros = []) {
      const base = `${prefix}/`;
      const itens = [];
      for (const [k, v] of docs.entries()) {
        if (!k.startsWith(base)) continue;
        const resto = k.slice(base.length);
        if (resto.includes('/')) continue;
        const ok = filtros.every(([campo, op, esperado]) => op === '==' && v?.[campo] === esperado);
        if (ok) itens.push(structuredClone(v));
      }
      return itens;
    },
    async transaction(fn) {
      const tx = {
        get: (p) => this.get(p),
        set: (p, v) => this.set(p, v),
        list: (p, f) => this.list(p, f),
      };
      return fn(tx);
    },
  };
}

function criarServico({ codigo = 'HT0001' } = {}) {
  let relogio = 10_000;
  const store = criarStoreMemoria({
    'professores/prof-1/turmas/data': {
      turmas: [
        {
          id: 't1',
          nome: '9º A',
          anoEscolar: '9º ano',
          alunos: [
            { id: 'a1', nome: 'Ana', loginKey: 'ana' },
            { id: 'a2', nome: 'Beto', loginKey: 'beto' },
            { id: 'a3', nome: 'Caio', loginKey: 'caio' },
            { id: 'a4', nome: 'Duda', loginKey: 'duda' },
          ],
        },
      ],
    },
    'alunoLogin/ana/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a1', revogado: false },
    'alunoLogin/beto/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a2', revogado: false },
    'aulaGamificadaDocentes/prof-1/questoes/q1': {
      id: 'q1',
      revision: 1,
      disciplina: 'História',
      anoEscolar: '9º ano',
      conteudo: 'Revolução Industrial',
      dificuldade: 'dificil',
      tipo: 'multipla_escolha',
      status: 'revisada',
      enunciado: 'Qual fonte de energia impulsionou a 1ª Revolução Industrial?',
      alternativas: [
        { id: 'A', texto: 'Carvão mineral' },
        { id: 'B', texto: 'Energia solar' },
        { id: 'C', texto: 'Energia nuclear' },
      ],
      respostaCorreta: 'A',
      explicacao: 'O carvão mineral alimentava as máquinas a vapor.',
      justificativaDificuldade: 'Exige contextualização histórica.',
    },
    'aulaGamificadaDocentes/prof-1/questoes/q2': {
      id: 'q2',
      revision: 1,
      disciplina: 'Ciências',
      anoEscolar: '9º ano',
      conteudo: 'Célula',
      dificuldade: 'facil',
      tipo: 'multipla_escolha',
      status: 'revisada',
      enunciado: 'Qual organela realiza a respiração celular?',
      alternativas: [
        { id: 'A', texto: 'Mitocôndria' },
        { id: 'B', texto: 'Parede celular' },
        { id: 'C', texto: 'Vacúolo' },
      ],
      respostaCorreta: 'A',
      explicacao: 'A mitocôndria produz ATP na respiração celular.',
      justificativaDificuldade: 'Conceito fundamental.',
    },
  });

  const servico = new AulaGamificadaService({
    store,
    agora: () => relogio,
    gerarCodigo: () => codigo,
    gerarId: () => `id_${Math.random().toString(36).slice(2, 8)}`,
  });
  return {
    servico,
    avancarTempo: (ms) => {
      relogio += ms;
    },
  };
}

const prof = { tipo: 'professor', uid: 'prof-1' };
const alunaAna = { tipo: 'aluno', uid: 'u-ana', loginKey: 'ana', nome: 'Ana' };
const alunoBeto = { tipo: 'aluno', uid: 'u-beto', loginKey: 'beto', nome: 'Beto' };

describe('Integração Heróis e Tabuleiro', () => {
  it('catálogo retorna 7 modalidades', async () => {
    const { servico } = criarServico();
    const cat = await servico.catalogo(prof);
    expect(cat.modalidades).toHaveLength(7);
    expect(cat.modalidades.map((m) => m.id)).toContain('herois');
    expect(cat.modalidades.map((m) => m.id)).toContain('tabuleiro');
  });

  it('Tabuleiro distribui alunos nas equipes padrão, exige turno e avança uma única vez ao revelar', async () => {
    const { servico } = criarServico({ codigo: 'TAB001' });
    const { sala } = await servico.criarSala(prof, {
      titulo: 'Trilha Interdisciplinar',
      modalidade: 'tabuleiro',
      turmaIds: ['t1'],
      questaoIds: ['q1', 'q2'],
      tempoSegundos: 60,
      requestId: 'req-tab-1',
    });

    // Equipes padrão Azul e Verde com todos os 4 alunos distribuídos
    expect(sala.equipes).toHaveLength(2);
    expect(sala.equipes[0].nome).toBe('Equipe Azul');
    expect(sala.equipes[1].nome).toBe('Equipe Verde');
    const totalDistribuidos = sala.equipes.reduce((s, e) => s + e.participanteIds.length, 0);
    expect(totalDistribuidos).toBe(4);
    expect(sala.tabuleiroEstado.equipeDaVezId).toBe(sala.equipes[0].id);

    await servico.entrar(alunaAna, 'TAB001', { requestId: 'entrar-ana' });
    await servico.entrar(alunoBeto, 'TAB001', { requestId: 'entrar-beto' });

    await servico.comandar(prof, 'TAB001', {
      acao: 'iniciar',
      rodada: 1,
      expectedRevision: 1,
      requestId: 'cmd-init',
    });

    // Beto (Equipe Verde) tenta responder na rodada 1 (vez da Equipe Azul) -> 409
    await expect(
      servico.responder(alunoBeto, 'TAB001', {
        rodada: 1,
        resposta: { alternativaId: 'A' },
        requestId: 'resp-beto-fora-turno',
      }),
    ).rejects.toMatchObject({ status: 409 });

    // Ana (Equipe Azul) acerta q1 (dificil)
    await servico.responder(alunaAna, 'TAB001', {
      rodada: 1,
      resposta: { alternativaId: 'A' },
      requestId: 'resp-ana-1',
    });

    const aposEncerrar = await servico.comandar(prof, 'TAB001', {
      acao: 'encerrar_rodada',
      rodada: 1,
      expectedRevision: 2,
      requestId: 'cmd-end',
    });
    // Antes de revelar, o peão ainda está na posição 0
    expect(aposEncerrar.estado.tabuleiroEstado.posicoesPorEquipe[sala.equipes[0].id]).toBe(0);

    const aposRevelar = await servico.comandar(prof, 'TAB001', {
      acao: 'revelar',
      rodada: 1,
      expectedRevision: 3,
      requestId: 'cmd-rev',
    });
    // Ao revelar, avança 2 casas (questão difícil) uma única vez
    expect(aposRevelar.estado.tabuleiroEstado.posicoesPorEquipe[sala.equipes[0].id]).toBe(2);
    expect(aposRevelar.estado.tabuleiroEstado.ultimaCarta.tipo).toBe('avance_2');

    // Repetir revelar com novo requestId ou revision antigo falha com 409 sem avançar de novo
    await expect(
      servico.comandar(prof, 'TAB001', {
        acao: 'revelar',
        rodada: 1,
        expectedRevision: 4,
        requestId: 'cmd-rev-dup',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('Heróis dá feedback individual imediato (Tente novamente), mantém gabarito/coletivo ocultos e não duplica pontos', async () => {
    const { servico } = criarServico({ codigo: 'HER001' });
    await servico.criarSala(prof, {
      titulo: 'Batalha Heróis',
      modalidade: 'herois',
      turmaIds: ['t1'],
      questaoIds: ['q1'],
      tempoSegundos: 60,
      requestId: 'req-her-1',
    });
    await servico.entrar(alunaAna, 'HER001', { requestId: 'entrar-ana-h' });
    await servico.comandar(prof, 'HER001', {
      acao: 'iniciar',
      rodada: 1,
      expectedRevision: 1,
      requestId: 'cmd-h-init',
    });

    // 1ª tentativa errada -> feedback individual imediato sem revelar respostaCorreta
    const r1 = await servico.responder(alunaAna, 'HER001', {
      rodada: 1,
      resposta: { alternativaId: 'B' },
      requestId: 'h-ana-1',
    });
    expect(r1.recibo.podeTentarNovamente).toBe(true);
    expect(r1.recibo.estadoHeroi).toBe('golpe_tente_novamente');

    const estadoDurante = await servico.estado(alunaAna, 'HER001');
    expect(estadoDurante.estado.feedback).toBeUndefined();
    expect(estadoDurante.estado.distribuicao).toBeUndefined();

    // 2ª tentativa certa -> consolida 1000 pontos uma única vez
    const r2 = await servico.responder(alunaAna, 'HER001', {
      rodada: 1,
      resposta: { alternativaId: 'A' },
      requestId: 'h-ana-2',
    });
    expect(r2.recibo.podeTentarNovamente).toBe(false);
    expect(r2.recibo.estadoHeroi).toBe('vitoria_fase');

    // 3ª tentativa -> 409
    await expect(
      servico.responder(alunaAna, 'HER001', {
        rodada: 1,
        resposta: { alternativaId: 'A' },
        requestId: 'h-ana-3',
      }),
    ).rejects.toMatchObject({ status: 409 });

    await servico.comandar(prof, 'HER001', {
      acao: 'encerrar_rodada',
      rodada: 1,
      expectedRevision: 2,
      requestId: 'cmd-h-end',
    });
    await servico.comandar(prof, 'HER001', {
      acao: 'revelar',
      rodada: 1,
      expectedRevision: 3,
      requestId: 'cmd-h-rev',
    });
    const rnk = await servico.comandar(prof, 'HER001', {
      acao: 'ranking',
      rodada: 1,
      expectedRevision: 4,
      requestId: 'cmd-h-rnk',
    });
    expect(rnk.estado.ranking[0].pontos).toBe(1000);
  });

  it('Tabuleiro rejeita criação de sala com mais de 4 equipes (422)', async () => {
    const { servico } = criarServico({ codigo: 'TAB404' });
    await expect(
      servico.criarSala(prof, {
        titulo: 'Excesso de equipes',
        modalidade: 'tabuleiro',
        turmaIds: ['t1'],
        questaoIds: ['q1'],
        tempoSegundos: 60,
        requestId: 'req-tab-5eq',
        equipes: [
          { id: 'e1', nome: 'E1', participanteIds: ['a1'] },
          { id: 'e2', nome: 'E2', participanteIds: ['a2'] },
          { id: 'e3', nome: 'E3', participanteIds: ['a3'] },
          { id: 'e4', nome: 'E4', participanteIds: ['a4'] },
          { id: 'e5', nome: 'E5', participanteIds: [] },
        ],
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
});
