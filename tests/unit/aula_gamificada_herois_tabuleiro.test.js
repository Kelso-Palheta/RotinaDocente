import { describe, expect, it } from 'vitest';
import {
  MODALIDADES,
  obterModalidade,
  regraPontuacao,
  validarTipoModalidade,
} from '@/dominio/aula-gamificada/modalidades';
import { normalizarQuestao } from '@/dominio/aula-gamificada/questoes';
import { calcularRanking } from '@/dominio/aula-gamificada/pontuacao';
import {
  avaliarRodadaTabuleiro,
  avaliarTentativaHerois,
  equipeDaVezTabuleiro,
  inicializarTabuleiroEstado,
} from '@/dominio/aula-gamificada/sala';

describe('Modalidades Heróis e Tabuleiro — domínio', () => {
  it('registra exatamente 7 modalidades no catálogo, incluindo herois e tabuleiro', () => {
    expect(MODALIDADES).toHaveLength(7);
    expect(MODALIDADES.map((m) => m.id)).toEqual([
      'quiz',
      'memoria',
      'associacao',
      'ordenacao',
      'equipes',
      'herois',
      'tabuleiro',
    ]);
    expect(obterModalidade('herois').tiposQuestoes).toEqual(['multipla_escolha']);
    expect(obterModalidade('tabuleiro').tiposQuestoes).toEqual(['multipla_escolha']);
    expect(regraPontuacao('herois')).toMatch(/Tente novamente|1000/i);
    expect(regraPontuacao('tabuleiro')).toMatch(/casas|Chegada/i);
    expect(() => validarTipoModalidade('herois', 'pares')).toThrow(/não aceita/i);
    expect(() => validarTipoModalidade('tabuleiro', 'ordenacao')).toThrow(/não aceita/i);
  });

  it('rejeita questões-placeholder de Herois.pptx com erro 422', () => {
    const base = {
      disciplina: 'Arte',
      anoEscolar: '9º ano',
      conteudo: 'Arte Conceitual',
      dificuldade: 'facil',
      tipo: 'multipla_escolha',
      explicacao: 'Explicação válida.',
      justificativaDificuldade: 'Adequada.',
      alternativas: [
        { id: 'A', texto: 'Opção A' },
        { id: 'B', texto: 'Opção B' },
        { id: 'C', texto: 'Opção C' },
      ],
      respostaCorreta: 'A',
    };

    expect(() =>
      normalizarQuestao({ ...base, enunciado: 'Digite aqui a pergunta' }),
    ).toThrow(/placeholder/i);

    expect(() =>
      normalizarQuestao({
        ...base,
        enunciado: 'Pergunta válida sobre Arte?',
        alternativas: [
          { id: 'A', texto: 'Resposta correta' },
          { id: 'B', texto: 'Resposta incorreta' },
          { id: 'C', texto: 'Outra opção' },
        ],
      }),
    ).toThrow(/placeholder/i);
  });

  it('alterna turnos no Tabuleiro e avalia as 4 cartas com regras determinísticas', () => {
    const equipes = [
      { id: 'eq_azul', nome: 'Equipe Azul', cor: 'azul', participanteIds: ['p1', 'p2'] },
      { id: 'eq_verde', nome: 'Equipe Verde', cor: 'verde', participanteIds: ['p3', 'p4'] },
    ];
    expect(equipeDaVezTabuleiro(equipes, 1)?.id).toBe('eq_azul');
    expect(equipeDaVezTabuleiro(equipes, 2)?.id).toBe('eq_verde');
    expect(equipeDaVezTabuleiro(equipes, 3)?.id).toBe('eq_azul');

    const estado0 = inicializarTabuleiroEstado(equipes);
    expect(estado0.totalCasas).toBe(12);
    expect(estado0.posicoesPorEquipe).toEqual({ eq_azul: 0, eq_verde: 0 });

    // 0 respondentes -> Passe a vez (+0)
    const passe = avaliarRodadaTabuleiro({
      tabuleiroEstado: estado0,
      equipes,
      rodada: 1,
      questao: { dificuldade: 'facil' },
      respostasRodada: [],
    });
    expect(passe.ultimaCarta.tipo).toBe('passe_a_vez');
    expect(passe.ultimaCarta.avanco).toBe(0);
    expect(passe.posicoesPorEquipe.eq_azul).toBe(0);

    // <= 50% acertos -> Ops. Não ande! Você errou (+0)
    const erro = avaliarRodadaTabuleiro({
      tabuleiroEstado: estado0,
      equipes,
      rodada: 1,
      questao: { dificuldade: 'medio' },
      respostasRodada: [
        { participanteId: 'p1', pontos: 1000 },
        { participanteId: 'p2', pontos: 0 },
      ],
    });
    expect(erro.ultimaCarta.tipo).toBe('erro_nao_ande');
    expect(erro.ultimaCarta.avanco).toBe(0);

    // > 50% em fácil/médio -> Avance 1 casa (+1)
    const av1 = avaliarRodadaTabuleiro({
      tabuleiroEstado: estado0,
      equipes,
      rodada: 1,
      questao: { dificuldade: 'medio' },
      respostasRodada: [
        { participanteId: 'p1', pontos: 1000 },
        { participanteId: 'p2', pontos: 1000 },
      ],
    });
    expect(av1.ultimaCarta.tipo).toBe('avance_1');
    expect(av1.ultimaCarta.avanco).toBe(1);
    expect(av1.posicoesPorEquipe.eq_azul).toBe(1);

    // > 50% em difícil -> Avance 2 casas (+2) e clamp na casa 12 define vencedorChegadaId
    const quaseChegando = {
      ...estado0,
      posicoesPorEquipe: { eq_azul: 11, eq_verde: 4 },
    };
    const av2 = avaliarRodadaTabuleiro({
      tabuleiroEstado: quaseChegando,
      equipes,
      rodada: 1,
      questao: { dificuldade: 'dificil' },
      respostasRodada: [{ participanteId: 'p1', pontos: 1000 }],
    });
    expect(av2.ultimaCarta.tipo).toBe('avance_2');
    expect(av2.posicoesPorEquipe.eq_azul).toBe(12);
    expect(av2.vencedorChegadaId).toBe('eq_azul');
  });

  it('ordena ranking do Tabuleiro por casa alcançada e desempata por pontos da equipe', () => {
    const equipes = [
      { id: 'eq_azul', nome: 'Equipe Azul', participanteIds: ['p1'] },
      { id: 'eq_verde', nome: 'Equipe Verde', participanteIds: ['p2'] },
      { id: 'eq_amarela', nome: 'Equipe Amarela', participanteIds: ['p3'] },
    ];
    const participantes = [
      { id: 'p1', equipeId: 'eq_azul', pontos: 1000 },
      { id: 'p2', equipeId: 'eq_verde', pontos: 3000 },
      { id: 'p3', equipeId: 'eq_amarela', pontos: 1000 },
    ];
    const ranking = calcularRanking(participantes, {
      modalidade: 'tabuleiro',
      equipes,
      posicoesPorEquipe: { eq_azul: 5, eq_verde: 5, eq_amarela: 7 },
    });
    expect(ranking.map((r) => r.id)).toEqual(['eq_amarela', 'eq_verde', 'eq_azul']);
    expect(ranking[0].posicao).toBe(1);
    expect(ranking[1].posicao).toBe(2);
    expect(ranking[2].posicao).toBe(3);
  });

  it('aplica regra de Tente novamente nos Heróis com limite de 2 tentativas, prazo e anti-duplicação', () => {
    const sala = { fase: 'pergunta', encerraEmMs: 20_000 };

    // 1ª tentativa errada
    const t1 = avaliarTentativaHerois({
      sala,
      registro: null,
      acertou: false,
      agora: 12_000,
    });
    expect(t1.tentativas).toBe(1);
    expect(t1.podeTentarNovamente).toBe(true);
    expect(t1.pontosRodada).toBe(0);
    expect(t1.estadoHeroi).toBe('golpe_tente_novamente');

    // 2ª tentativa certa dentro do prazo
    const t2 = avaliarTentativaHerois({
      sala,
      registro: { tentativas: 1, acertou: false, pontos: 0 },
      acertou: true,
      agora: 15_000,
    });
    expect(t2.tentativas).toBe(2);
    expect(t2.podeTentarNovamente).toBe(false);
    expect(t2.pontosRodada).toBe(1000);
    expect(t2.estadoHeroi).toBe('vitoria_fase');

    // 3ª tentativa ou após acerto -> 409
    expect(() =>
      avaliarTentativaHerois({
        sala,
        registro: { tentativas: 2, acertou: true, pontos: 1000 },
        acertou: true,
        agora: 16_000,
      }),
    ).toThrow(/concluiu/i);

    // Após prazo -> 409
    expect(() =>
      avaliarTentativaHerois({
        sala,
        registro: { tentativas: 1, acertou: false, pontos: 0 },
        acertou: true,
        agora: 20_000,
      }),
    ).toThrow(/prazo|tempo/i);
  });
});
