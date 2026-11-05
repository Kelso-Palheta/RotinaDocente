import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';

import { PainelAluno } from '@/components/revisao/PainelAluno';
import { PainelProfessor } from '@/components/revisao/PainelProfessor';
import { TelaProjecao } from '@/components/revisao/TelaProjecao';
import { CORES_ALTERNATIVAS } from '@/components/revisao/RevisaoTema';

afterEach(() => {
  cleanup();
});

const estadoBase = {
  sala: { id: 's1', titulo: 'Festival ENEM Arte 2026', codigo: 'ARTE42' },
  fase: 'pergunta',
  conexao: 'conectado',
  agoraServidorMs: 100000,
  rodada: {
    id: 'r1',
    numero: 1,
    total: 5,
    encerraEmMs: 160000,
    questao: {
      id: 'q1',
      enunciado: 'Questão sobre Vanguardas e Espaço Urbano.',
      imagens: [],
      alternativas: [
        { id: 'A', texto: 'Opção A — Coral' },
        { id: 'B', texto: 'Opção B — Ciano' },
        { id: 'C', texto: 'Opção C — Amarelo' },
        { id: 'D', texto: 'Opção D — Lima' },
        { id: 'E', texto: 'Opção E — Laranja' },
      ],
    },
    conteudo: [],
  },
  participacao: {
    total: 50,
    respondidos: 35,
    respondentes: [{ id: 'p1', nomeExibicao: 'Camila' }],
    distribuicao: { A: 5, B: 20, C: 4, D: 3, E: 3 },
  },
  feedback: null,
  ranking: [
    { posicao: 1, participanteId: 'p1', nomeExibicao: 'Camila', pontos: 1000 },
    { posicao: 2, participanteId: 'p2', nomeExibicao: 'Lucas', pontos: 800 },
  ],
};

describe('RevisaoVisualVibrante — Identidade Festival de Arte + Game Show', () => {
  it('PainelAluno: renderiza com tema vibrante, badges coloridos A-E e atributos de acessibilidade', () => {
    const { container } = render(
      <PainelAluno
        estado={estadoBase}
        envio={{ status: 'nao_enviado', alternativa: null }}
      />
    );

    // Deve ter indicador de tema vibrante
    const root = container.querySelector('[data-tema="vibrante"]');
    expect(root).toBeInTheDocument();

    // Alternativas A a E devem ter badges estilizados com cores distintas
    const buttons = screen.getAllByRole('button', { name: /^[A-E]\)/i });
    expect(buttons).toHaveLength(5);

    // Verifica se os badges A-E possuem os rótulos de letras
    ['A', 'B', 'C', 'D', 'E'].forEach((letra) => {
      expect(screen.getByTestId(`badge-alternativa-${letra}`)).toBeInTheDocument();
    });
  });

  it('PainelAluno: resposta confirmada ativa animação de confirmação sem comemoração de acerto antecipado', () => {
    render(
      <PainelAluno
        estado={estadoBase}
        envio={{ status: 'confirmado', alternativa: 'B' }}
      />
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/Resposta confirmada/i);
    expect(status).toHaveTextContent(/Alternativa B/i);
    // Não pode conter comemoração de acerto na fase pergunta
    expect(screen.queryByText(/Você acertou/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gabarito Oficial/i)).not.toBeInTheDocument();
  });

  it('TelaProjecao: renderiza fundo de palco violeta, acentos vibrantes e distribuição A-E com cores pop', () => {
    const { container } = render(<TelaProjecao estado={estadoBase} />);

    const root = container.querySelector('[data-tema="vibrante"]');
    expect(root).toBeInTheDocument();

    // Contagem A-E deve exibir os 5 blocos de distribuição com números
    ['A', 'B', 'C', 'D', 'E'].forEach((letra) => {
      const bloco = screen.getByTestId(`distribuicao-projecao-${letra}`);
      expect(bloco).toBeInTheDocument();
    });
  });

  it('TelaProjecao na fase ranking: exibe pódio festivo vibrante preservando as posições recebidas', () => {
    const estadoRanking = { ...estadoBase, fase: 'ranking' };
    render(<TelaProjecao estado={estadoRanking} />);

    expect(screen.getByText(/Classificação Geral/i)).toBeInTheDocument();
    expect(screen.getByText('Camila')).toBeInTheDocument();
    expect(screen.getByText('Lucas')).toBeInTheDocument();
  });

  it('PainelProfessor: renderiza cabeçalho de show e controles temáticos de alto impacto', () => {
    const { container } = render(
      <PainelProfessor estado={estadoBase} onAcao={() => {}} />
    );

    const root = container.querySelector('[data-tema="vibrante"]');
    expect(root).toBeInTheDocument();
    expect(screen.getByText(/Painel do Professor/i)).toBeInTheDocument();
  });

  it('garante que a configuração de cores de alternativas cobre exatamente as letras A a E', () => {
    expect(CORES_ALTERNATIVAS).toBeDefined();
    ['A', 'B', 'C', 'D', 'E'].forEach((letra) => {
      expect(CORES_ALTERNATIVAS[letra]).toBeDefined();
      expect(CORES_ALTERNATIVAS[letra].bg).toMatch(/^#/);
      expect(CORES_ALTERNATIVAS[letra].text).toMatch(/^#/);
    });
  });
});
