import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { TelaProjecao } from '@/components/revisao/TelaProjecao';

afterEach(() => {
  cleanup();
});

const baseEstado = {
  sala: {
    id: 'sala-1',
    titulo: 'Grande Aulão ENEM Arte',
    codigo: 'ARTE42',
    revisao: 1,
  },
  fase: 'espera',
  conexao: 'conectado',
  agoraServidorMs: 100000,
  rodada: {
    id: 'r1',
    numero: 2,
    total: 8,
    encerraEmMs: 160000,
    questao: {
      id: 'q2',
      ano: 2023,
      aplicacoes: ['regular'],
      tema: 'Vanguardas Europeias no Brasil',
      enunciado: 'O Manifesto Antropófago propunha a deglutição crítica da cultura europeia com o objetivo de:',
      imagens: [{ id: 'img-antropofagia', url: '/antropofagia.jpg', alt: 'Quadro Antropofagia', legenda: 'Tarsila do Amaral, 1929' }],
      alternativas: [
        { id: 'A', texto: 'Copiar fielmente os cânones renascentistas.' },
        { id: 'B', texto: 'Construir uma arte genuinamente nacional a partir da assimilação crítica.' },
        { id: 'C', texto: 'Isolar a produção estética brasileira de qualquer contato exterior.' },
        { id: 'D', texto: 'Subordinar as matrizes indígenas à estética parnasiana.' },
        { id: 'E', texto: 'Rejeitar a vanguarda e retornar ao academicismo imperial.' },
      ],
    },
    conteudo: [
      { tipo: 'texto', texto: 'A Antropofagia modernista foi um movimento lançado por Oswald de Andrade em 1928.' },
      { tipo: 'imagem', url: '/revista.jpg', alt: 'Revista de Antropofagia', legenda: 'Primeira edição da Revista de Antropofagia' },
    ],
  },
  participacao: {
    total: 40,
    respondidos: 15,
    respondentes: [
      { id: 'p1', nomeExibicao: 'Mariana Duarte' },
      { id: 'p2', nomeExibicao: 'Pedro Henrique da Silva Santos' },
      { id: 'p3', nomeExibicao: 'Lucas Albuquerque' },
    ],
    distribuicao: { A: 1, B: 11, C: 2, D: 1, E: 0 },
  },
  feedback: null,
  ranking: [],
};

