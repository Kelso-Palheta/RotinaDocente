import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { BlocoAulaTematica } from '@/components/revisao/BlocoAulaTematica';
import { PainelAluno } from '@/components/revisao/PainelAluno';
import { PainelProfessor } from '@/components/revisao/PainelProfessor';
import { TelaProjecao } from '@/components/revisao/TelaProjecao';

afterEach(() => {
  cleanup();
});

const blocoTextoMock = {
  id: 'b1-contexto',
  titulo: 'Contexto Histórico das Vanguardas',
  tipo: 'texto',
  texto:
    'No início do século XX, as vanguardas artísticas romperam com o academicismo e a representação ilusionista da realidade.',
  imagens: [],
};

const blocoImagemMock = {
  id: 'b2-imagem',
  titulo: 'Análise Visual: A Persistência da Memória',
  tipo: 'imagem',
  texto: 'Observe a fusão entre a paisagem árida e os relógios amolecidos.',
  imagemId: 'img-dali',
  imagemUrl: 'https://cdn.exemplo.org/aulas/dali.png',
  imagens: [
    {
      id: 'img-dali',
      url: 'https://cdn.exemplo.org/aulas/dali.png',
      alt: 'Relógios derretidos sobre galho e solo',
      legenda: 'Salvador Dalí, 1931. Acervo MoMA.',
    },
  ],
};

const aulaEstadoV2 = {
  conteudoId: 'surrealismo',
  tituloConteudo: 'Surrealismo e Inconsciente',
  indiceBloco: 0,
  totalBlocos: 4,
  ultimoBloco: false,
  bloco: blocoTextoMock,
};

const estadoV2Base = {
  sala: { id: 's1', titulo: 'Aulão Vanguardas ENEM', codigo: 'ARTE42' },
  fase: 'conteudo',
  conexao: 'conectado',
  agoraServidorMs: 100000,
  rodada: {
    numero: 1,
    total: 3,
    encerraEmMs: 160000,
    questao: null, // Na fase conteudo de sala v2, questao é null
    conteudo: [],
  },
  aula: aulaEstadoV2,
  participacao: { total: 30, respondidos: 0, respondentes: [] },
  feedback: null,
  ranking: [],
};

