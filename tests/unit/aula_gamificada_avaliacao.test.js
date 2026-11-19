import { describe, expect, it } from 'vitest';
import {
  arredondarDuasCasas,
  calcularAvaliacaoParticipante,
  gerarCsvRelatorio,
  gerarRelatorioSala,
  neutralizarCelulaCsv,
  validarConfiguracaoAvaliacao,
} from '@/dominio/aula-gamificada/avaliacao';

describe('Domínio Avaliação — critérios, notas dos 7 jogos, ausentes e CSV', () => {
  it('valida finalidade revisao vs avaliativa sem inferir ano letivo pela data', () => {
    const rev = validarConfiguracaoAvaliacao({ finalidade: 'revisao', turmas: [] });
    expect(rev.finalidade).toBe('revisao');

    const turmas = [
      { id: 't1', nome: '9º A', ano: 2025, alunos: [{ id: 'a1', nome: 'Ana' }] },
      { id: 't_leg', nome: 'Turma Legado', alunos: [{ id: 'a2', nome: 'Beto' }] },
    ];

    expect(() =>
      validarConfiguracaoAvaliacao({
        finalidade: 'avaliativa',
        modalidade: 'herois',
        turmas: [turmas[0]],
        avaliacao: {
          tituloAtividade: 'Avaliação Arte',
          disciplina: 'Arte',
          bimestre: '2',
          anoLetivo: '2026', // diverge de 2025!
          valorMaximo: 10,
        },
      }),
    ).toThrow(/ano letivo/i);

    const ok = validarConfiguracaoAvaliacao({
      finalidade: 'avaliativa',
      modalidade: 'herois',
      turmas: [turmas[0]],
      avaliacao: {
        tituloAtividade: 'Avaliação Arte',
        disciplina: 'Arte',
        bimestre: '2',
        anoLetivo: '2025',
        valorMaximo: 10,
      },
    });
    expect(ok.finalidade).toBe('avaliativa');
    expect(ok.avaliacao.criterioHerois).toBe('primeira_tentativa');
    expect(ok.avaliacao.valorMaximo).toBe(10);

    const legadoOk = validarConfiguracaoAvaliacao({
      finalidade: 'avaliativa',
      modalidade: 'quiz',
      turmas: [turmas[1]],
      avaliacao: {
        tituloAtividade: 'Avaliação Legado',
        disciplina: 'História',
        bimestre: '1',
        anoLetivo: 'legado',
        valorMaximo: 5,
      },
    });
    expect(legadoOk.avaliacao.anoLetivo).toBe('legado');
  });

  it('calcula Heróis em primeira_tentativa vs melhor_tentativa sem duplicar reenvios', () => {
    const sala = {
      modalidade: 'herois',
      fase: 'encerrada',
      rodada: 2,
      totalRodadas: 2,
      avaliacao: { valorMaximo: 10, criterioHerois: 'primeira_tentativa' },
    };
    const conteudos = [
      {
        segredo: {
          questao: { id: 'q1', tipo: 'multipla_escolha', respostaCorreta: 'A' },
        },
      },
      {
        segredo: {
          questao: { id: 'q2', tipo: 'multipla_escolha', respostaCorreta: 'B' },
        },
      },
    ];
    const participante = { id: 'p1', nomeExibicao: 'Ana', entrouEmMs: 1000 };
    const respostas = [
      // q1: errou na 1ª, acertou na 2ª
      {
        rodada: 1,
        participanteId: 'p1',
        tentativas: 2,
        acertou: true,
        primeiraResposta: { alternativaId: 'C' },
        resposta: { alternativaId: 'A' },
      },
      // q2: acertou na 1ª
      {
        rodada: 2,
        participanteId: 'p1',
        tentativas: 1,
        acertou: true,
        primeiraResposta: { alternativaId: 'B' },
        resposta: { alternativaId: 'B' },
      },
    ];

    const primeira = calcularAvaliacaoParticipante({
      sala,
      participante,
      conteudos,
      respostasDoParticipante: respostas,
      criterioHerois: 'primeira_tentativa',
    });
    expect(primeira.aproveitamento).toBe(0.5);
    expect(primeira.notaCalculada).toBe(5);

    const melhor = calcularAvaliacaoParticipante({
      sala,
      participante,
      conteudos,
      respostasDoParticipante: respostas,
      criterioHerois: 'melhor_tentativa',
    });
    expect(melhor.aproveitamento).toBe(1);
    expect(melhor.notaCalculada).toBe(10);
  });

  it('calcula Tabuleiro apenas nos turnos da equipe e distingue sem_oportunidade e nao_participou', () => {
    const equipes = [
      { id: 'eq_azul', nome: 'Azul', participanteIds: ['p1'] },
      { id: 'eq_verde', nome: 'Verde', participanteIds: ['p2'] },
    ];
    const conteudos = [
      { segredo: { questao: { id: 'q1', tipo: 'multipla_escolha', respostaCorreta: 'A' } } },
    ];
    // Encerrada antecipadamente na rodada 1 -> apenas eq_azul teve oportunidade!
    const sala = {
      modalidade: 'tabuleiro',
      fase: 'encerrada',
      rodada: 1,
      totalRodadas: 4,
      equipes,
      avaliacao: { valorMaximo: 10 },
    };

    const resAzul = calcularAvaliacaoParticipante({
      sala,
      participante: { id: 'p1', equipeId: 'eq_azul', entrouEmMs: 1000 },
      conteudos,
      respostasDoParticipante: [{ rodada: 1, participanteId: 'p1', resposta: { alternativaId: 'A' } }],
    });
    expect(resAzul.elegiveis).toBe(1);
    expect(resAzul.notaCalculada).toBe(10);

    const resVerde = calcularAvaliacaoParticipante({
      sala,
      participante: { id: 'p2', equipeId: 'eq_verde', entrouEmMs: 1000 },
      conteudos,
      respostasDoParticipante: [],
    });
    expect(resVerde.situacao).toBe('sem_oportunidade');
    expect(resVerde.elegiveis).toBe(0);
    expect(resVerde.notaCalculada).toBeNull();

    // Aluno ausente em Quiz não recebe zero automático
    const salaQuiz = {
      modalidade: 'quiz',
      fase: 'encerrada',
      rodada: 1,
      totalRodadas: 1,
      avaliacao: { valorMaximo: 10 },
    };
    const ausente = calcularAvaliacaoParticipante({
      sala: salaQuiz,
      participante: { id: 'p3', entrouEmMs: null },
      conteudos,
      respostasDoParticipante: [],
    });
    expect(ausente.situacao).toBe('nao_participou');
    expect(ausente.notaCalculada).toBeNull();
  });

  it('calcula parciais de Associação, Ordenação e Memória arredondando apenas no final', () => {
    const conteudos = [
      {
        segredo: {
          questao: {
            id: 'qp',
            tipo: 'pares',
            pares: [{ id: '1' }, { id: '2' }, { id: '3' }],
            respostaCorreta: [
              { esquerdaId: 'e1', direitaId: 'd1' },
              { esquerdaId: 'e2', direitaId: 'd2' },
              { esquerdaId: 'e3', direitaId: 'd3' },
            ],
          },
        },
      },
    ];
    const resMem = calcularAvaliacaoParticipante({
      sala: { modalidade: 'memoria', fase: 'encerrada', rodada: 1, avaliacao: { valorMaximo: 10 } },
      participante: { id: 'p1', entrouEmMs: 1000 },
      conteudos,
      respostasDoParticipante: [{ rodada: 1, participanteId: 'p1', encontrados: ['1', '2'] }],
    });
    expect(resMem.notaCalculada).toBe(arredondarDuasCasas((10 * 2) / 3)); // 6.67

    const resAssoc = calcularAvaliacaoParticipante({
      sala: { modalidade: 'associacao', fase: 'encerrada', rodada: 1, avaliacao: { valorMaximo: 10 } },
      participante: { id: 'p1', entrouEmMs: 1000 },
      conteudos,
      respostasDoParticipante: [
        {
          rodada: 1,
          participanteId: 'p1',
          resposta: { pares: [{ esquerdaId: 'e1', direitaId: 'd1' }] },
        },
      ],
    });
    expect(resAssoc.notaCalculada).toBe(3.33);

    const resOrd = calcularAvaliacaoParticipante({
      sala: { modalidade: 'ordenacao', fase: 'encerrada', rodada: 1, avaliacao: { valorMaximo: 10 } },
      participante: { id: 'p1', entrouEmMs: 1000 },
      conteudos: [
        {
          segredo: {
            questao: { id: 'qo', tipo: 'ordenacao', itens: [{ id: 'a' }, { id: 'b' }], respostaCorreta: ['a', 'b'] },
          },
        },
      ],
      respostasDoParticipante: [{ rodada: 1, participanteId: 'p1', resposta: { ordem: ['a', 'a'] } }],
    });
    expect(resOrd.notaCalculada).toBe(5);
  });

  it('neutraliza fórmulas em células CSV e gera relatório consistente', () => {
    expect(neutralizarCelulaCsv('=CMD()')).toBe("'=CMD()");
    expect(neutralizarCelulaCsv('+1+1')).toBe("'+1+1");
    expect(neutralizarCelulaCsv('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(neutralizarCelulaCsv('Ana Clara')).toBe('Ana Clara');

    const rel = gerarRelatorioSala({
      sala: {
        codigo: 'AV001',
        titulo: 'Prova Gamificada',
        modalidade: 'quiz',
        finalidade: 'avaliativa',
        fase: 'encerrada',
        rodada: 1,
        totalRodadas: 1,
        avaliacao: { valorMaximo: 10, bimestre: '1', anoLetivo: '2026', tituloAtividade: 'Quiz 1' },
      },
      conteudos: [{ segredo: { questao: { id: 'q1', tipo: 'multipla_escolha', respostaCorreta: 'A' } } }],
      participantes: [{ id: 'p1', alunoId: 'a1', turmaId: 't1', nomeExibicao: '=Malicioso', entrouEmMs: 1000 }],
      respostas: [{ rodada: 1, participanteId: 'p1', resposta: { alternativaId: 'A' } }],
    });
    const csv = gerarCsvRelatorio(rel);
    expect(csv).toContain("'=Malicioso");
    expect(csv).toContain('10.00');
  });
});