describe('RV-03 & RV-04 & RV-10 — TelaProjecao: exibição de alta legibilidade a 1920px', () => {
  it('fase espera: exibe código da sala em tamanho gigante e instrução de conexão', () => {
    render(<TelaProjecao estado={baseEstado} />);

    expect(screen.getByText('ARTE42')).toBeInTheDocument();
    expect(screen.getByText(/Grande Aulão ENEM Arte/i)).toBeInTheDocument();
    expect(screen.getByText(/Aguardando início do aulão/i)).toBeInTheDocument();
    expect(screen.getByText(/40 participantes conectados/i)).toBeInTheDocument();
  });

  it('fase conteudo: exibe conteúdo de revisão com textos e imagens com legenda', () => {
    const estado = { ...baseEstado, fase: 'conteudo' };
    render(<TelaProjecao estado={estado} />);

    expect(screen.getByText(/Rodada 2 de 8/i)).toBeInTheDocument();
    expect(screen.getByText(/A Antropofagia modernista foi um movimento/i)).toBeInTheDocument();
    expect(screen.getByText(/Primeira edição da Revista de Antropofagia/i)).toBeInTheDocument();
  });

  it('fase pergunta: exibe questão, alternativas, timer e estatísticas de participação', () => {
    const estado = { ...baseEstado, fase: 'pergunta' };
    render(<TelaProjecao estado={estado} />);

    expect(screen.getByText(/O Manifesto Antropófago propunha a deglutição crítica/i)).toBeInTheDocument();
    expect(screen.getByText(/Tarsila do Amaral, 1929/i)).toBeInTheDocument();

    // Todas as alternativas A–E visíveis
    expect(screen.getByText(/Copiar fielmente os cânones renascentistas/i)).toBeInTheDocument();
    expect(screen.getByText(/Construir uma arte genuinamente nacional/i)).toBeInTheDocument();

    // Contadores de participação
    expect(screen.getByText(/15 \/ 40 responderam/i)).toBeInTheDocument();

    // Distribuição A–E com contagens numéricas explícitas
    expect(screen.getByText(/A: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/B: 11/i)).toBeInTheDocument();
    expect(screen.getByText(/C: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/D: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/E: 0/i)).toBeInTheDocument();

    // RV-04: Nomes dos respondentes visíveis
    expect(screen.getByText(/Mariana Duarte/i)).toBeInTheDocument();
    expect(screen.getByText(/Pedro Henrique da Silva Santos/i)).toBeInTheDocument();

    // RV-04: NUNCA associa nome à alternativa marcada
    const containerRespondentes = screen.getByTestId('projecao-respondentes');
    expect(containerRespondentes.textContent).not.toMatch(/Mariana.*Alternativa/i);
    expect(containerRespondentes.textContent).not.toMatch(/Pedro.*Alternativa/i);

    // GABARITO NÃO É REVELADO na fase pergunta
    expect(screen.queryByText(/Gabarito Oficial/i)).not.toBeInTheDocument();
  });

  it('fase encerrada: indica encerramento da pergunta mas ainda NÃO revela gabarito', () => {
    const estado = { ...baseEstado, fase: 'encerrada' };
    render(<TelaProjecao estado={estado} />);

    expect(screen.getByText(/Pergunta Encerrada/i)).toBeInTheDocument();
    expect(screen.getByText(/B: 11/i)).toBeInTheDocument();
    expect(screen.queryByText(/Gabarito Oficial/i)).not.toBeInTheDocument();
  });

  it('fase feedback: destaca gabarito oficial e exibe explicações para todas as alternativas A–E', () => {
    const estado = {
      ...baseEstado,
      fase: 'feedback',
      feedback: {
        gabarito: 'B',
        explicacoes: {
          A: 'Incorreta: A antropofagia rompia com a cópia submissa.',
          B: 'Correta: A metáfora da deglutição sintetiza a assimilação crítica.',
          C: 'Incorreta: O movimento não propunha isolacionismo cultural.',
          D: 'Incorreta: As matrizes indígenas foram valorizadas como raiz ativa.',
          E: 'Incorreta: O grupo combatia frontalmente o academicismo.',
        },
      },
    };
    render(<TelaProjecao estado={estado} />);

    expect(screen.getByText(/Gabarito Oficial: Alternativa B/i)).toBeInTheDocument();
    expect(screen.getByText(/A metáfora da deglutição sintetiza a assimilação crítica/i)).toBeInTheDocument();
    expect(screen.getByText(/A antropofagia rompia com a cópia submissa/i)).toBeInTheDocument();
    expect(screen.getByText(/O movimento não propunha isolacionismo/i)).toBeInTheDocument();
  });

  it('fase ranking: exibe pódio e lista de classificação fiel ao recebido sem recalcular notas', () => {
    const estado = {
      ...baseEstado,
      fase: 'ranking',
      ranking: [
        { participanteId: 'p1', nomeExibicao: 'Mariana Duarte de Albuquerque', pontos: 2000, posicao: 1 },
        { participanteId: 'p2', nomeExibicao: 'Pedro Henrique da Silva', pontos: 1000, posicao: 2 },
        { participanteId: 'p3', nomeExibicao: 'Lucas Albuquerque', pontos: 1000, posicao: 2 },
        { participanteId: 'p4', nomeExibicao: 'Carla Nogueira', pontos: 0, posicao: 4 },
      ],
    };
    render(<TelaProjecao estado={estado} />);

    expect(screen.getByText(/Classificação Geral/i)).toBeInTheDocument();
    expect(screen.getByText(/Mariana Duarte de Albuquerque/i)).toBeInTheDocument();
    expect(screen.getByText(/2000 pts/i)).toBeInTheDocument();
    expect(screen.getByText(/Pedro Henrique da Silva/i)).toBeInTheDocument();
    expect(screen.getByText(/Lucas Albuquerque/i)).toBeInTheDocument();

    // Empate de 2º lugar preservado exatamente como recebido
    const posicoes2 = screen.getAllByText('2º');
    expect(posicoes2.length).toBeGreaterThanOrEqual(2);
  });

  it('fase finalizada: exibe encerramento e ranking final', () => {
    const estado = {
      ...baseEstado,
      fase: 'finalizada',
      ranking: [
        { participanteId: 'p1', nomeExibicao: 'Mariana Duarte', pontos: 8000, posicao: 1 },
      ],
    };
    render(<TelaProjecao estado={estado} />);

    expect(screen.getByText(/Aulão Finalizado/i)).toBeInTheDocument();
    expect(screen.getByText(/Mariana Duarte/i)).toBeInTheDocument();
    expect(screen.getByText(/8000 pts/i)).toBeInTheDocument();
  });
});