describe('TematicoApresentacao — BlocoAulaTematica e Apresentação da Aula v2', () => {
  describe('BlocoAulaTematica', () => {
    it('renderiza bloco de texto com título, texto, e indicador de progresso', () => {
      render(
        <BlocoAulaTematica
          bloco={blocoTextoMock}
          aula={{ indiceBloco: 0, totalBlocos: 4, tituloConteudo: 'Surrealismo' }}
        />
      );

      expect(screen.getByText(/Contexto Histórico das Vanguardas/i)).toBeInTheDocument();
      expect(
        screen.getByText(/No início do século XX, as vanguardas artísticas romperam/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Bloco 1 de 4/i)).toBeInTheDocument();
      expect(screen.getByText(/Surrealismo/i)).toBeInTheDocument();
    });

    it('renderiza bloco de imagem com alt, legenda e imagem contextual', () => {
      render(
        <BlocoAulaTematica
          bloco={blocoImagemMock}
          imagens={blocoImagemMock.imagens}
          aula={{ indiceBloco: 1, totalBlocos: 4, tituloConteudo: 'Surrealismo' }}
        />
      );

      expect(screen.getByText(/Análise Visual: A Persistência da Memória/i)).toBeInTheDocument();
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Relógios derretidos sobre galho e solo');
      expect(screen.getByText(/Salvador Dalí, 1931/i)).toBeInTheDocument();
    });
  });

  describe('PainelProfessor com estado.aula (sala v2)', () => {
    it('no primeiro bloco (indiceBloco: 0): "Voltar Bloco" desabilitado e "Avançar Bloco" emite avancar_conteudo', () => {
      const onAcao = vi.fn();
      render(<PainelProfessor estado={estadoV2Base} onAcao={onAcao} />);

      expect(screen.getByText(/Contexto Histórico das Vanguardas/i)).toBeInTheDocument();

      const btnVoltar = screen.getByRole('button', { name: /Voltar Bloco|Voltar Conteúdo/i });
      expect(btnVoltar).toBeDisabled();

      const btnAvancar = screen.getByRole('button', { name: /Avançar Bloco|Avançar Conteúdo/i });
      expect(btnAvancar).not.toBeDisabled();
      fireEvent.click(btnAvancar);
      expect(onAcao).toHaveBeenCalledWith('avancar_conteudo');
    });

    it('no bloco intermediário: "Voltar Bloco" e "Avançar Bloco" ambos habilitados', () => {
      const onAcao = vi.fn();
      const estadoIntermediario = {
        ...estadoV2Base,
        aula: {
          ...aulaEstadoV2,
          indiceBloco: 1,
          totalBlocos: 4,
          ultimoBloco: false,
        },
      };

      render(<PainelProfessor estado={estadoIntermediario} onAcao={onAcao} />);

      const btnVoltar = screen.getByRole('button', { name: /Voltar Bloco|Voltar Conteúdo/i });
      expect(btnVoltar).not.toBeDisabled();
      fireEvent.click(btnVoltar);
      expect(onAcao).toHaveBeenCalledWith('voltar_conteudo');

      const btnAvancar = screen.getByRole('button', { name: /Avançar Bloco|Avançar Conteúdo/i });
      expect(btnAvancar).not.toBeDisabled();
      fireEvent.click(btnAvancar);
      expect(onAcao).toHaveBeenCalledWith('avancar_conteudo');
    });

    it('no último bloco (ultimoBloco: true): "Avançar Bloco" é substituído por "Abrir Pergunta"', () => {
      const onAcao = vi.fn();
      const estadoUltimoBloco = {
        ...estadoV2Base,
        aula: {
          ...aulaEstadoV2,
          indiceBloco: 3,
          totalBlocos: 4,
          ultimoBloco: true,
        },
      };

      render(<PainelProfessor estado={estadoUltimoBloco} onAcao={onAcao} />);

      expect(
        screen.queryByRole('button', { name: /Avançar Bloco|Avançar Conteúdo/i })
      ).not.toBeInTheDocument();

      const btnAbrirPergunta = screen.getByRole('button', {
        name: /Abrir Pergunta|Concluir Aula e Abrir Pergunta/i,
      });
      expect(btnAbrirPergunta).not.toBeDisabled();
      fireEvent.click(btnAbrirPergunta);
      expect(onAcao).toHaveBeenCalledWith('abrir_pergunta');
    });

    it('na fase ranking de sala v2, o rótulo da próxima rodada indica que inicia a próxima pergunta', () => {
      const estadoRankingV2 = {
        ...estadoV2Base,
        fase: 'ranking',
        rodada: { numero: 1, total: 3 },
      };

      render(<PainelProfessor estado={estadoRankingV2} onAcao={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /Iniciar Próxima Pergunta|Próxima Pergunta/i })
      ).toBeInTheDocument();
    });

    it('preserva fallback legado quando estado.aula não existe', () => {
      const estadoLegado = {
        sala: { id: 's1', titulo: 'Aulão Legado', codigo: 'LEG99' },
        fase: 'conteudo',
        conexao: 'conectado',
        rodada: {
          numero: 1,
          total: 2,
          conteudo: [{ tipo: 'texto', texto: 'Conteúdo de rodada legado' }],
          questao: { id: 'q1', tema: 'Tema Legado' },
        },
      };

      render(<PainelProfessor estado={estadoLegado} onAcao={vi.fn()} />);

      expect(screen.getByText(/Conteúdo de rodada legado/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Abrir Pergunta/i })).toBeInTheDocument();
    });
  });

  describe('TelaProjecao com estado.aula (sala v2)', () => {
    it('renderiza o bloco temático atual em tela cheia sem botões de controle docente', () => {
      render(<TelaProjecao estado={estadoV2Base} />);

      expect(screen.getByText(/Contexto Histórico das Vanguardas/i)).toBeInTheDocument();
      expect(screen.getByText(/Bloco 1 de 4/i)).toBeInTheDocument();
      // Não deve ter botões de navegação
      expect(screen.queryByRole('button', { name: /Avançar Bloco/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Voltar Bloco/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Abrir Pergunta/i })).not.toBeInTheDocument();
    });

    it('preserva fallback legado quando estado.aula não existe', () => {
      const estadoLegado = {
        sala: { id: 's1', titulo: 'Aulão Projeção Legado', codigo: 'LEG99' },
        fase: 'conteudo',
        rodada: {
          numero: 1,
          total: 2,
          conteudo: [{ tipo: 'texto', texto: 'Texto projetado legado' }],
        },
      };

      render(<TelaProjecao estado={estadoLegado} />);
      expect(screen.getByText(/Texto projetado legado/i)).toBeInTheDocument();
    });
  });

  describe('PainelAluno com estado.aula (sala v2)', () => {
    it('renderiza o bloco temático atual sem botões de controle docente', () => {
      render(<PainelAluno estado={estadoV2Base} />);

      expect(screen.getByText(/Contexto Histórico das Vanguardas/i)).toBeInTheDocument();
      expect(screen.getByText(/Bloco 1 de 4/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Avançar Bloco/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Voltar Bloco/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Abrir Pergunta/i })).not.toBeInTheDocument();
    });

    it('preserva fallback legado quando estado.aula não existe', () => {
      const estadoLegado = {
        sala: { id: 's1', titulo: 'Aulão Aluno Legado', codigo: 'LEG99' },
        fase: 'conteudo',
        rodada: {
          numero: 1,
          total: 2,
          conteudo: [{ tipo: 'texto', texto: 'Texto aluno legado' }],
        },
      };

      render(<PainelAluno estado={estadoLegado} />);
      expect(screen.getByText(/Texto aluno legado/i)).toBeInTheDocument();
    });
  });
});
