import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  compatibilidadeModalidade,
  validarFormatoParticipacao,
} from '@/dominio/aula-gamificada/modalidades';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';

const prof = { tipo: 'professor', uid: 'prof-1' };
const idParticipante = (tId, aId) =>
  createHash('sha256').update(JSON.stringify([tId, aId])).digest('hex');

function criarAmbiente() {
  const docs = new Map(
    Object.entries({
      'professores/prof-1/turmas/data': {
        revision: 1,
        turmas: [
          {
            id: 't1',
            nome: '8º A',
            anoLetivo: 2026,
            alunos: [
              { id: 'a1', nome: 'Ana' },
              { id: 'a2', nome: 'Beto' },
              { id: 'a3', nome: 'Caio' },
              { id: 'a4', nome: 'Duda' },
            ],
            bimestres: { '1': { atividades: [], notas: {} } },
          },
        ],
      },
      'aulaGamificadaDocentes/prof-1/questoes/q_multi': {
        id: 'q_multi',
        professorId: 'prof-1',
        disciplina: 'Arte',
        anoEscolar: '8º ano',
        conteudo: 'Vanguardas',
        dificuldade: 'medio',
        tipo: 'multipla_escolha',
        status: 'revisada',
        revision: 1,
        enunciado: 'Pergunta teste?',
        alternativas: [
          { id: 'A', texto: 'Certa' },
          { id: 'B', texto: 'Errada' },
        ],
        respostaCorreta: 'A',
        explicacao: 'Exp A',
      },
      'aulaGamificadaDocentes/prof-1/questoes/q_mem': {
        id: 'q_mem',
        professorId: 'prof-1',
        disciplina: 'Arte',
        anoEscolar: '8º ano',
        conteudo: 'Vanguardas',
        dificuldade: 'facil',
        tipo: 'pares',
        status: 'revisada',
        revision: 1,
        enunciado: 'Pares',
        pares: [
          { id: 'p1', esquerda: 'E1', direita: 'D1' },
          { id: 'p2', esquerda: 'E2', direita: 'D2' },
        ],
        explicacao: 'Exp Pares',
      },
      'alunoLogin/ana/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a1' },
      'alunoLogin/beto/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a2' },
      'alunoLogin/caio/vinculos/prof-1': { professorUid: 'prof-1', turmaId: 't1', alunoId: 'a3' },
    }),
  );

  const store = {
    async get(p) {
      return docs.has(p) ? structuredClone(docs.get(p)) : null;
    },
    async list(p, filtros = []) {
      return [...docs]
        .filter(
          ([k, d]) =>
            k.startsWith(`${p}/`) &&
            !k.slice(p.length + 1).includes('/') &&
            filtros.every(([c, op, v]) => op === '==' && d[c] === v),
        )
        .map(([, d]) => structuredClone(d));
    },
    async transaction(fn) {
      const escritas = new Map();
      const ler = (f) => {
        if (escritas.size) throw new Error('Leitura após escrita.');
        return f();
      };
      const res = await fn({
        get: (p) => ler(() => store.get(p)),
        list: (p, f) => ler(() => store.list(p, f)),
        set: (p, v) => escritas.set(p, structuredClone(v)),
      });
      for (const [p, v] of escritas) docs.set(p, v);
      return res;
    },
  };

  let seq = 0;
  let codSeq = 0;
  let agora = 10_000;
  return {
    docs,
    avancarTempo: (ms) => {
      agora += ms;
    },
    servico: new AulaGamificadaService({
      store,
      idParticipante,
      agora: () => agora,
      gerarId: () => `id_${++seq}`,
      gerarCodigo: () => `DS000${++codSeq}`,
    }),
  };
}

