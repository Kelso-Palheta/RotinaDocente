import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { PrepararAulaoTematico } from '@/components/revisao/PrepararAulaoTematico';

afterEach(() => {
  cleanup();
});

const trilhasMock = [
  { id: 'historia-arte', titulo: 'História da Arte' },
  { id: 'arte-brasil', titulo: 'Arte Brasileira' },
];

const conteudosMock = [
  {
    id: 'surrealismo',
    trilhaId: 'historia-arte',
    titulo: 'Surrealismo',
    resumo: 'Exploração do inconsciente, do sonho e das formas automáticas.',
    duracaoEstimadaMinutos: 15,
    hashFonte: 'hash-surrealismo-1',
    apta: true,
  },
  {
    id: 'expressionismo',
    trilhaId: 'historia-arte',
    titulo: 'Expressionismo',
    resumo: 'Distorção da realidade para expressar emoções profundas e angústia.',
    duracaoEstimadaMinutos: 12,
    hashFonte: 'hash-expressionismo-1',
    apta: true,
  },
  {
    id: 'antropofagia',
    trilhaId: 'arte-brasil',
    titulo: 'Antropofagia e Modernismo',
    resumo: 'Deglutição crítica da cultura europeia com matrizes brasileiras.',
    duracaoEstimadaMinutos: 20,
    hashFonte: 'hash-antropofagia-1',
    apta: false, // Aula em rascunho
  },
];

const questoesMock = [
  {
    id: 'q1-surrealismo-apta',
    ano: 2024,
    aplicacoes: ['regular'],
    tema: 'Surrealismo e Magritte',
    conteudoIds: ['surrealismo'],
    status: 'revisada',
    apta: true,
  },
  {
    id: 'q2-surrealismo-apta',
    ano: 2023,
    aplicacoes: ['regular'],
    tema: 'Surrealismo e Dali',
    conteudoIds: ['surrealismo'],
    status: 'revisada',
    apta: true,
  },
  {
    id: 'q3-compartilhada-apta',
    ano: 2023,
    aplicacoes: ['ppl'],
    tema: 'Vanguardas: Sonho e Emoção',
    conteudoIds: ['surrealismo', 'expressionismo'],
    status: 'revisada',
    apta: true,
  },
  {
    id: 'q4-surrealismo-inapta',
    ano: 2022,
    aplicacoes: ['regular'],
    tema: 'Surrealismo em Rascunho',
    conteudoIds: ['surrealismo'],
    status: 'rascunho',
    apta: false,
  },
  {
    id: 'q5-expressionismo-apta',
    ano: 2024,
    aplicacoes: ['regular'],
    tema: 'Expressionismo Alemão',
    conteudoIds: ['expressionismo'],
    status: 'revisada',
    apta: true,
  },
  {
    id: 'q6-antropofagia-apta',
    ano: 2025,
    aplicacoes: ['regular'],
    tema: 'Abaporu e Tarsila',
    conteudoIds: ['antropofagia'],
    status: 'revisada',
    apta: true,
  },
];

const turmasMock = [
  { id: 'turma-3a', nome: '3º Ano A' },
  { id: 'turma-3b', nome: '3º Ano B' },
];

const selecaoBase = {
  titulo: 'Aulão Especial de Vanguardas',
  turmaIds: ['turma-3a'],
  conteudoIds: ['surrealismo'],
  quantidadeQuestoes: 3,
  questaoIds: ['q1-surrealismo-apta', 'q2-surrealismo-apta', 'q3-compartilhada-apta'],
  duracaoSegundos: 60,
  duracaoPorQuestao: {},
};

