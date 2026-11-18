import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { CartaoSuperficie } from '@/components/ui/CartaoSuperficie';
import { AbasNavegacao } from '@/components/ui/AbasNavegacao';
import { BarraAcoes } from '@/components/ui/BarraAcoes';
import { EstadoVazio } from '@/components/ui/EstadoVazio';

afterEach(() => {
  cleanup();
});

describe('Design System Arte em Jogo — Componentes Compartilhados', () => {
  describe('CabecalhoPagina', () => {
    it('renderiza título expressivo, subtítulo, badge temático e ações', () => {
      render(
        <CabecalhoPagina
          titulo="Portal do Aluno"
          subtitulo="Acompanhe suas notas, atividades e frequência."
          badge="Arte em Jogo"
          acoes={<button type="button">Nova Ação</button>}
        />
      );

      expect(screen.getByRole('heading', { name: /Portal do Aluno/i })).toBeInTheDocument();
      expect(screen.getByText(/Acompanhe suas notas/i)).toBeInTheDocument();
      expect(screen.getByText(/Arte em Jogo/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nova Ação/i })).toBeInTheDocument();
    });
  });

  describe('CartaoSuperficie', () => {
    it('renderiza conteúdo com superfícies de leitura e cabeçalho opcional', () => {
      render(
        <CartaoSuperficie
          titulo="Desempenho Geral"
          destaque="8.5"
          badge="Bimestre 1"
        >
          <p>Conteúdo do cartão</p>
        </CartaoSuperficie>
      );

      expect(screen.getByText(/Desempenho Geral/i)).toBeInTheDocument();
      expect(screen.getByText('8.5')).toBeInTheDocument();
      expect(screen.getByText(/Bimestre 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Conteúdo do cartão/i)).toBeInTheDocument();
    });
  });

  describe('AbasNavegacao', () => {
    it('renderiza lista de abas acessíveis e aciona onSelect ao trocar', () => {
      const onSelect = vi.fn();
      const abas = [
        { id: 'atividades', rotulo: 'Atividades' },
        { id: 'notas', rotulo: 'Notas e Boletim' },
        { id: 'redacao', rotulo: 'Redação' },
      ];

      render(
        <AbasNavegacao
          abas={abas}
          abaAtiva="atividades"
          onSelect={onSelect}
        />
      );

      const abaNotas = screen.getByRole('tab', { name: /Notas e Boletim/i });
      expect(abaNotas).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(abaNotas);
      expect(onSelect).toHaveBeenCalledWith('notas');
    });
  });

  describe('BarraAcoes', () => {
    it('renderiza ações principais e secundárias organizadas', () => {
      render(
        <BarraAcoes>
          <input placeholder="Filtrar por nome..." />
          <button type="button">Salvar</button>
        </BarraAcoes>
      );

      expect(screen.getByPlaceholderText(/Filtrar por nome/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
    });
  });

  describe('EstadoVazio', () => {
    it('renderiza mensagem informativa, ícone e botão de ação', () => {
      const onAcao = vi.fn();
      render(
        <EstadoVazio
          titulo="Nenhuma atividade pendente"
          descricao="Você concluiu todas as tarefas designadas para esta semana."
          textoAcao="Ver histórico"
          onAcao={onAcao}
        />
      );

      expect(screen.getByText(/Nenhuma atividade pendente/i)).toBeInTheDocument();
      expect(screen.getByText(/Você concluiu todas as tarefas/i)).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /Ver histórico/i });
      fireEvent.click(btn);
      expect(onAcao).toHaveBeenCalled();
    });
  });
});