describe('DISPUTA-01..04 — Formatos de disputa, duelo, grupos e avaliação coletiva', () => {
  it('DISPUTA-01: valida matriz de compatibilidade para todos os 7 jogos e expõe no catálogo', async () => {
    expect(compatibilidadeModalidade('equipes').formatos).toEqual(['grupos']);
    expect(compatibilidadeModalidade('tabuleiro').formatos).toEqual(['duelo', 'grupos']);
    expect(compatibilidadeModalidade('quiz').formatos).toEqual(['individual', 'duelo', 'grupos']);

    expect(() =>
      validarFormatoParticipacao({ modalidade: 'equipes', formatoParticipacao: 'individual' }),
    ).toThrow(/422|compat|permit/i);
    expect(() =>
      validarFormatoParticipacao({ modalidade: 'tabuleiro', formatoParticipacao: 'individual' }),
    ).toThrow(/422|compat|permit/i);

    const { servico } = criarAmbiente();
    const cat = await servico.catalogo(prof);
    expect(cat.modalidades).toHaveLength(7);
    for (const m of cat.modalidades) {
      expect(m.capa).toMatch(/^\/aula-gamificada\/catalogo\/[a-z]+\.svg$/);
      expect(Array.isArray(m.formatosParticipacao)).toBe(true);
    }
  });

  it('DISPUTA-02: duelo exige exatamente 2 alunos distintos, nega terceiro e não zera demais alunos da turma', async () => {
    const { servico } = criarAmbiente();
    await expect(
      servico.criarSala(prof, {
        requestId: 'd-err',
        titulo: 'Duelo inválido',
        modalidade: 'quiz',
        formatoParticipacao: 'duelo',
        tempoSegundos: 60,
        turmaIds: ['t1'],
        questaoIds: ['q_multi'],
        dueloParticipantes: [{ turmaId: 't1', alunoId: 'a1' }],
      }),
    ).rejects.toMatchObject({ status: 422 });

    const criada = await servico.criarSala(prof, {
      requestId: 'd-ok',
      titulo: 'Duelo Ana x Beto',
      modalidade: 'herois',
      formatoParticipacao: 'duelo',
      tempoSegundos: 60,
      finalidade: 'avaliativa',
      avaliacao: {
        tituloAtividade: 'Duelo Avaliativo',
        disciplina: 'Arte',
        bimestre: '1',
        anoLetivo: '2026',
        valorMaximo: 10,
      },
      turmaIds: ['t1'],
      questaoIds: ['q_multi'],
      dueloParticipantes: [
        { turmaId: 't1', alunoId: 'a1' },
        { turmaId: 't1', alunoId: 'a2' },
      ],
    });
    const codigo = criada.sala.codigo;
    expect(criada.sala.roster).toHaveLength(2);

    // Caio (a3) é da mesma turma, mas não está no duelo -> acesso negado (403)
    await expect(servico.entrar({ tipo: 'aluno', loginKey: 'caio' }, codigo)).rejects.toMatchObject({
      status: 403,
    });

    await servico.entrar({ tipo: 'aluno', loginKey: 'ana' }, codigo);
    await servico.comandar(prof, codigo, { acao: 'iniciar', rodada: 1, expectedRevision: 1, requestId: 'ini-1' });
    await servico.responder(
      { tipo: 'aluno', loginKey: 'ana' },
      codigo,
      { rodada: 1, requestId: 'resp-a1', resposta: { alternativaId: 'A' } },
    );
    await servico.comandar(prof, codigo, { acao: 'encerrar_rodada', rodada: 1, expectedRevision: 2, requestId: 'encr-1' });
    await servico.comandar(prof, codigo, { acao: 'revelar', rodada: 1, expectedRevision: 3, requestId: 'rev-1' });
    await servico.comandar(prof, codigo, { acao: 'encerrar_sala', rodada: 1, expectedRevision: 4, requestId: 'enc-1' });

    const rel = await servico.relatorioSala(prof, codigo);
    // Apenas os 2 do duelo constam no relatório; Caio e Duda não viram ausentes com zero
    expect(rel.alunos.map((a) => a.alunoId).sort()).toEqual(['a1', 'a2']);
  });

  it('DISPUTA-03 & 04: grupos com resposta compartilhada, representante, troca auditável, Heróis 2 tentativas do grupo e critério coletivo', async () => {
    const { servico } = criarAmbiente();
    const criada = await servico.criarSala(prof, {
      requestId: 'g-comp',
      titulo: 'Heróis em Grupos Compartilhados',
      modalidade: 'herois',
      formatoParticipacao: 'grupos',
      modoRespostaGrupo: 'compartilhada',
      tempoSegundos: 60,
      finalidade: 'avaliativa',
      avaliacao: {
        tituloAtividade: 'Av Coletiva',
        disciplina: 'Arte',
        bimestre: '1',
        anoLetivo: '2026',
        valorMaximo: 10,
        criterioHerois: 'melhor_tentativa',
        criterioColetivo: 'atribuir_presentes',
      },
      turmaIds: ['t1'],
      questaoIds: ['q_multi'],
      equipes: [
        { id: 'eq1', nome: 'Grupo Sol', membros: ['a1', 'a2'], representanteAlunoId: 'a1' },
        { id: 'eq2', nome: 'Grupo Lua', membros: ['a3', 'a4'], representanteAlunoId: 'a3' },
      ],
    });
    const codigo = criada.sala.codigo;

    await servico.entrar({ tipo: 'aluno', loginKey: 'ana' }, codigo);
    await servico.entrar({ tipo: 'aluno', loginKey: 'beto' }, codigo);
    await servico.comandar(prof, codigo, { acao: 'iniciar', rodada: 1, expectedRevision: 1, requestId: 'g-ini' });

    // Beto (não representante) não pode enviar
    await expect(
      servico.responder(
        { tipo: 'aluno', loginKey: 'beto' },
        codigo,
        { rodada: 1, requestId: 'beto-tent', resposta: { alternativaId: 'A' } },
      ),
    ).rejects.toMatchObject({ status: 403 });

    // Ana (representante) erra a 1ª tentativa do grupo -> 1 de 2 tentativas do grupo
    const t1 = await servico.responder(
      { tipo: 'aluno', loginKey: 'ana' },
      codigo,
      { rodada: 1, requestId: 'ana-1', resposta: { alternativaId: 'B' } },
    );
    expect(t1.recibo.tentativas).toBe(1);
    expect(t1.recibo.podeTentarNovamente).toBe(true);

    // Professor troca representante de eq1 para Beto sem reiniciar tentativas
    const troca = await servico.comandar(prof, codigo, {
      acao: 'alterar_representante',
      expectedRevision: 2,
      requestId: 'troca-rep',
      equipeId: 'eq1',
      representanteAlunoId: 'a2',
    });
    expect(troca.estado.sala.equipes.find((e) => e.id === 'eq1').representanteAlunoId).toBe('a2');

    // Agora Beto usa a 2ª tentativa do grupo e acerta (aproveitando a mesma contagem de tentativas do grupo = 2)
    const t2 = await servico.responder(
      { tipo: 'aluno', loginKey: 'beto' },
      codigo,
      { rodada: 1, requestId: 'beto-2', resposta: { alternativaId: 'A' } },
    );
    expect(t2.recibo.tentativas).toBe(2);
    expect(t2.recibo.estadoHeroi).toBe('vitoria_fase');

    await servico.comandar(prof, codigo, { acao: 'encerrar_rodada', rodada: 1, expectedRevision: 3, requestId: 'g-encr' });
    await servico.comandar(prof, codigo, { acao: 'revelar', rodada: 1, expectedRevision: 4, requestId: 'g-rev' });
    await servico.comandar(prof, codigo, { acao: 'encerrar_sala', rodada: 1, expectedRevision: 5, requestId: 'g-enc' });

    // Professor confirma presença de Ana e Beto (mesmo aparelho); Caio/Duda não confirmados
    await servico.comandar(prof, codigo, {
      acao: 'confirmar_presenca',
      expectedRevision: 6,
      requestId: 'conf-pres',
      presentesIds: [idParticipante('t1', 'a1'), idParticipante('t1', 'a2')],
    });

    const rel = await servico.relatorioSala(prof, codigo);
    const rAna = rel.alunos.find((a) => a.alunoId === 'a1');
    const rBeto = rel.alunos.find((a) => a.alunoId === 'a2');
    const rCaio = rel.alunos.find((a) => a.alunoId === 'a3');
    expect(rAna.notaFinal).toBe(10);
    expect(rAna.origemColetiva).toBe(true);
    expect(rBeto.notaFinal).toBe(10);
    expect(rCaio.notaFinal).toBeNull(); // Ausente não herda nota automaticamente
  });
});
