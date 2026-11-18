import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { questaoPublica } from '@/dominio/aula-gamificada/questoes';
import { montarConteudo } from '@/dominio/aula-gamificada/sala';

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

function criarServicoBase({ codigo = 'COMP01', dadosIniciais = {} } = {}) {
  let seq = 0;
  let relogio = 10000;
  const store = criarStoreMemoria({
    'professores/prof-1/turmas/data': {
      turmas: [
        {
          id: 't1',
          nome: '1º Ano A',
          alunos: [
            { id: 'a1', nome: 'Ana' },
            { id: 'a2', nome: 'Bruno' },
            { id: 'a3', nome: 'Carla' },
          ],
        },
      ],
    },
    'alunoLogin/ana1/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a1' },
    'alunoLogin/bruno2/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a2' },
    ...dadosIniciais,
  });

  const service = new AulaGamificadaService({
    store,
    agora: () => (relogio += 100),
    gerarId: () => `rnd_${++seq}_${(seq * 7919).toString(36)}`,
    gerarCodigo: () => codigo,
    idParticipante: (t, a) => `${t}:${a}`,
  });

  return { service, store };
}

const prof = { tipo: 'professor', uid: 'prof-1' };
const alunoAna = { tipo: 'aluno', loginKey: 'ana1' };
const alunoBruno = { tipo: 'aluno', loginKey: 'bruno2' };