describe('PrepararAulaoTematico — Contratos e Regras RT-01..RT-06', () => {
  it('sem conteúdos selecionados, nenhuma questão fica disponível no catálogo contextual', () => {
    const selecaoSemConteudo = {
      ...selecaoBase,
      conteudoIds: [],
      questaoIds: [],
    };

    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoSemConteudo}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Nenhum conteúdo selecionado|Selecione ao menos um conteúdo/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('catalogo-questao-q1-surrealismo-apta')).not.toBeInTheDocument();
    expect(screen.queryByTestId('catalogo-questao-q5-expressionismo-apta')).not.toBeInTheDocument();
  });

  it('ao selecionar Surrealismo, disponibiliza estritamente as questões vinculadas', () => {
    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoBase}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
      />
    );

    // Questões de Surrealismo aparecem no catálogo
    expect(screen.getByTestId('catalogo-questao-q1-surrealismo-apta')).toBeInTheDocument();
    expect(screen.getByTestId('catalogo-questao-q2-surrealismo-apta')).toBeInTheDocument();
    expect(screen.getByTestId('catalogo-questao-q3-compartilhada-apta')).toBeInTheDocument();
    expect(screen.getByTestId('catalogo-questao-q4-surrealismo-inapta')).toBeInTheDocument();

    // Questões exclusivas de Expressionismo ou Antropofagia NÃO aparecem
    expect(screen.queryByTestId('catalogo-questao-q5-expressionismo-apta')).not.toBeInTheDocument();
    expect(screen.queryByTestId('catalogo-questao-q6-antropofagia-apta')).not.toBeInTheDocument();
  });

  it('seleção de múltiplos conteúdos deduplica questões por ID', () => {
    const selecaoMultipla = {
      ...selecaoBase,
      conteudoIds: ['surrealismo', 'expressionismo'],
      quantidadeQuestoes: 4,
      questaoIds: [
        'q1-surrealismo-apta',
        'q2-surrealismo-apta',
        'q3-compartilhada-apta',
        'q5-expressionismo-apta',
      ],
    };

    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoMultipla}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
      />
    );

    // A questão compartilhada q3 deve aparecer apenas uma vez
    const ocorrencias = screen.getAllByTestId('catalogo-questao-q3-compartilhada-apta');
    expect(ocorrencias).toHaveLength(1);
  });

  it('separa compatíveis e aptas; rascunho compatível pode ser inspecionado mas não selecionado', () => {
    const onAbrirRevisao = vi.fn();
    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoBase}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
        onAbrirRevisao={onAbrirRevisao}
      />
    );

    // Contador de compatíveis e aptas
    expect(screen.getByText(/4 compatíveis/i)).toBeInTheDocument();
    expect(screen.getByText(/3 aptas/i)).toBeInTheDocument();

    // Questão inapta q4 está visível mas com seleção bloqueada
    const botaoAddQ4 = screen.queryByTestId('btn-adicionar-q4-surrealismo-inapta');
    if (botaoAddQ4) {
      expect(botaoAddQ4).toBeDisabled();
    } else {
      expect(screen.getByText(/Rascunho|Pendente de revisão/i)).toBeInTheDocument();
    }

    // Botão inspecionar aciona onAbrirRevisao
    const btnInspecionar = screen.getByTestId('btn-inspecionar-q4-surrealismo-inapta');
    fireEvent.click(btnInspecionar);
    expect(onAbrirRevisao).toHaveBeenCalledWith('q4-surrealismo-inapta');
  });

  it('ao trocar aulas, remove questões incompatíveis da seleção e suas durações, avisando a quantidade retirada', () => {
    const onAlterar = vi.fn();
    const selecaoCompostas = {
      ...selecaoBase,
      conteudoIds: ['surrealismo', 'expressionismo'],
      quantidadeQuestoes: 4,
      questaoIds: [
        'q1-surrealismo-apta',
        'q2-surrealismo-apta',
        'q3-compartilhada-apta',
        'q5-expressionismo-apta',
      ],
      duracaoPorQuestao: {
        'q1-surrealismo-apta': 90,
        'q5-expressionismo-apta': 120,
      },
    };

    const { rerender } = render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoCompostas}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
      />
    );

    // Desmarca Expressionismo:
    const checkboxExpressionismo = screen.getByTestId('checkbox-conteudo-expressionismo');
    fireEvent.click(checkboxExpressionismo);

    // onAlterar deve ser chamado removendo q5-expressionismo-apta da seleção e de duracaoPorQuestao
    expect(onAlterar).toHaveBeenCalledWith(
      expect.objectContaining({
        conteudoIds: ['surrealismo'],
        questaoIds: ['q1-surrealismo-apta', 'q2-surrealismo-apta', 'q3-compartilhada-apta'],
        duracaoPorQuestao: {
          'q1-surrealismo-apta': 90,
        },
      })
    );

    // Simula a nova renderização com a seleção atualizada e mensagem de aviso
    rerender(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={{
          ...selecaoCompostas,
          conteudoIds: ['surrealismo'],
          questaoIds: ['q1-surrealismo-apta', 'q2-surrealismo-apta', 'q3-compartilhada-apta'],
          duracaoPorQuestao: { 'q1-surrealismo-apta': 90 },
        }}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
      />
    );

    // Deve informar que a quantidade agora está incompleta (3 de 4)
    expect(
      screen.getByText(/Selecione exatamente 4 questões|3 de 4 questões selecionadas/i)
    ).toBeInTheDocument();
  });

  it('exige quantidade EXATA para criar; bloqueia criação se quantidade for divergente', () => {
    const onCriar = vi.fn();
    const selecaoIncompleta = {
      ...selecaoBase,
      quantidadeQuestoes: 5, // meta 5, mas tem apenas 3 em questaoIds
      questaoIds: ['q1-surrealismo-apta', 'q2-surrealismo-apta', 'q3-compartilhada-apta'],
    };

    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoIncompleta}
        onAlterar={vi.fn()}
        onCriar={onCriar}
      />
    );

    const btnCriar = screen.getByRole('button', { name: /Criar Aulão/i });
    expect(btnCriar).toBeDisabled();
    expect(
      screen.getByText(/Selecione exatamente 5 questões|Faltam 2 questões/i)
    ).toBeInTheDocument();
  });

  it('opção de completar com questões aptas preenche a seleção e explica quando insuficiente', () => {
    const onAlterar = vi.fn();
    const selecaoParaCompletar = {
      ...selecaoBase,
      quantidadeQuestoes: 5, // Há apenas 3 aptas disponíveis para Surrealismo
      questaoIds: ['q1-surrealismo-apta'],
    };

    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoParaCompletar}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
      />
    );

    const btnCompletar = screen.getByRole('button', { name: /Completar com aptas/i });
    fireEvent.click(btnCompletar);

    // Deve chamar onAlterar adicionando q2 e q3 (as únicas aptas restantes)
    expect(onAlterar).toHaveBeenCalledWith(
      expect.objectContaining({
        questaoIds: ['q1-surrealismo-apta', 'q2-surrealismo-apta', 'q3-compartilhada-apta'],
      })
    );
  });

  it('permite reordenar questões selecionadas (mover para cima e para baixo)', () => {
    const onAlterar = vi.fn();
    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoBase}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
      />
    );

    const btnMoverBaixo = screen.getByTestId('btn-mover-baixo-q1-surrealismo-apta');
    fireEvent.click(btnMoverBaixo);

    expect(onAlterar).toHaveBeenCalledWith(
      expect.objectContaining({
        questaoIds: ['q2-surrealismo-apta', 'q1-surrealismo-apta', 'q3-compartilhada-apta'],
      })
    );
  });

  it('permite definir exceções de tempo por questão (10 a 600 segundos inteiros)', () => {
    const onAlterar = vi.fn();
    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoBase}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
      />
    );

    const inputTempoQ1 = screen.getByTestId('input-tempo-q1-surrealismo-apta');
    fireEvent.change(inputTempoQ1, { target: { value: '90' } });

    expect(onAlterar).toHaveBeenCalledWith(
      expect.objectContaining({
        duracaoPorQuestao: expect.objectContaining({
          'q1-surrealismo-apta': 90,
        }),
      })
    );
  });

  it('conteúdo não aprovado (apta: false) bloqueia criação e permite inspeção', () => {
    const onCriar = vi.fn();
    const onAbrirConteudo = vi.fn();
    const selecaoComConteudoInapto = {
      ...selecaoBase,
      conteudoIds: ['antropofagia'], // apta: false
      quantidadeQuestoes: 1,
      questaoIds: ['q6-antropofagia-apta'],
    };

    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoComConteudoInapto}
        onAlterar={vi.fn()}
        onCriar={onCriar}
        onAbrirConteudo={onAbrirConteudo}
      />
    );

    const btnCriar = screen.getByRole('button', { name: /Criar Aulão/i });
    expect(btnCriar).toBeDisabled();
    expect(screen.getByText(/conteúdo pendente de aprovação docente/i)).toBeInTheDocument();

    const btnInspecionarConteudo = screen.getByTestId('btn-conferir-conteudo-antropofagia');
    fireEvent.click(btnInspecionarConteudo);
    expect(onAbrirConteudo).toHaveBeenCalledWith('antropofagia');
  });

  it('criação autorizada dispara onCriar quando todos os critérios são satisfeitos', () => {
    const onCriar = vi.fn();
    render(
      <PrepararAulaoTematico
        trilhas={trilhasMock}
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecaoBase}
        onAlterar={vi.fn()}
        onCriar={onCriar}
      />
    );

    const btnCriar = screen.getByRole('button', { name: /Criar Aulão/i });
    expect(btnCriar).not.toBeDisabled();
    fireEvent.click(btnCriar);
    expect(onCriar).toHaveBeenCalled();
  });
});