describe('Complementos de revisão — presença vs. respondentes e proteção de IDs/embaralhamento', () => {
  it('distingue participantes presentes dos que responderam à rodada e reinicia flag na próxima rodada', async () => {
    const { service } = criarServicoBase({ codigo: 'RESP01' });

    const q1 = (
      await service.salvarQuestao(prof, {
        requestId: 'req-q1',
        questao: {
          disciplina: 'Biologia',
          anoEscolar: '1º ano EM',
          conteudo: 'Célula',
          dificuldade: 'facil',
          tipo: 'multipla_escolha',
          enunciado: 'Pergunta 1',
          alternativas: [
            { id: 'A', texto: 'Mitocôndria' },
            { id: 'B', texto: 'Ribossomo' },
          ],
          respostaCorreta: 'A',
          explicacao: 'Explicação 1',
          justificativaDificuldade: 'Direta',
        },
      })
    ).questao;
    await service.revisarQuestao(prof, q1.id, { expectedRevision: q1.revision, requestId: 'rev-q1' });

    const q2 = (
      await service.salvarQuestao(prof, {
        requestId: 'req-q2',
        questao: {
          disciplina: 'Biologia',
          anoEscolar: '1º ano EM',
          conteudo: 'Célula',
          dificuldade: 'facil',
          tipo: 'multipla_escolha',
          enunciado: 'Pergunta 2',
          alternativas: [
            { id: 'A', texto: 'Núcleo' },
            { id: 'B', texto: 'Lisossomo' },
          ],
          respostaCorreta: 'A',
          explicacao: 'Explicação 2',
          justificativaDificuldade: 'Direta',
        },
      })
    ).questao;
    await service.revisarQuestao(prof, q2.id, { expectedRevision: q2.revision, requestId: 'rev-q2' });

    const { sala } = await service.criarSala(prof, {
      requestId: 'req-sala',
      titulo: 'Sala Presença vs Resposta',
      modalidade: 'quiz',
      turmaIds: ['t1'],
      questaoIds: [q1.id, q2.id],
      tempoSegundos: 60,
    });

    await service.entrar(alunoAna, sala.codigo, { requestId: 'ent-a' });
    await service.entrar(alunoBruno, sala.codigo, { requestId: 'ent-b' });

    // Antes de iniciar, ninguém respondeu
    const espera = (await service.estado(prof, sala.codigo)).estado;
    expect(espera.respondentes).toEqual([]);
    expect(espera.participantes.every((p) => p.respondeu === false)).toBe(true);

    // Inicia rodada 1 e apenas Ana responde
    const iniciada = (
      await service.comandar(prof, sala.codigo, {
        acao: 'iniciar',
        expectedRevision: espera.sala.revision,
        rodada: 1,
        requestId: 'cmd-init',
      })
    ).estado;
    await service.responder(alunoAna, sala.codigo, {
      rodada: 1,
      requestId: 'resp-a1',
      resposta: { alternativaId: 'A' },
    });

    const estadoDocente = (await service.estado(prof, sala.codigo)).estado;
    expect(estadoDocente.respondentes).toEqual([{ id: 't1:a1', nomeExibicao: 'Ana' }]);
    const anaProj = estadoDocente.participantes.find((p) => p.id === 't1:a1');
    const brunoProj = estadoDocente.participantes.find((p) => p.id === 't1:a2');
    const carlaProj = estadoDocente.participantes.find((p) => p.id === 't1:a3');
    expect(anaProj.respondeu).toBe(true);
    expect(anaProj.rodadaRespondida).toBe(1);
    expect(brunoProj.entrouEmMs).not.toBeNull();
    expect(brunoProj.respondeu).toBe(false);
    expect(brunoProj.rodadaRespondida).toBeUndefined();
    expect(carlaProj.entrouEmMs).toBeNull();
    expect(carlaProj.respondeu).toBe(false);
    // Sem associação de nome à alternativa
    expect(JSON.stringify(estadoDocente.respondentes)).not.toContain('alternativaId');

    // Estado do aluno continua sem expor participantes/respondentes
    const estadoAluno = (await service.estado(alunoBruno, sala.codigo)).estado;
    expect(estadoAluno.participantes).toBeUndefined();
    expect(estadoAluno.respondentes).toBeUndefined();

    // Avança para rodada 2: ninguém respondeu à rodada 2 ainda
    let rev = iniciada.sala.revision;
    for (const acao of ['encerrar_rodada', 'revelar', 'ranking', 'proxima']) {
      const res = await service.comandar(prof, sala.codigo, {
        acao,
        expectedRevision: rev,
        rodada: 1,
        requestId: `cmd-${acao}`,
      });
      rev = res.estado.sala.revision;
    }

    const rodada2 = (await service.estado(prof, sala.codigo)).estado;
    expect(rodada2.sala.rodada).toBe(2);
    expect(rodada2.respondentes).toEqual([]);
    expect(rodada2.participantes.every((p) => p.respondeu === false)).toBe(true);
  });

  it('regenera IDs opacos em questões manuais de pares e ordenação sem perder o gabarito', async () => {
    const { service } = criarServicoBase({ codigo: 'PROT01' });

    const manualPares = (
      await service.salvarQuestao(prof, {
        requestId: 'req-mp',
        questao: {
          disciplina: 'Química',
          anoEscolar: '1º ano EM',
          conteudo: 'Símbolos',
          dificuldade: 'facil',
          tipo: 'pares',
          enunciado: 'Associe elemento e símbolo.',
          pares: [
            { id: 'par-1', esquerda: { id: 'esq_1_par-1', texto: 'Sódio' }, direita: { id: 'dir_1_par-1', texto: 'Na' } },
            { id: 'par-2', esquerda: { id: 'esq_2_par-2', texto: 'Ferro' }, direita: { id: 'dir_2_par-2', texto: 'Fe' } },
          ],
          respostaCorreta: [
            { esquerdaId: 'esq_1_par-1', direitaId: 'dir_1_par-1' },
            { esquerdaId: 'esq_2_par-2', direitaId: 'dir_2_par-2' },
          ],
          explicacao: 'Símbolos químicos.',
          justificativaDificuldade: 'Básico.',
        },
      })
    ).questao;

    for (const par of manualPares.pares) {
      expect(par.esquerda.id).not.toMatch(/esq_/);
      expect(par.direita.id).not.toMatch(/dir_/);
      expect(par.esquerda.id).not.toContain('par-');
      expect(par.direita.id).not.toContain('par-');
    }
    expect(manualPares.respostaCorreta).toEqual([
      { esquerdaId: manualPares.pares[0].esquerda.id, direitaId: manualPares.pares[0].direita.id },
      { esquerdaId: manualPares.pares[1].esquerda.id, direitaId: manualPares.pares[1].direita.id },
    ]);

    const manualOrd = (
      await service.salvarQuestao(prof, {
        requestId: 'req-mo',
        questao: {
          disciplina: 'História',
          anoEscolar: '9º ano EF',
          conteudo: 'República',
          dificuldade: 'medio',
          tipo: 'ordenacao',
          enunciado: 'Ordene cronologicamente.',
          itens: [
            { id: 'item-1', texto: 'Evento de 2000' },
            { id: 'item-2', texto: 'Evento de 1900' },
            { id: 'item-3', texto: 'Evento de 1950' },
          ],
          respostaCorreta: ['item-2', 'item-3', 'item-1'],
          explicacao: 'Ordem cronológica.',
          justificativaDificuldade: 'Exige cronologia.',
        },
      })
    ).questao;

    const novosIds = manualOrd.itens.map((it) => it.id);
    expect(novosIds).not.toContain('item-1');
    expect(novosIds).not.toContain('item-2');
    expect(novosIds).not.toContain('item-3');
    // Gabarito continua apontando para [1900, 1950, 2000]
    const textosNaOrdemCorreta = manualOrd.respostaCorreta.map(
      (id) => manualOrd.itens.find((it) => it.id === id)?.texto,
    );
    expect(textosNaOrdemCorreta).toEqual(['Evento de 1900', 'Evento de 1950', 'Evento de 2000']);
  });

  it('montarConteudo usa entropia secreta e não permite deduzir ordem pública apenas com código, índice e ID da questão', () => {
    const q = {
      id: 'q-ord-1',
      revision: 1,
      disciplina: 'História',
      anoEscolar: '9º ano',
      conteudo: 'Marcos',
      dificuldade: 'medio',
      tipo: 'ordenacao',
      enunciado: 'Ordene.',
      status: 'revisada',
      itens: [
        { id: 'a', texto: '1º' },
        { id: 'b', texto: '2º' },
        { id: 'c', texto: '3º' },
        { id: 'd', texto: '4º' },
        { id: 'e', texto: '5º' },
        { id: 'f', texto: '6º' },
      ],
      respostaCorreta: ['a', 'b', 'c', 'd', 'e', 'f'],
    };

    const conteudo1 = montarConteudo(q, 'ordenacao', { codigo: 'SALA99', indice: 0, segredoSemente: 'segredo-1' });
    const conteudo2 = montarConteudo(q, 'ordenacao', { codigo: 'SALA99', indice: 0, segredoSemente: 'segredo-2' });
    const previsivelComDadosPublicos = questaoPublica(q, 'ordenacao', { seed: 'SALA99:0:q-ord-1' });

    expect(conteudo1.questaoPublica.itens.map((i) => i.id)).not.toEqual(
      conteudo2.questaoPublica.itens.map((i) => i.id),
    );
    expect(conteudo1.questaoPublica.itens.map((i) => i.id)).not.toEqual(
      previsivelComDadosPublicos.itens.map((i) => i.id),
    );
    expect(JSON.stringify(conteudo1.questaoPublica)).not.toContain('segredo-1');
  });
});
